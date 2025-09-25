// prompts/utils/promptBuilder.js
export class PromptBuilder {
  constructor() {
    this.templates = new Map();
  }

  // Register a template
  registerTemplate(name, template) {
    this.templates.set(name, template);
  }

  // Build prompt with variables
  buildPrompt(templateName, variables = {}) {
    const template = this.templates.get(templateName);
    
    if (!template) {
      throw new Error(`Template '${templateName}' not found`);
    }

    let prompt = template.template;
    
    // Replace variables
    template.variables.forEach(variable => {
      const placeholder = new RegExp(`{${variable}}`, 'g');
      prompt = prompt.replace(placeholder, variables[variable] || '');
    });

    return {
      system: template.system,
      prompt,
      constraints: template.constraints
    };
  }

  // Validate template variables
  validateVariables(templateName, variables) {
    const template = this.templates.get(templateName);
    if (!template) return false;

    return template.variables.every(variable => 
      variables.hasOwnProperty(variable)
    );
  }

  // Get all available templates
  getAvailableTemplates() {
    return Array.from(this.templates.keys());
  }
}

export const promptBuilder = new PromptBuilder();
