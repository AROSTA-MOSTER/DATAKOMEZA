/**
 * Virtual ID Routes
 * Handles VID generation, revocation, and management
 */

const express = require('express');
const router = express.Router();
const virtualIdService = require('../services/virtualIdService');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * @route   POST /api/vid/generate
 * @desc    Generate new Virtual ID
 * @access  Private
 */
router.post('/generate',
    auth.authenticateToken,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('vidType').isIn(['temporary', 'permanent', 'perpetual']).withMessage('Invalid VID type'),
        body('expiryDays').optional().isInt({ min: 1 })
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, vidType, expiryDays } = req.body;

            const result = await virtualIdService.generateVID(userId, vidType, expiryDays);

            res.json({
                success: true,
                message: 'VID generated successfully',
                data: result
            });
        } catch (error) {
            logger.error('VID generation failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/vid/revoke
 * @desc    Revoke a Virtual ID
 * @access  Private
 */
router.post('/revoke',
    auth.authenticateToken,
    [
        body('userId').notEmpty().withMessage('User ID is required'),
        body('vid').isLength({ min: 16, max: 16 }).withMessage('Invalid VID format'),
        body('reason').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { userId, vid, reason } = req.body;

            const result = await virtualIdService.revokeVID(userId, vid, reason);

            res.json(result);
        } catch (error) {
            logger.error('VID revocation failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   GET /api/vid/list/:userId
 * @desc    Get all VIDs for a user
 * @access  Private
 */
router.get('/list/:userId', auth.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;

        const vids = await virtualIdService.getUserVIDs(userId);

        res.json({
            success: true,
            data: vids
        });
    } catch (error) {
        logger.error('Failed to get VIDs', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   POST /api/vid/validate
 * @desc    Validate a VID
 * @access  Public
 */
router.post('/validate',
    [
        body('vid').isLength({ min: 16, max: 16 }).withMessage('Invalid VID format')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { vid } = req.body;

            const result = await virtualIdService.validateVID(vid);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            logger.error('VID validation failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   GET /api/vid/usage/:userId
 * @desc    Get VID usage history
 * @access  Private
 */
router.get('/usage/:userId', auth.authenticateToken, async (req, res) => {
    try {
        const { userId } = req.params;
        const { vid } = req.query;

        const history = await virtualIdService.getVIDUsageHistory(userId, vid);

        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        logger.error('Failed to get VID usage', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
