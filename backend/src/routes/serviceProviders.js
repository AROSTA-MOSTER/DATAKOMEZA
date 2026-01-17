/**
 * Service Provider Routes
 * Handles service provider listing and access requests
 */

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/service-providers
 * List all active service providers
 */
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;

        let sql = 'SELECT id, name, type, description, logo_url FROM service_providers WHERE status = $1';
        const params = ['active'];

        if (type) {
            sql += ' AND type = $2';
            params.push(type);
        }

        sql += ' ORDER BY name';

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        logger.error('Get service providers error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve service providers'
        });
    }
});

/**
 * GET /api/service-providers/:id
 * Get service provider details
 */
router.get('/:id', async (req, res) => {
    try {
        const result = await query(
            'SELECT id, name, type, description, contact_email, contact_phone, address, logo_url FROM service_providers WHERE id = $1 AND status = $2',
            [req.params.id, 'active']
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Service provider not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        logger.error('Get service provider error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve service provider'
        });
    }
});

module.exports = router;
