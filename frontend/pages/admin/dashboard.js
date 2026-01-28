/**
 * Admin Dashboard
 * Complete MOSIP workflow interface with all modals and features
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import UserDetailsModal from '../../components/UserDetailsModal';
import {
    CorrectionRequestModal,
    RejectionModal,
    ScheduleBiometricModal,
    BiometricCaptureModal,
    IssueDigitalIDModal,
    DuplicateResolutionModal
} from '../../components/WorkflowModals';
import styles from '../../styles/AdminDashboard.module.css';

export default function AdminDashboard() {
    const { user, isAuthenticated, isAdmin, loading: authLoading, logout } = useAuth();
    const router = useRouter();

    // Data state
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [approvedUsers, setApprovedUsers] = useState([]);
    const [verifiedUsers, setVerifiedUsers] = useState([]);
    const [flaggedUsers, setFlaggedUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    // Modal state
    const [selectedUser, setSelectedUser] = useState(null);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [correctionModalOpen, setCorrectionModalOpen] = useState(false);
    const [rejectionModalOpen, setRejectionModalOpen] = useState(false);
    const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
    const [captureModalOpen, setCaptureModalOpen] = useState(false);
    const [issueModalOpen, setIssueModalOpen] = useState(false);
    const [resolveModalOpen, setResolveModalOpen] = useState(false);

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isAdmin)) {
            router.push('/admin/login');
        } else if (isAuthenticated && isAdmin) {
            loadAdminData();
        }
    }, [isAuthenticated, isAdmin, authLoading, router]);

    const loadAdminData = async () => {
        try {
            const [statsRes, usersRes, logsRes, pendingRes, approvedRes, flaggedRes] = await Promise.all([
                api.get('/admin/statistics'),
                api.get('/admin/users?limit=10'),
                api.get('/admin/audit-logs?limit=20'),
                api.get('/admin/users/pending'),
                api.get('/admin/users/approved-for-biometric'),
                api.get('/admin/users/flagged-duplicates').catch(() => ({ data: { success: true, data: [] } }))
            ]);

            if (statsRes.data.success) setStats(statsRes.data.data);
            if (usersRes.data.success) setUsers(usersRes.data.data.users);
            if (logsRes.data.success) setAuditLogs(logsRes.data.data);
            if (pendingRes.data.success) setPendingUsers(pendingRes.data.data);
            if (approvedRes.data.success) setApprovedUsers(approvedRes.data.data);
            if (flaggedRes.data.success) setFlaggedUsers(flaggedRes.data.data);

            // Filter verified users from all users
            if (usersRes.data.success) {
                const verified = usersRes.data.data.users.filter(u => u.status === 'biometrics_verified');
                setVerifiedUsers(verified);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Quick actions
    const handleApproveBiometric = async (userId) => {
        try {
            const res = await api.post(`/admin/users/${userId}/approve-biometric`);
            if (res.data.success) {
                alert('User approved for biometric capture');
                loadAdminData();
            }
        } catch (error) {
            console.error('Error approving user:', error);
            alert('Failed to approve user');
        }
    };

    // Modal action handlers
    const handleModalAction = (action, user) => {
        setSelectedUser(user);
        setDetailsModalOpen(false);

        switch (action) {
            case 'approve':
                handleApproveBiometric(user.id);
                break;
            case 'correction':
                setCorrectionModalOpen(true);
                break;
            case 'reject':
                setRejectionModalOpen(true);
                break;
            case 'schedule':
                setScheduleModalOpen(true);
                break;
            case 'capture':
                setCaptureModalOpen(true);
                break;
            case 'issue':
                setIssueModalOpen(true);
                break;
            case 'resolve':
                setResolveModalOpen(true);
                break;
        }
    };

    const handleModalSuccess = (message) => {
        alert(message);
        closeAllModals();
        loadAdminData();
    };

    const closeAllModals = () => {
        setDetailsModalOpen(false);
        setCorrectionModalOpen(false);
        setRejectionModalOpen(false);
        setScheduleModalOpen(false);
        setCaptureModalOpen(false);
        setIssueModalOpen(false);
        setResolveModalOpen(false);
        setSelectedUser(null);
    };

    const openUserDetails = (userId) => {
        setSelectedUser({ id: userId });
        setDetailsModalOpen(true);
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const getStatusBadge = (status) => {
        const colors = {
            'pending_verification': { bg: '#fef3c7', color: '#92400e' },
            'approved_for_biometric': { bg: '#dbeafe', color: '#1e40af' },
            'biometrics_verified': { bg: '#d1fae5', color: '#065f46' },
            'active_verified': { bg: '#dcfce7', color: '#166534' },
            'flagged_duplicate': { bg: '#fee2e2', color: '#991b1b' },
            'correction_requested': { bg: '#ffedd5', color: '#9a3412' },
            'rejected': { bg: '#fecaca', color: '#dc2626' }
        };
        const style = colors[status] || { bg: '#f3f4f6', color: '#374151' };
        return (
            <span style={{
                background: style.bg,
                color: style.color,
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase'
            }}>
                {status?.replace(/_/g, ' ')}
            </span>
        );
    };

    if (authLoading || loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    const totalUsers = stats?.total_users || 0;
    const activeUsers = stats?.active_users || 0;
    const serviceProviders = stats?.active_service_providers || 0;
    const consents = stats?.active_consents || 0;

    return (
        <>
            <Head>
                <title>Admin Dashboard - DATAKOMEZA</title>
            </Head>

            <div className={styles.adminDashboard}>
                {/* Sidebar */}
                <aside className={styles.adminSidebar}>
                    <div className={styles.adminLogo}>
                        DATAKOMEZA
                    </div>
                    <nav className={styles.adminNav}>
                        <button
                            className={activeTab === 'dashboard' ? styles.adminNavItemActive : styles.adminNavItem}
                            onClick={() => setActiveTab('dashboard')}
                        >
                            📊 Dashboard
                        </button>
                        <button
                            className={activeTab === 'verification' ? styles.adminNavItemActive : styles.adminNavItem}
                            onClick={() => setActiveTab('verification')}
                        >
                            📋 Verification {pendingUsers.length > 0 && <span className={styles.badge}>{pendingUsers.length}</span>}
                        </button>
                        <button
                            className={activeTab === 'biometrics' ? styles.adminNavItemActive : styles.adminNavItem}
                            onClick={() => setActiveTab('biometrics')}
                        >
                            🧬 Biometrics {approvedUsers.length > 0 && <span className={styles.badge}>{approvedUsers.length}</span>}
                        </button>
                        <button
                            className={activeTab === 'duplicates' ? styles.adminNavItemActive : styles.adminNavItem}
                            onClick={() => setActiveTab('duplicates')}
                        >
                            ⚠️ Duplicates {flaggedUsers.length > 0 && <span className={styles.badgeRed}>{flaggedUsers.length}</span>}
                        </button>
                        <button
                            className={activeTab === 'issuance' ? styles.adminNavItemActive : styles.adminNavItem}
                            onClick={() => setActiveTab('issuance')}
                        >
                            🆔 ID Issuance {verifiedUsers.length > 0 && <span className={styles.badge}>{verifiedUsers.length}</span>}
                        </button>
                        <button
                            className={activeTab === 'users' ? styles.adminNavItemActive : styles.adminNavItem}
                            onClick={() => setActiveTab('users')}
                        >
                            👥 All Users
                        </button>
                        <button
                            className={activeTab === 'audit' ? styles.adminNavItemActive : styles.adminNavItem}
                            onClick={() => setActiveTab('audit')}
                        >
                            📜 Audit Logs
                        </button>
                    </nav>
                    <div className={styles.adminProfile}>
                        <div className={styles.adminAvatar}>
                            {getInitials(user?.firstName || 'Admin', user?.lastName || '')}
                        </div>
                        <div>
                            <div className={styles.adminName}>{user?.email || 'Admin'}</div>
                            <button className={styles.logoutButton} onClick={logout}>Logout</button>
                        </div>
                    </div>
                </aside>

                {/* Main Content */}
                <main className={styles.adminMain}>
                    <header className={styles.adminHeader}>
                        <h1>
                            {activeTab === 'dashboard' && '📊 Dashboard Overview'}
                            {activeTab === 'verification' && '📋 Pending Verification'}
                            {activeTab === 'biometrics' && '🧬 Biometric Capture Queue'}
                            {activeTab === 'duplicates' && '⚠️ Flagged Duplicates'}
                            {activeTab === 'issuance' && '🆔 Ready for ID Issuance'}
                            {activeTab === 'users' && '👥 All Users'}
                            {activeTab === 'audit' && '📜 Audit Logs'}
                        </h1>
                    </header>

                    {/* Dashboard Stats */}
                    {activeTab === 'dashboard' && (
                        <div className={styles.adminContent}>
                            <div className={styles.statsGrid}>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>👥</div>
                                    <div className={styles.statValue}>{totalUsers}</div>
                                    <div className={styles.statLabel}>Total Users</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>✅</div>
                                    <div className={styles.statValue}>{activeUsers}</div>
                                    <div className={styles.statLabel}>Verified</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>⏳</div>
                                    <div className={styles.statValue}>{pendingUsers.length}</div>
                                    <div className={styles.statLabel}>Pending</div>
                                </div>
                                <div className={styles.statCard}>
                                    <div className={styles.statIcon}>⚠️</div>
                                    <div className={styles.statValue}>{flaggedUsers.length}</div>
                                    <div className={styles.statLabel}>Flagged</div>
                                </div>
                            </div>

                            {/* Quick Actions */}
                            <div className={styles.quickActions}>
                                <h3>Quick Actions</h3>
                                <div className={styles.actionButtons}>
                                    <button onClick={() => setActiveTab('verification')}>
                                        📋 Review Pending ({pendingUsers.length})
                                    </button>
                                    <button onClick={() => setActiveTab('biometrics')}>
                                        🧬 Capture Biometrics ({approvedUsers.length})
                                    </button>
                                    <button onClick={() => setActiveTab('duplicates')}>
                                        ⚠️ Resolve Duplicates ({flaggedUsers.length})
                                    </button>
                                    <button onClick={() => setActiveTab('issuance')}>
                                        🆔 Issue IDs ({verifiedUsers.length})
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Pending Verification */}
                    {activeTab === 'verification' && (
                        <div className={styles.adminContent}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Registered</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {pendingUsers.length === 0 ? (
                                        <tr><td colSpan="5" className={styles.emptyRow}>No pending registrations</td></tr>
                                    ) : (
                                        pendingUsers.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div className={styles.userCell}>
                                                        <div className={styles.userAvatar}>{getInitials(u.first_name, u.last_name)}</div>
                                                        <span>{u.first_name} {u.last_name}</span>
                                                    </div>
                                                </td>
                                                <td>{u.email}</td>
                                                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                                                <td>{getStatusBadge(u.status)}</td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <button className={styles.viewBtn} onClick={() => openUserDetails(u.id)}>👁️ View</button>
                                                        <button className={styles.approveBtn} onClick={() => handleApproveBiometric(u.id)}>✓ Approve</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Biometric Capture Queue */}
                    {activeTab === 'biometrics' && (
                        <div className={styles.adminContent}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Scheduled</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {approvedUsers.length === 0 ? (
                                        <tr><td colSpan="5" className={styles.emptyRow}>No users pending biometric capture</td></tr>
                                    ) : (
                                        approvedUsers.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div className={styles.userCell}>
                                                        <div className={styles.userAvatar}>{getInitials(u.first_name, u.last_name)}</div>
                                                        <span>{u.first_name} {u.last_name}</span>
                                                    </div>
                                                </td>
                                                <td>{u.email}</td>
                                                <td>{u.scheduled_biometric_date ? new Date(u.scheduled_biometric_date).toLocaleString() : 'Not scheduled'}</td>
                                                <td>{getStatusBadge(u.status)}</td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <button className={styles.viewBtn} onClick={() => openUserDetails(u.id)}>👁️ View</button>
                                                        <button className={styles.captureBtn} onClick={() => { setSelectedUser(u); setCaptureModalOpen(true); }}>🧬 Capture</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Flagged Duplicates */}
                    {activeTab === 'duplicates' && (
                        <div className={styles.adminContent}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Match Info</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {flaggedUsers.length === 0 ? (
                                        <tr><td colSpan="5" className={styles.emptyRow}>No flagged duplicates</td></tr>
                                    ) : (
                                        flaggedUsers.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div className={styles.userCell}>
                                                        <div className={styles.userAvatar}>{getInitials(u.first_name, u.last_name)}</div>
                                                        <span>{u.first_name} {u.last_name}</span>
                                                    </div>
                                                </td>
                                                <td>{u.email}</td>
                                                <td className={styles.matchInfo}>{u.verification_notes || 'Potential duplicate detected'}</td>
                                                <td>{getStatusBadge(u.status)}</td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <button className={styles.viewBtn} onClick={() => openUserDetails(u.id)}>👁️ View</button>
                                                        <button className={styles.resolveBtn} onClick={() => { setSelectedUser(u); setResolveModalOpen(true); }}>🔍 Resolve</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* ID Issuance */}
                    {activeTab === 'issuance' && (
                        <div className={styles.adminContent}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>Biometric Status</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {verifiedUsers.length === 0 ? (
                                        <tr><td colSpan="5" className={styles.emptyRow}>No users ready for ID issuance</td></tr>
                                    ) : (
                                        verifiedUsers.map(u => (
                                            <tr key={u.id}>
                                                <td>
                                                    <div className={styles.userCell}>
                                                        <div className={styles.userAvatar}>{getInitials(u.first_name, u.last_name)}</div>
                                                        <span>{u.first_name} {u.last_name}</span>
                                                    </div>
                                                </td>
                                                <td>{u.email}</td>
                                                <td>✅ Verified</td>
                                                <td>{getStatusBadge(u.status)}</td>
                                                <td>
                                                    <div className={styles.actionButtons}>
                                                        <button className={styles.viewBtn} onClick={() => openUserDetails(u.id)}>👁️ View</button>
                                                        <button className={styles.issueBtn} onClick={() => { setSelectedUser(u); setIssueModalOpen(true); }}>🆔 Issue ID</button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* All Users */}
                    {activeTab === 'users' && (
                        <div className={styles.adminContent}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>User</th>
                                        <th>Email</th>
                                        <th>MOSIP ID</th>
                                        <th>Status</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {users.map(u => (
                                        <tr key={u.id}>
                                            <td>
                                                <div className={styles.userCell}>
                                                    <div className={styles.userAvatar}>{getInitials(u.first_name, u.last_name)}</div>
                                                    <span>{u.first_name} {u.last_name}</span>
                                                </div>
                                            </td>
                                            <td>{u.email}</td>
                                            <td>{u.mosip_id || '-'}</td>
                                            <td>{getStatusBadge(u.status)}</td>
                                            <td>
                                                <button className={styles.viewBtn} onClick={() => openUserDetails(u.id)}>👁️ View Details</button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Audit Logs */}
                    {activeTab === 'audit' && (
                        <div className={styles.adminContent}>
                            <table className={styles.dataTable}>
                                <thead>
                                    <tr>
                                        <th>Timestamp</th>
                                        <th>Action</th>
                                        <th>User ID</th>
                                        <th>Details</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map(log => (
                                        <tr key={log.id}>
                                            <td>{new Date(log.created_at).toLocaleString()}</td>
                                            <td><strong>{log.action}</strong></td>
                                            <td>{log.user_id}</td>
                                            <td className={styles.logDetails}>{JSON.stringify(log.details)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </main>
            </div>

            {/* Modals */}
            {detailsModalOpen && (
                <UserDetailsModal
                    userId={selectedUser?.id}
                    onClose={closeAllModals}
                    onAction={handleModalAction}
                />
            )}

            {correctionModalOpen && selectedUser && (
                <CorrectionRequestModal
                    user={selectedUser}
                    onClose={closeAllModals}
                    onSuccess={handleModalSuccess}
                />
            )}

            {rejectionModalOpen && selectedUser && (
                <RejectionModal
                    user={selectedUser}
                    onClose={closeAllModals}
                    onSuccess={handleModalSuccess}
                />
            )}

            {scheduleModalOpen && selectedUser && (
                <ScheduleBiometricModal
                    user={selectedUser}
                    onClose={closeAllModals}
                    onSuccess={handleModalSuccess}
                />
            )}

            {captureModalOpen && selectedUser && (
                <BiometricCaptureModal
                    user={selectedUser}
                    onClose={closeAllModals}
                    onSuccess={handleModalSuccess}
                />
            )}

            {issueModalOpen && selectedUser && (
                <IssueDigitalIDModal
                    user={selectedUser}
                    onClose={closeAllModals}
                    onSuccess={handleModalSuccess}
                />
            )}

            {resolveModalOpen && selectedUser && (
                <DuplicateResolutionModal
                    user={selectedUser}
                    onClose={closeAllModals}
                    onSuccess={handleModalSuccess}
                />
            )}
        </>
    );
}
