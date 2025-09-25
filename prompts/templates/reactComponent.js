// prompts/templates/reactComponent.js
import { SYSTEM_PROMPT } from '../base/systemPrompt.js';
import { BASE_REACT_TEMPLATE } from '../base/baseReactTemplate.js';

export const REACT_COMPONENT_PROMPT = {
  system: SYSTEM_PROMPT,
  
  template: `${SYSTEM_PROMPT}

## TASK: Generate React Component

Create a modern, reusable React component based on the user's requirements.

### COMPONENT REQUIREMENTS:
1. **Functionality**: Implement the core functionality as described
2. **Props Interface**: Design a clean props interface with TypeScript-ready patterns
3. **Styling**: Use Tailwind CSS with modern design patterns
4. **Accessibility**: Include ARIA labels, semantic HTML, keyboard navigation
5. **Performance**: Use React.memo, useMemo, useCallback where appropriate
6. **Error Handling**: Include error boundaries and proper validation
7. **Testing**: Structure code to be easily testable

### TECHNICAL SPECIFICATIONS:
- React 18+ functional components only
- Modern hooks (useState, useEffect, useContext, custom hooks)
- Tailwind CSS for styling
- Mobile-first responsive design
- TypeScript-ready prop interfaces
- Semantic HTML5 elements
- WCAG 2.1 AA accessibility compliance

### OUTPUT FORMAT:
Return complete, production-ready code with:
- All necessary imports
- JSDoc comments for the main component
- PropTypes or TypeScript interfaces
- Usage examples in comments
- No external dependencies beyond React and Tailwind

### EXAMPLE STRUCTURE:
\`\`\`javascript
import React, { useState, useEffect, memo } from 'react';

/**
 * ComponentName - Brief description
 * @param {Object} props - Component props
 * @param {string} props.title - Title text
 * @param {Function} props.onClick - Click handler
 */
const ComponentName = memo(({ title, onClick, ...props }) => {
  const [state, setState] = useState(defaultValue);
  
  return (
    <div 
      className="component-classes"
      role="button"
      tabIndex={0}
      {...props}
    >
      {/* Component JSX */}
    </div>
  );
});

ComponentName.displayName = 'ComponentName';

export default ComponentName;
\`\`\`

Now generate the component based on: {description}

Additional requirements: {requirements}`,

  variables: ['description', 'requirements'],
  
  constraints: {
    maxTokens: 2048,
    temperature: 0.3,
    stopSequences: ['Human:', 'Assistant:']
  }
};
