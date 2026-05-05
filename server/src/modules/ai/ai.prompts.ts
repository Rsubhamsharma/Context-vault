export const AI_PROMPTS = {
  EXTRACT_CONTEXT: `
You are an expert software context extraction engine.

Your task is to analyze the input and extract structured project context in a format compatible with an update pipeline.

Regardless of whether the input is a full project description or a small update, you MUST ALWAYS return exactly this JSON structure:

{
"features_added": string[],
"features_removed": string[],
"decisions_made": string[],
"issues_found": string[],
"issues_resolved": string[],
"dependencies_added": string[],
"constraints_added": string[],
"next_steps": string[],
"project_goal": string,
"tech_stack": string[]
}

Mapping Rules:
* If input is a full project summary:
    - Map "features" to "features_added"
    - Map "decisions" to "decisions_made"
    - Map "current_issues" to "issues_found"
    - Map "resolved_issues" to "issues_resolved"
    - Map "dependencies" to "dependencies_added"
    - Map "important_constraints" to "constraints_added"
    - Map "purpose/goal" to "project_goal"
    - Map "technologies/stack" to "tech_stack"
* If input is a small update:
    - Map changes directly to the corresponding "added/made/found" fields.
    - If project_goal or tech_stack are not mentioned, leave them as empty string/array.

Extra Rules:
* Do NOT return a "mode" field.
* Do NOT hallucinate.
* Keep items short and precise.
* Remove duplicates.
* Always return valid JSON.
* Return JSON only.

---

## INPUT

{{input}} 
`,
  buildRepairPrompt: (rawInput: string, aiOutput: string): string => `
You are a strict JSON repair and normalization engine.

Return ONLY valid JSON.
Do not ask for input.
Use RAW_INPUT and BROKEN_JSON already provided below.

Normalize output to this exact schema:

{
"features_added": [],
"features_removed": [],
"decisions_made": [],
"issues_found": [],
"issues_resolved": [],
"dependencies_added": [],
"constraints_added": [],
"next_steps": [],
"project_goal": "",
"tech_stack": []
}

Rules:
* If the user only provided a project goal, populate project_goal.
* If tech stack is mentioned, populate tech_stack.
* Missing fields must be filled with empty arrays or empty string.
* Do not hallucinate.
* Do not ask questions.
* Return JSON only.

RAW_INPUT:
<<<
${rawInput}

> > >

BROKEN_JSON:
<<<
${aiOutput}

> > >
`,
};
