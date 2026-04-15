/**
 * Base application error class.
 * All custom errors extend this so errorHandler can reliably check instanceof.
 */
class AppError extends Error {
  constructor(message, status) {
    super(message);
    this.name = this.constructor.name;
    this.status = status;
    // Maintains proper stack trace (V8 only)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found') {
    super(message, 404);
  }
}

class ConflictError extends AppError {
  constructor(message = 'Conflict — resource already exists') {
    super(message, 409);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Validation failed') {
    super(message, 400);
  }
}

class GoneError extends AppError {
  constructor(message = 'Resource expired or no longer available') {
    super(message, 410);
  }
}

module.exports = { AppError, NotFoundError, ConflictError, ValidationError, GoneError };
