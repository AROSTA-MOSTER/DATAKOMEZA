/**
 * Authentication Routes
 * Handles OTP, demographic, biometric, and e-KYC authentication
 */

const express = require('express');
const router = express.Router();
const authenticationService = require('../services/authenticationService');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * @route   POST /api/authentication/otp/send
 * @desc    Send OTP for authentication
 * @access  Public
 */
router.post('/otp/send',
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('type').isIn(['sms', 'email']).withMessage('Type must be sms or email'),
        body('contact').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, type, contact } = req.body;

            const result = await authenticationService.sendOTP(userId, type, contact);

            res.json(result);
        } catch (error) {
            logger.error('OTP send failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/authentication/otp/verify
 * @desc    Verify OTP
 * @access  Public
 */
router.post('/otp/verify',
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits'),
        body('type').isIn(['sms', 'email']).withMessage('Type must be sms or email')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, otp, type } = req.body;

            const result = await authenticationService.verifyOTP(userId, otp, type);

            res.json(result);
        } catch (error) {
            logger.error('OTP verification failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/authentication/demographic
 * @desc    Authenticate using demographic data
 * @access  Public
 */
router.post('/demographic',
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('firstName').notEmpty().withMessage('First name is required'),
        body('lastName').notEmpty().withMessage('Last name is required'),
        body('dateOfBirth').notEmpty().withMessage('Date of birth is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, firstName, lastName, dateOfBirth, phone, email } = req.body;

            const result = await authenticationService.authenticateDemographic(userId, {
                firstName,
                lastName,
                dateOfBirth,
                phone,
                email
            });

            res.json(result);
        } catch (error) {
            logger.error('Demographic authentication failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/authentication/biometric
 * @desc    Authenticate using biometric data
 * @access  Public
 */
router.post('/biometric',
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('biometricData').notEmpty().withMessage('Biometric data is required'),
        body('biometricType').isIn(['Fingerprint', 'Iris', 'Face']).withMessage('Invalid biometric type')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, biometricData, biometricType } = req.body;

            const result = await authenticationService.authenticateBiometric(
                userId,
                biometricData,
                biometricType
            );

            res.json(result);
        } catch (error) {
            logger.error('Biometric authentication failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/authentication/ekyc
 * @desc    Authenticate and get e-KYC response
 * @access  Private (Partner API Key required)
 */
router.post('/ekyc',
    auth,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('partnerId').notEmpty().withMessage('Partner ID is required'),
        body('policyId').optional().isInt()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, partnerId, policyId } = req.body;

            const result = await authenticationService.authenticateEKYC(
                userId,
                partnerId,
                policyId
            );

            res.json(result);
        } catch (error) {
            logger.error('e-KYC authentication failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   GET /api/authentication/history/:userId
 * @desc    Get authentication history for user
 * @access  Private
 */
router.get('/history/:userId', auth, async (req, res) => {
    try {
        const { userId } = req.params;
        const limit = parseInt(req.query.limit) || 50;

        const history = await authenticationService.getAuthenticationHistory(userId, limit);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        logger.error('Failed to get auth history', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
