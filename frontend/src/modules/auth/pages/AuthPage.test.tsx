import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { AuthProvider } from '../context/AuthProvider.tsx';
import AuthPage from './AuthPage';

const authServiceMocks = vi.hoisted(() => ({
  login: vi.fn(),
  register: vi.fn(),
  checkAvailability: vi.fn(),
  logout: vi.fn(),
  refresh: vi.fn(),
  getCurrentUser: vi.fn(),
  readStoredUser: vi.fn(() => null),
  storeUser: vi.fn(),
  getErrorMessage: vi.fn(() => 'No se pudo iniciar sesión.'),
}));

vi.mock('../services/authService', () => ({
  authService: authServiceMocks,
}));

function renderAuthPage() {
  return render(
    <MemoryRouter>
      <AuthProvider>
        <AuthPage />
      </AuthProvider>
    </MemoryRouter>,
  );
}

function fillRegistrationForm(data: {
  name: string;
  nickname: string;
  email: string;
  password: string;
}) {
  fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));
  fireEvent.change(screen.getByLabelText(/^Nombre completo/), { target: { value: data.name } });
  fireEvent.change(screen.getByLabelText(/^Nombre de usuario/), { target: { value: data.nickname } });
  fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: data.email } });
  fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: data.password } });
  fireEvent.click(screen.getByRole('checkbox'));
}

