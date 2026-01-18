/**
 * DATAKOMEZA Backend Server
 * Main entry point for the Express.js API server
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const serviceProviderRoutes = require('./routes/serviceProviders');
const consentRoutes = require('./routes/consent');
const verificationRoutes = require('./routes/verification');
const adminRoutes = require('./routes/admin');
const mosipRoutes = require('./routes/mosip');
const securityRoutes = require('./routes/security');

// New MOSIP-compliant routes
const authenticationRoutes = require('./routes/authentication');
const virtualIdRoutes = require('./routes/virtualId');
const partnerRoutes = require('./routes/partners');
const policyRoutes = require('./routes/policies');
const residentRoutes = require('./routes/resident');
const registrationRoutes = require('./routes/registration');

const errorHandler = require('./middleware/errorHandler');
const { logger } = require('./utils/logger');
const { apiLimiter, authLimiter, mosipLimiter, registrationLimiter } = require('./middleware/rateLimiter');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet()); // Security headers
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: message => logger.info(message.trim()) } }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

// API Routes with rate limiting
app.use('/api/', apiLimiter); // General rate limit for all API routes
app.use('/api/auth', authLimiter, authRoutes); // Strict limit for auth
app.use('/api/users', userRoutes);
app.use('/api/service-providers', serviceProviderRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/mosip', mosipLimiter, mosipRoutes); // Limit MOSIP operations
app.use('/api/security', securityRoutes); // Security information

// New MOSIP-compliant routes
app.use('/api/authentication', authLimiter, authenticationRoutes); // Multi-modal authentication
app.use('/api/vid', virtualIdRoutes); // Virtual ID management
app.use('/api/partners', partnerRoutes); // Partner management
app.use('/api/policies', policyRoutes); // Policy management
app.use('/api/resident', residentRoutes); // Resident services
app.use('/api/registration', registrationLimiter, registrationRoutes); // Registration client

// API Documentation
app.get('/api-docs', (req, res) => {
    res.json({
        name: 'DATAKOMEZA API',
        version: '2.0.0',
        description: 'MOSIP-compliant privacy-preserving digital identity platform for refugees',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register new refugee user',
                'POST /api/auth/login': 'Login with email/phone and PIN',
                'POST /api/auth/admin/login': 'Admin login',
                'POST /api/auth/refresh': 'Refresh JWT token'
            },
            authentication: {
                'POST /api/authentication/otp/send': 'Send OTP (SMS/Email)',
                'POST /api/authentication/otp/verify': 'Verify OTP',
                'POST /api/authentication/demographic': 'Demographic authentication',
                'POST /api/authentication/biometric': 'Biometric authentication',
                'POST /api/authentication/ekyc': 'e-KYC authentication',
                'GET /api/authentication/history/:userId': 'Get authentication history'
            },
            virtualId: {
                'POST /api/vid/generate': 'Generate Virtual ID',
                'POST /api/vid/revoke': 'Revoke Virtual ID',
                'GET /api/vid/list/:userId': 'List user VIDs',
                'POST /api/vid/validate': 'Validate VID',
                'GET /api/vid/usage/:userId': 'Get VID usage history'
            },
            partners: {
                'POST /api/partners/register': 'Partner self-registration',
                'POST /api/partners/:id/certificate': 'Upload CA certificate',
                'POST /api/partners/:id/api-key': 'Generate API key',
                'POST /api/partners/:id/license': 'Generate license key',
                'PUT /api/partners/:id/approve': 'Approve partner',
                'GET /api/partners/:id': 'Get partner details',
                'GET /api/partners': 'List partners'
            },
            policies: {
                'POST /api/policies': 'Create policy',
                'GET /api/policies/:id': 'Get policy',
                'GET /api/policies': 'List policies',
                'PUT /api/policies/:id': 'Update policy',
                'POST /api/policies/map': 'Map policy to partner',
                'GET /api/policies/partner/:id': 'Get partner policies'
            },
            resident: {
                'POST /api/resident/auth/lock': 'Lock authentication method',
                'POST /api/resident/auth/unlock': 'Unlock authentication method',
                'GET /api/resident/auth/locks/:userId': 'Get auth locks',
                'POST /api/resident/service-request': 'Create service request',
                'GET /api/resident/service-requests/:userId': 'Get service requests',
                'GET /api/resident/transactions/:userId': 'Get transaction history',
                'POST /api/resident/verify/phone': 'Verify phone number',
                'POST /api/resident/verify/email': 'Verify email',
                'POST /api/resident/data-update': 'Request data update'
            },
            users: {
                'GET /api/users/profile': 'Get user profile',
                'PUT /api/users/profile': 'Update user profile',
                'GET /api/users/attributes': 'Get user attributes',
                'POST /api/users/attributes': 'Add user attribute',
                'GET /api/users/qr-code': 'Generate QR code for offline auth'
            },
            consent: {
                'GET /api/consent': 'Get all consent records',
                'POST /api/consent/grant': 'Grant consent to service provider',
                'POST /api/consent/revoke': 'Revoke consent',
                'GET /api/consent/:id': 'Get specific consent record'
            },
            verification: {
                'POST /api/verification/qr': 'Verify QR code',
                'POST /api/verification/pin': 'Verify PIN',
                'POST /api/verification/offline': 'Offline verification'
            },
            serviceProviders: {
                'GET /api/service-providers': 'List all service providers',
                'GET /api/service-providers/:id': 'Get service provider details',
                'POST /api/service-providers/request-access': 'Request access to user data'
            },
            admin: {
                'GET /api/admin/users': 'List all users (admin only)',
                'GET /api/admin/audit-logs': 'Get audit logs',
                'GET /api/admin/statistics': 'Get platform statistics',
                'POST /api/admin/service-providers': 'Create service provider'
            },
            mosip: {
                'POST /api/mosip/register': 'Register with MOSIP',
                'GET /api/mosip/verify/:mosipId': 'Verify MOSIP identity',
                'POST /api/mosip/update': 'Update MOSIP record'
            }
        },
        totalEndpoints: '50+'
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
    });
});

// Error handling middleware
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
    logger.info(`🚀 DATAKOMEZA Backend Server running on port ${PORT}`);
    logger.info(`📝 Environment: ${process.env.NODE_ENV}`);
    logger.info(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
    logger.info(`💚 Health Check: http://localhost:${PORT}/health`);
});

module.exports = app;
