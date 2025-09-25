// prompts/templates/fullReactApp.js
import { SYSTEM_PROMPT } from '../base/systemPrompt.js';
import { BASE_REACT_TEMPLATE } from '../base/baseReactTemplate.js';

export const FULL_REACT_APP_PROMPT = {
  system: SYSTEM_PROMPT,
  
  template: `${SYSTEM_PROMPT}

## TASK: Generate Complete React Application

Create a production-ready React application with multiple components, routing, and modern features.

### APPLICATION STRUCTURE:
\`\`\`
src/
├── components/
│   ├── common/          # Reusable UI components
│   ├── layout/          # Layout components (Header, Footer, Sidebar)
│   └── features/        # Feature-specific components
├── pages/               # Page components for routing
├── hooks/               # Custom React hooks
├── utils/               # Helper functions
├── context/             # React Context providers
├── types/               # TypeScript type definitions
├── styles/              # CSS files
├── App.jsx              # Main app component
└── main.jsx             # Entry point
\`\`\`

### REQUIRED FEATURES:
1. **Navigation**: Header with responsive navigation menu
2. **Routing**: React Router v6 with multiple pages
3. **State Management**: Context API for global state
4. **Components**: At least 5 reusable components
5. **Pages**: Home, About, Contact, and feature-specific pages
6. **Responsive Design**: Mobile-first with Tailwind CSS
7. **Error Handling**: Error boundaries and 404 page
8. **Loading States**: Skeleton loaders and spinners
9. **Accessibility**: Full WCAG 2.1 AA compliance
10. **Performance**: Code splitting and optimization

### TECHNICAL REQUIREMENTS:
- React 18+ with concurrent features
- React Router v6
- Context API for state management
- Tailwind CSS with custom components
- Modern React patterns (Suspense, lazy loading)
- Custom hooks for logic separation
- Error boundaries
- SEO-friendly structure

### OUTPUT FORMAT:
Return JSON with complete file structure:
\`\`\`json
{
  "files": [
    {
      "name": "package.json",
      "path": "package.json",
      "content": "// Complete package.json"
    },
    {
      "name": "App.jsx",
      "path": "src/App.jsx", 
      "content": "// Complete App component"
    }
    // ... all other files
  ],
  "webcontainerFiles": {
    // WebContainer-ready format
  },
  "instructions": {
    "setup": ["npm install", "npm run dev"],
    "build": ["npm run build"],
    "deploy": "Ready for Vercel/Netlify deployment"
  }
}
\`\`\`

### BASE TEMPLATE:
${JSON.stringify(BASE_REACT_TEMPLATE, null, 2)}

Generate application: {description}
Features: {features}
Additional requirements: {requirements}`,

  variables: ['description', 'features', 'requirements'],
  
  constraints: {
    maxTokens: 4096,
    temperature: 0.2,
    stopSequences: ['Human:', 'Assistant:']
  }
};
