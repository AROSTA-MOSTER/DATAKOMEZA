/**
 * Admin Dashboard
 * Administrative interface for managing the platform
 */

import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';
import styles from '../../styles/Dashboard.module.css';

export default function AdminDashboard() {
    const { user, isAuthenticated, isAdmin, loading: authLoading, logout } = useAuth();
    const router = useRouter();
    const [stats, setStats] = useState(null);
    const [users, setUsers] = useState([]);
    const [auditLogs, setAuditLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        if (!authLoading && (!isAuthenticated || !isAdmin)) {
            router.push('/admin/login');
        } else if (isAuthenticated && isAdmin) {
            loadAdminData();
        }
    }, [isAuthenticated, isAdmin, authLoading, router]);

    const loadAdminData = async () => {
        try {
            const [statsRes, usersRes, logsRes] = await Promise.all([
                api.get('/admin/statistics'),
                api.get('/admin/users?limit=10'),
                api.get('/admin/audit-logs?limit=20')
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
        } catch (error) {
            console.error('Error loading admin data:', error);
        } finally {
            setLoading(false);
        }
    };

    if (authLoading || loading) {
        return (
            <div className="loading">
                <div className="spinner"></div>
            </div>
        );
    }

    return (
        <>
            <Head>
                <title>Admin Dashboard - DATAKOMEZA</title>
            </Head>

            <div className={styles.dashboard}>
                <header className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1>DATAKOMEZA Admin</h1>
                        <div className={styles.headerActions}>
                            <span className="text-muted">
                                {user?.fullName || user?.email}
                            </span>
                            <button onClick={logout} className="btn btn-secondary btn-sm">
                                Logout
                            </button>
                        </div>
                    </div>
                </header>

                <div className={styles.container}>
                    <aside className={styles.sidebar}>
                        <nav className={styles.nav}>
                            <button
                                className={activeTab === 'overview' ? styles.navItemActive : styles.navItem}
                                onClick={() => setActiveTab('overview')}
                            >
                                📊 Overview
                            </button>
                            <button
                                className={activeTab === 'users' ? styles.navItemActive : styles.navItem}
                                onClick={() => setActiveTab('users')}
                            >
                                👥 Users
                            </button>
                            <button
                                className={activeTab === 'audit' ? styles.navItemActive : styles.navItem}
                                onClick={() => setActiveTab('audit')}
                            >
                                📝 Audit Logs
                            </button>
                        </nav>
                    </aside>

                    <main className={styles.main}>
                        {activeTab === 'overview' && stats && (
                            <div className="fade-in">
                                <h2>Platform Statistics</h2>
                                <div className="grid grid-4 gap-2 mt-2">
                                    <div className="card">
                                        <h3>Total Users</h3>
                                        <p className={styles.statValue}>{stats.total_users}</p>
                                    </div>
                                    <div className="card">
                                        <h3>Active Users</h3>
                                        <p className={styles.statValue}>{stats.active_users}</p>
                                    </div>
                                    <div className="card">
                                        <h3>Service Providers</h3>
                                        <p className={styles.statValue}>{stats.active_service_providers}</p>
                                    </div>
                                    <div className="card">
                                        <h3>Active Consents</h3>
                                        <p className={styles.statValue}>{stats.active_consents}</p>
                                    </div>
                                </div>

                                <div className="grid grid-2 gap-2 mt-2">
                                    <div className="card">
                                        <h3>Authentication Stats (24h)</h3>
                                        <p className="text-muted">Last 24 hours</p>
                                        <p className={styles.statValue}>{stats.authentications_24h}</p>
                                    </div>
                                    <div className="card">
                                        <h3>Success Rate</h3>
                                        <p className="text-muted">All time</p>
                                        <p className={styles.statValue}>
                                            {stats.successful_authentications && stats.failed_authentications
                                                ? Math.round((stats.successful_authentications / (stats.successful_authentications + stats.failed_authentications)) * 100)
                                                : 0}%
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'users' && (
                            <div className="fade-in">
                                <h2>Recent Users</h2>
                                <div className="card mt-2">
                                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                        <thead>
                                            <tr style={{ borderBottom: '2px solid var(--border)' }}>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Name</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Email</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>MOSIP ID</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Status</th>
                                                <th style={{ padding: '1rem', textAlign: 'left' }}>Registered</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <tr key={user.id} style={{ borderBottom: '1px solid var(--border)' }}>
                                                    <td style={{ padding: '1rem' }}>{user.first_name} {user.last_name}</td>
                                                    <td style={{ padding: '1rem' }}>{user.email}</td>
                                                    <td style={{ padding: '1rem' }}>{user.mosip_id}</td>
                                                    <td style={{ padding: '1rem' }}>
                                                        <span className="badge badge-success">{user.status}</span>
                                                    </td>
                                                    <td style={{ padding: '1rem' }}>
                                                        {new Date(user.created_at).toLocaleDateString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {activeTab === 'audit' && (
                            <div className="fade-in">
                                <h2>Audit Logs</h2>
                                <div className="mt-2">
                                    {auditLogs.map((log) => (
                                        <div key={log.id} className="card mb-2">
                                            <div className="flex-between">
                                                <div>
                                                    <h4>{log.action.replace(/_/g, ' ').toUpperCase()}</h4>
                                                    <p className="text-muted">
                                                        {log.user_email && `User: ${log.user_email} • `}
                                                        {new Date(log.created_at).toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <span className="badge badge-primary">{log.resource_type || 'system'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </main>
                </div>
            </div>
        </>
    );
}
