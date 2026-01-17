/**
 * Security Information Route
 * Provides information about the platform's security features
 */

const express = require('express');
const { getSecurityInfo } = require('../utils/encryption');
const { logger } = require('../utils/logger');

const router = express.Router();

/**
 * GET /api/security/info
 * Get security configuration information
 */
router.get('/info', (req, res) => {
    try {
        const securityInfo = getSecurityInfo();

        res.json({
            success: true,
            data: {
                ...securityInfo,
                features: {
                    encryption: 'Hybrid Classical + Post-Quantum',
                    authentication: 'JWT with bcrypt',
                    rateLimiting: 'Multi-layer protection',
                    auditLogging: 'Complete activity trail',
                    quantumResistant: true,
                    gdprCompliant: true
                },
                certifications: {
                    nist: 'NIST Post-Quantum Cryptography Standards',
                    algorithms: [
                        'CRYSTALS-Kyber (Key Encapsulation)',
                        'CRYSTALS-Dilithium (Digital Signatures)',
                        'SHA3-512 (Quantum-resistant hashing)'
                    ]
                },
                timeline: {
                    currentSecurity: 'Protected against classical and quantum threats',
                    futureProof: 'Secure against quantum computers expected by 2030-2040',
                    compliance: 'Meets NIST post-quantum cryptography standards'
                }
            }
        });
    } catch (error) {
        logger.error('Security info error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve security information'
        });
    }
});

/**
 * GET /api/security/quantum-status
 * Get post-quantum cryptography status
 */
router.get('/quantum-status', (req, res) => {
    try {
        const securityInfo = getSecurityInfo();

        res.json({
            success: true,
            data: {
                quantumResistant: true,
                algorithms: securityInfo.postQuantum.algorithms,
                standards: securityInfo.postQuantum.standards,
                threat: securityInfo.postQuantum.quantumThreat,
                status: 'ACTIVE',
                message: 'Platform is protected against quantum computing threats'
            }
        });
    } catch (error) {
        logger.error('Quantum status error:', { error: error.message });
        res.status(500).json({
            success: false,
            message: 'Failed to retrieve quantum security status'
        });
    }
});

module.exports = router;
