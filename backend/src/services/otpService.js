/**
 * OTP Service
 * Handles OTP generation, sending, and verification for SMS and Email
 */

const crypto = require('crypto');
const pool = require('../config/database');
const logger = require('../utils/logger');

// For production, use actual SMS/Email services
// const twilio = require('twilio');
// const sgMail = require('@sendgrid/mail');

class OTPService {
    constructor() {
        this.OTP_EXPIRY_MINUTES = 5;
        this.MAX_ATTEMPTS = 3;
    }

    /**
     * Generate OTP code
     */
    async generateOTP(userId, type, contact) {
        try {
            // Generate 6-digit OTP
            const otp = crypto.randomInt(100000, 999999).toString();

            // Calculate expiry
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + this.OTP_EXPIRY_MINUTES);

            // Invalidate previous OTPs
            await pool.query(
                'UPDATE otp_requests SET verified = true WHERE user_id = $1 AND otp_type = $2 AND verified = false',
                [userId, type]
            );

            // Store OTP
            await pool.query(
                `INSERT INTO otp_requests (user_id, otp_code, otp_type, contact, expires_at)
                VALUES ($1, $2, $3, $4, $5)`,
                [userId, otp, type, contact, expiresAt]
            );

            logger.info('OTP generated', { userId, type, contact });

            return otp;
        } catch (error) {
            logger.error('OTP generation failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Send OTP via SMS
     */
    async sendSMS(phone, otp) {
        try {
            // In production, use Twilio or AWS SNS
            // const client = twilio(accountSid, authToken);
            // await client.messages.create({
            //     body: `Your DATAKOMEZA verification code is: ${otp}. Valid for 5 minutes.`,
            //     from: process.env.TWILIO_PHONE_NUMBER,
            //     to: phone
            // });

            // For development, just log
            logger.info('SMS OTP sent (dev mode)', { phone, otp });
            console.log(`📱 SMS OTP for ${phone}: ${otp}`);

            return true;
        } catch (error) {
            logger.error('SMS send failed', { error: error.message, phone });
            throw error;
        }
    }

    /**
     * Send OTP via Email
     */
    async sendEmail(email, otp) {
        try {
            // In production, use SendGrid or AWS SES
            // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
            // await sgMail.send({
            //     to: email,
            //     from: process.env.SENDGRID_FROM_EMAIL,
            //     subject: 'DATAKOMEZA Verification Code',
            //     text: `Your verification code is: ${otp}. Valid for 5 minutes.`,
            //     html: `<p>Your verification code is: <strong>${otp}</strong></p><p>Valid for 5 minutes.</p>`
            // });

            // For development, just log
            logger.info('Email OTP sent (dev mode)', { email, otp });
            console.log(`📧 Email OTP for ${email}: ${otp}`);

            return true;
        } catch (error) {
            logger.error('Email send failed', { error: error.message, email });
            throw error;
        }
    }

    /**
     * Verify OTP
     */
    async verifyOTP(userId, otp, type) {
        try {
            const result = await pool.query(
                `SELECT id, otp_code, expires_at, attempts, verified
                FROM otp_requests
                WHERE user_id = $1 AND otp_type = $2 AND verified = false
                ORDER BY created_at DESC
                LIMIT 1`,
                [userId, type]
            );

            if (result.rows.length === 0) {
                logger.warn('No OTP found for verification', { userId, type });
                return false;
            }

            const otpRecord = result.rows[0];

            // Check if expired
            if (new Date() > new Date(otpRecord.expires_at)) {
                logger.warn('OTP expired', { userId, type });
                return false;
            }

            // Check attempts
            if (otpRecord.attempts >= this.MAX_ATTEMPTS) {
                logger.warn('Max OTP attempts exceeded', { userId, type });
                return false;
            }

            // Increment attempts
            await pool.query(
                'UPDATE otp_requests SET attempts = attempts + 1 WHERE id = $1',
                [otpRecord.id]
            );

            // Verify OTP
            if (otpRecord.otp_code !== otp) {
                logger.warn('Invalid OTP', { userId, type });
                return false;
            }

            // Mark as verified
            await pool.query(
                'UPDATE otp_requests SET verified = true, verified_at = CURRENT_TIMESTAMP WHERE id = $1',
                [otpRecord.id]
            );

            logger.info('OTP verified successfully', { userId, type });
            return true;
        } catch (error) {
            logger.error('OTP verification failed', { error: error.message, userId });
            throw error;
        }
    }

    /**
     * Cleanup expired OTPs
     */
    async cleanupExpiredOTPs() {
        try {
            const result = await pool.query(
                'DELETE FROM otp_requests WHERE expires_at < CURRENT_TIMESTAMP'
            );

            logger.info('Expired OTPs cleaned up', { count: result.rowCount });
            return result.rowCount;
        } catch (error) {
            logger.error('OTP cleanup failed', { error: error.message });
            throw error;
        }
    }
}

module.exports = new OTPService();
