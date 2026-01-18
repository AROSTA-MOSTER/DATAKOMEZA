/**
 * Policy Service
 * Manages policies for data sharing and authentication
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class PolicyService {
    /**
     * Create new policy
     */
    async createPolicy(policyData, createdBy) {
        try {
            const {
                policyName,
                policyType,
                policyGroup,
                description,
                policyRules
            } = policyData;

            // Generate policy ID
            const policyId = `POL_${Date.now()}_${Math.random().toString(36).substring(7).toUpperCase()}`;

            // Insert policy
            const result = await pool.query(
                `INSERT INTO policies
                (policy_id, policy_name, policy_type, policy_group, description, policy_data, created_by, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, 'active')
                RETURNING id, policy_id, policy_name, policy_type`,
                [policyId, policyName, policyType, policyGroup, description, JSON.stringify(policyRules), createdBy]
            );

            logger.info('Policy created', { policyId, policyName, policyType });

            return {
                success: true,
                message: 'Policy created successfully',
                policy: result.rows[0]
            };
        } catch (error) {
            logger.error('Policy creation failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Get policy by ID
     */
    async getPolicy(policyId) {
        try {
            const result = await pool.query(
                `SELECT id, policy_id, policy_name, policy_type, policy_group, 
                description, policy_data, version, status, valid_from, valid_to, created_at
                FROM policies
                WHERE id = $1`,
                [policyId]
            );

            if (result.rows.length === 0) {
                throw new Error('Policy not found');
            }

            return result.rows[0];
        } catch (error) {
            logger.error('Failed to get policy', { error: error.message, policyId });
            throw error;
        }
    }

    /**
     * List policies
     */
    async listPolicies(filters = {}) {
        try {
            let query = `
                SELECT id, policy_id, policy_name, policy_type, policy_group,
                description, status, created_at
                FROM policies
                WHERE 1=1
            `;
            const params = [];
            let paramCount = 1;

            if (filters.policyType) {
                query += ` AND policy_type = $${paramCount}`;
                params.push(filters.policyType);
                paramCount++;
            }

            if (filters.status) {
                query += ` AND status = $${paramCount}`;
                params.push(filters.status);
                paramCount++;
            }

            if (filters.policyGroup) {
                query += ` AND policy_group = $${paramCount}`;
                params.push(filters.policyGroup);
                paramCount++;
            }

            query += ' ORDER BY created_at DESC';

            const result = await pool.query(query, params);
            return result.rows;
        } catch (error) {
            logger.error('Failed to list policies', { error: error.message });
            throw error;
        }
    }

    /**
     * Update policy
     */
    async updatePolicy(policyId, updates) {
        try {
            const {
                policyName,
                description,
                policyRules,
                status
            } = updates;

            const updateFields = [];
            const params = [];
            let paramCount = 1;

            if (policyName) {
                updateFields.push(`policy_name = $${paramCount}`);
                params.push(policyName);
                paramCount++;
            }

            if (description) {
                updateFields.push(`description = $${paramCount}`);
                params.push(description);
                paramCount++;
            }

            if (policyRules) {
                updateFields.push(`policy_data = $${paramCount}`);
                params.push(JSON.stringify(policyRules));
                paramCount++;
            }

            if (status) {
                updateFields.push(`status = $${paramCount}`);
                params.push(status);
                paramCount++;
            }

            if (updateFields.length === 0) {
                throw new Error('No fields to update');
            }

            params.push(policyId);
            const query = `
                UPDATE policies
                SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
                WHERE id = $${paramCount}
                RETURNING id, policy_id, policy_name
            `;

            const result = await pool.query(query, params);

            if (result.rows.length === 0) {
                throw new Error('Policy not found');
            }

            logger.info('Policy updated', { policyId });

            return {
                success: true,
                message: 'Policy updated successfully',
                policy: result.rows[0]
            };
        } catch (error) {
            logger.error('Policy update failed', { error: error.message, policyId });
            throw error;
        }
    }

    /**
     * Map policy to partner
     */
    async mapPolicyToPartner(partnerId, policyId, createdBy) {
        try {
            // Check if mapping already exists
            const existing = await pool.query(
                'SELECT id FROM partner_policies WHERE partner_id = $1 AND policy_id = $2',
                [partnerId, policyId]
            );

            if (existing.rows.length > 0) {
                // Update existing mapping
                await pool.query(
                    `UPDATE partner_policies
                    SET status = 'active', effective_from = CURRENT_TIMESTAMP
                    WHERE partner_id = $1 AND policy_id = $2`,
                    [partnerId, policyId]
                );
            } else {
                // Create new mapping
                await pool.query(
                    `INSERT INTO partner_policies (partner_id, policy_id, created_by, status)
                    VALUES ($1, $2, $3, 'active')`,
                    [partnerId, policyId, createdBy]
                );
            }

            logger.info('Policy mapped to partner', { partnerId, policyId });

            return {
                success: true,
                message: 'Policy mapped to partner successfully'
            };
        } catch (error) {
            logger.error('Policy mapping failed', { error: error.message, partnerId, policyId });
            throw error;
        }
    }

    /**
     * Get partner policies
     */
    async getPartnerPolicies(partnerId) {
        try {
            const result = await pool.query(
                `SELECT p.id, p.policy_id, p.policy_name, p.policy_type, p.policy_data,
                pp.status, pp.effective_from, pp.effective_to
                FROM partner_policies pp
                JOIN policies p ON pp.policy_id = p.id
                WHERE pp.partner_id = $1 AND pp.status = 'active'
                ORDER BY pp.created_at DESC`,
                [partnerId]
            );

            return result.rows;
        } catch (error) {
            logger.error('Failed to get partner policies', { error: error.message, partnerId });
            throw error;
        }
    }

    /**
     * Validate policy enforcement
     */
    async validatePolicyEnforcement(partnerId, policyType, requestedData) {
        try {
            // Get active policies for partner
            const policies = await pool.query(
                `SELECT p.policy_data
                FROM partner_policies pp
                JOIN policies p ON pp.policy_id = p.id
                WHERE pp.partner_id = $1 AND p.policy_type = $2 
                AND pp.status = 'active' AND p.status = 'active'
                ORDER BY pp.effective_from DESC
                LIMIT 1`,
                [partnerId, policyType]
            );

            if (policies.rows.length === 0) {
                return {
                    allowed: false,
                    reason: 'No active policy found for partner'
                };
            }

            const policyData = policies.rows[0].policy_data;

            // Check if requested data is allowed by policy
            const allowedFields = policyData.allowedFields || [];
            const requestedFields = Object.keys(requestedData);

            const disallowedFields = requestedFields.filter(
                field => !allowedFields.includes(field)
            );

            if (disallowedFields.length > 0) {
                return {
                    allowed: false,
                    reason: 'Some requested fields are not allowed by policy',
                    disallowedFields
                };
            }

            return {
                allowed: true,
                policyData
            };
        } catch (error) {
            logger.error('Policy validation failed', { error: error.message, partnerId });
            throw error;
        }
    }

    /**
     * Create default policies
     */
    async createDefaultPolicies() {
        try {
            const defaultPolicies = [
                {
                    policyName: 'Basic Data Sharing',
                    policyType: 'data_sharing',
                    policyGroup: 'default',
                    description: 'Basic demographic data sharing policy',
                    policyRules: {
                        allowedFields: ['first_name', 'last_name', 'date_of_birth', 'gender'],
                        encryptionRequired: true,
                        consentRequired: true
                    }
                },
                {
                    policyName: 'Full Data Sharing',
                    policyType: 'data_sharing',
                    policyGroup: 'default',
                    description: 'Full demographic and contact data sharing',
                    policyRules: {
                        allowedFields: ['first_name', 'last_name', 'date_of_birth', 'gender', 'email', 'phone', 'nationality'],
                        encryptionRequired: true,
                        consentRequired: true
                    }
                },
                {
                    policyName: 'Multi-Modal Authentication',
                    policyType: 'authentication',
                    policyGroup: 'default',
                    description: 'Allows all authentication methods',
                    policyRules: {
                        allowedMethods: ['otp', 'demographic', 'biometric', 'ekyc'],
                        biometricTypes: ['fingerprint', 'iris', 'face'],
                        minimumAuthLevel: 1
                    }
                },
                {
                    policyName: 'Biometric Only Authentication',
                    policyType: 'authentication',
                    policyGroup: 'default',
                    description: 'Requires biometric authentication',
                    policyRules: {
                        allowedMethods: ['biometric'],
                        biometricTypes: ['fingerprint', 'iris'],
                        minimumAuthLevel: 2
                    }
                }
            ];

            for (const policy of defaultPolicies) {
                try {
                    await this.createPolicy(policy, null);
                } catch (error) {
                    // Skip if already exists
                    if (!error.message.includes('duplicate')) {
                        throw error;
                    }
                }
            }

            logger.info('Default policies created');

            return {
                success: true,
                message: 'Default policies created successfully'
            };
        } catch (error) {
            logger.error('Failed to create default policies', { error: error.message });
            throw error;
        }
    }
}

module.exports = new PolicyService();
