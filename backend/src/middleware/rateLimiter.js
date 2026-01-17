/**
 * Rate Limiting Middleware
 * Protects against brute force and DDoS attacks
 */

const rateLimit = require('express-rate-limit');
const { logger } = require('../utils/logger');

/**
 * General API rate limiter
 * 100 requests per 15 minutes per IP
 */
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        success: false,
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    handler: (req, res) => {
        logger.warn('Rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            method: req.method
        });
        res.status(429).json({
            success: false,
            message: 'Too many requests, please try again later.'
        });
    }
});

/**
 * Strict rate limiter for authentication endpoints
 * 5 attempts per 15 minutes per IP
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 login attempts per windowMs
    skipSuccessfulRequests: true, // Don't count successful requests
    message: {
        success: false,
        message: 'Too many login attempts, please try again after 15 minutes.'
    },
    handler: (req, res) => {
        logger.warn('Auth rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            identifier: req.body.identifier || req.body.email
        });
        res.status(429).json({
            success: false,
            message: 'Too many login attempts. Please try again after 15 minutes.'
        });
    }
});

/**
 * Rate limiter for MOSIP operations
 * 10 operations per hour per IP
 */
const mosipLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 10, // Limit each IP to 10 MOSIP operations per hour
    message: {
        success: false,
        message: 'MOSIP operation limit reached. Please try again later.'
    },
    handler: (req, res) => {
        logger.warn('MOSIP rate limit exceeded', {
            ip: req.ip,
            path: req.path,
            userId: req.user?.userId
        });
        res.status(429).json({
            success: false,
            message: 'MOSIP operation limit reached. Please try again in an hour.'
        });
    }
});

/**
 * Rate limiter for registration
 * 3 registrations per hour per IP
 */
const registrationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 registrations per hour
    message: {
        success: false,
        message: 'Registration limit reached. Please try again later.'
    },
    handler: (req, res) => {
        logger.warn('Registration rate limit exceeded', {
            ip: req.ip,
            email: req.body.email
        });
        res.status(429).json({
            success: false,
            message: 'Too many registration attempts. Please try again in an hour.'
        });
    }
});

module.exports = {
    apiLimiter,
    authLimiter,
    mosipLimiter,
    registrationLimiter
};
