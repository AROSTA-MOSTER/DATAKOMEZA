/**
 * Admin Dashboard
 * Refined administrative interface matching design mockup
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import styles from '../../styles/AdminDashboard.module.css';

export default function AdminDashboard() {
    const { user, isAuthenticated, isAdmin, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [pendingUsers, setPendingUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isAdmin)) {
            router.push('/admin/login');
        } else if (isAuthenticated && isAdmin) {
            loadAdminData();
        }
    }, [isAuthenticated, isAdmin, authLoading, router]);

    const loadAdminData = async () => {
        try {
            const [statsRes, usersRes, logsRes, pendingRes] = await Promise.all([
                api.get('/admin/statistics'),
                api.get('/admin/users?limit=10'),
                api.get('/admin/audit-logs?limit=20'),
                api.get('/admin/users/pending')
            ]);

            if (statsRes.data.success) {
                setStats(statsRes.data.data);
            }

            if (usersRes.data.success) {
                setUsers(usersRes.data.data.users);
            }

            if (logsRes.data.success) {
                setAuditLogs(logsRes.data.data);
            }

            if (pendingRes.data.success) {
                setPendingUsers(pendingRes.data.data);
            }
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

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

    const handleCaptureBiometric = async (userId) => {
        try {
            const res = await api.post(`/admin/users/${userId}/capture-biometric`);
            if (res.data.success) {
                alert(`Biometrics captured! MOSIP ID Issued: ${res.data.data.mosipId}`);
                loadAdminData();
            }
        } catch (error) {
            console.error('Error capturing biometrics:', error);
            alert('Failed to capture biometrics');
        }
    };

    const getInitials = (firstName, lastName) => {
        return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
    };

    const mockActivities = [
        { id: 1, text: 'Amina 1 user ago', time: '2 minutes ago' },
        { id: 2, text: 'Registration Datakomeza Consent Datakomeza consent', time: '5 minutes ago' },
        { id: 3, text: 'Amina 1 user ago', time: '12 minutes ago' },
        { id: 4, text: 'Amina 1 user ago', time: '25 minutes ago' },
        { id: 5, text: 'Registration Datakomeza Consent Datakomeza consent', time: '1 hour ago' },
    ];

    if (authLoading || loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    const totalUsers = stats?.total_users || 10234;
    const activeUsers = stats?.active_users || 8456;
    const serviceProviders = stats?.active_service_providers || 45;
    const consents = stats?.active_consents || 15678;

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
                            📋 Verification {pendingUsers.length > 0 && `(${pendingUsers.length})`}
                        </button>
                        <button className={styles.adminNavItem}>
                            👥 Users
                        </button>
                        <button className={styles.adminNavItem}>
                            🏢 Providers
                        </button>
                        <button className={styles.adminNavItem}>
                            📋 Audit
                        </button>
                        <button className={styles.adminNavItem}>
                            ⚙️ Settings
                        </button>
                    </nav>
                </aside>

                {/* Main Content */}
                <main className={styles.adminMain}>
                    <div className={styles.adminHeader}>
                        <h1>{activeTab === 'dashboard' ? 'Dashboard' : 'Verification Queue'}</h1>
                        <button onClick={logout} style={{
                            padding: '0.5rem 1rem',
                            background: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            borderRadius: '8px',
                            color: 'white',
                            cursor: 'pointer'
                        }}>
                            Logout
                        </button>
                    </div>

                    {activeTab === 'dashboard' ? (
                        <>
                            {/* Gradient Stat Cards */}
                            <div className={styles.adminStatsRow}>
                                <div className={styles.gradientStatCard} data-color="purple">
                                    <div className={styles.statIcon}>👥</div>
                                    <div className={styles.statLabel}>TOTAL USERS</div>
                                    <div className={styles.statNumber}>{totalUsers.toLocaleString()}</div>
                                </div>
                                <div className={styles.gradientStatCard} data-color="blue">
                                    <div className={styles.statIcon}>👤</div>
                                    <div className={styles.statLabel}>ACTIVE USERS</div>
                                    <div className={styles.statNumber}>{activeUsers.toLocaleString()}</div>
                                </div>
                                <div className={styles.gradientStatCard} data-color="cyan">
                                    <div className={styles.statIcon}>🏢</div>
                                    <div className={styles.statLabel}>SERVICE PROVIDERS</div>
                                    <div className={styles.statNumber}>{serviceProviders}</div>
                                </div>
                                <div className={styles.gradientStatCard} data-color="purple-alt">
                                    <div className={styles.statIcon}>📋</div>
                                    <div className={styles.statLabel}>CONSENTS</div>
                                    <div className={styles.statNumber}>{consents.toLocaleString()}</div>
                                </div>
                            </div>

                            {/* Recent User Registrations Table */}
                            <div className={styles.tableCard}>
                                <h3>RECENT USER REGISTRATIONS</h3>
                                <table className={styles.adminTable}>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Registration Date</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {users.slice(0, 8).map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className={styles.userCell}>
                                                        <div className={styles.userAvatar}>
                                                            {getInitials(user.first_name, user.last_name)}
                                                        </div>
                                                        <span>{user.first_name} {user.last_name}</span>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={styles.statusBadge} data-status={user.status || 'business'}>
                                                        {user.status || 'Business'}
                                                    </span>
                                                </td>
                                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Analytics Section */}
                            <div className={styles.analyticsSection}>
                                <div className={styles.chartCard}>
                                    <h4>ANALYTICS</h4>
                                    <div className={styles.chartPlaceholder}>
                                        📊 Line Chart (User Growth)
                                    </div>
                                </div>
                                <div className={styles.chartCard}>
                                    <h4>STATISTICS</h4>
                                    <div className={styles.chartPlaceholder}>
                                        📊 Bar Chart
                                    </div>
                                </div>
                                <div className={styles.chartCard}>
                                    <h4>DISTRIBUTION</h4>
                                    <div className={styles.chartPlaceholder}>
                                        📊 Pie Chart
                                    </div>
                                </div>
                            </div>

                            {/* Activity Feed */}
                            <div className={styles.activityFeed}>
                                <h3>
                                    REAL-TIME ACTIVITY FEED
                                    <a href="#" className={styles.viewAllLink}>View All</a>
                                </h3>
                                {mockActivities.map((activity) => (
                                    <div key={activity.id} className={styles.activityItem}>
                                        <p>{activity.text}</p>
                                        <span className={styles.activityTime}>{activity.time}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Audit Logs */}
                            {auditLogs.length > 0 && (
                                <div className={styles.activityFeed} style={{ marginTop: '1.5rem' }}>
                                    <h3>
                                        AUDIT LOGS
                                        <a href="#" className={styles.viewAllLink}>Clear All</a>
                                    </h3>
                                    {auditLogs.slice(0, 5).map((log) => (
                                        <div key={log.id} className={styles.activityItem}>
                                            <p>{log.action.replace(/_/g, ' ').toUpperCase()}</p>
                                            <span className={styles.activityTime}>
                                                {log.user_email && `${log.user_email} • `}
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </>
                    ) : (
                        <div className={styles.tableCard}>
                            <h3>PENDING VERIFICATIONS ({pendingUsers.length})</h3>
                            {pendingUsers.length === 0 ? (
                                <p style={{ color: 'white', opacity: 0.7, padding: '1rem' }}>No pending verifications.</p>
                            ) : (
                                <table className={styles.adminTable}>
                                    <thead>
                                        <tr>
                                            <th>Name</th>
                                            <th>Email</th>
                                            <th>Status</th>
                                            <th>Submitted</th>
                                            <th>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {pendingUsers.map((user) => (
                                            <tr key={user.id}>
                                                <td>
                                                    <div className={styles.userCell}>
                                                        <div className={styles.userAvatar}>
                                                            {getInitials(user.first_name, user.last_name)}
                                                        </div>
                                                        <span>{user.first_name} {user.last_name}</span>
                                                    </div>
                                                </td>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={styles.statusBadge} data-status={user.status}>
                                                        {user.status === 'pending_verification' ? 'Pending' : user.status}
                                                    </span>
                                                </td>
                                                <td>{new Date(user.created_at).toLocaleDateString()}</td>
                                                <td>
                                                    {user.status === 'pending_verification' && (
                                                        <button
                                                            onClick={() => handleApproveBiometric(user.id)}
                                                            className={styles.actionButton}
                                                            style={{
                                                                marginRight: '0.5rem',
                                                                background: '#10b981', // green
                                                                border: 'none',
                                                                padding: '0.25rem 0.75rem',
                                                                borderRadius: '4px',
                                                                color: 'white',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Approve for Biometric
                                                        </button>
                                                    )}
                                                    {user.status === 'approved_for_biometric' && (
                                                        <button
                                                            onClick={() => handleCaptureBiometric(user.id)}
                                                            className={styles.actionButton}
                                                            style={{
                                                                background: '#3b82f6', // blue
                                                                border: 'none',
                                                                padding: '0.25rem 0.75rem',
                                                                borderRadius: '4px',
                                                                color: 'white',
                                                                cursor: 'pointer'
                                                            }}
                                                        >
                                                            Capture & Issue ID
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    )}
                </main>
            </div>
        </>
    );
}
