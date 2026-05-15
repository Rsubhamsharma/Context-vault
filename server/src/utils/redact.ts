import { z } from 'zod';

export interface RedactionResult {
  text: string;
  secretsRedactedCount: number;
  riskyFilesDetected: string[];
}

const SECRET_PATTERNS = [
  /(?:api_key|apikey|secret|token|password|passwd|auth_token|access_token|refresh_token)[\s:=]+[a-zA-Z0-9_\-.~+/]{16,}/gi,
  /-----BEGIN (?:RSA|OPENSSH|PRIVATE) KEY-----[\s\S]*?-----END (?:RSA|OPENSSH|PRIVATE) KEY-----/gi,
  /(?:aws_access_key_id|aws_secret_access_key)[\s:=]+[a-zA-Z0-9_\-.~+/]{16,}/gi,
  /(?:DATABASE_URL|MONGODB_URI|REDIS_URL|POSTGRES_URL)[\s:=]+[a-zA-Z0-9_\-.~+/:@%]+(?:\/[a-zA-Z0-9_\-.~+/]+)?/gi,
  /(?:ghp_|gho_|ghu_|ghs_|ghr_)[a-zA-Z0-9]{36}/g, // GitHub tokens
  /(?:sk-or-sig-)[a-zA-Z0-9\-_]{20,}/g, // OpenAI/Gemini style keys
];

const RISKY_FILE_PATTERNS = [
  /\.env(\.local|\.production|\.development)?$/i,
  /\.(pem|key)$/i,
  /credentials\..*$/i,
  /secrets\..*$/i,
];

export function redactSecrets(text: string): RedactionResult {
  let redactedText = text;
  let secretsRedactedCount = 0;
  const riskyFilesDetected: string[] = [];

  // Detect risky files if the text looks like a diff or file list
  const lines = text.split('\n');
  lines.forEach(line => {
    if (line.startsWith('+++ ') || line.startsWith('--- ') || line.startsWith('diff ')) {
      const filePath = line.slice(4).trim();
      if (RISKY_FILE_PATTERNS.some(pattern => pattern.test(filePath))) {
        riskyFilesDetected.push(filePath);
      }
    }
  });

  // Redact secrets
  SECRET_PATTERNS.forEach(pattern => {
    const matches = redactedText.match(pattern);
    if (matches) {
      secretsRedactedCount += matches.length;
      redactedText = redactedText.replace(pattern, '[REDACTED_SECRET]');
    }
  });

  return {
    text: redactedText,
    secretsRedactedCount,
    riskyFilesDetected,
  };
}

export const MAX_GIT_IMPORT_LENGTH = 50000; // 50k chars ~ 12.5k tokens approx
