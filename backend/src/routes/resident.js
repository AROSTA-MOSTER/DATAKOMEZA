/**
 * Resident Services Routes
 * Handles resident portal features: auth locks, service requests, card downloads, etc.
 */

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * @route   POST /api/resident/auth/lock
 * @desc    Lock authentication method
 * @access  Private
 */
router.post('/auth/lock',
    auth.authenticateToken,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('authType').isIn(['biometric', 'otp', 'demographic', 'all']).withMessage('Invalid auth type'),
        body('biometricModality').optional().isIn(['fingerprint', 'iris', 'face', 'all']),
        body('lockReason').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, authType, biometricModality, lockReason } = req.body;

            await pool.query(
                `INSERT INTO auth_locks (user_id, auth_type, biometric_modality, is_locked, locked_at, lock_reason)
                VALUES ($1, $2, $3, true, CURRENT_TIMESTAMP, $4)
                ON CONFLICT (user_id, auth_type, biometric_modality)
                DO UPDATE SET is_locked = true, locked_at = CURRENT_TIMESTAMP, lock_reason = $4`,
                [userId, authType, biometricModality, lockReason]
            );

            logger.info('Authentication locked', { userId, authType, biometricModality });

            res.json({
                success: true,
                message: 'Authentication method locked successfully'
            });
        } catch (error) {
            logger.error('Auth lock failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/resident/auth/unlock
 * @desc    Unlock authentication method
 * @access  Private
 */
router.post('/auth/unlock',
    auth.authenticateToken,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('authType').isIn(['biometric', 'otp', 'demographic', 'all']).withMessage('Invalid auth type'),
        body('biometricModality').optional().isIn(['fingerprint', 'iris', 'face', 'all'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, authType, biometricModality } = req.body;

            await pool.query(
                `UPDATE auth_locks
                SET is_locked = false, unlocked_at = CURRENT_TIMESTAMP
                WHERE user_id = $1 AND auth_type = $2 AND (biometric_modality = $3 OR $3 IS NULL)`,
                [userId, authType, biometricModality]
            );

            logger.info('Authentication unlocked', { userId, authType, biometricModality });

            res.json({
                success: true,
                message: 'Authentication method unlocked successfully'
            });
        } catch (error) {
            logger.error('Auth unlock failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   GET /api/resident/auth/locks/:userId
 * @desc    Get authentication locks for user
 * @access  Private
 */
router.get('/auth/locks/:userId', auth.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        const result = await pool.query(
            `SELECT auth_type, biometric_modality, is_locked, locked_at, unlocked_at, lock_reason
            FROM auth_locks
            WHERE user_id = $1
            ORDER BY created_at DESC`,
            [userId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Failed to get auth locks', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   POST /api/resident/service-request
 * @desc    Create service request
 * @access  Private
 */
router.post('/service-request',
    auth.authenticateToken,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('requestType').isIn([
            'vid_generate', 'vid_revoke', 'card_download', 'card_customize',
            'data_update', 'auth_lock', 'auth_unlock', 'phone_verify',
            'email_verify', 'data_share', 'uin_update'
        ]).withMessage('Invalid request type'),
        body('requestData').optional().isObject()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, requestType, requestData } = req.body;
            const requestId = `REQ_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            const result = await pool.query(
                `INSERT INTO service_requests (user_id, request_id, request_type, request_data, status)
                VALUES ($1, $2, $3, $4, 'pending')
                RETURNING id, request_id, request_type, status, created_at`,
                [userId, requestId, requestType, JSON.stringify(requestData)]
            );

            logger.info('Service request created', { userId, requestId, requestType });

            res.status(201).json({
                success: true,
                message: 'Service request created successfully',
                data: result.rows[0]
            });
        } catch (error) {
            logger.error('Service request creation failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   GET /api/resident/service-requests/:userId
 * @desc    Get service requests for user
 * @access  Private
 */
router.get('/service-requests/:userId', auth.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const status = req.query.status;

        let query = `
            SELECT request_id, request_type, status, request_data, result_data, 
            created_at, completed_at
            FROM service_requests
            WHERE user_id = $1
        `;
        const params = [userId];

        if (status) {
            query += ' AND status = $2';
            params.push(status);
        }

        query += ' ORDER BY created_at DESC LIMIT 50';

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Failed to get service requests', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/resident/transactions/:userId
 * @desc    Get transaction history for user
 * @access  Private
 */
router.get('/transactions/:userId', auth.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;
        const category = req.query.category;

        let query = `
            SELECT transaction_id, transaction_type, transaction_category, 
            description, status, created_at
            FROM transaction_history
            WHERE user_id = $1
        `;
        const params = [userId];

        if (category) {
            query += ' AND transaction_category = $2';
            params.push(category);
        }

        query += ` ORDER BY created_at DESC LIMIT $${params.length + 1}`;
        params.push(limit);

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Failed to get transactions', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   POST /api/resident/verify/phone
 * @desc    Verify phone number
 * @access  Private
 */
router.post('/verify/phone',
    auth.authenticateToken,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('phone').isMobilePhone().withMessage('Valid phone number is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, phone } = req.body;

            // Generate verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            await pool.query(
                `INSERT INTO contact_verifications 
                (user_id, contact_type, contact_value, verification_code, expires_at)
                VALUES ($1, 'phone', $2, $3, $4)`,
                [userId, phone, verificationCode, expiresAt]
            );

            // In production, send SMS
            logger.info('Phone verification initiated', { userId, phone });
            console.log(`📱 Verification code for ${phone}: ${verificationCode}`);

            res.json({
                success: true,
                message: 'Verification code sent to phone'
            });
        } catch (error) {
            logger.error('Phone verification failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/resident/verify/email
 * @desc    Verify email address
 * @access  Private
 */
router.post('/verify/email',
    auth.authenticateToken,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('email').isEmail().withMessage('Valid email is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, email } = req.body;

            // Generate verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
            const expiresAt = new Date();
            expiresAt.setMinutes(expiresAt.getMinutes() + 10);

            await pool.query(
                `INSERT INTO contact_verifications 
                (user_id, contact_type, contact_value, verification_code, expires_at)
                VALUES ($1, 'email', $2, $3, $4)`,
                [userId, email, verificationCode, expiresAt]
            );

            // In production, send email
            logger.info('Email verification initiated', { userId, email });
            console.log(`📧 Verification code for ${email}: ${verificationCode}`);

            res.json({
                success: true,
                message: 'Verification code sent to email'
            });
        } catch (error) {
            logger.error('Email verification failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/resident/data-update
 * @desc    Request demographic data update
 * @access  Private
 */
router.post('/data-update',
    auth.authenticateToken,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('updateType').isIn(['demographic', 'contact', 'address', 'document']).withMessage('Invalid update type'),
        body('newData').isObject().withMessage('New data is required'),
        body('supportingDocuments').optional().isObject()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, updateType, newData, supportingDocuments } = req.body;
            const requestId = `UPD_${Date.now()}_${Math.random().toString(36).substring(7)}`;

            const result = await pool.query(
                `INSERT INTO data_update_requests 
                (user_id, request_id, update_type, new_data, supporting_documents, status)
                VALUES ($1, $2, $3, $4, $5, 'pending')
                RETURNING id, request_id, update_type, status, created_at`,
                [userId, requestId, updateType, JSON.stringify(newData), JSON.stringify(supportingDocuments)]
            );

            logger.info('Data update request created', { userId, requestId, updateType });

            res.status(201).json({
                success: true,
                message: 'Data update request submitted successfully',
                data: result.rows[0]
            });
        } catch (error) {
            logger.error('Data update request failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

module.exports = router;
