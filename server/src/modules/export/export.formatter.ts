import { z } from 'zod';
import { projectContextSchema } from '../context/context.schema';

type ProjectContext = z.infer<typeof projectContextSchema>;

const formatList = (list: string[]) => (list && list.length > 0 ? list.join('\n- ') : 'None specified');
const formatString = (str: string) => (str && str.trim() ? str : 'Not specified yet.');

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

const continuationInstructions = [
  'Continue from the current state above.',
  'Do not rebuild from scratch unless explicitly asked.',
  'Do not remove existing working features unless requested.',
  'Respect the current tech stack, decisions, and constraints.',
  'Prioritize the listed next steps and current issues.',
];

export const exportFormatter = {
  format(projectName: string, context: ProjectContext, target: string): string {
    switch (target) {
      case 'json':
        return JSON.stringify({
          projectName,
          context,
          instructions: continuationInstructions,
        }, null, 2);
      case 'generic_markdown':
        return `# Context Vault Export: ${projectName}\n\n${generateMarkdown(context)}\n\n## Continuation Instructions\n- ${continuationInstructions.join('\n- ')}`;
      case 'chatgpt':
        return `# Context Vault Export: ${projectName}\n\nYou are continuing an existing software project. Use this context as the current source of truth.\n\n${generateMarkdown(context)}\n\n## Continuation Instructions\n- ${continuationInstructions.join('\n- ')}`;
      case 'claude':
        return `# Context Vault Export: ${projectName}\n\nBelow is the current project context. Please internalize this state to assist me with the next steps. Avoid repeating known constraints unless necessary.\n\n${generateMarkdown(context)}\n\n## Continuation Instructions\n- ${continuationInstructions.join('\n- ')}`;
      case 'cursor':
        return `PROJECT_CONTEXT_START\n# Context Vault Export: ${projectName}\n\n${generateMarkdown(context)}\n\n## Continuation Instructions\n- ${continuationInstructions.join('\n- ')}\nPROJECT_CONTEXT_END\n\nUse this context to provide precise code suggestions and architectural guidance.`;
      case 'windsurf':
        return `CONTEXT_SNAPSHOT\n# Context Vault Export: ${projectName}\n\n${generateMarkdown(context)}\n\n## Continuation Instructions\n- ${continuationInstructions.join('\n- ')}\n\nFocus on implementing the Next Steps while adhering to the Tech Stack and Important Decisions.`;
      default:
        throw new Error(`Unsupported export target: ${target}`);
    }
  },
};
