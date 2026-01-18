/**
 * Transaction History Component
 * Displays user's transaction history with filtering
 */

import { useState, useEffect } from 'react';
import axios from 'axios';
import styles from '../styles/TransactionHistory.module.css';

const TransactionHistory = ({ userId }) => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all');

    const categories = [
        { value: 'all', label: 'All Transactions', icon: '📊' },
        { value: 'authentication', label: 'Authentication', icon: '🔐' },
        { value: 'data_share', label: 'Data Sharing', icon: '🤝' },
        { value: 'service_request', label: 'Service Requests', icon: '⚙️' },
        { value: 'vid_operation', label: 'VID Operations', icon: '🆔' },
        { value: 'card_operation', label: 'Card Operations', icon: '💳' }
    ];

    useEffect(() => {
        loadTransactions();
    }, [userId, filter]);

    const loadTransactions = async () => {
        try {
            setLoading(true);
            setError('');

            const token = localStorage.getItem('token');
            const url = filter === 'all'
                ? `${process.env.NEXT_PUBLIC_API_URL}/api/resident/transactions/${userId}`
                : `${process.env.NEXT_PUBLIC_API_URL}/api/resident/transactions/${userId}?category=${filter}`;

            const response = await axios.get(url, {
                headers: { Authorization: `Bearer ${token}` }
            });

            setTransactions(response.data.data);
        } catch (err) {
            setError('Failed to load transaction history');
        } finally {
            setLoading(false);
        }
    };

    const getCategoryIcon = (category) => {
        const cat = categories.find(c => c.value === category);
        return cat ? cat.icon : '📄';
    };

    const getStatusColor = (status) => {
        switch (status?.toLowerCase()) {
            case 'success':
            case 'completed':
                return '#10b981';
            case 'pending':
                return '#f59e0b';
            case 'failed':
            case 'rejected':
                return '#ef4444';
            default:
                return '#6b7280';
        }
    };

    return (
        <div className={styles.transactionHistory}>
            <div className={styles.header}>
                <h2>Transaction History</h2>
                <p className={styles.subtitle}>View all your activity and transactions</p>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            <div className={styles.filterBar}>
                {categories.map((category) => (
                    <button
                        key={category.value}
                        onClick={() => setFilter(category.value)}
                        className={`${styles.filterBtn} ${filter === category.value ? styles.activeFilter : ''}`}
                    >
                        <span className={styles.filterIcon}>{category.icon}</span>
                        <span className={styles.filterLabel}>{category.label}</span>
                    </button>
                ))}
            </div>

            <div className={styles.transactionList}>
                {loading && <div className={styles.loading}>Loading transactions...</div>}

                {!loading && transactions.length === 0 && (
                    <div className={styles.empty}>
                        <p>No transactions found</p>
                        <p className={styles.hint}>Your activity will appear here</p>
                    </div>
                )}

                {!loading && transactions.map((transaction) => (
                    <div key={transaction.transaction_id} className={styles.transactionCard}>
                        <div className={styles.transactionHeader}>
                            <div className={styles.iconType}>
                                <span className={styles.categoryIcon}>
                                    {getCategoryIcon(transaction.transaction_category)}
                                </span>
                                <div className={styles.typeInfo}>
                                    <h3>{transaction.transaction_type.replace(/_/g, ' ')}</h3>
                                    <span className={styles.category}>
                                        {transaction.transaction_category?.replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                            {transaction.status && (
                                <span
                                    className={styles.statusBadge}
                                    style={{ backgroundColor: getStatusColor(transaction.status) }}
                                >
                                    {transaction.status}
                                </span>
                            )}
                        </div>

                        {transaction.description && (
                            <p className={styles.description}>{transaction.description}</p>
                        )}

                        <div className={styles.transactionFooter}>
                            <span className={styles.transactionId}>
                                ID: {transaction.transaction_id}
                            </span>
                            <span className={styles.timestamp}>
                                {new Date(transaction.created_at).toLocaleString()}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            {!loading && transactions.length > 0 && (
                <div className={styles.pagination}>
                    <p>Showing {transactions.length} transactions</p>
                </div>
            )}
        </div>
    );
};

export default TransactionHistory;
