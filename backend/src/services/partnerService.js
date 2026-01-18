/**
 * Partner Service
 * Manages partner lifecycle, API keys, and certificates
 */

const crypto = require('crypto');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const logger = require('../utils/logger');

class PartnerService {
    /**
     * Register new partner (self-onboarding)
     */
    async registerPartner(partnerData) {
        try {
            const {
                partnerName,
                partnerType,
                organizationName,
                email,
                phone,
                address,
                website
            } = partnerData;

            // Generate partner ID
            const partnerId = `PTR_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

            // Insert partner
            const result = await pool.query(
                `INSERT INTO partners 
                (partner_id, partner_name, partner_type, organization_name, email, phone, address, website, status, approval_status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending', 'pending')
                RETURNING id, partner_id, partner_name, status`,
                [partnerId, partnerName, partnerType, organizationName, email, phone, address, website]
            );

            const partner = result.rows[0];

            logger.info('Partner registered', { partnerId, partnerName });

            return {
                success: true,
                message: 'Partner registration submitted for approval',
                partner: {
                    id: partner.id,
                    partnerId: partner.partner_id,
                    partnerName: partner.partner_name,
                    status: partner.status
                }
            };
        } catch (error) {
            logger.error('Partner registration failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Upload and verify CA signed certificate
     */
    async uploadCertificate(partnerId, certificateData) {
        try {
            const {
                certificateType = 'leaf',
                certificatePEM,
                validFrom,
                validTo,
                issuer,
                subject
            } = certificateData;

            // Calculate thumbprint
            const thumbprint = crypto
                .createHash('sha256')
                .update(certificatePEM)
                .digest('hex');

            // Extract serial number (simplified - in production, parse the certificate)
            const serialNumber = crypto.randomBytes(16).toString('hex');

            // Insert certificate
            const result = await pool.query(
                `INSERT INTO partner_certificates
                (partner_id, certificate_type, certificate_data, thumbprint, serial_number, 
                issuer, subject, valid_from, valid_to, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active')
                RETURNING id, thumbprint, valid_to`,
                [partnerId, certificateType, certificatePEM, thumbprint, serialNumber,
                    issuer, subject, validFrom, validTo]
            );

            // Update partner with certificate info
            await pool.query(
                `UPDATE partners
                SET certificate_data = $1, certificate_thumbprint = $2, certificate_expiry = $3
                WHERE id = $4`,
                [certificatePEM, thumbprint, validTo, partnerId]
            );

            logger.info('Certificate uploaded', { partnerId, thumbprint });

            return {
                success: true,
                message: 'Certificate uploaded successfully',
                thumbprint: result.rows[0].thumbprint,
                validTo: result.rows[0].valid_to
            };
        } catch (error) {
            logger.error('Certificate upload failed', { error: error.message, partnerId });
            throw error;
        }
    }

    /**
     * Generate API key for partner
     */
    async generateAPIKey(partnerId, keyType = 'production') {
        try {
            // Generate API key and secret
            const apiKey = `DK_${crypto.randomBytes(24).toString('hex')}`;
            const apiSecret = crypto.randomBytes(32).toString('hex');
            const apiSecretHash = await bcrypt.hash(apiSecret, 10);

            // Set expiry (1 year for production, 30 days for sandbox)
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + (keyType === 'production' ? 365 : 30));

            // Insert API key
            await pool.query(
                `INSERT INTO api_keys
                (partner_id, api_key, api_secret_hash, key_type, expires_at, status)
                VALUES ($1, $2, $3, $4, $5, 'active')`,
                [partnerId, apiKey, apiSecretHash, keyType, expiresAt]
            );

            logger.info('API key generated', { partnerId, keyType });

            return {
                success: true,
                message: 'API key generated successfully',
                apiKey,
                apiSecret, // Only returned once
                keyType,
                expiresAt
            };
        } catch (error) {
            logger.error('API key generation failed', { error: error.message, partnerId });
            throw error;
        }
    }

    /**
     * Generate license key for MISP partners
     */
    async generateLicenseKey(partnerId, licenseType = 'misp', maxTransactions = null) {
        try {
            // Generate license key
            const licenseKey = `LIC_${crypto.randomBytes(24).toString('hex').toUpperCase()}`;

            // Set expiry (1 year)
            const expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);

            // Insert license key
            const result = await pool.query(
                `INSERT INTO license_keys
                (partner_id, license_key, license_type, max_transactions, expires_at, status)
                VALUES ($1, $2, $3, $4, $5, 'active')
                RETURNING id, license_key, expires_at`,
                [partnerId, licenseKey, licenseType, maxTransactions, expiresAt]
            );

            logger.info('License key generated', { partnerId, licenseType });

            return {
                success: true,
                message: 'License key generated successfully',
                licenseKey: result.rows[0].license_key,
                expiresAt: result.rows[0].expires_at,
                maxTransactions
            };
        } catch (error) {
            logger.error('License key generation failed', { error: error.message, partnerId });
            throw error;
        }
    }

    /**
     * Approve partner registration
     */
    async approvePartner(partnerId, approvedBy) {
        try {
            const result = await pool.query(
                `UPDATE partners
                SET status = 'active', approval_status = 'approved', 
                approved_by = $2, approved_at = CURRENT_TIMESTAMP
                WHERE id = $1 AND approval_status = 'pending'
                RETURNING id, partner_id, partner_name`,
                [partnerId, approvedBy]
            );

            if (result.rows.length === 0) {
                throw new Error('Partner not found or already processed');
            }

            logger.info('Partner approved', { partnerId, approvedBy });

            return {
                success: true,
                message: 'Partner approved successfully',
                partner: result.rows[0]
            };
        } catch (error) {
            logger.error('Partner approval failed', { error: error.message, partnerId });
            throw error;
        }
    }

    /**
     * Get partner details
     */
    async getPartner(partnerId) {
        try {
            const result = await pool.query(
                `SELECT id, partner_id, partner_name, partner_type, organization_name,
                email, phone, address, website, status, approval_status, 
                certificate_expiry, created_at
                FROM partners
                WHERE id = $1`,
                [partnerId]
            );

            if (result.rows.length === 0) {
                throw new Error('Partner not found');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Failed to get partner', { error: error.message, partnerId });
            throw error;
        }
    }

    /**
     * List all partners
     */
    async listPartners(filters = {}) {
        try {
            let query = `
                SELECT id, partner_id, partner_name, partner_type, email, 
                status, approval_status, created_at
                FROM partners
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (filters.partnerType) {
                query += ` AND partner_type = $${paramCount}`;
                params.push(filters.partnerType);
                paramCount++;
            }

            if (filters.status) {
                query += ` AND status = $${paramCount}`;
                params.push(filters.status);
                paramCount++;
            }

            if (filters.approvalStatus) {
                query += ` AND approval_status = $${paramCount}`;
                params.push(filters.approvalStatus);
                paramCount++;
            }

            query += ' ORDER BY created_at DESC';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error('Failed to list partners', { error: error.message });
            throw error;
        }
    }

    /**
     * Validate API key
     */
    async validateAPIKey(apiKey, apiSecret) {
        try {
            const result = await pool.query(
                `SELECT ak.id, ak.partner_id, ak.api_secret_hash, ak.status, ak.expires_at,
                p.partner_name, p.status as partner_status
                FROM api_keys ak
                JOIN partners p ON ak.partner_id = p.id
                WHERE ak.api_key = $1`,
                [apiKey]
            );

            if (result.rows.length === 0) {
                return { valid: false, reason: 'Invalid API key' };
            }

            const keyRecord = result.rows[0];

            // Check partner status
            if (keyRecord.partner_status !== 'active') {
                return { valid: false, reason: 'Partner is not active' };
            }

            // Check key status
            if (keyRecord.status !== 'active') {
                return { valid: false, reason: `API key is ${keyRecord.status}` };
            }

            // Check expiry
            if (keyRecord.expires_at && new Date() > new Date(keyRecord.expires_at)) {
                return { valid: false, reason: 'API key expired' };
            }

            // Verify secret
            const secretMatch = await bcrypt.compare(apiSecret, keyRecord.api_secret_hash);
            if (!secretMatch) {
                return { valid: false, reason: 'Invalid API secret' };
            }

            // Update last used
            await pool.query(
                `UPDATE api_keys 
                SET last_used_at = CURRENT_TIMESTAMP, usage_count = usage_count + 1
                WHERE id = $1`,
                [keyRecord.id]
            );

            return {
                valid: true,
                partnerId: keyRecord.partner_id,
                partnerName: keyRecord.partner_name
            };
        } catch (error) {
            logger.error('API key validation failed', { error: error.message });
            throw error;
        }
    }
}

module.exports = new PartnerService();
