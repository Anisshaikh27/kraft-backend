// React-specific prompts and templates for better code generation

const getReactFullProjectPrompt = () => `
When creating COMPLETE React projects (not just components), you MUST generate:

🚨 MANDATORY BASE FILES (ALWAYS generate these first):

1. // package.json
   \`\`\`json
   {
     "name": "react-app",
     "version": "1.0.0",
     "dependencies": {
       "react": "^18.2.0",
       "react-dom": "^18.2.0"
     }
   }
   \`\`\`

2. // public/index.html
   \`\`\`html
   <!DOCTYPE html>
   <html lang="en">
     <head>
       <meta charset="UTF-8">
       <meta name="viewport" content="width=device-width, initial-scale=1.0">
       <script src="https://cdn.tailwindcss.com"></script>
       <title>React App</title>
     </head>
     <body>
       <div id="root"></div>
     </body>
   </html>
   \`\`\`

3. // src/index.css
   \`\`\`css
   @tailwind base;
   @tailwind components;
   @tailwind utilities;

   * {
     margin: 0;
     padding: 0;
     box-sizing: border-box;
   }

   body {
     font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
       'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
       sans-serif;
     -webkit-font-smoothing: antialiased;
     -moz-osx-font-smoothing: grayscale;
   }

   html, body, #root {
     height: 100%;
     width: 100%;
   }
   \`\`\`

4. // src/index.js
   \`\`\`jsx
   import React from 'react';
   import ReactDOM from 'react-dom/client';
   import App from './App';
   import './index.css';

   const root = ReactDOM.createRoot(document.getElementById('root'));
   root.render(
     <React.StrictMode>
       <App />
     </React.StrictMode>
   );
   \`\`\`

5. // src/App.js
   \`\`\`jsx
   [Complete App component with JSX and Tailwind styling]
   \`\`\`

THEN add additional components as needed.

CRITICAL: ALWAYS provide these 5 files BEFORE any additional components.
`;

const getReactComponentPrompt = () => `
When creating React components, follow these patterns:

<component_structure>
// Functional Component Template
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ComponentName = ({ prop1, prop2, children }) => {
  const [state, setState] = useState(initialValue);

  useEffect(() => {
    // Effect logic
    return () => {
      // Cleanup if needed
    };
  }, [dependencies]);

  const handleEvent = (event) => {
    // Event handler logic
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div className="component-container">
      {/* Component JSX */}
    </div>
  );
};

ComponentName.propTypes = {
  prop1: PropTypes.string.isRequired,
  prop2: PropTypes.number,
  children: PropTypes.node
};

ComponentName.defaultProps = {
  prop2: 0
};

export default ComponentName;
</component_structure>

<react_patterns>
1. **Custom Hooks**: Extract reusable logic
2. **Context Providers**: For global state management
3. **Error Boundaries**: Catch and handle errors gracefully
4. **Lazy Loading**: Use React.lazy for code splitting
5. **Memoization**: Use React.memo, useMemo, useCallback for performance
6. **Form Handling**: Controlled components with validation
7. **API Integration**: Custom hooks for data fetching
8. **Responsive Design**: Mobile-first approach with Tailwind CSS
</react_patterns>
`;

const getReactHooksPrompt = () => `
<custom_hooks_patterns>
// Data Fetching Hook
const useApi = (url, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(url, options);
      
      if (!response.ok) {
        throw new Error(\`HTTP error! status: \${response.status}\`);
      }
      
      const result = await response.json();
      setData(result);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
};

// Local Storage Hook
const useLocalStorage = (key, initialValue) => {
  const [storedValue, setStoredValue] = useState(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(\`Error reading localStorage key "\${key}":, error\`);
      return initialValue;
    }
  });

  const setValue = useCallback((value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(\`Error setting localStorage key "\${key}":, error\`);
    }
  }, [key, storedValue]);

  return [storedValue, setValue];
};

// Form Hook
const useForm = (initialValues, validationSchema) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const handleChange = (name, value) => {
    setValues(prev => ({ ...prev, [name]: value }));
    
    if (touched[name]) {
      validateField(name, value);
    }
  };

  const handleBlur = (name) => {
    setTouched(prev => ({ ...prev, [name]: true }));
    validateField(name, values[name]);
  };

  const validateField = (name, value) => {
    if (validationSchema[name]) {
      const error = validationSchema[name](value);
      setErrors(prev => ({ ...prev, [name]: error }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    Object.keys(validationSchema).forEach(key => {
      const error = validationSchema[key](values[key]);
      if (error) newErrors[key] = error;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const reset = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    reset,
    isValid: Object.keys(errors).length === 0
  };
};
</custom_hooks_patterns>
`;

const getReactContextPrompt = () => `
<context_patterns>
// Theme Context Example
import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      <div className={\`\${theme} min-h-screen transition-colors duration-300\`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Auth Context Example  
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      verifyToken(token);
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (credentials) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials)
      });

      if (response.ok) {
        const { user, token } = await response.json();
        localStorage.setItem('token', token);
        setUser(user);
        return { success: true };
      } else {
        throw new Error('Login failed');
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
</context_patterns>
`;

const getReactTailwindPrompt = () => `
<tailwind_patterns>
When using Tailwind CSS with React:

1. **Responsive Design**: Mobile-first approach
   \`className="w-full md:w-1/2 lg:w-1/3"\`

2. **Component Variants**: Use conditional classes
   \`className={\`btn \${primary ? 'btn-primary' : 'btn-secondary'}\`}\`

3. **Dark Mode**: Use dark: prefix
   \`className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white"\`

4. **Interactive States**: Hover, focus, active
   \`className="hover:bg-blue-500 focus:ring-2 focus:ring-blue-300"\`

5. **Grid Layouts**: Use grid classes
   \`className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"\`

6. **Flexbox**: For alignment and distribution
   \`className="flex items-center justify-between"\`

7. **Forms**: Styled form controls
   \`className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"\`

8. **Cards**: Common card pattern
   \`className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"\`

// Button Component Example
const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  disabled = false,
  onClick,
  ...props 
}) => {
  const baseClasses = 'font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variants = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900 focus:ring-gray-500',
    danger: 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500'
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const classes = \`
    \${baseClasses}
    \${variants[variant]}
    \${sizes[size]}
    \${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
  \`.trim();

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};
</tailwind_patterns>
`;

const getReactTestingPrompt = () => `
<testing_patterns>
// Component Testing with Jest and React Testing Library
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ComponentName from './ComponentName';

describe('ComponentName', () => {
  test('renders correctly', () => {
    render(<ComponentName prop1="test" />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  test('handles user interactions', async () => {
    const handleClick = jest.fn();
    render(<ComponentName onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('handles async operations', async () => {
    render(<ComponentName />);
    
    await waitFor(() => {
      expect(screen.getByText('Loaded Data')).toBeInTheDocument();
    });
  });
});

// Hook Testing
import { renderHook, act } from '@testing-library/react';
import useCustomHook from './useCustomHook';

describe('useCustomHook', () => {
  test('should initialize with correct values', () => {
    const { result } = renderHook(() => useCustomHook());
    
    expect(result.current.value).toBe(initialValue);
  });

  test('should update value', () => {
    const { result } = renderHook(() => useCustomHook());
    
    act(() => {
      result.current.setValue('new value');
    });
    
    expect(result.current.value).toBe('new value');
  });
});
</testing_patterns>
`;

module.exports = {
  getReactFullProjectPrompt,
  getReactComponentPrompt,
  getReactHooksPrompt,
  getReactContextPrompt,
  getReactTailwindPrompt,
  getReactTestingPrompt
};