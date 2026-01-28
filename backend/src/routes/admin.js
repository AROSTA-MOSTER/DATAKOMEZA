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


/**
 * GET /api/admin/users/pending
 * Get users pending verification
 */
router.get('/users/pending', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const result = await query(
            'SELECT id, email, phone, first_name, last_name, status, created_at FROM users WHERE status = $1 ORDER BY created_at DESC',
            ['pending_verification']
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Error fetching pending users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/admin/users/:id/approve-biometric
 * Approve user for biometric capture
 */
router.post('/users/:id/approve-biometric', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;

        // Check if user exists and is pending
        const userCheck = await query('SELECT status FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userCheck.rows[0].status !== 'pending_verification') {
            return res.status(400).json({ success: false, message: 'User verification not pending' });
        }

        // Update status
        await query(
            "UPDATE users SET status = 'approved_for_biometric' WHERE id = $1",
            [id]
        );

        // Audit log
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [id, 'approved_for_biometric', 'user', JSON.stringify({ admin_id: req.user.userId })]
        );

        res.json({ success: true, message: 'User approved for biometric capture' });
    } catch (error) {
        logger.error('Error approving user:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/admin/users/:id/capture-biometric
 * Simulate biometric capture, deduplication check, and issue Digital ID
 */
router.post('/users/:id/capture-biometric', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;

        // Check user status
        const userCheck = await query('SELECT status FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userCheck.rows[0].status !== 'approved_for_biometric') {
            return res.status(400).json({ success: false, message: 'User not approved for biometrics' });
        }

        // 1. Simulate Biometric Capture & Quality Check (Success)
        // 2. Simulate ABIS Deduplication (Success)

        // 3. Generate Digital ID (MOSIP ID)
        const mosipId = 'MOSIP' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

        // 4. Update User Status & ID
        await query(
            "UPDATE users SET status = 'active_verified', biometric_status = 'captured', mosip_id = $1 WHERE id = $2",
            [mosipId, id]
        );

        // Audit log
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [id, 'biometric_captured_id_issued', 'user', JSON.stringify({ admin_id: req.user.userId, mosip_id: mosipId })]
        );

        res.json({
            success: true,
            message: 'Biometrics verified and Digital ID issued',
            data: { mosipId }
        });
    } catch (error) {
        logger.error('Error capturing biometrics:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/admin/users/:id/details
 * Get full user details for admin review
 */
router.get('/users/:id/details', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;

        const result = await query(
            `SELECT id, mosip_id, email, phone, first_name, last_name, 
                    date_of_birth, place_of_birth, gender, nationality,
                    father_name, mother_name, marital_status, current_address,
                    status, biometric_status, verification_notes, 
                    correction_fields, scheduled_biometric_date,
                    created_at, updated_at
             FROM users WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Get biometric records if any
        const biometrics = await query(
            `SELECT biometric_type, finger_position, quality_score, status, captured_at
             FROM biometric_records WHERE user_id = $1`,
            [id]
        );

        res.json({
            success: true,
            data: {
                user: result.rows[0],
                biometrics: biometrics.rows
            }
        });
    } catch (error) {
        logger.error('Error fetching user details:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/admin/users/:id/request-correction
 * Request user to correct specific fields
 */
router.post('/users/:id/request-correction', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;
        const { fields, message } = req.body;

        if (!fields || !Array.isArray(fields) || fields.length === 0) {
            return res.status(400).json({ success: false, message: 'Fields array required' });
        }

        // Check user exists
        const userCheck = await query('SELECT status FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update user status and correction fields
        await query(
            `UPDATE users SET 
                status = 'correction_requested',
                correction_fields = $1,
                verification_notes = $2
             WHERE id = $3`,
            [fields, message || 'Please correct the indicated fields', id]
        );

        // Audit log
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [id, 'correction_requested', 'user', JSON.stringify({
                admin_id: req.user.userId,
                fields: fields,
                message: message
            })]
        );

        res.json({ success: true, message: 'Correction request sent to user' });
    } catch (error) {
        logger.error('Error requesting correction:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/admin/users/:id/reject
 * Reject user registration
 */
router.post('/users/:id/reject', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        if (!reason) {
            return res.status(400).json({ success: false, message: 'Rejection reason required' });
        }

        // Check user exists
        const userCheck = await query('SELECT status FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update status
        await query(
            `UPDATE users SET 
                status = 'rejected',
                verification_notes = $1
             WHERE id = $2`,
            [reason, id]
        );

        // Audit log
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [id, 'registration_rejected', 'user', JSON.stringify({
                admin_id: req.user.userId,
                reason: reason
            })]
        );

        res.json({ success: true, message: 'Registration rejected' });
    } catch (error) {
        logger.error('Error rejecting registration:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/admin/users/:id/schedule-biometric
 * Schedule biometric capture appointment
 */
router.post('/users/:id/schedule-biometric', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;
        const { scheduledDate } = req.body;

        if (!scheduledDate) {
            return res.status(400).json({ success: false, message: 'Scheduled date required' });
        }

        // Check user is approved for biometric
        const userCheck = await query('SELECT status FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userCheck.rows[0].status !== 'approved_for_biometric') {
            return res.status(400).json({ success: false, message: 'User must be approved for biometrics first' });
        }

        await query(
            'UPDATE users SET scheduled_biometric_date = $1 WHERE id = $2',
            [scheduledDate, id]
        );

        // Audit log
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [id, 'biometric_scheduled', 'user', JSON.stringify({
                admin_id: req.user.userId,
                scheduled_date: scheduledDate
            })]
        );

        res.json({ success: true, message: 'Biometric capture scheduled' });
    } catch (error) {
        logger.error('Error scheduling biometric:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/admin/users/:id/capture-biometrics-full
 * Full biometric capture with ABIS deduplication
 */
router.post('/users/:id/capture-biometrics-full', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;
        const { biometrics } = req.body;
        const crypto = require('crypto');
        const mosipService = require('../services/mosipMockService');

        // Validate biometrics array
        if (!biometrics || !Array.isArray(biometrics)) {
            return res.status(400).json({ success: false, message: 'Biometrics array required' });
        }

        // Check user status
        const userCheck = await query('SELECT status, first_name, last_name FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userCheck.rows[0].status !== 'approved_for_biometric') {
            return res.status(400).json({ success: false, message: 'User not approved for biometrics' });
        }

        // Step 1: Quality check all biometrics
        let allQualityPassed = true;
        const qualityResults = [];

        for (const bio of biometrics) {
            const qualityCheck = await mosipService.sdk.checkQuality(
                bio.data || 'mock-biometric-data',
                bio.type
            );
            qualityResults.push({
                type: bio.type,
                position: bio.position,
                quality: qualityCheck.score,
                passed: qualityCheck.passed
            });
            if (!qualityCheck.passed) {
                allQualityPassed = false;
            }
        }

        if (!allQualityPassed) {
            // Update biometric status
            await query(
                "UPDATE users SET biometric_status = 'quality_check_failed' WHERE id = $1",
                [id]
            );

            return res.status(400).json({
                success: false,
                message: 'Biometric quality check failed',
                data: { qualityResults }
            });
        }

        // Step 2: Insert biometric records
        for (const bio of biometrics) {
            const templateHash = crypto
                .createHash('sha256')
                .update(bio.data || 'mock-data-' + bio.type)
                .digest('hex');

            await query(
                `INSERT INTO biometric_records 
                    (user_id, biometric_type, finger_position, quality_score, captured_by, template_hash, status)
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [
                    id,
                    bio.type,
                    bio.position || null,
                    bio.quality || 95,
                    req.user.userId,
                    templateHash,
                    'verified'
                ]
            );
        }

        // Step 3: Check if all required biometrics are captured
        const required = ['face', 'signature'];
        const fingerCount = biometrics.filter(b => b.type === 'fingerprint').length;
        const hasRequiredTypes = required.every(type =>
            biometrics.some(b => b.type === type)
        );

        if (!hasRequiredTypes || fingerCount < 10) {
            // Partial capture
            await query(
                "UPDATE users SET biometric_status = 'partial' WHERE id = $1",
                [id]
            );

            return res.json({
                success: true,
                message: 'Biometrics partially captured',
                data: {
                    capturedCount: biometrics.length,
                    requiredFingerprints: 10,
                    currentFingerprints: fingerCount,
                    missingRequired: required.filter(t => !biometrics.some(b => b.type === t))
                }
            });
        }

        // Step 4: ABIS Deduplication Check
        const abisResult = await mosipService.abis.identifyBiometric(id, {
            face: biometrics.find(b => b.type === 'face')?.data,
            fingerprints: biometrics.filter(b => b.type === 'fingerprint').map(b => b.data)
        });

        // Update deduplication status in biometric records
        await query(
            `UPDATE biometric_records SET deduplication_status = $1 WHERE user_id = $2`,
            [abisResult.duplicateFound ? 'duplicate_found' : 'unique', id]
        );

        if (abisResult.duplicateFound) {
            // FLAGGED_DUPLICATE - Block issuance
            await query(
                `UPDATE users SET 
                    status = 'flagged_duplicate',
                    biometric_status = 'captured',
                    verification_notes = $1
                 WHERE id = $2`,
                [`Potential duplicate found. Match confidence: ${abisResult.matchConfidence || 'N/A'}%`, id]
            );

            // Audit log
            await query(
                'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
                [id, 'duplicate_flagged', 'user', JSON.stringify({
                    admin_id: req.user.userId,
                    match_confidence: abisResult.matchConfidence,
                    potential_match_id: abisResult.matchedId
                })]
            );

            return res.json({
                success: false,
                message: 'Duplicate identity detected - flagged for investigation',
                data: {
                    status: 'flagged_duplicate',
                    matchConfidence: abisResult.matchConfidence,
                    requiresManualReview: true
                }
            });
        }

        // Step 5: All checks passed - Set BIOMETRICS_VERIFIED
        await query(
            `UPDATE users SET 
                status = 'biometrics_verified',
                biometric_status = 'captured'
             WHERE id = $1`,
            [id]
        );

        // Audit log for biometrics verified
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [id, 'biometrics_verified', 'user', JSON.stringify({
                admin_id: req.user.userId,
                biometric_count: biometrics.length,
                deduplication_result: 'unique'
            })]
        );

        res.json({
            success: true,
            message: 'Biometrics verified successfully. Ready for ID issuance.',
            data: {
                status: 'biometrics_verified',
                biometricsCount: biometrics.length,
                nextStep: 'issue_digital_id'
            }
        });

    } catch (error) {
        logger.error('Error in full biometric capture:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/admin/users/:id/issue-digital-id
 * Issue Digital ID after biometrics are verified
 */
router.post('/users/:id/issue-digital-id', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;
        const crypto = require('crypto');

        // Check user status
        const userCheck = await query(
            'SELECT status, first_name, last_name, email FROM users WHERE id = $1',
            [id]
        );
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userCheck.rows[0].status !== 'biometrics_verified') {
            return res.status(400).json({
                success: false,
                message: 'User biometrics must be verified before ID issuance'
            });
        }

        const user = userCheck.rows[0];

        // Generate MOSIP ID (UIN)
        const mosipId = 'MOSIP' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

        // Generate QR code token for verification
        const qrToken = crypto.randomBytes(32).toString('hex');
        const qrTokenHash = crypto.createHash('sha256').update(qrToken).digest('hex');

        // Store QR verification token
        await query(
            `INSERT INTO verification_tokens (user_id, token_hash, token_type, expires_at)
             VALUES ($1, $2, 'qr_code', NOW() + INTERVAL '1 year')`,
            [id, qrTokenHash]
        );

        // Update user with final status
        await query(
            `UPDATE users SET 
                status = 'active_verified',
                mosip_id = $1
             WHERE id = $2`,
            [mosipId, id]
        );

        // Audit log
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [id, 'digital_id_issued', 'user', JSON.stringify({
                admin_id: req.user.userId,
                mosip_id: mosipId,
                qr_generated: true
            })]
        );

        res.json({
            success: true,
            message: 'Digital ID issued successfully',
            data: {
                mosipId,
                userName: `${user.first_name} ${user.last_name}`,
                qrToken: qrToken, // In production, this would be encoded in a QR code
                status: 'active_verified',
                issuedAt: new Date().toISOString()
            }
        });

    } catch (error) {
        logger.error('Error issuing digital ID:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/admin/users/flagged-duplicates
 * Get users flagged as potential duplicates
 */
router.get('/users/flagged-duplicates', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, phone, first_name, last_name, verification_notes, created_at 
             FROM users 
             WHERE status = 'flagged_duplicate' 
             ORDER BY created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Error fetching flagged duplicates:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * POST /api/admin/users/:id/resolve-duplicate
 * Resolve a flagged duplicate case
 */
router.post('/users/:id/resolve-duplicate', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution, notes } = req.body;

        if (!resolution || !['approve', 'reject', 'merge'].includes(resolution)) {
            return res.status(400).json({
                success: false,
                message: 'Resolution must be: approve, reject, or merge'
            });
        }

        // Check user is flagged
        const userCheck = await query('SELECT status FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (userCheck.rows[0].status !== 'flagged_duplicate') {
            return res.status(400).json({ success: false, message: 'User is not flagged as duplicate' });
        }

        let newStatus;
        if (resolution === 'approve') {
            newStatus = 'biometrics_verified'; // Can now proceed to ID issuance
        } else if (resolution === 'reject') {
            newStatus = 'rejected';
        } else {
            // merge - would require more complex logic in production
            newStatus = 'rejected';
        }

        await query(
            `UPDATE users SET 
                status = $1,
                verification_notes = $2
             WHERE id = $3`,
            [newStatus, `Duplicate resolved: ${resolution}. ${notes || ''}`, id]
        );

        // Audit log
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [id, 'duplicate_resolved', 'user', JSON.stringify({
                admin_id: req.user.userId,
                resolution,
                notes,
                new_status: newStatus
            })]
        );

        res.json({
            success: true,
            message: `Duplicate case resolved: ${resolution}`,
            data: { newStatus }
        });

    } catch (error) {
        logger.error('Error resolving duplicate:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * GET /api/admin/users/approved-for-biometric
 * Get users ready for biometric capture
 */
router.get('/users/approved-for-biometric', [
    authenticateToken,
    requireAdmin
], async (req, res) => {
    try {
        const result = await query(
            `SELECT id, email, phone, first_name, last_name, status, 
                    scheduled_biometric_date, created_at 
             FROM users 
             WHERE status = 'approved_for_biometric' 
             ORDER BY scheduled_biometric_date ASC NULLS LAST, created_at DESC`
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        logger.error('Error fetching approved users:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
