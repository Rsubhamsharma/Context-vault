import { z } from 'zod';
import { projectContextSchema } from '../context/context.schema';
import { SmartExportAIOutput } from './smart-export.schema';

type ProjectContext = z.infer<typeof projectContextSchema>;

const formatList = (list: string[]) => (list && list.length > 0 ? list.join('\n- ') : 'None specified');
const formatString = (str: string) => (str && str.trim() ? str : 'Not specified yet.');

const compressFeatures = (features: string[]): string[] => {
  if (!features || features.length === 0) return [];

  const groups: Record<string, { keywords: string[]; items: string[] }> = {
    'Auth and project ownership protection': {
      keywords: ['auth', 'jwt', 'ownership', 'permission', 'security', 'login', 'register'],
      items: [],
    },
    'Versioned context snapshots with timeline history': {
      keywords: ['version', 'snapshot', 'timeline', 'history', 'restore', 'diff'],
      items: [],
    },
    'AI extraction, merge, validation, and repair pipeline': {
      keywords: ['ai', 'extraction', 'merge', 'validation', 'repair', 'gemini', 'prompt', 'zod'],
      items: [],
    },
    'Multi-platform export system': {
      keywords: ['export', 'chatgpt', 'claude', 'cursor', 'windsurf', 'markdown'],
      items: [],
    },
    'Dashboard with sidebar navigation, search, sorting, dark mode, and animations': {
      keywords: ['ui', 'ux', 'dashboard', 'sidebar', 'navigation', 'sorting', 'search', 'dark mode', 'framer', 'animation', 'frontend'],
      items: [],
    },
  };

  const unmatched: string[] = [];

  features.forEach(feature => {
    const lowerFeature = feature.toLowerCase();
    let matched = false;
    for (const [groupName, group] of Object.entries(groups)) {
      if (group.keywords.some(keyword => lowerFeature.includes(keyword))) {
        group.items.push(feature);
        matched = true;
        break;
      }
    }
    if (!matched) unmatched.push(feature);
  });

  const result: string[] = Object.entries(groups)
    .filter(([_, group]) => group.items.length > 0)
    .map(([groupName]) => groupName);

  return [...result, ...unmatched.slice(0, 3)];
};

const getEffectiveTechStack = (context: ProjectContext): string[] => {
  if (context.tech_stack && context.tech_stack && context.tech_stack.length > 0 && context.tech_stack[0] !== 'None specified') {
    return context.tech_stack;
  }

  const stackRelatedDecisions = context.decisions?.filter(d => 
    /stack|language|framework|database|library|architecture/i.test(d)
  ) || [];

  const combined = [...(context.dependencies || []), ...stackRelatedDecisions];
  return combined.length > 0 ? combined : ['None specified'];
};

const generateMarkdown = (context: ProjectContext): string => {
  return `
## Project Goal
${formatString(context.project_goal)}

## Current Tech Stack
- ${formatList(context.tech_stack)}

## Active Features
- ${formatList(context.features)}

## Removed / Deprecated Features
- ${formatList(context.removed_features)}

## Important Decisions
- ${formatList(context.decisions)}

## Dependencies
- ${formatList(context.dependencies)}

## Current Issues
- ${formatList(context.current_issues)}

## Resolved Issues
- ${formatList(context.resolved_issues)}

## Important Constraints
- ${formatList(context.important_constraints)}

## Next Steps
- ${formatList(context.next_steps)}
`.trim();
};

const generateCompactMarkdown = (context: ProjectContext): string => {
  const compressedFeatures = compressFeatures(context.features || []);
  const effectiveStack = getEffectiveTechStack(context);
  const limitedDecisions = context.decisions?.slice(0, 6) || [];
  
  const safetyConstraints = [
    'Do not rebuild from scratch',
    'Do not remove existing working features',
    'Respect current stack',
    'Treat ProjectContext as source of truth',
    'Preserve version history',
    'Use strict validation/runtime safety',
  ];
  const constraints = [...new Set([...safetyConstraints, ...(context.important_constraints || [])])];

  return `
## Project Goal
${formatString(context.project_goal)}

## Current Tech Stack
- ${formatList(effectiveStack)}

## Active Features
- ${formatList(compressedFeatures)}

## Important Decisions
- ${formatList(limitedDecisions)}

## Current Issues
- ${formatList(context.current_issues)}

## Important Constraints
- ${formatList(constraints)}

## Next Steps
- ${formatList(context.next_steps)}
`.trim();
};

