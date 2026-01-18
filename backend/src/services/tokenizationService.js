/**
 * Tokenization Service
 * Generates and manages Partner-Specific User Tokens (PSUT)
 * for identifying repeat customers
 */

const crypto = require('crypto');
const pool = require('../config/database');
const logger = require('../utils/logger');

class TokenizationService {
    constructor() {
        this.TOKEN_EXPIRY_DAYS = 365; // 1 year default
    }

    /**
     * Generate PSUT (Partner-Specific User Token)
     */
    async generatePSUT(userId, partnerId, expiryDays = null) {
        try {
            // Check if token already exists
            const existingToken = await pool.query(
                `SELECT token, expires_at, status FROM partner_tokens
                WHERE user_id = $1 AND partner_id = $2 AND status = 'active'`,
                [userId, partnerId]
            );

            // If valid token exists, return it
            if (existingToken.rows.length > 0) {
                const token = existingToken.rows[0];

                // Check if expired
                if (token.expires_at && new Date() > new Date(token.expires_at)) {
                    // Mark as expired and generate new one
                    await pool.query(
                        'UPDATE partner_tokens SET status = \'expired\' WHERE user_id = $1 AND partner_id = $2',
                        [userId, partnerId]
                    );
                } else {
                    // Update usage
                    await pool.query(
                        `UPDATE partner_tokens 
                        SET last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1
                        WHERE user_id = $1 AND partner_id = $2`,
                        [userId, partnerId]
                    );

                    logger.info('Existing PSUT returned', { userId, partnerId });
                    return token.token;
                }
            }

            // Generate new token
            const token = this.generateToken(userId, partnerId);

            // Calculate expiry
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (expiryDays || this.TOKEN_EXPIRY_DAYS));

            // Store token
            await pool.query(
                `INSERT INTO partner_tokens (user_id, partner_id, token, expires_at, status)
                VALUES ($1, $2, $3, $4, 'active')
                ON CONFLICT (user_id, partner_id) 
                DO UPDATE SET token = $3, expires_at = $4, status = 'active', created_at = CURRENT_TIMESTAMP`,
                [userId, partnerId, token, expiresAt]
            );

            logger.info('New PSUT generated', { userId, partnerId });

            return token;
        } catch (error) {
            logger.error('PSUT generation failed', { error: error.message, userId, partnerId });
            throw error;
        }
    }

    /**
     * Generate token string
     */
    generateToken(userId, partnerId) {
        // Create deterministic but secure token
        const data = `${userId}:${partnerId}:${Date.now()}`;
        const hash = crypto.createHash('sha256').update(data).digest('hex');

        // Add random component for uniqueness
        const random = crypto.randomBytes(16).toString('hex');

        return `PSUT_${hash.substring(0, 32)}_${random}`;
    }

    /**
     * Validate PSUT token
     */
    async validatePSUT(token, partnerId) {
        try {
            const result = await pool.query(
                `SELECT user_id, expires_at, status FROM partner_tokens
                WHERE token = $1 AND partner_id = $2`,
                [token, partnerId]
            );

            if (result.rows.length === 0) {
                return {
                    valid: false,
                    reason: 'Token not found'
                };
            }

            const tokenRecord = result.rows[0];

            // Check status
            if (tokenRecord.status !== 'active') {
                return {
                    valid: false,
                    reason: `Token is ${tokenRecord.status}`
                };
            }

            // Check expiry
            if (tokenRecord.expires_at && new Date() > new Date(tokenRecord.expires_at)) {
                // Mark as expired
                await pool.query(
                    'UPDATE partner_tokens SET status = \'expired\' WHERE token = $1',
                    [token]
                );

                return {
                    valid: false,
                    reason: 'Token expired'
                };
            }

            // Update last used
            await pool.query(
                `UPDATE partner_tokens 
                SET last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1
                WHERE token = $1`,
                [token]
            );

            return {
                valid: true,
                userId: tokenRecord.user_id
            };
        } catch (error) {
            logger.error('PSUT validation failed', { error: error.message, token });
            throw error;
        }
    }

    /**
     * Revoke PSUT token
     */
    async revokePSUT(userId, partnerId, reason = 'User requested') {
        try {
            const result = await pool.query(
                `UPDATE partner_tokens
                SET status = 'revoked', revoked_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND partner_id = $2 AND status = 'active'
                RETURNING token`,
                [userId, partnerId]
            );

            if (result.rows.length === 0) {
                throw new Error('No active token found');
            }

            logger.info('PSUT revoked', { userId, partnerId, reason });

            return {
                success: true,
                message: 'Token revoked successfully'
            };
        } catch (error) {
            logger.error('PSUT revocation failed', { error: error.message, userId, partnerId });
            throw error;
        }
    }

    /**
     * Get user's tokens
     */
    async getUserTokens(userId) {
        try {
            const result = await pool.query(
                `SELECT pt.token, pt.partner_id, p.partner_name, pt.status, 
                pt.expires_at, pt.usage_count, pt.last_used_at, pt.created_at
                FROM partner_tokens pt
                LEFT JOIN partners p ON pt.partner_id = p.id
                WHERE pt.user_id = $1
                ORDER BY pt.created_at DESC`,
                [userId]
            );

            return result.rows;
        } catch (error) {
            logger.error('Failed to get user tokens', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Cleanup expired tokens
     */
    async cleanupExpiredTokens() {
        try {
            const result = await pool.query(
                `UPDATE partner_tokens
                SET status = 'expired'
                WHERE expires_at < CURRENT_TIMESTAMP AND status = 'active'`
            );

            logger.info('Expired tokens cleaned up', { count: result.rowCount });
            return result.rowCount;
        } catch (error) {
            logger.error('Token cleanup failed', { error: error.message });
            throw error;
        }
    }
}

module.exports = new TokenizationService();
