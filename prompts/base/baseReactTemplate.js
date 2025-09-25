// prompts/base/baseReactTemplate.js
export const BASE_REACT_TEMPLATE = {
  packageJson: {
    name: "ai-generated-app",
    version: "1.0.0",
    dependencies: {
      "react": "^18.2.0",
      "react-dom": "^18.2.0",
      "@types/react": "^18.2.0",
      "@types/react-dom": "^18.2.0"
    },
    scripts: {
      "dev": "vite",
      "build": "vite build",
      "preview": "vite preview",
      "lint": "eslint src --ext .js,.jsx,.ts,.tsx",
      "type-check": "tsc --noEmit"
    },
    devDependencies: {
      "@vitejs/plugin-react": "^4.0.0",
      "vite": "^4.4.0",
      "typescript": "^5.0.0"
    }
  },

  indexHtml: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="AI-generated React application" />
  <title>AI Generated App</title>
  <script src="https://cdn.tailwindcss.com"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>`,

  mainJs: `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`,

  indexCss: `@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    font-family: 'Inter', system-ui, sans-serif;
  }
}

@layer components {
  .btn-primary {
    @apply bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200;
  }
  
  .card {
    @apply bg-white rounded-xl shadow-lg border border-gray-100 p-6;
  }
}`
};
