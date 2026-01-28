/**
 * Workflow Action Modals
 * Modals for correction request, rejection, scheduling, and duplicate resolution
 */

import { useState } from 'react';
import api from '../utils/api';
import styles from '../styles/AdminModals.module.css';

// Correction Request Modal
export function CorrectionRequestModal({ user, onClose, onSuccess }) {
    const [selectedFields, setSelectedFields] = useState([]);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const availableFields = [
        'first_name', 'last_name', 'date_of_birth', 'gender',
        'nationality', 'place_of_birth', 'father_name', 'mother_name',
        'marital_status', 'current_address', 'phone', 'email'
    ];

    const toggleField = (field) => {
        setSelectedFields(prev =>
            prev.includes(field)
                ? prev.filter(f => f !== field)
                : [...prev, field]
        );
    };

    const handleSubmit = async () => {
        if (selectedFields.length === 0) {
            alert('Please select at least one field');
            return;
        }
        try {
            setLoading(true);
            const res = await api.post(`/admin/users/${user.id}/request-correction`, {
                correctionFields: selectedFields,
                notes
            });
            if (res.data.success) {
                onSuccess('Correction request sent');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error sending correction request');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>✏️ Request Correction</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.modalBody}>
                    <p>Select fields that need correction for <strong>{user.first_name} {user.last_name}</strong>:</p>

                    <div className={styles.fieldSelector}>
                        {availableFields.map(field => (
                            <label key={field} className={styles.fieldCheckbox}>
                                <input
                                    type="checkbox"
                                    checked={selectedFields.includes(field)}
                                    onChange={() => toggleField(field)}
                                />
                                <span>{field.replace(/_/g, ' ')}</span>
                            </label>
                        ))}
                    </div>

                    <textarea
                        className={styles.notesInput}
                        placeholder="Additional notes for the user..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={styles.correctButton}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Sending...' : 'Send Correction Request'}
                    </button>
                    <button className={styles.closeButtonSecondary} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Rejection Modal
export function RejectionModal({ user, onClose, onSuccess }) {
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!reason.trim()) {
            alert('Please provide a rejection reason');
            return;
        }
        try {
            setLoading(true);
            const res = await api.post(`/admin/users/${user.id}/reject`, { reason });
            if (res.data.success) {
                onSuccess('Registration rejected');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error rejecting registration');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>✗ Reject Registration</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.modalBody}>
                    <p>Reject registration for <strong>{user.first_name} {user.last_name}</strong>?</p>
                    <p className={styles.warning}>⚠️ This action cannot be undone.</p>

                    <textarea
                        className={styles.notesInput}
                        placeholder="Reason for rejection (required)..."
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        rows={4}
                        required
                    />
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={styles.rejectButton}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Rejecting...' : 'Confirm Rejection'}
                    </button>
                    <button className={styles.closeButtonSecondary} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Schedule Biometric Modal
export function ScheduleBiometricModal({ user, onClose, onSuccess }) {
    const [scheduledDate, setScheduledDate] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!scheduledDate) {
            alert('Please select a date and time');
            return;
        }
        try {
            setLoading(true);
            const res = await api.post(`/admin/users/${user.id}/schedule-biometric`, {
                scheduledDate
            });
            if (res.data.success) {
                onSuccess('Biometric appointment scheduled');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error scheduling appointment');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>📅 Schedule Biometric Capture</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.modalBody}>
                    <p>Schedule biometric appointment for <strong>{user.first_name} {user.last_name}</strong>:</p>

                    <input
                        type="datetime-local"
                        className={styles.dateInput}
                        value={scheduledDate}
                        onChange={e => setScheduledDate(e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                    />
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={styles.scheduleButton}
                        onClick={handleSubmit}
                        disabled={loading}
                    >
                        {loading ? 'Scheduling...' : 'Confirm Schedule'}
                    </button>
                    <button className={styles.closeButtonSecondary} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Biometric Capture Modal
export function BiometricCaptureModal({ user, onClose, onSuccess }) {
    const [capturing, setCapturing] = useState(false);
    const [captureStatus, setCaptureStatus] = useState({});
    const [loading, setLoading] = useState(false);

    const biometricModalities = [
        { type: 'face', label: 'Face Photo', icon: '😊' },
        { type: 'fingerprint', positions: ['right_thumb', 'right_index', 'right_middle', 'right_ring', 'right_little', 'left_thumb', 'left_index', 'left_middle', 'left_ring', 'left_little'], label: 'Fingerprints (10)', icon: '👆' },
        { type: 'signature', label: 'Signature', icon: '✍️' }
    ];

    const simulateCapture = async () => {
        setCapturing(true);

        // Simulate capturing each modality
        for (const modality of ['face', 'fingerprints', 'signature']) {
            setCaptureStatus(prev => ({ ...prev, [modality]: 'capturing' }));
            await new Promise(r => setTimeout(r, 1000));
            setCaptureStatus(prev => ({ ...prev, [modality]: 'done' }));
        }

        setCapturing(false);
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);

            // Create mock biometric data for all modalities
            const biometrics = [
                { type: 'face', data: 'mock-face-data', quality: 95 },
                { type: 'signature', data: 'mock-signature-data', quality: 90 },
                // 10 fingerprints
                ...['right_thumb', 'right_index', 'right_middle', 'right_ring', 'right_little',
                    'left_thumb', 'left_index', 'left_middle', 'left_ring', 'left_little'].map(pos => ({
                        type: 'fingerprint',
                        position: pos,
                        data: `mock-${pos}-data`,
                        quality: 85 + Math.floor(Math.random() * 10)
                    }))
            ];

            const res = await api.post(`/admin/users/${user.id}/capture-biometrics-full`, {
                biometrics
            });

            if (res.data.success) {
                onSuccess(res.data.message);
            } else {
                alert(res.data.message || 'Capture failed');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error capturing biometrics');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContentMedium} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>🧬 Biometric Capture</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.modalBody}>
                    <p>Capturing biometrics for <strong>{user.first_name} {user.last_name}</strong></p>

                    <div className={styles.capturePanel}>
                        {biometricModalities.map(modality => (
                            <div key={modality.type} className={styles.captureItem}>
                                <span className={styles.captureIcon}>{modality.icon}</span>
                                <span className={styles.captureLabel}>{modality.label}</span>
                                <span className={styles.captureStatus}>
                                    {captureStatus[modality.type === 'fingerprint' ? 'fingerprints' : modality.type] === 'capturing' && '⏳ Capturing...'}
                                    {captureStatus[modality.type === 'fingerprint' ? 'fingerprints' : modality.type] === 'done' && '✅ Captured'}
                                    {!captureStatus[modality.type === 'fingerprint' ? 'fingerprints' : modality.type] && '⬜ Pending'}
                                </span>
                            </div>
                        ))}
                    </div>

                    {!capturing && Object.keys(captureStatus).length === 0 && (
                        <button className={styles.startCaptureButton} onClick={simulateCapture}>
                            🎥 Start Capture Simulation
                        </button>
                    )}
                </div>

                <div className={styles.modalActions}>
                    {Object.keys(captureStatus).length === 3 && !capturing && (
                        <button
                            className={styles.captureButton}
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {loading ? 'Submitting...' : '✓ Submit to ABIS for Deduplication'}
                        </button>
                    )}
                    <button className={styles.closeButtonSecondary} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}

// Issue Digital ID Modal
export function IssueDigitalIDModal({ user, onClose, onSuccess }) {
    const [loading, setLoading] = useState(false);
    const [issuedData, setIssuedData] = useState(null);

    const handleIssue = async () => {
        try {
            setLoading(true);
            const res = await api.post(`/admin/users/${user.id}/issue-digital-id`);

            if (res.data.success) {
                setIssuedData(res.data.data);
                onSuccess('Digital ID issued successfully');
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error issuing Digital ID');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>🆔 Issue Digital ID</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.modalBody}>
                    {!issuedData ? (
                        <>
                            <p>Issue Digital ID for <strong>{user.first_name} {user.last_name}</strong>?</p>
                            <p className={styles.info}>ℹ️ This will generate a unique MOSIP ID and QR verification code.</p>
                        </>
                    ) : (
                        <div className={styles.issuedInfo}>
                            <div className={styles.successBanner}>✅ Digital ID Issued!</div>
                            <div className={styles.field}>
                                <label>MOSIP ID</label>
                                <span className={styles.mosipIdLarge}>{issuedData.mosipId}</span>
                            </div>
                            <div className={styles.field}>
                                <label>Issued To</label>
                                <span>{issuedData.userName}</span>
                            </div>
                            <div className={styles.field}>
                                <label>Issued At</label>
                                <span>{new Date(issuedData.issuedAt).toLocaleString()}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={styles.modalActions}>
                    {!issuedData ? (
                        <button
                            className={styles.issueButton}
                            onClick={handleIssue}
                            disabled={loading}
                        >
                            {loading ? 'Issuing...' : '🆔 Issue Digital ID'}
                        </button>
                    ) : null}
                    <button className={styles.closeButtonSecondary} onClick={onClose}>
                        {issuedData ? 'Close' : 'Cancel'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// Duplicate Resolution Modal
export function DuplicateResolutionModal({ user, onClose, onSuccess }) {
    const [resolution, setResolution] = useState('');
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!resolution) {
            alert('Please select a resolution');
            return;
        }
        try {
            setLoading(true);
            const res = await api.post(`/admin/users/${user.id}/resolve-duplicate`, {
                resolution,
                notes
            });

            if (res.data.success) {
                onSuccess(`Duplicate resolved: ${resolution}`);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Error resolving duplicate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContentSmall} onClick={e => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h2>🔍 Resolve Duplicate</h2>
                    <button className={styles.closeButton} onClick={onClose}>×</button>
                </div>

                <div className={styles.modalBody}>
                    <p>Resolve duplicate flag for <strong>{user.first_name} {user.last_name}</strong>:</p>

                    {user.verification_notes && (
                        <div className={styles.duplicateInfo}>
                            <strong>Match Info:</strong> {user.verification_notes}
                        </div>
                    )}

                    <div className={styles.resolutionOptions}>
                        <label className={styles.radioOption}>
                            <input
                                type="radio"
                                name="resolution"
                                value="approve"
                                checked={resolution === 'approve'}
                                onChange={() => setResolution('approve')}
                            />
                            <span>✅ <strong>Approve</strong> - Not a duplicate, proceed with verification</span>
                        </label>
                        <label className={styles.radioOption}>
                            <input
                                type="radio"
                                name="resolution"
                                value="reject"
                                checked={resolution === 'reject'}
                                onChange={() => setResolution('reject')}
                            />
                            <span>❌ <strong>Reject</strong> - Confirmed duplicate, reject registration</span>
                        </label>
                        <label className={styles.radioOption}>
                            <input
                                type="radio"
                                name="resolution"
                                value="merge"
                                checked={resolution === 'merge'}
                                onChange={() => setResolution('merge')}
                            />
                            <span>🔗 <strong>Merge</strong> - Merge with existing record</span>
                        </label>
                    </div>

                    <textarea
                        className={styles.notesInput}
                        placeholder="Resolution notes..."
                        value={notes}
                        onChange={e => setNotes(e.target.value)}
                        rows={3}
                    />
                </div>

                <div className={styles.modalActions}>
                    <button
                        className={styles.resolveButton}
                        onClick={handleSubmit}
                        disabled={loading || !resolution}
                    >
                        {loading ? 'Resolving...' : 'Confirm Resolution'}
                    </button>
                    <button className={styles.closeButtonSecondary} onClick={onClose}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    );
}
