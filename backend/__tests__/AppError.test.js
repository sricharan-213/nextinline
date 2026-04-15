const { AppError, NotFoundError, ConflictError, ValidationError, GoneError } = require('../utils/AppError');

describe('AppError hierarchy', () => {
  test('AppError sets message, status, and name', () => {
    const err = new AppError('test error', 418);
    expect(err.message).toBe('test error');
    expect(err.status).toBe(418);
    expect(err.name).toBe('AppError');
    expect(err instanceof Error).toBe(true);
    expect(err instanceof AppError).toBe(true);
  });

  test('NotFoundError has status 404', () => {
    const err = new NotFoundError('not found');
    expect(err.status).toBe(404);
    expect(err.name).toBe('NotFoundError');
    expect(err instanceof AppError).toBe(true);
  });

  test('ConflictError has status 409', () => {
    const err = new ConflictError('conflict');
    expect(err.status).toBe(409);
    expect(err.name).toBe('ConflictError');
  });

  test('ValidationError has status 400', () => {
    const err = new ValidationError('bad input');
    expect(err.status).toBe(400);
    expect(err.name).toBe('ValidationError');
  });

  test('GoneError has status 410', () => {
    const err = new GoneError('expired');
    expect(err.status).toBe(410);
    expect(err.name).toBe('GoneError');
  });

  test('Default messages are set when no message provided', () => {
    expect(new NotFoundError().message).toBe('Resource not found');
    expect(new ConflictError().message).toBe('Conflict — resource already exists');
    expect(new ValidationError().message).toBe('Validation failed');
    expect(new GoneError().message).toBe('Resource expired or no longer available');
  });
});
