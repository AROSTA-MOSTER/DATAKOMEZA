/**
 * Virtual ID Service
 * Manages Virtual IDs (VID) for privacy-preserving identity verification
 * Supports temporary, permanent, and perpetual VIDs
 */

const crypto = require('crypto');
const pool = require('../config/database');
const logger = require('../utils/logger');
const encryption = require('../utils/encryption');

class VirtualIDService {
    constructor() {
        this.VID_LENGTH = 16;
        this.VID_TYPES = {
            TEMPORARY: 'temporary',    // Single use
            PERMANENT: 'permanent',     // Reusable with expiry
            PERPETUAL: 'perpetual'      // No expiry
        };
        this.DEFAULT_EXPIRY_DAYS = {
            temporary: 1,
            permanent: 365,
            perpetual: null
        };
    }

    /**
     * Generate a new Virtual ID
     */
    async generateVID(userId, vidType = 'temporary', expiryDays = null) {
        try {
            // Validate VID type
            if (!Object.values(this.VID_TYPES).includes(vidType)) {
                throw new Error('Invalid VID type');
            }

            // Generate unique VID
            let vid;
            let isUnique = false;
            let attempts = 0;
            const maxAttempts = 10;

            while (!isUnique && attempts < maxAttempts) {
                vid = this.generateVIDNumber();

                // Check uniqueness
                const existingVID = await pool.query(
                    'SELECT id FROM virtual_ids WHERE vid = $1',
                    [vid]
                );

                if (existingVID.rows.length === 0) {
                    isUnique = true;
                }
                attempts++;
            }

            if (!isUnique) {
                throw new Error('Failed to generate unique VID');
            }

            // Calculate expiry
            let expiresAt = null;
            if (vidType !== 'perpetual') {
                const days = expiryDays || this.DEFAULT_EXPIRY_DAYS[vidType];
                expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + days);
            }

            // Insert VID
            const result = await pool.query(
                `INSERT INTO virtual_ids (user_id, vid, vid_type, expires_at, status)
                VALUES ($1, $2, $3, $4, 'active')
                RETURNING id, vid, vid_type, expires_at, created_at`,
                [userId, vid, vidType, expiresAt]
            );

            const vidRecord = result.rows[0];

            // Get user's UIN for mapping
            const userResult = await pool.query(
                'SELECT mosip_id FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length > 0 && userResult.rows[0].mosip_id) {
                // Encrypt and store UIN mapping
                const encryptedUIN = encryption.encrypt(userResult.rows[0].mosip_id);

                await pool.query(
                    `INSERT INTO vid_uin_mapping (vid_id, user_id, encrypted_uin)
                    VALUES ($1, $2, $3)`,
                    [vidRecord.id, userId, encryptedUIN]
                );
            }

            logger.info('VID generated', { userId, vid, vidType });

            return {
                vid: vidRecord.vid,
                vidType: vidRecord.vid_type,
                expiresAt: vidRecord.expires_at,
                createdAt: vidRecord.created_at
            };
        } catch (error) {
            logger.error('VID generation failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Generate VID number
     */
    generateVIDNumber() {
        // Generate 16-digit VID
        const randomBytes = crypto.randomBytes(8);
        const vid = randomBytes.readBigUInt64BE(0).toString().padStart(16, '0').substring(0, 16);
        return vid;
    }

    /**
     * Revoke a Virtual ID
     */
    async revokeVID(userId, vid, reason = 'User requested') {
        try {
            const result = await pool.query(
                `UPDATE virtual_ids
                SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP, revoke_reason = $3
                WHERE user_id = $1 AND vid = $2 AND status = 'active'
                RETURNING id, vid`,
                [userId, vid, reason]
            );

            if (result.rows.length === 0) {
                throw new Error('VID not found or already revoked');
            }

            logger.info('VID revoked', { userId, vid, reason });

            return {
                success: true,
                message: 'VID revoked successfully',
                vid: result.rows[0].vid
            };
        } catch (error) {
            logger.error('VID revocation failed', { error: error.message, userId, vid });
            throw error;
        }
    }

    /**
     * Get all VIDs for a user
     */
    async getUserVIDs(userId) {
        try {
            const result = await pool.query(
                `SELECT vid, vid_type, status, expires_at, usage_count, created_at, revoked_at
                FROM virtual_ids
                WHERE user_id = $1
                ORDER BY created_at DESC`,
                [userId]
            );

            return result.rows;
        } catch (error) {
            logger.error('Failed to get user VIDs', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Validate VID
     */
    async validateVID(vid) {
        try {
            const result = await pool.query(
                `SELECT id, user_id, vid_type, status, expires_at, usage_count, usage_limit
                FROM virtual_ids
                WHERE vid = $1`,
                [vid]
            );

            if (result.rows.length === 0) {
                return {
                    valid: false,
                    reason: 'VID not found'
                };
            }

            const vidRecord = result.rows[0];

            // Check status
            if (vidRecord.status !== 'active') {
                return {
                    valid: false,
                    reason: `VID is ${vidRecord.status}`
                };
            }

            // Check expiry
            if (vidRecord.expires_at && new Date() > new Date(vidRecord.expires_at)) {
                // Mark as expired
                await pool.query(
                    'UPDATE virtual_ids SET status = \'expired\' WHERE id = $1',
                    [vidRecord.id]
                );

                return {
                    valid: false,
                    reason: 'VID expired'
                };
            }

            // Check usage limit
            if (vidRecord.usage_limit && vidRecord.usage_count >= vidRecord.usage_limit) {
                return {
                    valid: false,
                    reason: 'VID usage limit exceeded'
                };
            }

            return {
                valid: true,
                userId: vidRecord.user_id,
                vidType: vidRecord.vid_type
            };
        } catch (error) {
            logger.error('VID validation failed', { error: error.message, vid });
            throw error;
        }
    }

    /**
     * Log VID usage
     */
    async logVIDUsage(vid, usageType, partnerId = null, success = true, metadata = null) {
        try {
            // Get VID record
            const vidResult = await pool.query(
                'SELECT id, user_id FROM virtual_ids WHERE vid = $1',
                [vid]
            );

            if (vidResult.rows.length === 0) {
                throw new Error('VID not found');
            }

            const { id: vidId, user_id: userId } = vidResult.rows[0];

            // Log usage
            await pool.query(
                `INSERT INTO vid_usage_logs (vid_id, user_id, partner_id, usage_type, success, metadata)
                VALUES ($1, $2, $3, $4, $5, $6)`,
                [vidId, userId, partnerId, usageType, success, metadata]
            );

            // Increment usage count
            await pool.query(
                'UPDATE virtual_ids SET usage_count = usage_count + 1 WHERE id = $1',
                [vidId]
            );

            logger.info('VID usage logged', { vid, usageType, partnerId });
        } catch (error) {
            logger.error('VID usage logging failed', { error: error.message, vid });
        }
    }

    /**
     * Get VID usage history
     */
    async getVIDUsageHistory(userId, vid = null) {
        try {
            let query;
            let params;

            if (vid) {
                query = `
                    SELECT vul.usage_type, vul.partner_id, vul.success, vul.created_at
                    FROM vid_usage_logs vul
                    JOIN virtual_ids v ON vul.vid_id = v.id
                    WHERE v.user_id = $1 AND v.vid = $2
                    ORDER BY vul.created_at DESC
                    LIMIT 100
                `;
                params = [userId, vid];
            } else {
                query = `
                    SELECT v.vid, vul.usage_type, vul.partner_id, vul.success, vul.created_at
                    FROM vid_usage_logs vul
                    JOIN virtual_ids v ON vul.vid_id = v.id
                    WHERE v.user_id = $1
                    ORDER BY vul.created_at DESC
                    LIMIT 100
                `;
                params = [userId];
            }

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error('Failed to get VID usage history', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Cleanup expired VIDs
     */
    async cleanupExpiredVIDs() {
        try {
            const result = await pool.query(
                `UPDATE virtual_ids
                SET status = 'expired'
                WHERE expires_at < CURRENT_TIMESTAMP AND status = 'active'`
            );

            logger.info('Expired VIDs cleaned up', { count: result.rowCount });
            return result.rowCount;
        } catch (error) {
            logger.error('VID cleanup failed', { error: error.message });
            throw error;
        }
    }
}

module.exports = new VirtualIDService();
