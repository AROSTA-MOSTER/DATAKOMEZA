/**
 * Partner Portal Page
 * Main page for partner management
 */

import { useState } from 'react';
import Head from 'next/head';
import PartnerRegistration from '../components/PartnerRegistration';
import PartnerDashboard from '../components/PartnerDashboard';
import styles from '../styles/PartnerPortal.module.css';

export default function PartnerPortal() {
    const [view, setView] = useState('register'); // 'register' or 'dashboard'
    const [partnerId, setPartnerId] = useState(null);

    return (
        <div className={styles.container}>
            <Head>
                <title>Partner Portal - DATAKOMEZA</title>
                <meta name="description" content="Partner integration portal" />
            </Head>

            <div className={styles.header}>
                <h1>Partner Management Portal</h1>
                <div className={styles.nav}>
                    <button
                        onClick={() => setView('register')}
                        className={view === 'register' ? styles.activeNav : ''}
                    >
                        Register
                    </button>
                    <button
                        onClick={() => setView('dashboard')}
                        className={view === 'dashboard' ? styles.activeNav : ''}
                        disabled={!partnerId}
                    >
                        Dashboard
                    </button>
                </div>
            </div>

            <div className={styles.content}>
                {view === 'register' && <PartnerRegistration />}
                {view === 'dashboard' && partnerId && <PartnerDashboard partnerId={partnerId} />}
            </div>
        </div>
    );
}
