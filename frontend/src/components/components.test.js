import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// ── Mocks ──────────────────────────────────────────────────────────────────
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user1', name: 'Test User', email: 'test@example.com' },
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    register: jest.fn(),
  }),
  AuthProvider: ({ children }) => <>{children}</>,
}));

jest.mock('../context/ThemeContext', () => ({
  useTheme: () => ({ theme: 'dark', toggleTheme: jest.fn() }),
  ThemeProvider: ({ children }) => <>{children}</>,
}));

jest.mock('../hooks/useSocket', () => ({
  useSocket: () => null,
}));

jest.mock('../services/api', () => ({
  taskService: {
    getAll: jest.fn().mockResolvedValue({
      data: {
        tasks: [
          {
            _id: 'task1',
            title: 'Write Unit Tests',
            description: 'Cover all components with tests',
            status: 'In Progress',
            priority: 'High',
            dueDate: new Date(Date.now() + 86400000 * 3).toISOString(),
            createdAt: new Date().toISOString(),
            user: { _id: 'user1', name: 'Test User' },
            sharedWith: [],
            attachments: [],
          },
          {
            _id: 'task2',
            title: 'Deploy to Render',
            description: 'Production deployment',
            status: 'Pending',
            priority: 'Medium',
            dueDate: new Date(Date.now() + 86400000 * 7).toISOString(),
            createdAt: new Date().toISOString(),
            user: { _id: 'user1', name: 'Test User' },
            sharedWith: [],
            attachments: [],
          },
        ],
        progress: { total: 2, completed: 0, percent: 0 },
      },
    }),
    getShared: jest.fn().mockResolvedValue({ data: { tasks: [] } }),
    create: jest.fn().mockResolvedValue({ data: { task: { _id: 'new1', title: 'New Task' } } }),
    update: jest.fn().mockResolvedValue({ data: { task: { _id: 'task1', status: 'Completed' } } }),
    delete: jest.fn().mockResolvedValue({ data: { success: true } }),
    share: jest.fn().mockResolvedValue({ data: { success: true } }),
    uploadAttachment: jest.fn().mockResolvedValue({ data: { success: true } }),
  },
  notificationService: {
    getAll: jest.fn().mockResolvedValue({ data: { notifications: [], unreadCount: 0 } }),
    markAllRead: jest.fn().mockResolvedValue({ data: {} }),
  },
  authService: {
    login: jest.fn(),
    register: jest.fn(),
    getMe: jest.fn(),
    searchUsers: jest.fn().mockResolvedValue({ data: { users: [] } }),
  },
  analyticsService: {
    getOverview: jest.fn().mockResolvedValue({
      data: {
        data: {
          total: 5, completed: 2, pending: 2, inProgress: 1, overdue: 1,
          completionRate: 40,
          statusBreakdown: [{ name: 'Pending', value: 2 }, { name: 'In Progress', value: 1 }, { name: 'Completed', value: 2 }],
          priorityBreakdown: [{ name: 'High', value: 2 }, { name: 'Medium', value: 2 }, { name: 'Low', value: 1 }],
        },
      },
    }),
    getTrends: jest.fn().mockResolvedValue({
      data: {
        data: {
          period: 'weekly',
          labels: ['Mon', 'Tue', 'Wed'],
          created: [1, 2, 1],
          completed: [0, 1, 1],
          overdue: [0, 0, 1],
        },
      },
    }),
  },
  default: {},
}));

// ── Component Imports ──────────────────────────────────────────────────────
import ProgressBar from '../components/ProgressBar';
import TaskCard from '../components/TaskCard';
import TaskForm from '../components/TaskForm';
import { LoginPage, RegisterPage } from '../components/AuthPages';
import SharedTasksPage from '../components/SharedTasksPage';

