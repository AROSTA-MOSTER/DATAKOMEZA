/**
 * Resident Portal Page
 * Main page for resident services including VID management and auth controls
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import VirtualIDManager from '../components/VirtualIDManager';
import AuthenticationControls from '../components/AuthenticationControls';
import TransactionHistory from '../components/TransactionHistory';
import styles from '../styles/ResidentPortal.module.css';

export default function ResidentPortal() {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('vids');
    const [userId, setUserId] = useState(null);

    // Check authentication
    useEffect(() => {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!token) {
            router.push('/login');
            return;
        }

        setUserId(user.id);
    }, [router]);

    const tabs = [
        { id: 'vids', label: 'Virtual IDs', icon: '🆔' },
        { id: 'auth', label: 'Authentication', icon: '🔐' },
        { id: 'transactions', label: 'Transactions', icon: '📊' },
        { id: 'services', label: 'Services', icon: '⚙️' }
    ];

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (!userId) {
        return <div className={styles.loading}>Loading...</div>;
    }

    return (
        <div className={styles.container}>
            <Head>
                <title>Resident Portal - DATAKOMEZA</title>
                <meta name="description" content="Manage your digital identity" />
            </Head>

            <div className={styles.header}>
                <div className={styles.headerContent}>
                    <h1>Resident Portal</h1>
                    <p>Manage your digital identity and privacy settings</p>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn}>
                    Logout
                </button>
            </div>

            <div className={styles.tabBar}>
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`${styles.tab} ${activeTab === tab.id ? styles.activeTab : ''}`}
                    >
                        <span className={styles.tabIcon}>{tab.icon}</span>
                        <span className={styles.tabLabel}>{tab.label}</span>
                    </button>
                ))}
            </div>

            <div className={styles.content}>
                {activeTab === 'vids' && <VirtualIDManager userId={userId} />}
                {activeTab === 'auth' && <AuthenticationControls userId={userId} />}
                {activeTab === 'transactions' && <TransactionHistory userId={userId} />}
                {activeTab === 'services' && (
                    <div className={styles.comingSoon}>
                        <h2>Service Requests</h2>
                        <p>Coming soon...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