const formatSmartMarkdown = (aiOutput: SmartExportAIOutput): string => {
  const sections: string[] = [];
  
  sections.push(`## Current Task\n${aiOutput.normalizedTask}`);
  sections.push(`## Task Intent\n${aiOutput.taskIntent}`);
  sections.push(`## Project Goal\n${formatString(aiOutput.project_goal)}`);
  
  if (aiOutput.relevant_tech_stack.length > 0) {
    sections.push(`## Relevant Tech Stack\n- ${formatList(aiOutput.relevant_tech_stack)}`);
  }
  
  if (aiOutput.relevant_existing_features.length > 0) {
    sections.push(`## Relevant Existing Features\n- ${formatList(aiOutput.relevant_existing_features)}`);
  }
  
  if (aiOutput.relevant_decisions.length > 0) {
    sections.push(`## Relevant Decisions\n- ${formatList(aiOutput.relevant_decisions)}`);
  }
  
  if (aiOutput.relevant_current_issues.length > 0) {
    sections.push(`## Relevant Current Issues\n- ${formatList(aiOutput.relevant_current_issues)}`);
  }
  
  if (aiOutput.relevant_constraints.length > 0) {
    sections.push(`## Relevant Constraints\n- ${formatList(aiOutput.relevant_constraints)}`);
  }
  
  if (aiOutput.do_not_change.length > 0) {
    sections.push(`## Do Not Change\n- ${formatList(aiOutput.do_not_change)}`);
  }

  return sections.join('\n\n');
};

const continuationInstructions = {
  general: [
    'Continue from the current state above.',
    'Do not rebuild from scratch unless explicitly asked.',
    'Do not remove existing working features unless requested.',
    'Respect the current tech stack, decisions, and constraints.',
    'Prioritize the listed next steps and current issues.',
  ],
  smart: [
    'Focus only on the current task.',
    'Do not rebuild from scratch unless explicitly asked.',
    'Do not remove existing working features unless requested.',
    'Respect the current tech stack, decisions, and constraints.',
    'Keep changes production-grade, focused, and maintainable.',
    'For frontend changes, keep the UI responsive and match the existing structure.',
  ],
};

export const exportFormatter = {
  format(projectName: string, contextOrAi: ProjectContext | SmartExportAIOutput, target: string, mode: 'full' | 'compact' | 'smart' = 'full'): string {
    let markdown = '';
    let instructions = continuationInstructions.general;

    if (mode === 'full') {
      markdown = generateMarkdown(contextOrAi as ProjectContext);
    } else if (mode === 'compact') {
      markdown = generateCompactMarkdown(contextOrAi as ProjectContext);
    } else if (mode === 'smart') {
      markdown = formatSmartMarkdown(contextOrAi as SmartExportAIOutput);
      instructions = continuationInstructions.smart;
    }

    switch (target) {
      case 'json':
        return JSON.stringify({
          projectName,
          context: contextOrAi,
          mode,
          instructions,
        }, null, 2);
      case 'generic_markdown':
        return `# Context Vault Export: ${mode === 'smart' ? 'Smart Task Context' : projectName}\n\n${markdown}\n\n## Continuation Instructions\n- ${instructions.join('\n- ')}`;
      case 'chatgpt':
        return `# Context Vault Export: ${mode === 'smart' ? 'Smart Task Context' : projectName}\n\n${mode === 'smart' ? 'You are continuing an existing software project. Use this task-specific context as the current source of truth.' : 'You are continuing an existing software project. Use this context as the current source of truth.'}\n\n${markdown}\n\n## Continuation Instructions\n- ${instructions.join('\n- ')}`;
      case 'claude':
        return `# Context Vault Export: ${mode === 'smart' ? 'Smart Task Context' : projectName}\n\n${mode === 'smart' ? 'Below is the task-specific project context. Please internalize this state to assist me with the current task.' : 'Below is the current project context. Please internalize this state to assist me with the next steps. Avoid repeating known constraints unless necessary.'}\n\n${markdown}\n\n## Continuation Instructions\n- ${instructions.join('\n- ')}`;
      case 'cursor':
        const cursorFooter = mode === 'smart' 
          ? 'Use this task-specific context to provide precise, production-grade code suggestions. Focus only on requested changes and do not modify unrelated files.' 
          : 'Use this context to provide precise code suggestions and architectural guidance.';
        return `PROJECT_CONTEXT_START\n# Context Vault Export: ${mode === 'smart' ? 'Smart Task Context' : projectName}\n\n${markdown}\n\n## Continuation Instructions\n- ${instructions.join('\n- ')}\nPROJECT_CONTEXT_END\n\n${cursorFooter}`;
      case 'windsurf':
        const windsurfFooter = mode === 'smart'
          ? 'Focus on implementing the Current Task while adhering to the Tech Stack and Important Decisions. Keep changes focused and follow existing project structure.'
          : 'Focus on implementing the Next Steps while adhering to the Tech Stack and Important Decisions.';
        return `CONTEXT_SNAPSHOT\n# Context Vault Export: ${mode === 'smart' ? 'Smart Task Context' : projectName}\n\n${markdown}\n\n## Continuation Instructions\n- ${instructions.join('\n- ')}\n\n${windsurfFooter}`;
      default:
        throw new Error(`Unsupported export target: ${target}`);
    }
  },
};
