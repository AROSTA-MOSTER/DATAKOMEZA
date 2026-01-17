/**
 * MOSIP Integration Routes
 * Real MOSIP Mock Services integration
 */

const express = require('express');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');
const mosipService = require('../services/mosipMockService');

const router = express.Router();

/**
 * GET /api/mosip/health
 * Check MOSIP services health
 */
router.get('/health', async (req, res) => {
    try {
        const health = await mosipService.healthCheck();

        res.json({
            success: true,
            data: health
        });
    } catch (error) {
        logger.error('MOSIP health check error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Health check failed'
        });
    }
});

/**
 * GET /api/mosip/devices
 * Discover available biometric devices
 */
router.get('/devices', authenticateToken, async (req, res) => {
    try {
        const devices = await mosipService.mds.discoverDevices();

        res.json({
            success: true,
            data: devices
        });
    } catch (error) {
        logger.error('Device discovery error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Device discovery failed'
        });
    }
});

/**
 * POST /api/mosip/capture-biometric
 * Capture biometric data
 */
router.post('/capture-biometric', authenticateToken, [
    body('deviceId').notEmpty(),
    body('biometricType').isIn(['Fingerprint', 'Iris', 'Face'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { deviceId, biometricType } = req.body;

        const biometric = await mosipService.mds.captureBiometric(deviceId, biometricType);

        res.json({
            success: true,
            data: biometric
        });
    } catch (error) {
        logger.error('Biometric capture error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Biometric capture failed'
        });
    }
});

/**
 * POST /api/mosip/register
 * Register user with MOSIP (Complete workflow)
 */
router.post('/register', authenticateToken, [
    body('biometricData').optional(),
    body('documentData').optional()
], async (req, res) => {
    try {
        // Get user data
        const userResult = await query(
            'SELECT * FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        // Register with MOSIP
        const mosipResult = await mosipService.registerWithMOSIP({
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            dateOfBirth: user.date_of_birth,
            gender: user.gender,
            nationality: user.nationality
        });

        if (!mosipResult.success) {
            return res.status(400).json({
                success: false,
                message: mosipResult.message
            });
        }

        // Update user with MOSIP ID and reference ID
        await query(
            'UPDATE users SET mosip_id = $1 WHERE id = $2',
            [mosipResult.mosipId, req.user.userId]
        );

        // Store biometric reference
        await query(
            `INSERT INTO user_attributes (user_id, attribute_name, attribute_value_encrypted, attribute_type, is_sensitive)
       VALUES ($1, $2, $3, $4, $5)`,
            [
                req.user.userId,
                'mosip_reference_id',
                mosipResult.referenceId,
                'text',
                true
            ]
        );

        // Log audit trail
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [
                req.user.userId,
                'mosip_registered',
                'user',
                JSON.stringify({
                    mosip_id: mosipResult.mosipId,
                    reference_id: mosipResult.referenceId,
                    biometric_quality: mosipResult.biometricQuality
                })
            ]
        );

        logger.info('MOSIP registration successful', {
            userId: req.user.userId,
            mosipId: mosipResult.mosipId
        });

        res.json({
            success: true,
            message: mosipResult.message,
            data: {
                mosipId: mosipResult.mosipId,
                referenceId: mosipResult.referenceId,
                biometricQuality: mosipResult.biometricQuality,
                status: 'registered'
            }
        });

    } catch (error) {
        logger.error('MOSIP registration error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'MOSIP registration failed',
            error: error.message
        });
    }
});

/**
 * POST /api/mosip/verify
 * Verify identity using biometrics
 */
router.post('/verify', authenticateToken, [
    body('biometricData').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { biometricData } = req.body;

        // Get user's MOSIP ID
        const userResult = await query(
            'SELECT mosip_id FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (userResult.rows.length === 0 || !userResult.rows[0].mosip_id) {
            return res.status(404).json({
                success: false,
                message: 'User not registered with MOSIP'
            });
        }

        const mosipId = userResult.rows[0].mosip_id;

        // Verify with MOSIP
        const verifyResult = await mosipService.verifyIdentity(mosipId, biometricData);

        // Log verification attempt
        await query(
            'INSERT INTO authentication_logs (user_id, auth_method, auth_status) VALUES ($1, $2, $3)',
            [
                req.user.userId,
                'mosip_biometric',
                verifyResult.verified ? 'success' : 'failed'
            ]
        );

        res.json({
            success: true,
            data: verifyResult
        });

    } catch (error) {
        logger.error('MOSIP verification error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'MOSIP verification failed'
        });
    }
});

/**
 * GET /api/mosip/verify/:mosipId
 * Verify MOSIP identity by ID
 */
router.get('/verify/:mosipId', async (req, res) => {
    try {
        const { mosipId } = req.params;

        // Find user with MOSIP ID
        const result = await query(
            'SELECT id, mosip_id, first_name, last_name, email FROM users WHERE mosip_id = $1',
            [mosipId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'MOSIP ID not found'
            });
        }

        res.json({
            success: true,
            message: 'MOSIP ID verified',
            data: {
                verified: true,
                user: result.rows[0]
            }
        });

    } catch (error) {
        logger.error('MOSIP verification error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'MOSIP verification failed'
        });
    }
});

/**
 * POST /api/mosip/quality-check
 * Check biometric quality
 */
router.post('/quality-check', authenticateToken, [
    body('biometricData').notEmpty(),
    body('biometricType').isIn(['Fingerprint', 'Iris', 'Face'])
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { biometricData, biometricType } = req.body;

        const qualityResult = await mosipService.sdk.checkQuality(biometricData, biometricType);

        res.json({
            success: true,
            data: qualityResult
        });
    } catch (error) {
        logger.error('Quality check error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Quality check failed'
        });
    }
});

module.exports = router;
