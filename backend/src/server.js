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

// API Documentation
app.get('/api-docs', (req, res) => {
    res.json({
        name: 'DATAKOMEZA API',
        version: '1.0.0',
        description: 'Privacy-preserving digital identity platform for refugees',
        endpoints: {
            auth: {
                'POST /api/auth/register': 'Register new refugee user',
                'POST /api/auth/login': 'Login with email/phone and PIN',
                'POST /api/auth/admin/login': 'Admin login',
                'POST /api/auth/refresh': 'Refresh JWT token'
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
        }
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
