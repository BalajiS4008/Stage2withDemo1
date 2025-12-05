import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(() => JSON.stringify({
    user: { id: '1', username: 'testuser', role: 'admin' }
  })),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock;

// Mock alert, confirm, prompt
global.alert = vi.fn();
global.confirm = vi.fn(() => true);
global.prompt = vi.fn();

// Mock console methods to reduce noise in tests (optional)
global.console = {
  ...console,
  error: vi.fn(),
  warn: vi.fn(),
  log: vi.fn(),
};

// Mock AuthContext
vi.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'testuser', role: 'admin' },
    login: vi.fn(),
    logout: vi.fn(),
    isAdmin: () => true
  }),
  AuthProvider: ({ children }) => children
}));

// Mock ThemeContext
vi.mock('../context/ThemeContext', () => ({
  useTheme: () => ({
    isDarkMode: false,
    toggleTheme: vi.fn()
  }),
  ThemeProvider: ({ children }) => children
}));
