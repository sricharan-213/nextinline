// Silence console logs and errors during tests to keep output clean.
// Using spyOn to allow restoring if needed, though forceExit is used.

beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'log').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
