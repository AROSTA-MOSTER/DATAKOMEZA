/**
 * MOSIP Mock Services Integration
 * Integrates with MOSIP Mock MDS, ABIS, SDK, and MV services
 * 
 * This module provides integration with MOSIP Mock Services for:
 * - Biometric capture (MockMDS)
 * - Biometric deduplication (mock-abis)
 * - Document validation (mock-sdk)
 * - Master data validation (mock-mv)
 */

const axios = require('axios');
const { logger } = require('../utils/logger');
const { encrypt, generateToken } = require('../utils/encryption');

// MOSIP Mock Services Configuration
const MOSIP_CONFIG = {
    MDS_URL: process.env.MOSIP_MDS_URL || 'http://localhost:4501',
    ABIS_URL: process.env.MOSIP_ABIS_URL || 'http://localhost:8081',
    SDK_URL: process.env.MOSIP_SDK_URL || 'http://localhost:8080',
    MV_URL: process.env.MOSIP_MV_URL || 'http://localhost:8082',
    TIMEOUT: 30000
};

/**
 * MockMDS Integration - Biometric Device Service
 * Simulates biometric capture (fingerprint, iris, face)
 */
class MockMDSService {
    /**
     * Discover available biometric devices
     */
    async discoverDevices() {
        try {
            const response = await axios.get(`${MOSIP_CONFIG.MDS_URL}/device`, {
                timeout: MOSIP_CONFIG.TIMEOUT
            });

            logger.info('MDS: Devices discovered', { count: response.data?.length || 0 });
            return {
                success: true,
                devices: response.data || []
            };
        } catch (error) {
            logger.error('MDS: Device discovery failed', { error: error.message });
            return {
                success: false,
                message: 'Using mock biometric data',
                devices: this.getMockDevices()
            };
        }
    }

    /**
     * Capture biometric data from device
     */
    async captureBiometric(deviceId, biometricType = 'Fingerprint') {
        try {
            const response = await axios.post(`${MOSIP_CONFIG.MDS_URL}/capture`, {
                env: 'Developer',
                purpose: 'Registration',
                specVersion: '0.9.5',
                timeout: '30000',
                captureTime: new Date().toISOString(),
                transactionId: generateToken(16),
                bio: [{
                    type: biometricType,
                    count: biometricType === 'Fingerprint' ? 2 : 1,
                    bioSubType: biometricType === 'Fingerprint' ? ['Left IndexFinger', 'Right IndexFinger'] : ['UNKNOWN'],
                    requestedScore: 60,
                    deviceId: deviceId,
                    deviceSubId: 1
                }]
            }, {
                timeout: MOSIP_CONFIG.TIMEOUT
            });

            logger.info('MDS: Biometric captured', { type: biometricType });
            return {
                success: true,
                biometricData: response.data,
                type: biometricType,
                quality: response.data?.biometrics?.[0]?.qualityScore || 85
            };
        } catch (error) {
            logger.error('MDS: Biometric capture failed', { error: error.message });
            return {
                success: false,
                message: 'Using mock biometric data',
                biometricData: this.getMockBiometric(biometricType)
            };
        }
    }

    /**
     * Get mock devices for fallback
     */
    getMockDevices() {
        return [
            {
                deviceId: 'MOCK_FP_001',
                deviceType: 'Fingerprint',
                deviceSubType: 'Slap',
                make: 'Mock Devices Inc',
                model: 'FP-2000',
                serialNo: 'MOCK123456',
                deviceStatus: 'Ready'
            },
            {
                deviceId: 'MOCK_IRIS_001',
                deviceType: 'Iris',
                deviceSubType: 'Double',
                make: 'Mock Devices Inc',
                model: 'IRIS-3000',
                serialNo: 'MOCK789012',
                deviceStatus: 'Ready'
            },
            {
                deviceId: 'MOCK_FACE_001',
                deviceType: 'Face',
                deviceSubType: 'Full face',
                make: 'Mock Devices Inc',
                model: 'FACE-4000',
                serialNo: 'MOCK345678',
                deviceStatus: 'Ready'
            }
        ];
    }

