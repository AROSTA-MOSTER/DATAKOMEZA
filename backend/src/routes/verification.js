/**
 * Verification Routes
 * Handles QR code and PIN verification for offline authentication
 */

const express = require('express');
const bcrypt = require('bcrypt');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * POST /api/verification/qr
 * Verify QR code for authentication
 */
router.post('/qr', [
    body('token').notEmpty(),
    body('userId').isUUID()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { token, userId } = req.body;

        // Find verification token
        const tokenResult = await query(
            `SELECT * FROM verification_tokens 
       WHERE user_id = $1 AND token_hash = $2 AND token_type = $3 AND used = false AND expires_at > CURRENT_TIMESTAMP`,
            [userId, token, 'qr_code']
        );

        if (tokenResult.rows.length === 0) {
            // Log failed verification
            await query(
                'INSERT INTO authentication_logs (user_id, auth_method, auth_status, offline_mode) VALUES ($1, $2, $3, $4)',
                [userId, 'qr_code', 'failed', true]
            );

            return res.status(401).json({
                success: false,
                message: 'Invalid or expired QR code'
            });
        }

        // Mark token as used
        await query(
            'UPDATE verification_tokens SET used = true, used_at = CURRENT_TIMESTAMP WHERE id = $1',
            [tokenResult.rows[0].id]
        );

        // Get user data
        const userResult = await query(
            'SELECT id, mosip_id, first_name, last_name, email FROM users WHERE id = $1',
            [userId]
        );

        // Log successful verification
        await query(
            'INSERT INTO authentication_logs (user_id, auth_method, auth_status, offline_mode) VALUES ($1, $2, $3, $4)',
            [userId, 'qr_code', 'success', true]
        );

        logger.info('QR code verified successfully', { userId });

        res.json({
            success: true,
            message: 'QR code verified successfully',
            data: {
                user: userResult.rows[0],
                verified: true
            }
        });

    } catch (error) {
        logger.error('QR verification error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

/**
 * POST /api/verification/pin
 * Verify PIN for offline authentication
 */
router.post('/pin', [
    body('identifier').notEmpty(), // email or phone
    body('pin').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { identifier, pin } = req.body;

        // Find user
        const userResult = await query(
            'SELECT id, mosip_id, first_name, last_name, email, pin_hash FROM users WHERE email = $1 OR phone = $1',
            [identifier]
        );

        if (userResult.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = userResult.rows[0];

        // Verify PIN
        const validPin = await bcrypt.compare(pin, user.pin_hash);
        if (!validPin) {
            // Log failed verification
            await query(
                'INSERT INTO authentication_logs (user_id, auth_method, auth_status, offline_mode) VALUES ($1, $2, $3, $4)',
                [user.id, 'pin', 'failed', true]
            );

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Log successful verification
        await query(
            'INSERT INTO authentication_logs (user_id, auth_method, auth_status, offline_mode) VALUES ($1, $2, $3, $4)',
            [user.id, 'pin', 'success', true]
        );

        logger.info('PIN verified successfully', { userId: user.id });

        res.json({
            success: true,
            message: 'PIN verified successfully',
            data: {
                user: {
                    id: user.id,
                    mosipId: user.mosip_id,
                    firstName: user.first_name,
                    lastName: user.last_name,
                    email: user.email
                },
                verified: true
            }
        });

    } catch (error) {
        logger.error('PIN verification error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Verification failed'
        });
    }
});

module.exports = router;
