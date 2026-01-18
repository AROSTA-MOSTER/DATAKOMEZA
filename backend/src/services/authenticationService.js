/**
 * Authentication Service
 * Implements all MOSIP authentication methods:
 * - OTP Authentication (SMS/Email)
 * - Demographic Authentication
 * - Biometric Authentication
 * - e-KYC Authentication
 */

const bcrypt = require('bcrypt');
const crypto = require('crypto');
const pool = require('../config/database');
const otpService = require('./otpService');
const eKycService = require('./eKycService');
const tokenizationService = require('./tokenizationService');
const mosipService = require('./mosipMockService');
const logger = require('../utils/logger');

class AuthenticationService {
    /**
     * OTP Authentication
     * Send and verify OTP for SMS/Email authentication
     */
    async sendOTP(userId, type = 'sms', contact) {
        try {
            // Get user details
            const userResult = await pool.query(
                'SELECT id, email, phone FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const user = userResult.rows[0];
            const contactValue = contact || (type === 'sms' ? user.phone : user.email);

            if (!contactValue) {
                throw new Error(`No ${type} contact available for user`);
            }

            // Generate OTP
            const otp = await otpService.generateOTP(userId, type, contactValue);

            // Send OTP
            if (type === 'sms') {
                await otpService.sendSMS(contactValue, otp);
            } else {
                await otpService.sendEmail(contactValue, otp);
            }

            logger.info('OTP sent', { userId, type, contact: contactValue });

            return {
                success: true,
                message: `OTP sent to ${type === 'sms' ? 'phone' : 'email'}`,
                expiresIn: 300 // 5 minutes
            };
        } catch (error) {
            logger.error('OTP send failed', { error: error.message, userId, type });
            throw error;
        }
    }

    async verifyOTP(userId, otp, type = 'sms') {
        try {
            const isValid = await otpService.verifyOTP(userId, otp, type);

            if (!isValid) {
                // Log failed attempt
                await this.logAuthentication(userId, 'otp', 'failed', null, 'Invalid OTP');
                return {
                    success: false,
                    message: 'Invalid or expired OTP'
                };
            }

            // Log successful authentication
            await this.logAuthentication(userId, 'otp', 'success');

            return {
                success: true,
                message: 'OTP verified successfully'
            };
        } catch (error) {
            logger.error('OTP verification failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Demographic Authentication
     * Match demographic data with fuzzy matching
     */
    async authenticateDemographic(userId, demographicData) {
        try {
            // Get user demographic data
            const userResult = await pool.query(
                'SELECT first_name, last_name, date_of_birth, phone, email FROM users WHERE id = $1',
                [userId]
            );

            if (userResult.rows.length === 0) {
                throw new Error('User not found');
            }

            const user = userResult.rows[0];

            // Calculate match scores
            const nameMatch = this.fuzzyMatch(
                `${user.first_name} ${user.last_name}`.toLowerCase(),
                `${demographicData.firstName} ${demographicData.lastName}`.toLowerCase()
            );

            const dobMatch = user.date_of_birth === demographicData.dateOfBirth ? 100 : 0;

            let phoneMatch = 0;
            if (demographicData.phone && user.phone) {
                phoneMatch = this.fuzzyMatch(user.phone, demographicData.phone);
            }

            let emailMatch = 0;
            if (demographicData.email && user.email) {
                emailMatch = this.fuzzyMatch(user.email.toLowerCase(), demographicData.email.toLowerCase());
            }

            // Calculate overall match score
            const weights = {
                name: 0.4,
                dob: 0.3,
                phone: 0.15,
                email: 0.15
            };

            const overallScore =
                (nameMatch * weights.name) +
                (dobMatch * weights.dob) +
                (phoneMatch * weights.phone) +
                (emailMatch * weights.email);

            const threshold = 75; // 75% match required
            const isAuthenticated = overallScore >= threshold;

            // Log authentication attempt
            await this.logAuthentication(
                userId,
                'demographic',
                isAuthenticated ? 'success' : 'failed',
                null,
                isAuthenticated ? null : `Match score ${overallScore.toFixed(2)}% below threshold`
            );

            return {
                success: isAuthenticated,
                matchScore: overallScore.toFixed(2),
                message: isAuthenticated
                    ? 'Demographic authentication successful'
                    : 'Demographic data does not match'
            };
        } catch (error) {
            logger.error('Demographic authentication failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Fuzzy string matching using Levenshtein distance
     */
    fuzzyMatch(str1, str2) {
        if (!str1 || !str2) return 0;

        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        const similarity = ((maxLength - distance) / maxLength) * 100;

        return Math.max(0, similarity);
    }

    levenshteinDistance(str1, str2) {
        const matrix = [];

        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }

        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }

        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                } else {
                    matrix[i][j] = Math.min(
                        matrix[i - 1][j - 1] + 1,
                        matrix[i][j - 1] + 1,
                        matrix[i - 1][j] + 1
                    );
                }
            }
        }

        return matrix[str2.length][str1.length];
    }

    /**
     * Biometric Authentication
     * Authenticate using fingerprint, iris, or face
     */
    async authenticateBiometric(userId, biometricData, biometricType = 'Fingerprint') {
        try {
            // Check if biometric auth is locked
            const lockCheck = await this.checkAuthLock(userId, 'biometric', biometricType.toLowerCase());
            if (lockCheck.isLocked) {
                return {
                    success: false,
                    message: `${biometricType} authentication is locked`
                };
            }

            // Verify biometric with MOSIP
            const verificationResult = await mosipService.verifyBiometric(userId, biometricData, biometricType);

            // Log authentication attempt
            await this.logAuthentication(
                userId,
                'biometric',
                verificationResult.success ? 'success' : 'failed',
                null,
                verificationResult.success ? null : 'Biometric match failed'
            );

            return verificationResult;
        } catch (error) {
            logger.error('Biometric authentication failed', { error: error.message, userId, biometricType });
            throw error;
        }
    }

    /**
     * e-KYC Authentication
     * Generate encrypted e-KYC response for partners
     */
    async authenticateEKYC(userId, partnerId, policyId) {
        try {
            // Verify partner and policy
            const partnerResult = await pool.query(
                'SELECT id, partner_name, status FROM partners WHERE id = $1',
                [partnerId]
            );

            if (partnerResult.rows.length === 0 || partnerResult.rows[0].status !== 'active') {
                throw new Error('Invalid or inactive partner');
            }

            // Generate e-KYC response
            const eKycResponse = await eKycService.generateEKYCResponse(userId, partnerId, policyId);

            // Generate PSUT token for partner
            const token = await tokenizationService.generatePSUT(userId, partnerId);

            // Log authentication
            await this.logAuthentication(userId, 'ekyc', 'success', partnerId);

            return {
                success: true,
                eKycData: eKycResponse.encryptedData,
                token: token,
                message: 'e-KYC authentication successful'
            };
        } catch (error) {
            logger.error('e-KYC authentication failed', { error: error.message, userId, partnerId });
            throw error;
        }
    }

    /**
     * Check if authentication method is locked
     */
    async checkAuthLock(userId, authType, biometricModality = null) {
        try {
            const query = biometricModality
                ? 'SELECT is_locked FROM auth_locks WHERE user_id = $1 AND auth_type = $2 AND biometric_modality = $3'
                : 'SELECT is_locked FROM auth_locks WHERE user_id = $1 AND auth_type = $2';

            const params = biometricModality ? [userId, authType, biometricModality] : [userId, authType];

            const result = await pool.query(query, params);

            if (result.rows.length === 0) {
                return { isLocked: false };
            }

            return {
                isLocked: result.rows[0].is_locked,
                lockedAt: result.rows[0].locked_at
            };
        } catch (error) {
            logger.error('Auth lock check failed', { error: error.message, userId, authType });
            return { isLocked: false };
        }
    }

    /**
     * Log authentication attempt
     */
    async logAuthentication(userId, authType, authStatus, partnerId = null, failureReason = null) {
        try {
            await pool.query(
                `INSERT INTO authentication_logs 
                (user_id, auth_type, auth_status, partner_id, failure_reason, created_at)
                VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)`,
                [userId, authType, authStatus, partnerId, failureReason]
            );
        } catch (error) {
            logger.error('Failed to log authentication', { error: error.message });
        }
    }

    /**
     * Get authentication history for user
     */
    async getAuthenticationHistory(userId, limit = 50) {
        try {
            const result = await pool.query(
                `SELECT auth_type, auth_status, partner_id, ip_address, created_at
                FROM authentication_logs
                WHERE user_id = $1
                ORDER BY created_at DESC
                LIMIT $2`,
                [userId, limit]
            );

            return result.rows;
        } catch (error) {
            logger.error('Failed to get auth history', { error: error.message, userId });
            throw error;
        }
    }
}

module.exports = new AuthenticationService();
