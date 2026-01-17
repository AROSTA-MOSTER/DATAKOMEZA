/**
 * User Routes
 * Handles user profile, attributes, and QR code generation
 */

const express = require('express');
const QRCode = require('qrcode');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const { encrypt, decrypt, generateToken } = require('../utils/encryption');
const { logger } = require('../utils/logger');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/users/profile
 * Get current user profile
 */
router.get('/profile', async (req, res) => {
    try {
        const result = await query(
            `SELECT id, mosip_id, email, phone, first_name, last_name, 
              date_of_birth, gender, nationality, photo_url, status, created_at
       FROM users WHERE id = $1`,
            [req.user.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });

    } catch (error) {
        logger.error('Get profile error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve profile'
        });
    }
});

/**
 * PUT /api/users/profile
 * Update user profile
 */
router.put('/profile', [
    body('phone').optional().isMobilePhone(),
    body('photoUrl').optional().isURL()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { phone, photoUrl } = req.body;
        const updates = [];
        const values = [];
        let paramCount = 1;

        if (phone) {
            updates.push(`phone = $${paramCount++}`);
            values.push(phone);
        }
        if (photoUrl) {
            updates.push(`photo_url = $${paramCount++}`);
            values.push(photoUrl);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(req.user.userId);
        const result = await query(
            `UPDATE users SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $${paramCount} 
       RETURNING id, email, phone, first_name, last_name, photo_url`,
            values
        );

        // Log audit trail
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [req.user.userId, 'profile_updated', 'user', JSON.stringify({ fields: Object.keys(req.body) })]
        );

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: result.rows[0]
        });

    } catch (error) {
        logger.error('Update profile error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
});

/**
 * GET /api/users/attributes
 * Get user attributes (decrypted)
 */
router.get('/attributes', async (req, res) => {
    try {
        const result = await query(
            `SELECT id, attribute_name, attribute_value_encrypted, attribute_type, is_sensitive, created_at
       FROM user_attributes WHERE user_id = $1`,
            [req.user.userId]
        );

        // Decrypt attributes
        const attributes = result.rows.map(attr => ({
            id: attr.id,
            name: attr.attribute_name,
            value: attr.attribute_value_encrypted.startsWith('ENCRYPTED:')
                ? attr.attribute_value_encrypted.replace('ENCRYPTED:', '')
                : decrypt(attr.attribute_value_encrypted),
            type: attr.attribute_type,
            isSensitive: attr.is_sensitive,
            createdAt: attr.created_at
        }));

        res.json({
            success: true,
            data: attributes
        });

    } catch (error) {
        logger.error('Get attributes error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve attributes'
        });
    }
});

/**
 * POST /api/users/attributes
 * Add or update user attribute
 */
router.post('/attributes', [
    body('name').trim().notEmpty(),
    body('value').notEmpty(),
    body('type').optional().isIn(['text', 'date', 'number', 'file']),
    body('isSensitive').optional().isBoolean()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, value, type = 'text', isSensitive = true } = req.body;

        // Encrypt value
        const encryptedValue = encrypt(value);

        // Upsert attribute
        const result = await query(
            `INSERT INTO user_attributes (user_id, attribute_name, attribute_value_encrypted, attribute_type, is_sensitive)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, attribute_name) 
       DO UPDATE SET attribute_value_encrypted = $3, attribute_type = $4, is_sensitive = $5, updated_at = CURRENT_TIMESTAMP
       RETURNING id, attribute_name, attribute_type, is_sensitive`,
            [req.user.userId, name, encryptedValue, type, isSensitive]
        );

        // Log audit trail
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [req.user.userId, 'attribute_added', 'user_attribute', JSON.stringify({ attribute_name: name })]
        );

        res.status(201).json({
            success: true,
            message: 'Attribute saved successfully',
            data: result.rows[0]
        });

    } catch (error) {
        logger.error('Add attribute error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to save attribute'
        });
    }
});

/**
 * GET /api/users/qr-code
 * Generate QR code for offline authentication
 */
router.get('/qr-code', async (req, res) => {
    try {
        // Get user data
        const userResult = await query(
            'SELECT id, mosip_id, first_name, last_name FROM users WHERE id = $1',
            [req.user.userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = userResult.rows[0];

        // Generate verification token
        const token = generateToken(32);
        const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Store token
        await query(
            `INSERT INTO verification_tokens (user_id, token_hash, token_type, expires_at)
       VALUES ($1, $2, $3, $4)`,
            [user.id, token, 'qr_code', expiresAt]
        );

        // Create QR code data
        const qrData = JSON.stringify({
            userId: user.id,
            mosipId: user.mosip_id,
            name: `${user.first_name} ${user.last_name}`,
            token,
            expiresAt: expiresAt.toISOString()
        });

        // Generate QR code
        const qrCodeDataURL = await QRCode.toDataURL(qrData, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            width: 300
        });

        // Log audit trail
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type) VALUES ($1, $2, $3)',
            [req.user.userId, 'qr_code_generated', 'verification_token']
        );

        res.json({
            success: true,
            data: {
                qrCode: qrCodeDataURL,
                expiresAt: expiresAt.toISOString()
            }
        });

    } catch (error) {
        logger.error('QR code generation error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to generate QR code'
        });
    }
});

module.exports = router;
