/**
 * Registration Routes
 * Handles registration client operations
 */

const express = require('express');
const router = express.Router();
const registrationService = require('../services/registrationService');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * @route   POST /api/registration/operator/login
 * @desc    Operator login
 * @access  Public
 */
router.post('/operator/login',
    [
        body('operatorId').notEmpty().withMessage('Operator ID is required'),
        body('password').notEmpty().withMessage('Password is required'),
        body('loginMode').optional().isIn(['password', 'biometric', 'offline'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { operatorId, password, loginMode } = req.body;

            const result = await registrationService.operatorLogin(operatorId, password, loginMode);

            res.json(result);
        } catch (error) {
            logger.error('Operator login failed', { error: error.message });
            res.status(401).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/registration/packet/create
 * @desc    Create registration packet
 * @access  Private (Operator)
 */
router.post('/packet/create',
    auth.authenticateToken,
    [
        body('operatorId').isInt().withMessage('Operator ID is required'),
        body('demographicData').isObject().withMessage('Demographic data is required'),
        body('biometricData').optional().isObject(),
        body('documents').optional().isObject(),
        body('preRegId').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const result = await registrationService.createRegistrationPacket(
                req.body.operatorId,
                req.body
            );

            res.status(201).json(result);
        } catch (error) {
            logger.error('Packet creation failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/registration/packet/:packetId/submit
 * @desc    Submit packet for supervisor review
 * @access  Private (Operator)
 */
router.post('/packet/:packetId/submit', auth.authenticateToken, async (req, res) => {
    try {
        const { packetId } = req.params;
        const { operatorId } = req.body;

        const result = await registrationService.submitForReview(packetId, operatorId);

        res.json(result);
    } catch (error) {
        logger.error('Submit for review failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   POST /api/registration/packet/:packetId/review
 * @desc    Supervisor review packet
 * @access  Private (Supervisor)
 */
router.post('/packet/:packetId/review',
    auth.authenticateToken,
    [
        body('supervisorId').isInt().withMessage('Supervisor ID is required'),
        body('approved').isBoolean().withMessage('Approval status is required'),
        body('comments').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { packetId } = req.params;
            const { supervisorId, approved, comments } = req.body;

            const result = await registrationService.reviewPacket(
                packetId,
                supervisorId,
                approved,
                comments
            );

            res.json(result);
        } catch (error) {
            logger.error('Packet review failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/registration/packet/:packetId/upload
 * @desc    Upload packet to server
 * @access  Private (Operator)
 */
router.post('/packet/:packetId/upload', auth.authenticateToken, async (req, res) => {
    try {
        const { packetId } = req.params;

        const result = await registrationService.uploadPacket(packetId);

        res.json(result);
    } catch (error) {
        logger.error('Packet upload failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   POST /api/registration/packet/:packetId/acknowledgement
 * @desc    Generate acknowledgement slip
 * @access  Private (Operator)
 */
router.post('/packet/:packetId/acknowledgement', auth.authenticateToken, async (req, res) => {
    try {
        const { packetId } = req.params;

        const result = await registrationService.generateAcknowledgement(packetId);

        res.json(result);
    } catch (error) {
        logger.error('Acknowledgement generation failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/registration/packets/operator/:operatorId
 * @desc    Get packets for operator
 * @access  Private (Operator)
 */
router.get('/packets/operator/:operatorId', auth.authenticateToken, async (req, res) => {
    try {
        const { operatorId } = req.params;
        const { status } = req.query;

        const packets = await registrationService.getOperatorPackets(operatorId, status);

        res.json({
            success: true,
            data: packets
        });
    } catch (error) {
        logger.error('Failed to get operator packets', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/registration/packets/review
 * @desc    Get packets for supervisor review
 * @access  Private (Supervisor)
 */
router.get('/packets/review', auth.authenticateToken, async (req, res) => {
    try {
        const packets = await registrationService.getPacketsForReview(req.user.id);

        res.json({
            success: true,
            data: packets
        });
    } catch (error) {
        logger.error('Failed to get packets for review', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