describe('AuthPage', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  test('switches between login and registration forms', () => {
    renderAuthPage();

    expect(screen.getByLabelText(/^Email/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Nombre completo/)).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));

    expect(screen.getByLabelText(/^Nombre completo/)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Nombre de usuario/)).toBeInTheDocument();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
  });

  test('submits login credentials through the auth context', async () => {
    authServiceMocks.login.mockResolvedValue({
      id: 7,
      name: 'Ana',
      nickname: 'ana',
      email: 'ana@example.com',
      role: 'USER',
    });
    renderAuthPage();

    fireEvent.change(screen.getByLabelText(/^Email/), { target: { value: 'ana@example.com' } });
    fireEvent.change(screen.getByLabelText(/^Contraseña/), { target: { value: 'secure-password' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Iniciar sesión' })[1]);

    await waitFor(() => {
      expect(authServiceMocks.login).toHaveBeenCalledWith({
        email: 'ana@example.com',
        password: 'secure-password',
      });
    });
  });

  test('shows availability error before opening the leveling dialog when email or nickname is taken', async () => {
    const conflictError = new Error('Conflict');
    authServiceMocks.checkAvailability.mockRejectedValue(conflictError);
    authServiceMocks.getErrorMessage.mockReturnValue('El nombre de usuario ya está en uso.');
    renderAuthPage();

    fillRegistrationForm({
      name: 'Carlos Gómez',
      nickname: 'carlosg',
      email: 'carlos@example.com',
      password: 'password123',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('El nombre de usuario ya está en uso.');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(authServiceMocks.register).not.toHaveBeenCalled();
  });

  test('completes registration directly for a first-time player and keeps email on login', async () => {
    authServiceMocks.checkAvailability.mockResolvedValue(undefined);
    authServiceMocks.register.mockResolvedValue(undefined);
    renderAuthPage();

    fillRegistrationForm({
      name: 'Carlos Gómez',
      nickname: 'carlosg',
      email: 'carlos@example.com',
      password: 'password123',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    await waitFor(() => {
      expect(authServiceMocks.checkAvailability).toHaveBeenCalledWith('carlos@example.com', 'carlosg');
    });

    // Initial leveling modal opens on first-time check
    expect(await screen.findByRole('dialog')).toHaveTextContent('Antes de crear tu cuenta ¿Es la primera vez que juegas al padel?');
    const continueButton = screen.getByRole('button', { name: 'CONTINUAR →' });
    expect(continueButton).toBeDisabled();

    fireEvent.click(screen.getByText('Sí, es mi primera vez'));
    fireEvent.click(screen.getByRole('button', { name: 'FINALIZAR REGISTRO' }));

    await waitFor(() => {
      expect(authServiceMocks.register).toHaveBeenCalledWith({
        name: 'Carlos Gómez',
        nickname: 'carlosg',
        email: 'carlos@example.com',
        password: 'password123',
        firstTimePlayer: true,
        levelingAnswers: undefined,
      });
    });

    // Switches back to login keeping the registered email prefilled
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Inicia sesión' })).toBeInTheDocument();
    expect(screen.getByLabelText(/^Email/)).toHaveValue('carlos@example.com');
  }, 15_000,
  );

  test('completes the 5-question wizard for an experienced player and resets registration fields', async () => {
    authServiceMocks.checkAvailability.mockResolvedValue(undefined);
    authServiceMocks.register.mockResolvedValue(undefined);
    renderAuthPage();

    fillRegistrationForm({
      name: 'Laura Díaz',
      nickname: 'laurad',
      email: 'laura@example.com',
      password: 'password123',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    // Choose experienced player path
    fireEvent.click(await screen.findByText('No, ya he jugado antes'));
    fireEvent.click(screen.getByRole('button', { name: 'CONTINUAR →' }));

    // Question 1 (score 2)
    expect(screen.getByText('Pregunta 1 de 5')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Juego con regularidad (al menos 1 vez por semana) partidos amistosos.'));
    fireEvent.click(screen.getByRole('button', { name: 'SIGUIENTE PREGUNTA →' }));

    // Question 2 (score 3)
    expect(screen.getByText('Pregunta 2 de 5')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Controlo dirección, profundidad y globos defensivos con comodidad.'));
    fireEvent.click(screen.getByRole('button', { name: 'SIGUIENTE PREGUNTA →' }));

    // Question 3 (score 2)
    expect(screen.getByText('Pregunta 3 de 5')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Defiendo bien la pared de fondo y empiezo a resolver rebotes en pared lateral.'));
    fireEvent.click(screen.getByRole('button', { name: 'SIGUIENTE PREGUNTA →' }));

    // Question 4 (score 1)
    expect(screen.getByText('Pregunta 4 de 5')).toBeInTheDocument();
    fireEvent.click(screen.getByText('Subo a la red en ocasiones, pero voleo sin control ni profundidad.'));
    fireEvent.click(screen.getByRole('button', { name: 'SIGUIENTE PREGUNTA →' }));

    // Question 5 (score 2)
    expect(screen.getByText('Pregunta 5 de 5')).toBeInTheDocument();
    const finishButton = screen.getByRole('button', { name: 'FINALIZAR REGISTRO' });
    expect(finishButton).toBeDisabled();
    fireEvent.click(screen.getByText('Subo a la red tras el saque y mantengo la posición en paralelo con mi compañero.'));
    expect(finishButton).toBeEnabled();
    fireEvent.click(finishButton);

    await waitFor(() => {
      expect(authServiceMocks.register).toHaveBeenCalledWith({
        name: 'Laura Díaz',
        nickname: 'laurad',
        email: 'laura@example.com',
        password: 'password123',
        firstTimePlayer: false,
        levelingAnswers: [2, 3, 2, 1, 2],
      });
    });

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(screen.getByLabelText(/^Email/)).toHaveValue('laura@example.com');

    // Reopening registration shows clean form fields
    fireEvent.click(screen.getByRole('button', { name: 'Registrarse' }));
    expect(screen.getByLabelText(/^Nombre completo/)).toHaveValue('');
    expect(screen.getByLabelText(/^Nombre de usuario/)).toHaveValue('');
    expect(screen.getByLabelText(/^Email/)).toHaveValue('');
    expect(screen.getByLabelText(/^Contraseña/)).toHaveValue('');
    expect(screen.getByRole('checkbox')).not.toBeChecked();
  });

  test('supports navigating back and cancelling the leveling wizard without registering', async () => {
    authServiceMocks.checkAvailability.mockResolvedValue(undefined);
    renderAuthPage();

    fillRegistrationForm({
      name: 'Mario Pér',
      nickname: 'mariop',
      email: 'mario@example.com',
      password: 'password123',
    });

    fireEvent.click(screen.getByRole('button', { name: 'Crear cuenta' }));

    fireEvent.click(await screen.findByText('No, ya he jugado antes'));
    fireEvent.click(screen.getByRole('button', { name: 'CONTINUAR →' }));

    // Advance to question 2 and go back to question 1 and initial check
    fireEvent.click(screen.getByText('Juego con regularidad (al menos 1 vez por semana) partidos amistosos.'));
    fireEvent.click(screen.getByRole('button', { name: 'SIGUIENTE PREGUNTA →' }));
    expect(screen.getByText('Pregunta 2 de 5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '← Anterior' }));
    expect(screen.getByText('Pregunta 1 de 5')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '← Anterior' }));
    expect(screen.getByText('Antes de crear tu cuenta ¿Es la primera vez que juegas al padel?')).toBeInTheDocument();

    // Cancel registration closes the modal without calling register
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar registro' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(authServiceMocks.register).not.toHaveBeenCalled();
  });
});
