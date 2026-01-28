/**
 * FloatingParticles Component
 * Animated background with floating glowing orbs
 */

import styles from './FloatingParticles.module.css';

export default function FloatingParticles() {
    return (
        <div className={styles.particlesContainer}>
            <div className={styles.particle} data-color="purple"></div>
            <div className={styles.particle} data-color="pink"></div>
            <div className={styles.particle} data-color="blue"></div>
            <div className={styles.particle} data-color="cyan"></div>
            <div className={styles.particle} data-color="purple-alt"></div>
            <div className={styles.particle} data-color="pink-alt"></div>
        </div>
    );
}
