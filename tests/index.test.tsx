// tests/index.test.tsx
import { render, waitFor } from '@testing-library/react-native';
import React from 'react';

// Mock expo-router
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// Mock storageService
const mockGetAccessToken = jest.fn();
const mockGetUserCountry = jest.fn();
jest.mock('../app/services/storageService', () => ({
  getAccessToken: jest.fn().mockImplementation((...args) => mockGetAccessToken(...args)),
  getUserCountry: jest.fn().mockImplementation((...args) => mockGetUserCountry(...args)),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(() => Promise.resolve('en')),
  setItem: jest.fn(() => Promise.resolve()),
  removeItem: jest.fn(() => Promise.resolve()),
}));

// Import component after mocks
import IndexPage from '../app/index';

describe('IndexPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('redirects to home when token exists', async () => {
    mockGetAccessToken.mockResolvedValueOnce('valid-token');

    render(<IndexPage />);

    await waitFor(() => {
      expect(mockGetAccessToken).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/home');
    });
  });

  it('redirects to login when no token exists', async () => {
    mockGetAccessToken.mockResolvedValueOnce(null);

    render(<IndexPage />);

    await waitFor(() => {
      expect(mockGetAccessToken).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('displays loading indicator initially', () => {
    mockGetAccessToken.mockImplementation(() => new Promise(() => {})); // Never resolves

    const { getByText } = render(<IndexPage />);

    expect(getByText('Cargando...')).toBeTruthy();
  });

  it('handles token check error gracefully', async () => {
    mockGetAccessToken.mockRejectedValueOnce(new Error('Storage error'));

    render(<IndexPage />);

    await waitFor(() => {
      expect(mockGetAccessToken).toHaveBeenCalled();
    });

    // Should redirect to login on error
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });
});
