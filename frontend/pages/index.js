/**
 * Home Page
 * Landing page for DATAKOMEZA platform
 */

import Head from 'next/head';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import styles from '../styles/Home.module.css';

export default function Home() {
    const { isAuthenticated, user } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isAuthenticated) {
            if (user?.isAdmin) {
                router.push('/admin/dashboard');
            } else {
                router.push('/dashboard');
            }
        }
    }, [isAuthenticated, user, router]);

    return (
        <>
            <Head>
                <title>DATAKOMEZA - Digital Identity for Refugees</title>
                <meta name="description" content="Privacy-preserving digital identity platform for refugees and asylum seekers in Africa" />
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
            </Head>

            {/* Hero Section */}
            <section className={styles.hero}>
                <div className={styles.heroContent}>
                    <div className={styles.quantumBadge}>
                        Post-Quantum Security Enabled
                    </div>
                    <h1 className={styles.title}>
                        DATAKOMEZA
                    </h1>
                    <p className={styles.subtitle}>
                        Secure, privacy-preserving digital identity platform for refugees and asylum seekers in Africa.
                        Access healthcare, education, and humanitarian services with confidence.
                    </p>
                    <div className={styles.ctaButtons}>
                        <Link href="/register" className={styles.btnPrimary}>
                            Get Started →
                        </Link>
                        <Link href="/login" className={styles.btnSecondary}>
                            Sign In
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section className={styles.features}>
                <div className={styles.featuresContainer}>
                    <h2 className={styles.sectionTitle}>Why Choose DATAKOMEZA?</h2>
                    <p className={styles.sectionSubtitle}>
                        Built with cutting-edge technology to protect your identity and empower your future
                    </p>
                    <div className={styles.featuresGrid}>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🔒</span>
                            <h3 className={styles.featureTitle}>Privacy First</h3>
                            <p className={styles.featureDescription}>
                                End-to-end encryption with post-quantum cryptography ensures your sensitive data remains private and secure.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🤝</span>
                            <h3 className={styles.featureTitle}>Consent-Based</h3>
                            <p className={styles.featureDescription}>
                                You control what information you share and with whom. Revoke access anytime with a single click.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>📱</span>
                            <h3 className={styles.featureTitle}>Offline Ready</h3>
                            <p className={styles.featureDescription}>
                                QR code and PIN-based authentication works even without internet connection.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🏥</span>
                            <h3 className={styles.featureTitle}>Healthcare Access</h3>
                            <p className={styles.featureDescription}>
                                Securely share medical information with healthcare providers while maintaining full control.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>📚</span>
                            <h3 className={styles.featureTitle}>Education Services</h3>
                            <p className={styles.featureDescription}>
                                Access educational programs and vocational training opportunities to build your future.
                            </p>
                        </div>
                        <div className={styles.featureCard}>
                            <span className={styles.featureIcon}>🌍</span>
                            <h3 className={styles.featureTitle}>Humanitarian Aid</h3>
                            <p className={styles.featureDescription}>
                                Connect with NGOs and humanitarian organizations for essential assistance.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className={styles.stats}>
                <div className={styles.statsGrid}>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>10K+</div>
                        <div className={styles.statLabel}>Refugees Registered</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>50+</div>
                        <div className={styles.statLabel}>Service Providers</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>99.9%</div>
                        <div className={styles.statLabel}>Uptime</div>
                    </div>
                    <div className={styles.statCard}>
                        <div className={styles.statNumber}>24/7</div>
                        <div className={styles.statLabel}>Support</div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className={styles.cta}>
                <div className={styles.ctaContent}>
                    <h2 className={styles.ctaTitle}>Ready to Get Started?</h2>
                    <p className={styles.ctaText}>
                        Join thousands of refugees who have already secured their digital identity with DATAKOMEZA.
                    </p>
                    <div className={styles.ctaButtons}>
                        <Link href="/register" className={styles.btnPrimary}>
                            Create Your Identity →
                        </Link>
                    </div>
                </div>
            </section>
        </>
    );
}
