/**
 * Error Handler Middleware
 * Centralized error handling for the application
 */

const { logger } = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    // Log error
    logger.error('Error occurred:', {
        message: err.message,
        stack: err.stack,
        path: req.path,
        method: req.method
    });

    // Default error
    let statusCode = err.statusCode || 500;
    let message = err.message || 'Internal server error';

    // Handle specific error types
    if (err.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validation error';
    } else if (err.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Unauthorized';
    } else if (err.code === '23505') { // PostgreSQL unique violation
        statusCode = 409;
        message = 'Resource already exists';
    } else if (err.code === '23503') { // PostgreSQL foreign key violation
        statusCode = 400;
        message = 'Invalid reference';
    }

    // Send error response
    res.status(statusCode).json({
        success: false,
        message,
        ...(process.env.NODE_ENV === 'development' && {
            error: err.message,
            stack: err.stack
        })
    });
};

module.exports = errorHandler;
