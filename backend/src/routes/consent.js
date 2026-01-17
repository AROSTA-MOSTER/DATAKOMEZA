/**
 * Consent Routes
 * Handles consent management for data sharing
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();
router.use(authenticateToken);

/**
 * GET /api/consent
 * Get all consent records for current user
 */
router.get('/', async (req, res) => {
    try {
        const result = await query(
            `SELECT c.*, sp.name as service_provider_name, sp.type as service_provider_type
       FROM consent_records c
       JOIN service_providers sp ON c.service_provider_id = sp.id
       WHERE c.user_id = $1
       ORDER BY c.created_at DESC`,
            [req.user.userId]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        logger.error('Get consent records error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve consent records'
        });
    }
});

/**
 * POST /api/consent/grant
 * Grant consent to a service provider
 */
router.post('/grant', [
    body('serviceProviderId').isUUID(),
    body('attributesShared').isArray().notEmpty(),
    body('purpose').trim().notEmpty(),
    body('expiryMonths').optional().isInt({ min: 1, max: 24 })
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { serviceProviderId, attributesShared, purpose, expiryMonths = 12 } = req.body;

        // Verify service provider exists
        const spResult = await query(
            'SELECT id, name FROM service_providers WHERE id = $1 AND status = $2',
            [serviceProviderId, 'active']
        );

        if (spResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service provider not found'
            });
        }

        // Calculate expiry date
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + expiryMonths);

        // Create consent record
        const result = await query(
            `INSERT INTO consent_records (
        id, user_id, service_provider_id, attributes_shared, purpose,
        consent_given, consent_date, expiry_date
      ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, $7)
      RETURNING *`,
            [
                uuidv4(),
                req.user.userId,
                serviceProviderId,
                JSON.stringify(attributesShared),
                purpose,
                true,
                expiryDate
            ]
        );

        // Log audit trail
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details) VALUES ($1, $2, $3, $4, $5)',
            [
                req.user.userId,
                'consent_granted',
                'consent_record',
                result.rows[0].id,
                JSON.stringify({ service_provider: spResult.rows[0].name, attributes: attributesShared })
            ]
        );

        logger.info('Consent granted', {
            userId: req.user.userId,
            serviceProviderId,
            attributes: attributesShared
        });

        res.status(201).json({
            success: true,
            message: 'Consent granted successfully',
            data: result.rows[0]
        });

    } catch (error) {
        logger.error('Grant consent error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to grant consent'
        });
    }
});

/**
 * POST /api/consent/revoke
 * Revoke consent
 */
router.post('/revoke', [
    body('consentId').isUUID()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { consentId } = req.body;

        // Update consent record
        const result = await query(
            `UPDATE consent_records 
       SET revoked = true, revoked_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2 AND revoked = false
       RETURNING *`,
            [consentId, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consent record not found or already revoked'
            });
        }

        // Log audit trail
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, resource_id) VALUES ($1, $2, $3, $4)',
            [req.user.userId, 'consent_revoked', 'consent_record', consentId]
        );

        logger.info('Consent revoked', { userId: req.user.userId, consentId });

        res.json({
            success: true,
            message: 'Consent revoked successfully',
            data: result.rows[0]
        });

    } catch (error) {
        logger.error('Revoke consent error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to revoke consent'
        });
    }
});

/**
 * GET /api/consent/:id
 * Get specific consent record
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            `SELECT c.*, sp.name as service_provider_name, sp.type as service_provider_type
       FROM consent_records c
       JOIN service_providers sp ON c.service_provider_id = sp.id
       WHERE c.id = $1 AND c.user_id = $2`,
            [req.params.id, req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Consent record not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        logger.error('Get consent record error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve consent record'
        });
    }
});

module.exports = router;
