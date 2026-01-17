/**
 * Authentication Context
 * Manages user authentication state across the application
 */

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import api from '../utils/api';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in on mount
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');

        if (token && userData) {
            setUser(JSON.parse(userData));
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }

        setLoading(false);
    }, []);

    const login = async (identifier, pin) => {
        try {
            const response = await api.post('/auth/login', { identifier, pin });

            if (response.data.success) {
                const { user, token } = response.data.data;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                setUser(user);
                return { success: true };
            }

            return { success: false, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed'
            };
        }
    };

    const register = async (userData) => {
        try {
            const response = await api.post('/auth/register', userData);

            if (response.data.success) {
                const { user, token } = response.data.data;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify(user));
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                setUser(user);
                return { success: true };
            }

            return { success: false, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed'
            };
        }
    };

    const adminLogin = async (email, password) => {
        try {
            const response = await api.post('/auth/admin/login', { email, password });

            if (response.data.success) {
                const { admin, token } = response.data.data;

                localStorage.setItem('token', token);
                localStorage.setItem('user', JSON.stringify({ ...admin, isAdmin: true }));
                api.defaults.headers.common['Authorization'] = `Bearer ${token}`;

                setUser({ ...admin, isAdmin: true });
                return { success: true };
            }

            return { success: false, message: response.data.message };
        } catch (error) {
            return {
                success: false,
                message: error.response?.data?.message || 'Admin login failed'
            };
        }
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        delete api.defaults.headers.common['Authorization'];
        setUser(null);
        router.push('/');
    };

    const value = {
        user,
        loading,
        login,
        register,
        adminLogin,
        logout,
        isAuthenticated: !!user,
        isAdmin: user?.isAdmin || false
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};
