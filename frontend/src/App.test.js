import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Login from './Login/Login';

test('renders the login form', () => {
  render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Login />
    </MemoryRouter>
  );

  expect(screen.getByLabelText(/user name/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument();
});
