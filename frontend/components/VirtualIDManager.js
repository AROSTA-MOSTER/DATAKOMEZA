/**
 * Virtual ID Management Component
 * Allows users to generate, view, and revoke Virtual IDs
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/VirtualID.module.css';

const VirtualIDManager = ({ userId }) => {
    const [vids, setVids] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showGenerateForm, setShowGenerateForm] = useState(false);
    const [vidType, setVidType] = useState('temporary');

    useEffect(() => {
        loadVIDs();
    }, [userId]);

    const loadVIDs = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(
                `${process.env.NEXT_PUBLIC_API_URL}/api/vid/list/${userId}`,
                { headers: { Authorization: `Bearer ${token}` } }
            );
            setVids(response.data.data);
        } catch (err) {
            setError('Failed to load Virtual IDs');
        } finally {
            setLoading(false);
        }
    };

    const generateVID = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('token');
            const response = await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/vid/generate`,
                { userId, vidType },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess(`Virtual ID generated: ${response.data.data.vid}`);
            setShowGenerateForm(false);
            loadVIDs();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to generate VID');
        } finally {
            setLoading(false);
        }
    };

    const revokeVID = async (vid) => {
        if (!confirm('Are you sure you want to revoke this Virtual ID?')) {
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            const token = localStorage.getItem('token');
            await axios.post(
                `${process.env.NEXT_PUBLIC_API_URL}/api/vid/revoke`,
                { userId, vid, reason: 'User requested' },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            setSuccess('Virtual ID revoked successfully');
            loadVIDs();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to revoke VID');
        } finally {
            setLoading(false);
        }
    };

    const getVIDTypeColor = (type) => {
        switch (type) {
            case 'temporary': return '#f59e0b';
            case 'permanent': return '#3b82f6';
            case 'perpetual': return '#10b981';
            default: return '#6b7280';
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'active': return '#10b981';
            case 'revoked': return '#ef4444';
            case 'expired': return '#6b7280';
            default: return '#6b7280';
        }
    };

    return (
        <div className={styles.vidManager}>
            <div className={styles.header}>
                <h2>Virtual ID Management</h2>
                <button
                    className={styles.generateBtn}
                    onClick={() => setShowGenerateForm(!showGenerateForm)}
                    disabled={loading}
                >
                    + Generate New VID
                </button>
            </div>

            {error && <div className={styles.error}>{error}</div>}
            {success && <div className={styles.success}>{success}</div>}

            {showGenerateForm && (
                <div className={styles.generateForm}>
                    <h3>Generate New Virtual ID</h3>
                    <div className={styles.formGroup}>
                        <label>VID Type</label>
                        <select
                            value={vidType}
                            onChange={(e) => setVidType(e.target.value)}
                            className={styles.select}
                        >
                            <option value="temporary">Temporary (1 day)</option>
                            <option value="permanent">Permanent (1 year)</option>
                            <option value="perpetual">Perpetual (No expiry)</option>
                        </select>
                    </div>
                    <div className={styles.formActions}>
                        <button
                            onClick={generateVID}
                            disabled={loading}
                            className={styles.btnPrimary}
                        >
                            {loading ? 'Generating...' : 'Generate'}
                        </button>
                        <button
                            onClick={() => setShowGenerateForm(false)}
                            className={styles.btnSecondary}
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}

            <div className={styles.vidList}>
                {loading && <div className={styles.loading}>Loading Virtual IDs...</div>}

                {!loading && vids.length === 0 && (
                    <div className={styles.empty}>
                        <p>No Virtual IDs found</p>
                        <p className={styles.hint}>Generate a Virtual ID to protect your privacy</p>
                    </div>
                )}

                {!loading && vids.map((vid) => (
                    <div key={vid.vid} className={styles.vidCard}>
                        <div className={styles.vidHeader}>
                            <div className={styles.vidNumber}>{vid.vid}</div>
                            <div className={styles.badges}>
                                <span
                                    className={styles.badge}
                                    style={{ backgroundColor: getVIDTypeColor(vid.vid_type) }}
                                >
                                    {vid.vid_type}
                                </span>
                                <span
                                    className={styles.badge}
                                    style={{ backgroundColor: getStatusColor(vid.status) }}
                                >
                                    {vid.status}
                                </span>
                            </div>
                        </div>

                        <div className={styles.vidDetails}>
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Created:</span>
                                <span className={styles.value}>
                                    {new Date(vid.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {vid.expires_at && (
                                <div className={styles.detailRow}>
                                    <span className={styles.label}>Expires:</span>
                                    <span className={styles.value}>
                                        {new Date(vid.expires_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                            <div className={styles.detailRow}>
                                <span className={styles.label}>Usage Count:</span>
                                <span className={styles.value}>{vid.usage_count || 0}</span>
                            </div>
                            {vid.revoked_at && (
                                <div className={styles.detailRow}>
                                    <span className={styles.label}>Revoked:</span>
                                    <span className={styles.value}>
                                        {new Date(vid.revoked_at).toLocaleDateString()}
                                    </span>
                                </div>
                            )}
                        </div>

                        {vid.status === 'active' && (
                            <div className={styles.vidActions}>
                                <button
                                    onClick={() => revokeVID(vid.vid)}
                                    className={styles.btnDanger}
                                    disabled={loading}
                                >
                                    Revoke
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default VirtualIDManager;
