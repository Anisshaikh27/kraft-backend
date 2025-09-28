// Global error handling middleware

const errorHandler = (err, req, res, next) => {
  // Log error details
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Default error response
  let error = {
    message: 'Internal server error',
    status: 500,
    type: 'ServerError'
  };

  // Handle specific error types
  if (err.name === 'ValidationError') {
    error = {
      message: 'Validation failed',
      status: 400,
      type: 'ValidationError',
      details: err.details || err.message
    };
  } else if (err.name === 'CastError') {
    error = {
      message: 'Invalid data format',
      status: 400,
      type: 'CastError'
    };
  } else if (err.code === 11000) {
    error = {
      message: 'Duplicate field value',
      status: 400,
      type: 'DuplicateError'
    };
  } else if (err.name === 'JsonWebTokenError') {
    error = {
      message: 'Invalid token',
      status: 401,
      type: 'AuthError'
    };
  } else if (err.name === 'TokenExpiredError') {
    error = {
      message: 'Token expired',
      status: 401,
      type: 'AuthError'
    };
  } else if (err.status) {
    error = {
      message: err.message,
      status: err.status,
      type: err.type || 'CustomError'
    };
  }

  // Handle AI service specific errors
  if (err.message?.includes('rate limit')) {
    error = {
      message: 'Rate limit exceeded. Please try again later.',
      status: 429,
      type: 'RateLimitError',
      retryAfter: 60 // seconds
    };
  } else if (err.message?.includes('API key')) {
    error = {
      message: 'AI service authentication failed',
      status: 503,
      type: 'ServiceError'
    };
  } else if (err.message?.includes('unavailable')) {
    error = {
      message: 'AI service temporarily unavailable',
      status: 503,
      type: 'ServiceError'
    };
  }

  // Add request ID for tracking
  const requestId = req.headers['x-request-id'] || generateRequestId();

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: error.message,
      type: error.type,
      requestId: requestId,
      timestamp: new Date().toISOString()
    }
  };

  // Add additional fields for non-production environments
  if (process.env.NODE_ENV !== 'production') {
    errorResponse.error.stack = err.stack;
    errorResponse.error.details = err.details;
  }

  // Add retry-after header for rate limiting
  if (error.status === 429 && error.retryAfter) {
    res.set('Retry-After', error.retryAfter);
  }

  // Add CORS headers for errors
  res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-session-id');

  // Send error response
  res.status(error.status).json(errorResponse);
};

// Handle 404 errors (not found)
const notFoundHandler = (req, res, next) => {
  const error = new Error(`Endpoint not found - ${req.method} ${req.originalUrl}`);
  error.status = 404;
  error.type = 'NotFoundError';
  next(error);
};

// Handle async route errors
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Generate unique request ID
const generateRequestId = () => {
  return 'req_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
};

// Request timeout middleware
const timeoutHandler = (timeout = 30000) => {
  return (req, res, next) => {
    // Set timeout for the request
    const timer = setTimeout(() => {
      const error = new Error('Request timeout');
      error.status = 408;
      error.type = 'TimeoutError';
      next(error);
    }, timeout);

    // Clear timeout when response finishes
    res.on('finish', () => {
      clearTimeout(timer);
    });

    // Clear timeout when response closes
    res.on('close', () => {
      clearTimeout(timer);
    });

    next();
  };
};

// Request logging middleware
const requestLogger = (req, res, next) => {
  req.startTime = Date.now();
  
  const originalSend = res.send;
  res.send = function(body) {
    const duration = Date.now() - req.startTime;
    
    console.log(`${req.method} ${req.url} - ${res.statusCode} - ${duration}ms`);
    
    originalSend.call(this, body);
  };

  next();
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  if (Array.isArray(errors)) {
    return errors.map(err => ({
      field: err.path || err.param,
      message: err.message || err.msg,
      value: err.value
    }));
  }

  if (errors.details) {
    return errors.details.map(err => ({
      field: err.path.join('.'),
      message: err.message,
      value: err.context?.value
    }));
  }

  return [{ message: 'Validation failed' }];
};

// Custom error classes
class APIError extends Error {
  constructor(message, status = 500, type = 'APIError') {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    this.type = type;
    this.timestamp = new Date().toISOString();
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class ValidationError extends APIError {
  constructor(message, details = null) {
    super(message, 400, 'ValidationError');
    this.details = details;
  }
}

class AuthenticationError extends APIError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AuthenticationError');
  }
}

class AuthorizationError extends APIError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AuthorizationError');
  }
}

class NotFoundError extends APIError {
  constructor(message = 'Resource not found') {
    super(message, 404, 'NotFoundError');
  }
}

class RateLimitError extends APIError {
  constructor(message = 'Rate limit exceeded', retryAfter = 60) {
    super(message, 429, 'RateLimitError');
    this.retryAfter = retryAfter;
  }
}

class ServiceUnavailableError extends APIError {
  constructor(message = 'Service temporarily unavailable') {
    super(message, 503, 'ServiceUnavailableError');
  }
}

module.exports = {
  errorHandler,
  notFoundHandler,
  asyncHandler,
  timeoutHandler,
  requestLogger,
  formatValidationErrors,
  
  // Error classes
  APIError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  RateLimitError,
  ServiceUnavailableError
};