// ══════════════════════════════════════════════════════════════════════════════
// ProgressBar Tests
// ══════════════════════════════════════════════════════════════════════════════
describe('ProgressBar', () => {
  test('renders 0% when no tasks', () => {
    render(<ProgressBar progress={{ total: 0, completed: 0, percent: 0 }} />);
    expect(screen.getByText('0%')).toBeInTheDocument();
  });

  test('renders correct percentage', () => {
    render(<ProgressBar progress={{ total: 10, completed: 4, percent: 40 }} />);
    expect(screen.getByText('40%')).toBeInTheDocument();
  });

  test('shows total and completed counts', () => {
    render(<ProgressBar progress={{ total: 10, completed: 4, percent: 40 }} />);
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  test('shows remaining count', () => {
    render(<ProgressBar progress={{ total: 10, completed: 4, percent: 40 }} />);
    expect(screen.getByText('6')).toBeInTheDocument();
  });

  test('renders 100% correctly', () => {
    render(<ProgressBar progress={{ total: 5, completed: 5, percent: 100 }} />);
    expect(screen.getByText('100%')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TaskCard Tests
// ══════════════════════════════════════════════════════════════════════════════
describe('TaskCard', () => {
  const baseTask = {
    _id: 'task1',
    title: 'Test Task Title',
    description: 'Test description text',
    status: 'Pending',
    priority: 'High',
    dueDate: new Date(Date.now() + 86400000 * 5).toISOString(),
    user: { _id: 'user1', name: 'Alice' },
    sharedWith: [],
    attachments: [],
  };

  const defaultProps = {
    task: baseTask,
    onClick: jest.fn(),
    onEdit: jest.fn(),
    onDelete: jest.fn(),
    currentUserId: 'user1',
  };

  test('renders task title', () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText('Test Task Title')).toBeInTheDocument();
  });

  test('renders description', () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText('Test description text')).toBeInTheDocument();
  });

  test('renders status badge', () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  test('renders priority badge', () => {
    render(<TaskCard {...defaultProps} />);
    expect(screen.getByText('High')).toBeInTheDocument();
  });

  test('calls onClick when card is clicked', () => {
    const onClick = jest.fn();
    render(<TaskCard {...defaultProps} onClick={onClick} />);
    fireEvent.click(screen.getByText('Test Task Title'));
    expect(onClick).toHaveBeenCalledWith(baseTask);
  });

  test('shows "shared" badge when task has sharedWith users', () => {
    const sharedTask = { ...baseTask, sharedWith: [{ _id: 'user2', name: 'Bob' }] };
    render(<TaskCard {...defaultProps} task={sharedTask} />);
    expect(screen.getByText('shared')).toBeInTheDocument();
  });

  test('shows attachment count when attachments exist', () => {
    const taskWithAtt = { ...baseTask, attachments: [{ _id: 'att1', originalName: 'file.pdf', size: 1024 }] };
    render(<TaskCard {...defaultProps} task={taskWithAtt} />);
    expect(screen.getByText(/1 attachment/i)).toBeInTheDocument();
  });

  test('shows "Completed" status correctly', () => {
    const completedTask = { ...baseTask, status: 'Completed' };
    render(<TaskCard {...defaultProps} task={completedTask} />);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// TaskForm Tests
// ══════════════════════════════════════════════════════════════════════════════
describe('TaskForm', () => {
  const baseProps = {
    task: null,
    onSubmit: jest.fn(),
    onCancel: jest.fn(),
    loading: false,
  };

  test('renders title input', () => {
    render(<TaskForm {...baseProps} />);
    expect(screen.getByPlaceholderText(/What needs to be done/i)).toBeInTheDocument();
  });

  test('renders description textarea', () => {
    render(<TaskForm {...baseProps} />);
    expect(screen.getByPlaceholderText(/Add more details/i)).toBeInTheDocument();
  });

  test('renders status select with default Pending', () => {
    render(<TaskForm {...baseProps} />);
    expect(screen.getByDisplayValue('Pending')).toBeInTheDocument();
  });

  test('renders priority select with default Medium', () => {
    render(<TaskForm {...baseProps} />);
    expect(screen.getByDisplayValue('Medium')).toBeInTheDocument();
  });

  test('renders "Create Task" button when no task prop', () => {
    render(<TaskForm {...baseProps} />);
    expect(screen.getByText('Create Task')).toBeInTheDocument();
  });

  test('renders "Save Changes" when editing existing task', () => {
    const existingTask = {
      title: 'Existing', description: '', status: 'Pending',
      priority: 'Low', dueDate: new Date().toISOString(),
    };
    render(<TaskForm {...baseProps} task={existingTask} />);
    expect(screen.getByText('Save Changes')).toBeInTheDocument();
  });

  test('shows validation error if title is empty on submit', async () => {
    render(<TaskForm {...baseProps} />);
    fireEvent.click(screen.getByText('Create Task'));
    await waitFor(() => expect(screen.getByText('Title is required')).toBeInTheDocument());
  });

  test('calls onCancel when Cancel is clicked', () => {
    const onCancel = jest.fn();
    render(<TaskForm {...baseProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  test('shows "Saving…" when loading is true', () => {
    render(<TaskForm {...baseProps} loading={true} />);
    expect(screen.getByText('Saving…')).toBeInTheDocument();
  });

  test('pre-fills fields when editing', () => {
    const t = { title: 'Pre-filled Title', description: 'Some desc', status: 'In Progress', priority: 'High', dueDate: '2026-07-01T00:00:00.000Z' };
    render(<TaskForm {...baseProps} task={t} />);
    expect(screen.getByDisplayValue('Pre-filled Title')).toBeInTheDocument();
    expect(screen.getByDisplayValue('In Progress')).toBeInTheDocument();
    expect(screen.getByDisplayValue('High')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// Auth Pages Tests
// ══════════════════════════════════════════════════════════════════════════════
describe('LoginPage', () => {
  test('renders email and password inputs', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
  });

  test('renders Sign In button', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  test('renders link to register', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByText(/Create one/i)).toBeInTheDocument();
  });

  test('renders TaskFlow branding', () => {
    render(<MemoryRouter><LoginPage /></MemoryRouter>);
    expect(screen.getByText(/TaskFlow/i)).toBeInTheDocument();
  });
});

describe('RegisterPage', () => {
  test('renders name, email, password inputs', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByPlaceholderText(/Your name/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/you@example.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Min. 6 characters/i)).toBeInTheDocument();
  });

  test('renders Create Account button', () => {
    render(<MemoryRouter><RegisterPage /></MemoryRouter>);
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════════
// SharedTasksPage Tests
// ══════════════════════════════════════════════════════════════════════════════
describe('SharedTasksPage', () => {
  test('renders page heading', async () => {
    render(<MemoryRouter><SharedTasksPage /></MemoryRouter>);
    expect(screen.getByText(/Shared with Me/i)).toBeInTheDocument();
  });

  test('shows empty state when no shared tasks', async () => {
    render(<MemoryRouter><SharedTasksPage /></MemoryRouter>);
    await waitFor(() => expect(screen.getByText(/No shared tasks yet/i)).toBeInTheDocument());
  });
});
