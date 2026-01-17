/**
 * Authentication Routes
 * Handles user registration, login, and token management
 */

const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { query } = require('../config/database');
const { encrypt, generateUserKey } = require('../utils/encryption');
const { logger } = require('../utils/logger');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * POST /api/auth/register
 * Register a new refugee user
 */
router.post('/register', [
    body('email').isEmail().normalizeEmail(),
    body('phone').optional().isMobilePhone(),
    body('pin').isLength({ min: 6, max: 6 }).isNumeric(),
    body('firstName').trim().notEmpty(),
    body('lastName').trim().notEmpty(),
    body('dateOfBirth').optional().isISO8601(),
    body('gender').optional().isIn(['Male', 'Female', 'Other']),
    body('nationality').optional().trim()
], async (req, res) => {
    try {
        // Validate input
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, phone, pin, firstName, lastName, dateOfBirth, gender, nationality } = req.body;

        // Check if user already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1 OR phone = $2',
            [email, phone]
        );

        if (existingUser.rows.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'User with this email or phone already exists'
            });
        }

        // Hash PIN
        const pinHash = await bcrypt.hash(pin, 10);

        // Generate encryption key for user
        const encryptionKey = generateUserKey();

        // Generate MOSIP ID (mock for now)
        const mosipId = 'MOSIP' + Math.floor(Math.random() * 10000000000).toString().padStart(10, '0');

        // Insert user
        const result = await query(
            `INSERT INTO users (
        id, mosip_id, email, phone, pin_hash, first_name, last_name,
        date_of_birth, gender, nationality, encryption_key, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id, mosip_id, email, phone, first_name, last_name, created_at`,
            [
                uuidv4(), mosipId, email, phone, pinHash, firstName, lastName,
                dateOfBirth, gender, nationality, encryptionKey, 'active'
            ]
        );

        const user = result.rows[0];

        // Log audit trail
        await query(
            'INSERT INTO audit_logs (user_id, action, resource_type, details) VALUES ($1, $2, $3, $4)',
            [user.id, 'user_registered', 'user', JSON.stringify({ method: 'self_registration' })]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, type: 'user' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        logger.info('User registered successfully', { userId: user.id, email: user.email });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    mosipId: user.mosip_id,
                    email: user.email,
                    phone: user.phone,
                    firstName: user.first_name,
                    lastName: user.last_name
                },
                token
            }
        });

    } catch (error) {
        logger.error('Registration error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/login
 * User login with email/phone and PIN
 */
router.post('/login', [
    body('identifier').notEmpty(), // email or phone
    body('pin').isLength({ min: 6, max: 6 }).isNumeric()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { identifier, pin } = req.body;

        // Find user by email or phone
        const result = await query(
            'SELECT * FROM users WHERE email = $1 OR phone = $1',
            [identifier]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const user = result.rows[0];

        // Verify PIN
        const validPin = await bcrypt.compare(pin, user.pin_hash);
        if (!validPin) {
            // Log failed attempt
            await query(
                'INSERT INTO authentication_logs (user_id, auth_method, auth_status) VALUES ($1, $2, $3)',
                [user.id, 'pin', 'failed']
            );

            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        await query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [user.id]
        );

        // Log successful authentication
        await query(
            'INSERT INTO authentication_logs (user_id, auth_method, auth_status, ip_address) VALUES ($1, $2, $3, $4)',
            [user.id, 'pin', 'success', req.ip]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, type: 'user' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        logger.info('User logged in successfully', { userId: user.id });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    mosipId: user.mosip_id,
                    email: user.email,
                    phone: user.phone,
                    firstName: user.first_name,
                    lastName: user.last_name
                },
                token
            }
        });

    } catch (error) {
        logger.error('Login error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

/**
 * POST /api/auth/admin/login
 * Admin user login
 */
router.post('/admin/login', [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        // Find admin user
        const result = await query(
            'SELECT * FROM admin_users WHERE email = $1 AND status = $2',
            [email, 'active']
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        const admin = result.rows[0];

        // Verify password
        const validPassword = await bcrypt.compare(password, admin.password_hash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Update last login
        await query(
            'UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
            [admin.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: admin.id, email: admin.email, type: 'admin', role: admin.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        logger.info('Admin logged in successfully', { adminId: admin.id });

        res.json({
            success: true,
            message: 'Admin login successful',
            data: {
                admin: {
                    id: admin.id,
                    email: admin.email,
                    fullName: admin.full_name,
                    role: admin.role
                },
                token
            }
        });

    } catch (error) {
        logger.error('Admin login error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: error.message
        });
    }
});

module.exports = router;
