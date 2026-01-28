/**
 * User Details Modal
 * Displays full user demographic data for admin review
 */

import { useState, useEffect } from 'react';
import api from '../utils/api';
import styles from '../styles/AdminModals.module.css';

export default function UserDetailsModal({ userId, onClose, onAction }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (userId) {
            loadUserDetails();
        }
    }, [userId]);

    const loadUserDetails = async () => {
        try {
            setLoading(true);
            const res = await api.get(`/admin/users/${userId}/details`);
            if (res.data.success) {
                setUser(res.data.data);
            } else {
                setError('Failed to load user details');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Error loading details');
        } finally {
            setLoading(false);
        }
    };

    const getStatusBadge = (status) => {
        const statusColors = {
            'pending_verification': '#f59e0b',
            'approved_for_biometric': '#3b82f6',
            'biometrics_verified': '#10b981',
            'active_verified': '#22c55e',
            'flagged_duplicate': '#ef4444',
            'correction_requested': '#f97316',
            'rejected': '#dc2626'
        };
        return {
            backgroundColor: statusColors[status] || '#6b7280',
            color: 'white',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: '600',
            textTransform: 'uppercase'
        };
    };

    if (!userId) return null;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>User Details</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                {loading && (
                    <div className={styles.loading}>Loading user details...</div>
                )}

                {error && (
                    <div className={styles.error}>{error}</div>
                )}

                {user && !loading && (
                    <div className={styles.detailsGrid}>
                        {/* Status Banner */}
                        <div className={styles.statusBanner}>
                            <span style={getStatusBadge(user.status)}>{user.status?.replace(/_/g, ' ')}</span>
                            {user.mosip_id && <span className={styles.mosipId}>MOSIP ID: {user.mosip_id}</span>}
                        </div>

                        {/* Personal Information */}
                        <div className={styles.section}>
                            <h3>📋 Personal Information</h3>
                            <div className={styles.fieldGrid}>
                                <div className={styles.field}>
                                    <label>First Name</label>
                                    <span>{user.first_name}</span>
                                </div>
                                <div className={styles.field}>
                                    <label>Last Name</label>
                                    <span>{user.last_name}</span>
                                </div>
                                <div className={styles.field}>
                                    <label>Date of Birth</label>
                                    <span>{user.date_of_birth ? new Date(user.date_of_birth).toLocaleDateString() : 'N/A'}</span>
                                </div>
                                <div className={styles.field}>
                                    <label>Gender</label>
                                    <span>{user.gender || 'N/A'}</span>
                                </div>
                                <div className={styles.field}>
                                    <label>Nationality</label>
                                    <span>{user.nationality || 'N/A'}</span>
                                </div>
                                <div className={styles.field}>
                                    <label>Place of Birth</label>
                                    <span>{user.place_of_birth || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Family Information */}
                        <div className={styles.section}>
                            <h3>👨‍👩‍👧 Family Information</h3>
                            <div className={styles.fieldGrid}>
                                <div className={styles.field}>
                                    <label>Father's Name</label>
                                    <span>{user.father_name || 'N/A'}</span>
                                </div>
                                <div className={styles.field}>
                                    <label>Mother's Name</label>
                                    <span>{user.mother_name || 'N/A'}</span>
                                </div>
                                <div className={styles.field}>
                                    <label>Marital Status</label>
                                    <span>{user.marital_status || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Contact Information */}
                        <div className={styles.section}>
                            <h3>📞 Contact Information</h3>
                            <div className={styles.fieldGrid}>
                                <div className={styles.field}>
                                    <label>Email</label>
                                    <span>{user.email}</span>
                                </div>
                                <div className={styles.field}>
                                    <label>Phone</label>
                                    <span>{user.phone || 'N/A'}</span>
                                </div>
                                <div className={styles.fieldFull}>
                                    <label>Current Address</label>
                                    <span>{user.current_address || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Biometric Status */}
                        {user.biometric_status && (
                            <div className={styles.section}>
                                <h3>🧬 Biometric Status</h3>
                                <div className={styles.fieldGrid}>
                                    <div className={styles.field}>
                                        <label>Biometric Status</label>
                                        <span>{user.biometric_status}</span>
                                    </div>
                                    {user.scheduled_biometric_date && (
                                        <div className={styles.field}>
                                            <label>Scheduled Date</label>
                                            <span>{new Date(user.scheduled_biometric_date).toLocaleString()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Notes */}
                        {user.verification_notes && (
                            <div className={styles.section}>
                                <h3>📝 Notes</h3>
                                <div className={styles.notes}>{user.verification_notes}</div>
                            </div>
                        )}

                        {/* Correction Fields */}
                        {user.correction_fields && user.correction_fields.length > 0 && (
                            <div className={styles.section}>
                                <h3>⚠️ Fields Requiring Correction</h3>
                                <div className={styles.correctionList}>
                                    {user.correction_fields.map((field, i) => (
                                        <span key={i} className={styles.correctionField}>{field}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Registration Date */}
                        <div className={styles.metaInfo}>
                            Registered: {new Date(user.created_at).toLocaleString()}
                        </div>
                    </div>
                )}

                {/* Action Buttons */}
                {user && !loading && (
                    <div className={styles.modalActions}>
                        {user.status === 'pending_verification' && (
                            <>
                                <button
                                    className={styles.approveButton}
                                    onClick={() => onAction('approve', user)}
                                >
                                    ✓ Approve for Biometric
                                </button>
                                <button
                                    className={styles.correctButton}
                                    onClick={() => onAction('correction', user)}
                                >
                                    ✏️ Request Correction
                                </button>
                                <button
                                    className={styles.rejectButton}
                                    onClick={() => onAction('reject', user)}
                                >
                                    ✗ Reject
                                </button>
                            </>
                        )}
                        {user.status === 'approved_for_biometric' && (
                            <>
                                <button
                                    className={styles.scheduleButton}
                                    onClick={() => onAction('schedule', user)}
                                >
                                    📅 Schedule Biometric
                                </button>
                                <button
                                    className={styles.captureButton}
                                    onClick={() => onAction('capture', user)}
                                >
                                    🧬 Capture Biometrics
                                </button>
                            </>
                        )}
                        {user.status === 'biometrics_verified' && (
                            <button
                                className={styles.issueButton}
                                onClick={() => onAction('issue', user)}
                            >
                                🆔 Issue Digital ID
                            </button>
                        )}
                        {user.status === 'flagged_duplicate' && (
                            <button
                                className={styles.resolveButton}
                                onClick={() => onAction('resolve', user)}
                            >
                                🔍 Resolve Duplicate
                            </button>
                        )}
                        <button className={styles.closeButtonSecondary} onClick={onClose}>
                            Close
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
