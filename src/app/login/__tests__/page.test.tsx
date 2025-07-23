import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../page';
import { useAuth } from '@/hooks/use-auth';

// Mock the useAuth hook
jest.mock('@/hooks/use-auth', () => ({
  useAuth: jest.fn(),
}));

// Mock the next/navigation router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  const mockLogin = jest.fn();

  beforeEach(() => {
    (useAuth as jest.Mock).mockReturnValue({
      login: mockLogin,
      user: null,
      isLoading: false,
    });
    jest.clearAllMocks();
  });

  it('renders the login form with demo mode active by default', () => {
    render(<LoginPage />);
    expect(screen.getByRole('heading', { name: /SignalCX/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Demo Access/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login as Manager/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Login as Agent/i })).toBeInTheDocument();
  });

  it('switches to live mode when the switch is clicked', () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByLabelText(/Live/i));
    expect(screen.getByRole('heading', { name: /Welcome Back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/Username or Email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('calls the login function with manager credentials in demo mode', async () => {
    render(<LoginPage />);
    const managerButton = screen.getByRole('button', { name: /Login as Manager/i });
    fireEvent.click(managerButton);
    expect(mockLogin).toHaveBeenCalledWith('manager@example.com', 'demo', undefined);
  });

  it('calls the login function with agent credentials in demo mode', async () => {
    render(<LoginPage />);
    const agentButton = screen.getByRole('button', { name: /Login as Agent/i });
    fireEvent.click(agentButton);
    expect(mockLogin).toHaveBeenCalledWith('agent@example.com', 'demo', undefined);
  });
});