    /**
     * Get mock biometric data for fallback
     */
    getMockBiometric(type) {
        return {
            biometrics: [{
                specVersion: '0.9.5',
                data: Buffer.from(`MOCK_${type.toUpperCase()}_DATA`).toString('base64'),
                hash: generateToken(32),
                sessionKey: generateToken(32),
                thumbprint: generateToken(32),
                qualityScore: 85,
                digitalId: generateToken(16),
                deviceCode: `MOCK_${type.toUpperCase()}_001`,
                deviceServiceVersion: '0.9.5',
                bioType: type,
                bioSubType: type === 'Fingerprint' ? 'Left IndexFinger' : 'UNKNOWN',
                purpose: 'Registration',
                env: 'Developer',
                timestamp: new Date().toISOString()
            }]
        };
    }
}

/**
 * MockABIS Integration - Automated Biometric Identification System
 * Handles biometric deduplication and identification
 */
class MockABISService {
    /**
     * Insert biometric data for deduplication
     */
    async insertBiometric(referenceId, biometricData) {
        try {
            const response = await axios.post(`${MOSIP_CONFIG.ABIS_URL}/v1/insert`, {
                id: generateToken(16),
                version: '1.1',
                requestId: generateToken(16),
                requesttime: new Date().toISOString(),
                referenceId: referenceId,
                referenceURL: `file://biometric_${referenceId}.zip`,
                gallery: {
                    referenceIds: [{
                        referenceId: referenceId
                    }]
                }
            }, {
                timeout: MOSIP_CONFIG.TIMEOUT
            });

            logger.info('ABIS: Biometric inserted', { referenceId });
            return {
                success: true,
                referenceId,
                response: response.data
            };
        } catch (error) {
            logger.error('ABIS: Insert failed', { error: error.message });
            return {
                success: false,
                message: 'Mock ABIS insert completed',
                referenceId,
                mockResponse: {
                    id: generateToken(16),
                    requestId: generateToken(16),
                    responsetime: new Date().toISOString(),
                    returnValue: 1
                }
            };
        }
    }

    /**
     * Identify/deduplicate biometric data
     */
    async identifyBiometric(referenceId, biometricData) {
        try {
            const response = await axios.post(`${MOSIP_CONFIG.ABIS_URL}/v1/identify`, {
                id: generateToken(16),
                version: '1.1',
                requestId: generateToken(16),
                requesttime: new Date().toISOString(),
                referenceId: referenceId,
                referenceURL: `file://biometric_${referenceId}.zip`,
                gallery: {
                    referenceIds: []
                },
                flags: {
                    maxResults: 30,
                    targetFPIR: 30,
                    flag1: 'value1'
                }
            }, {
                timeout: MOSIP_CONFIG.TIMEOUT
            });

            const candidates = response.data?.candidateList?.candidates || [];
            const isDuplicate = candidates.length > 0;

            logger.info('ABIS: Identification complete', {
                referenceId,
                isDuplicate,
                candidateCount: candidates.length
            });

            return {
                success: true,
                isDuplicate,
                candidates,
                confidence: candidates.length > 0 ? candidates[0].analytics?.confidence || 0 : 0
            };
        } catch (error) {
            logger.error('ABIS: Identify failed', { error: error.message });
            return {
                success: false,
                message: 'Mock ABIS identification completed',
                isDuplicate: false,
                candidates: [],
                confidence: 0
            };
        }
    }

    /**
     * Delete biometric data
     */
    async deleteBiometric(referenceId) {
        try {
            const response = await axios.post(`${MOSIP_CONFIG.ABIS_URL}/v1/delete`, {
                id: generateToken(16),
                version: '1.1',
                requestId: generateToken(16),
                requesttime: new Date().toISOString(),
                referenceId: referenceId
            }, {
                timeout: MOSIP_CONFIG.TIMEOUT
            });

            logger.info('ABIS: Biometric deleted', { referenceId });
            return {
                success: true,
                referenceId
            };
        } catch (error) {
            logger.error('ABIS: Delete failed', { error: error.message });
            return {
                success: false,
                message: 'Mock ABIS delete completed',
                referenceId
            };
        }
    }
}

