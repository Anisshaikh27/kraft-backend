// Base prompts for general code generation and project initialization

const getBaseCodePrompt = () => `
When generating code, follow these principles:

<code_quality_standards>
1. **Clean Code**: Write self-documenting, readable code
2. **Best Practices**: Follow language and framework conventions
3. **Error Handling**: Always include proper error handling
4. **Performance**: Consider performance implications
5. **Security**: Follow security best practices
6. **Testing**: Write testable, modular code
7. **Documentation**: Include necessary comments and documentation
8. **Maintainability**: Structure code for easy maintenance and updates
</code_quality_standards>

<file_generation_rules>
When creating files, always:
1. Use proper file extensions (.js, .jsx, .css, .html, .json, etc.)
2. Include necessary imports at the top
3. Follow consistent naming conventions (camelCase, PascalCase, kebab-case)
4. Add proper file headers when relevant
5. Ensure all dependencies are properly declared
6. Structure code logically with clear separation of concerns
</file_generation_rules>
`;

const getProjectInitPrompt = () => `
When initializing new projects:

<project_structure>
For React applications, create this structure:

/project
├── public/
│   ├── index.html          # Main HTML template
│   ├── favicon.ico         # Favicon
│   └── manifest.json       # PWA manifest
├── src/
│   ├── components/         # Reusable components
│   │   ├── common/         # Common UI components
│   │   └── layout/         # Layout components
│   ├── pages/              # Page components
│   ├── hooks/              # Custom React hooks
│   ├── context/            # React context providers
│   ├── utils/              # Utility functions
│   ├── services/           # API services
│   ├── styles/             # Global styles
│   ├── assets/             # Images, icons, fonts
│   ├── constants/          # App constants
│   ├── types/              # TypeScript types (if using TS)
│   ├── App.js              # Main App component
│   ├── index.js            # Entry point
│   └── index.css           # Global styles
├── package.json            # Dependencies and scripts
├── README.md              # Project documentation
├── .gitignore             # Git ignore rules
└── tailwind.config.js     # Tailwind configuration
</project_structure>

<essential_files>
1. **package.json**: Include all necessary dependencies
2. **README.md**: Comprehensive project documentation
3. **index.html**: Proper HTML5 structure with meta tags
4. **App.js**: Main application component with routing
5. **index.css**: Global styles and Tailwind imports
6. **.gitignore**: Standard ignore patterns for Node.js projects
</essential_files>
`;

const getPackageJsonTemplate = () => `
<package_json_template>
{
  "name": "project-name",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.8.0",
    "react-scripts": "5.0.1"
  },
  "scripts": {
    "start": "react-scripts start",
    "build": "react-scripts build",
    "test": "react-scripts test",
    "eject": "react-scripts eject",
    "lint": "eslint src/",
    "lint:fix": "eslint src/ --fix",
    "format": "prettier --write src/"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  },
  "devDependencies": {
    "@testing-library/jest-dom": "^5.16.4",
    "@testing-library/react": "^13.4.0",
    "@testing-library/user-event": "^13.5.0",
    "autoprefixer": "^10.4.13",
    "postcss": "^8.4.21",
    "tailwindcss": "^3.2.6"
  }
}
</package_json_template>
`;

const getHtmlTemplate = () => `
<html_template>
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%PUBLIC_URL%/favicon.ico" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#000000" />
    <meta name="description" content="Web application built with React" />
    <link rel="apple-touch-icon" href="%PUBLIC_URL%/logo192.png" />
    <link rel="manifest" href="%PUBLIC_URL%/manifest.json" />
    <title>React App</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>
</html_template>
`;

const getTailwindConfig = () => `
<tailwind_config>
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
        },
        gray: {
          50: '#f9fafb',
          100: '#f3f4f6',
          900: '#111827',
        }
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      }
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
  darkMode: 'class',
}
</tailwind_config>
`;

const getReadmeTemplate = () => `
<readme_template>
# Project Name

Brief description of what this project does.

## Features

- ⚡ Fast and responsive
- 🎨 Modern UI with Tailwind CSS  
- 📱 Mobile-first design
- ♿ Accessible components
- 🔧 Easy to customize

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository
   \`\`\`bash
   git clone <repository-url>
   cd project-name
   \`\`\`

2. Install dependencies
   \`\`\`bash
   npm install
   # or
   yarn install
   \`\`\`

3. Start the development server
   \`\`\`bash
   npm start
   # or  
   yarn start
   \`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Available Scripts

- \`npm start\` - Runs the app in development mode
- \`npm build\` - Builds the app for production
- \`npm test\` - Launches the test runner
- \`npm run lint\` - Runs ESLint
- \`npm run format\` - Formats code with Prettier

## Project Structure

\`\`\`
src/
├── components/     # Reusable UI components
├── pages/          # Page components  
├── hooks/          # Custom React hooks
├── utils/          # Utility functions
├── styles/         # Global styles
├── App.js          # Main app component
└── index.js        # Entry point
\`\`\`

## Built With

- [React](https://reactjs.org/) - Frontend library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [React Router](https://reactrouter.com/) - Client-side routing

## Contributing

1. Fork the project
2. Create your feature branch (\`git checkout -b feature/AmazingFeature\`)
3. Commit your changes (\`git commit -m 'Add some AmazingFeature'\`)
4. Push to the branch (\`git push origin feature/AmazingFeature\`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.
</readme_template>
`;

const getGitignoreTemplate = () => `
<gitignore_template>
# Dependencies
/node_modules
/.pnp
.pnp.js

# Testing
/coverage

# Production
/build
/dist

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
lerna-debug.log*

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Optional npm cache directory
.npm

# Optional eslint cache
.eslintcache

# Optional REPL history
.node_repl_history

# Output of 'npm pack'
*.tgz

# Yarn Integrity file
.yarn-integrity

# dotenv environment variables file
.env

# MacOS
.DS_Store

# Windows
Thumbs.db
ehthumbs.db

# VS Code
.vscode/

# JetBrains IDEs
.idea/

# Temporary folders
tmp/
temp/
</gitignore_template>
`;

module.exports = {
  getBaseCodePrompt,
  getProjectInitPrompt,
  getPackageJsonTemplate,
  getHtmlTemplate,
  getTailwindConfig,
  getReadmeTemplate,
  getGitignoreTemplate
};