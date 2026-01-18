/**
 * Registration Service
 * Handles operator management and registration workflows
 */

const pool = require('../config/database');
const bcrypt = require('bcrypt');
const logger = require('../utils/logger');
const crypto = require('crypto');

class RegistrationService {
    /**
     * Operator login
     */
    async operatorLogin(operatorId, password, loginMode = 'password') {
        try {
            const result = await pool.query(
                'SELECT id, operator_id, name, email, password_hash, role, status FROM operators WHERE operator_id = $1',
                [operatorId]
            );

            if (result.rows.length === 0) {
                throw new Error('Operator not found');
            }

            const operator = result.rows[0];

            if (operator.status !== 'active') {
                throw new Error(`Operator account is ${operator.status}`);
            }

            // Verify password
            const validPassword = await bcrypt.compare(password, operator.password_hash);
            if (!validPassword) {
                throw new Error('Invalid credentials');
            }

            // Create session
            const sessionToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date();
            expiresAt.setHours(expiresAt.getHours() + 8); // 8 hour session

            await pool.query(
                `INSERT INTO operator_sessions (operator_id, session_token, login_mode, expires_at, status)
                VALUES ($1, $2, $3, $4, 'active')`,
                [operator.id, sessionToken, loginMode, expiresAt]
            );

            // Update last login
            await pool.query(
                'UPDATE operators SET last_login_at = CURRENT_TIMESTAMP WHERE id = $1',
                [operator.id]
            );

            logger.info('Operator logged in', { operatorId, loginMode });

            return {
                success: true,
                sessionToken,
                operator: {
                    id: operator.id,
                    operatorId: operator.operator_id,
                    name: operator.name,
                    email: operator.email,
                    role: operator.role
                },
                expiresAt
            };
        } catch (error) {
            logger.error('Operator login failed', { error: error.message, operatorId });
            throw error;
        }
    }

