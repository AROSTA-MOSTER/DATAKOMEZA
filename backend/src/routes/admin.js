/**
 * Admin Routes
 * Administrative functions for managing the platform
 */

const express = require('express');
const { query } = require('../config/database');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { logger } = require('../utils/logger');

const router = express.Router();

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

/**
 * GET /api/admin/users
 * List all users
 */
router.get('/users', async (req, res) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        const offset = (page - 1) * limit;

        let sql = `SELECT id, mosip_id, email, phone, first_name, last_name, 
                      date_of_birth, gender, nationality, status, created_at, last_login
               FROM users`;
        const params = [];

        if (status) {
            sql += ' WHERE status = $1';
            params.push(status);
        }

        sql += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);

        // Get total count
        const countResult = await query(
            status ? 'SELECT COUNT(*) FROM users WHERE status = $1' : 'SELECT COUNT(*) FROM users',
            status ? [status] : []
        );

        res.json({
            success: true,
            data: {
                users: result.rows,
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: parseInt(countResult.rows[0].count)
                }
            }
        });

    } catch (error) {
        logger.error('Get users error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve users'
        });
    }
});

/**
 * GET /api/admin/audit-logs
 * Get audit logs
 */
router.get('/audit-logs', async (req, res) => {
    try {
        const { page = 1, limit = 50, userId, action } = req.query;
        const offset = (page - 1) * limit;

        let sql = `SELECT al.*, u.email as user_email, u.first_name, u.last_name
               FROM audit_logs al
               LEFT JOIN users u ON al.user_id = u.id
               WHERE 1=1`;
        const params = [];

        if (userId) {
            params.push(userId);
            sql += ` AND al.user_id = $${params.length}`;
        }

        if (action) {
            params.push(action);
            sql += ` AND al.action = $${params.length}`;
        }

        sql += ` ORDER BY al.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await query(sql, params);

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        logger.error('Get audit logs error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve audit logs'
        });
    }
});

/**
 * GET /api/admin/statistics
 * Get platform statistics
 */
router.get('/statistics', async (req, res) => {
    try {
        const stats = await query(`
      SELECT 
        (SELECT COUNT(*) FROM users WHERE status = 'active') as active_users,
        (SELECT COUNT(*) FROM users) as total_users,
        (SELECT COUNT(*) FROM service_providers WHERE status = 'active') as active_service_providers,
        (SELECT COUNT(*) FROM consent_records WHERE consent_given = true AND revoked = false) as active_consents,
        (SELECT COUNT(*) FROM authentication_logs WHERE created_at > NOW() - INTERVAL '24 hours') as authentications_24h,
        (SELECT COUNT(*) FROM authentication_logs WHERE auth_status = 'success') as successful_authentications,
        (SELECT COUNT(*) FROM authentication_logs WHERE auth_status = 'failed') as failed_authentications
    `);

        res.json({
            success: true,
            data: stats.rows[0]
        });

    } catch (error) {
        logger.error('Get statistics error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve statistics'
        });
    }
});

module.exports = router;
