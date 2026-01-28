/**
 * Policy Routes
 * Handles policy creation, management, and partner mapping
 */

const express = require('express');
const router = express.Router();
const policyService = require('../services/policyService');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * @route   POST /api/policies
 * @desc    Create new policy
 * @access  Private (Admin)
 */
router.post('/',
    auth.authenticateToken,
    [
        body('policyName').notEmpty().withMessage('Policy name is required'),
        body('policyType').isIn(['data_sharing', 'authentication', 'credential', 'ekyc']).withMessage('Invalid policy type'),
        body('policyRules').isObject().withMessage('Policy rules must be an object'),
        body('policyGroup').optional().isString(),
        body('description').optional().isString()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const createdBy = req.user.id;

            const result = await policyService.createPolicy(req.body, createdBy);

            res.status(201).json(result);
        } catch (error) {
            logger.error('Policy creation failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   GET /api/policies/:policyId
 * @desc    Get policy by ID
 * @access  Private
 */
router.get('/:policyId', auth.authenticateToken, async (req, res) => {
    try {
        const { policyId } = req.params;

        const policy = await policyService.getPolicy(policyId);

        res.json({
            success: true,
            data: policy
        });
    } catch (error) {
        logger.error('Failed to get policy', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/policies
 * @desc    List all policies
 * @access  Private
 */
router.get('/', auth.authenticateToken, async (req, res) => {
    try {
        const filters = {
            policyType: req.query.policyType,
            status: req.query.status,
            policyGroup: req.query.policyGroup
        };

        const policies = await policyService.listPolicies(filters);

        res.json({
            success: true,
            data: policies
        });
    } catch (error) {
        logger.error('Failed to list policies', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   PUT /api/policies/:policyId
 * @desc    Update policy
 * @access  Private (Admin)
 */
router.put('/:policyId',
    auth.authenticateToken,
    [
        body('policyName').optional().isString(),
        body('description').optional().isString(),
        body('policyRules').optional().isObject(),
        body('status').optional().isIn(['draft', 'active', 'inactive', 'deprecated'])
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { policyId } = req.params;

            const result = await policyService.updatePolicy(policyId, req.body);

            res.json(result);
        } catch (error) {
            logger.error('Policy update failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/policies/map
 * @desc    Map policy to partner
 * @access  Private (Admin)
 */
router.post('/map',
    auth.authenticateToken,
    [
        body('partnerId').isInt().withMessage('Partner ID is required'),
        body('policyId').isInt().withMessage('Policy ID is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { partnerId, policyId } = req.body;
            const createdBy = req.user.id;

            const result = await policyService.mapPolicyToPartner(partnerId, policyId, createdBy);

            res.json(result);
        } catch (error) {
            logger.error('Policy mapping failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   GET /api/policies/partner/:partnerId
 * @desc    Get policies for a partner
 * @access  Private
 */
router.get('/partner/:partnerId', auth.authenticateToken, async (req, res) => {
    try {
        const { partnerId } = req.params;

        const policies = await policyService.getPartnerPolicies(partnerId);

        res.json({
            success: true,
            data: policies
        });
    } catch (error) {
        logger.error('Failed to get partner policies', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   POST /api/policies/init-defaults
 * @desc    Create default policies
 * @access  Private (Admin)
 */
router.post('/init-defaults', auth.authenticateToken, async (req, res) => {
    try {
        const result = await policyService.createDefaultPolicies();

        res.json(result);
    } catch (error) {
        logger.error('Failed to create default policies', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
