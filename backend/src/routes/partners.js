/**
 * Partner Routes
 * Handles partner registration, API keys, certificates, and licenses
 */

const express = require('express');
const router = express.Router();
const partnerService = require('../services/partnerService');
const auth = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('../utils/logger');

/**
 * @route   POST /api/partners/register
 * @desc    Partner self-registration
 * @access  Public
 */
router.post('/register',
    [
        body('partnerName').notEmpty().withMessage('Partner name is required'),
        body('partnerType').isIn(['auth', 'ekyc', 'credential', 'misp', 'device', 'ftm']).withMessage('Invalid partner type'),
        body('organizationName').notEmpty().withMessage('Organization name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('phone').optional().isString(),
        body('address').optional().isString(),
        body('website').optional().isURL()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const result = await partnerService.registerPartner(req.body);

            res.status(201).json(result);
        } catch (error) {
            logger.error('Partner registration failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/partners/:partnerId/certificate
 * @desc    Upload CA signed certificate
 * @access  Private
 */
router.post('/:partnerId/certificate',
    auth,
    [
        body('certificatePEM').notEmpty().withMessage('Certificate is required'),
        body('validFrom').isISO8601().withMessage('Valid from date required'),
        body('validTo').isISO8601().withMessage('Valid to date required'),
        body('issuer').notEmpty().withMessage('Issuer is required'),
        body('subject').notEmpty().withMessage('Subject is required')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { partnerId } = req.params;

            const result = await partnerService.uploadCertificate(partnerId, req.body);

            res.json(result);
        } catch (error) {
            logger.error('Certificate upload failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/partners/:partnerId/api-key
 * @desc    Generate API key for partner
 * @access  Private (Admin)
 */
router.post('/:partnerId/api-key',
    auth,
    [
        body('keyType').isIn(['sandbox', 'production']).withMessage('Invalid key type')
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { partnerId } = req.params;
            const { keyType } = req.body;

            const result = await partnerService.generateAPIKey(partnerId, keyType);

            res.json(result);
        } catch (error) {
            logger.error('API key generation failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   POST /api/partners/:partnerId/license
 * @desc    Generate license key for MISP partner
 * @access  Private (Admin)
 */
router.post('/:partnerId/license',
    auth,
    [
        body('licenseType').isIn(['misp', 'device', 'ftm']).withMessage('Invalid license type'),
        body('maxTransactions').optional().isInt()
    ],
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ success: false, errors: errors.array() });
            }

            const { partnerId } = req.params;
            const { licenseType, maxTransactions } = req.body;

            const result = await partnerService.generateLicenseKey(
                partnerId,
                licenseType,
                maxTransactions
            );

            res.json(result);
        } catch (error) {
            logger.error('License key generation failed', { error: error.message });
            res.status(500).json({
                success: false,
                message: error.message
            });
        }
    }
);

/**
 * @route   PUT /api/partners/:partnerId/approve
 * @desc    Approve partner registration
 * @access  Private (Admin)
 */
router.put('/:partnerId/approve', auth, async (req, res) => {
    try {
        const { partnerId } = req.params;
        const approvedBy = req.user.id; // From auth middleware

        const result = await partnerService.approvePartner(partnerId, approvedBy);

        res.json(result);
    } catch (error) {
        logger.error('Partner approval failed', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/partners/:partnerId
 * @desc    Get partner details
 * @access  Private
 */
router.get('/:partnerId', auth, async (req, res) => {
    try {
        const { partnerId } = req.params;

        const partner = await partnerService.getPartner(partnerId);

        res.json({
            success: true,
            data: partner
        });
    } catch (error) {
        logger.error('Failed to get partner', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

/**
 * @route   GET /api/partners
 * @desc    List all partners
 * @access  Private (Admin)
 */
router.get('/', auth, async (req, res) => {
    try {
        const filters = {
            partnerType: req.query.partnerType,
            status: req.query.status,
            approvalStatus: req.query.approvalStatus
        };

        const partners = await partnerService.listPartners(filters);

        res.json({
            success: true,
            data: partners
        });
    } catch (error) {
        logger.error('Failed to list partners', { error: error.message });
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

module.exports = router;