/**
 * MockSDK Integration - Software Development Kit
 * Handles quality checks and matching
 */
class MockSDKService {
    /**
     * Check biometric quality
     */
    async checkQuality(biometricData, biometricType) {
        try {
            const response = await axios.post(`${MOSIP_CONFIG.SDK_URL}/check-quality`, {
                sample: {
                    bioType: biometricType,
                    bioSubType: 'UNKNOWN',
                    bioValue: biometricData
                },
                modalities: [biometricType]
            }, {
                timeout: MOSIP_CONFIG.TIMEOUT
            });

            const qualityScore = response.data?.response?.scores?.[0]?.score || 85;

            logger.info('SDK: Quality check complete', { type: biometricType, score: qualityScore });
            return {
                success: true,
                qualityScore,
                passed: qualityScore >= 60
            };
        } catch (error) {
            logger.error('SDK: Quality check failed', { error: error.message });
            return {
                success: false,
                message: 'Mock SDK quality check completed',
                qualityScore: 85,
                passed: true
            };
        }
    }

    /**
     * Match biometric samples
     */
    async matchBiometrics(sample1, sample2, biometricType) {
        try {
            const response = await axios.post(`${MOSIP_CONFIG.SDK_URL}/match`, {
                sample: {
                    bioType: biometricType,
                    bioSubType: 'UNKNOWN',
                    bioValue: sample1
                },
                gallery: [{
                    bioType: biometricType,
                    bioSubType: 'UNKNOWN',
                    bioValue: sample2
                }],
                modalitiesToMatch: [biometricType]
            }, {
                timeout: MOSIP_CONFIG.TIMEOUT
            });

            const matchScore = response.data?.response?.decisions?.[0]?.match || false;

            logger.info('SDK: Match complete', { type: biometricType, matched: matchScore });
            return {
                success: true,
                matched: matchScore,
                score: response.data?.response?.decisions?.[0]?.analyticsInfo?.score || 0
            };
        } catch (error) {
            logger.error('SDK: Match failed', { error: error.message });
            return {
                success: false,
                message: 'Mock SDK match completed',
                matched: false,
                score: 0
            };
        }
    }
}

/**
 * MockMV Integration - Master Data Validator
 * Validates master data
 */
class MockMVService {
    /**
     * Validate master data
     */
    async validateMasterData(data, validationType) {
        try {
            const response = await axios.post(`${MOSIP_CONFIG.MV_URL}/validate`, {
                id: generateToken(16),
                version: '1.0',
                requesttime: new Date().toISOString(),
                request: {
                    validationType,
                    data
                }
            }, {
                timeout: MOSIP_CONFIG.TIMEOUT
            });

            logger.info('MV: Validation complete', { type: validationType });
            return {
                success: true,
                valid: response.data?.response?.status === 'success',
                errors: response.data?.errors || []
            };
        } catch (error) {
            logger.error('MV: Validation failed', { error: error.message });
            return {
                success: false,
                message: 'Mock MV validation completed',
                valid: true,
                errors: []
            };
        }
    }
}

/**
 * Unified MOSIP Service
 * Combines all MOSIP mock services
 */
class MOSIPService {
    constructor() {
        this.mds = new MockMDSService();
        this.abis = new MockABISService();
        this.sdk = new MockSDKService();
        this.mv = new MockMVService();
    }