    /**
     * Create registration packet
     */
    async createRegistrationPacket(operatorId, registrationData) {
        try {
            const { demographicData, biometricData, documents, preRegId } = registrationData;

            // Generate packet ID
            const packetId = `PKT_${Date.now()}_${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

            // Calculate packet hash
            const packetHash = crypto
                .createHash('sha256')
                .update(JSON.stringify({ demographicData, biometricData, documents }))
                .digest('hex');

            // Insert packet
            const result = await pool.query(
                `INSERT INTO registration_packets 
                (packet_id, operator_id, pre_reg_id, demographic_data, biometric_data, 
                documents, packet_hash, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
                RETURNING id, packet_id, created_at`,
                [
                    packetId,
                    operatorId,
                    preRegId,
                    JSON.stringify(demographicData),
                    JSON.stringify(biometricData),
                    JSON.stringify(documents),
                    packetHash
                ]
            );

            logger.info('Registration packet created', { packetId, operatorId });

            return {
                success: true,
                packet: result.rows[0]
            };
        } catch (error) {
            logger.error('Packet creation failed', { error: error.message, operatorId });
            throw error;
        }
    }

    /**
     * Submit packet for supervisor review
     */
    async submitForReview(packetId, operatorId) {
        try {
            const result = await pool.query(
                `UPDATE registration_packets
                SET status = 'supervisor_review', updated_at = CURRENT_TIMESTAMP
                WHERE packet_id = $1 AND operator_id = $2 AND status = 'pending'
                RETURNING id, packet_id`,
                [packetId, operatorId]
            );

            if (result.rows.length === 0) {
                throw new Error('Packet not found or already submitted');
            }

            logger.info('Packet submitted for review', { packetId, operatorId });

            return {
                success: true,
                message: 'Packet submitted for supervisor review'
            };
        } catch (error) {
            logger.error('Submit for review failed', { error: error.message, packetId });
            throw error;
        }
    }

    /**
     * Supervisor review packet
     */
    async reviewPacket(packetId, supervisorId, approved, comments = null) {
        try {
            const status = approved ? 'approved' : 'rejected';
            const rejectionReason = approved ? null : comments;

            const result = await pool.query(
                `UPDATE registration_packets
                SET status = $1, supervisor_id = $2, supervisor_comments = $3,
                    rejection_reason = $4, reviewed_at = CURRENT_TIMESTAMP
                WHERE packet_id = $5 AND status = 'supervisor_review'
                RETURNING id, packet_id`,
                [status, supervisorId, comments, rejectionReason, packetId]
            );

            if (result.rows.length === 0) {
                throw new Error('Packet not found or not in review status');
            }

            logger.info('Packet reviewed', { packetId, supervisorId, approved });

            return {
                success: true,
                message: `Packet ${approved ? 'approved' : 'rejected'}`,
                status
            };
        } catch (error) {
            logger.error('Packet review failed', { error: error.message, packetId });
            throw error;
        }
    }

    /**
     * Upload packet to server
     */
    async uploadPacket(packetId) {
        try {
            const result = await pool.query(
                `UPDATE registration_packets
                SET status = 'uploaded', uploaded_at = CURRENT_TIMESTAMP
                WHERE packet_id = $1 AND status = 'approved'
                RETURNING id, packet_id`,
                [packetId]
            );

            if (result.rows.length === 0) {
                throw new Error('Packet not found or not approved');
            }

            // In production, this would upload to MOSIP server
            logger.info('Packet uploaded', { packetId });

            return {
                success: true,
                message: 'Packet uploaded successfully'
            };
        } catch (error) {
            logger.error('Packet upload failed', { error: error.message, packetId });
            throw error;
        }
    }

    /**
     * Generate acknowledgement slip
     */
    async generateAcknowledgement(packetId) {
        try {
            const packetResult = await pool.query(
                'SELECT id, packet_id, demographic_data FROM registration_packets WHERE packet_id = $1',
                [packetId]
            );

            if (packetResult.rows.length === 0) {
                throw new Error('Packet not found');
            }

            const packet = packetResult.rows[0];
            const slipNumber = `ACK_${Date.now()}_${crypto.randomBytes(3).toString('hex').toUpperCase()}`;

            // Generate QR code data
            const qrData = JSON.stringify({
                packetId: packet.packet_id,
                slipNumber,
                timestamp: new Date().toISOString()
            });

            await pool.query(
                `INSERT INTO acknowledgement_slips (packet_id, slip_number, qr_code_data)
                VALUES ($1, $2, $3)`,
                [packet.id, slipNumber, qrData]
            );

            logger.info('Acknowledgement slip generated', { packetId, slipNumber });

            return {
                success: true,
                slipNumber,
                qrData,
                packetId: packet.packet_id
            };
        } catch (error) {
            logger.error('Acknowledgement generation failed', { error: error.message, packetId });
            throw error;
        }
    }

    /**
     * Get packets for operator
     */
    async getOperatorPackets(operatorId, status = null) {
        try {
            let query = `
                SELECT packet_id, status, demographic_data, created_at, reviewed_at
                FROM registration_packets
                WHERE operator_id = $1
            `;
            const params = [operatorId];

            if (status) {
                query += ' AND status = $2';
                params.push(status);
            }

            query += ' ORDER BY created_at DESC LIMIT 50';

            const result = await pool.query(query, params);

            return result.rows;
        } catch (error) {
            logger.error('Failed to get operator packets', { error: error.message, operatorId });
            throw error;
        }
    }

    /**
     * Get packets for supervisor review
     */
    async getPacketsForReview(supervisorId) {
        try {
            const result = await pool.query(
                `SELECT rp.packet_id, rp.demographic_data, rp.created_at,
                o.name as operator_name, o.operator_id
                FROM registration_packets rp
                JOIN operators o ON rp.operator_id = o.id
                WHERE rp.status = 'supervisor_review'
                ORDER BY rp.created_at ASC
                LIMIT 50`
            );

            return result.rows;
        } catch (error) {
            logger.error('Failed to get packets for review', { error: error.message });
            throw error;
        }
    }
}

module.exports = new RegistrationService();