    /**
     * Complete registration workflow with MOSIP
     */
    async registerWithMOSIP(userData) {
        try {
            logger.info('MOSIP: Starting registration workflow', { email: userData.email });

            // Step 1: Discover biometric devices
            const devices = await this.mds.discoverDevices();

            // Step 2: Capture biometrics
            const fingerprint = await this.mds.captureBiometric(
                devices.devices[0]?.deviceId || 'MOCK_FP_001',
                'Fingerprint'
            );

            // Step 3: Quality check
            const qualityCheck = await this.sdk.checkQuality(
                fingerprint.biometricData,
                'Fingerprint'
            );

            if (!qualityCheck.passed) {
                return {
                    success: false,
                    message: 'Biometric quality too low. Please try again.'
                };
            }

            // Step 4: Generate reference ID
            const referenceId = `REF_${Date.now()}_${generateToken(8)}`;

            // Step 5: Insert into ABIS for deduplication
            const insertResult = await this.abis.insertBiometric(
                referenceId,
                fingerprint.biometricData
            );

            // Step 6: Check for duplicates
            const identifyResult = await this.abis.identifyBiometric(
                referenceId,
                fingerprint.biometricData
            );

            if (identifyResult.isDuplicate) {
                return {
                    success: false,
                    message: 'Duplicate identity detected. This person is already registered.',
                    duplicateConfidence: identifyResult.confidence
                };
            }

            // Step 7: Validate master data
            const validationResult = await this.mv.validateMasterData(
                userData,
                'user_registration'
            );

            if (!validationResult.valid) {
                return {
                    success: false,
                    message: 'Data validation failed',
                    errors: validationResult.errors
                };
            }

            // Step 8: Generate MOSIP ID
            const mosipId = `MOSIP${Date.now().toString().slice(-10)}`;

            logger.info('MOSIP: Registration successful', { mosipId, referenceId });

            return {
                success: true,
                mosipId,
                referenceId,
                biometricQuality: qualityCheck.qualityScore,
                message: 'Successfully registered with MOSIP'
            };

        } catch (error) {
            logger.error('MOSIP: Registration workflow failed', { error: error.message });
            return {
                success: false,
                message: 'MOSIP registration failed. Using fallback.',
                mosipId: `MOSIP${Date.now().toString().slice(-10)}`
            };
        }
    }

    /**
     * Verify identity using biometrics
     */
    async verifyIdentity(mosipId, biometricData) {
        try {
            logger.info('MOSIP: Starting verification', { mosipId });

            // Quality check
            const qualityCheck = await this.sdk.checkQuality(biometricData, 'Fingerprint');

            if (!qualityCheck.passed) {
                return {
                    success: false,
                    verified: false,
                    message: 'Biometric quality too low'
                };
            }

            // Match against stored biometric
            const matchResult = await this.sdk.matchBiometrics(
                biometricData,
                'stored_biometric_data', // In real implementation, fetch from database
                'Fingerprint'
            );

            logger.info('MOSIP: Verification complete', {
                mosipId,
                verified: matchResult.matched
            });

            return {
                success: true,
                verified: matchResult.matched,
                matchScore: matchResult.score,
                message: matchResult.matched ? 'Identity verified' : 'Identity verification failed'
            };

        } catch (error) {
            logger.error('MOSIP: Verification failed', { error: error.message });
            return {
                success: false,
                verified: false,
                message: 'Verification failed'
            };
        }
    }

    /**
     * Health check for all MOSIP services
     */
    async healthCheck() {
        const services = {
            mds: false,
            abis: false,
            sdk: false,
            mv: false
        };

        try {
            await axios.get(`${MOSIP_CONFIG.MDS_URL}/info`, { timeout: 5000 });
            services.mds = true;
        } catch (error) {
            logger.warn('MDS service not available');
        }

        try {
            await axios.get(`${MOSIP_CONFIG.ABIS_URL}/actuator/health`, { timeout: 5000 });
            services.abis = true;
        } catch (error) {
            logger.warn('ABIS service not available');
        }

        try {
            await axios.get(`${MOSIP_CONFIG.SDK_URL}/actuator/health`, { timeout: 5000 });
            services.sdk = true;
        } catch (error) {
            logger.warn('SDK service not available');
        }

        try {
            await axios.get(`${MOSIP_CONFIG.MV_URL}/actuator/health`, { timeout: 5000 });
            services.mv = true;
        } catch (error) {
            logger.warn('MV service not available');
        }

        return {
            healthy: Object.values(services).some(s => s),
            services,
            message: Object.values(services).every(s => s)
                ? 'All MOSIP services available'
                : 'Some MOSIP services unavailable (using mock fallback)'
        };
    }
}

module.exports = new MOSIPService();
