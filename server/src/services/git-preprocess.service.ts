import { redactSecrets } from '../utils/redact';

export interface PreprocessingMetadata {
  filesDetected: string[];
  highSignalFiles: string[];
  ignoredFiles: string[];
  riskyFiles: string[];
  redactionCount: number;
  originalInputSize: number;
  sanitizedInputSize: number;
  wasFiltered: boolean;
}

export interface PreprocessedPayload {
  sanitizedText: string;
  metadata: PreprocessingMetadata;
}

const HIGH_SIGNAL_PATTERNS = [
  /package\.json$/i,
  /schema\.prisma$/i,
  /migrations\/.*\.sql$/i,
  /routes\/.*\.ts$/i,
  /controllers\/.*\.ts$/i,
  /services\/.*\.ts$/i,
  /api\/.*\.ts$/i,
  /auth\/.*\.ts$/i,
  /pages\/.*\.tsx?$/i,
  /components\/.*\.tsx?$/i,
  /config\/.*\.ts$/i,
  /README\.md$/i,
  /docs\/.*\.md$/i,
  /\.test\.ts?$/i,
  /\.spec\.ts?$/i,
];

const IGNORED_PATTERNS = [
  /node_modules\//i,
  /dist\//i,
  /build\//i,
  /coverage\//i,
  /\.next\//i,
  /\.vite\//i,
  /\.cache\//i,
  /\.log$/i,
  /generated\//i,
  /\.min\.(js|css)$/i,
  /\.(png|jpg|jpeg|gif|svg|webp|ico)$/i,
  /package-lock\.json$/i,
  /yarn\.lock$/i,
  /pnpm-lock\.yaml$/i,
];

const RISKY_PATTERNS = [
  /\.env(\.local|\.production|\.development)?$/i,
  /\.(pem|key)$/i,
  /credentials\..*$/i,
  /secrets\..*$/i,
];

export class GitPreprocessService {
  preprocess(text: string): PreprocessedPayload {
    const originalInputSize = text.length;
    const lines = text.split('\n');
    
    const filesDetected: string[] = [];
    const highSignalFiles: string[] = [];
    const ignoredFiles: string[] = [];
    const riskyFiles: string[] = [];
    
    const sanitizedLines: string[] = [];
    let isCurrentlyIgnoring = false;
    let currentFile: string | null = null;

    lines.forEach(line => {
      // Detect file markers in diffs
      if (line.startsWith('+++ ') || line.startsWith('--- ') || line.startsWith('diff ')) {
        const filePath = line.slice(4).trim();
        currentFile = filePath;
        
        if (!filesDetected.includes(filePath)) {
          filesDetected.push(filePath);
        }

        const isRisky = RISKY_PATTERNS.some(p => p.test(filePath));
        const isIgnored = IGNORED_PATTERNS.some(p => p.test(filePath));
        const isHighSignal = HIGH_SIGNAL_PATTERNS.some(p => p.test(filePath));

        if (isRisky) riskyFiles.push(filePath);
        if (isIgnored) ignoredFiles.push(filePath);
        if (isHighSignal) highSignalFiles.push(filePath);

        isCurrentlyIgnoring = isIgnored;
        
        // Keep the file header for context, but mark if it's risky
        sanitizedLines.push(line);
        return;
      }

      // Filter content based on file classification
      if (isCurrentlyIgnoring) {
        return;
      }

      // Special handling for risky files: we keep the header but redact the content
      // redactSecrets handles the actual value redaction, but we can also add a warning
      sanitizedLines.push(line);
    });

    let sanitizedText = sanitizedLines.join('\n');
    const { text: finalRedactedText, secretsRedactedCount } = redactSecrets(sanitizedText);
    
    return {
      sanitizedText: finalRedactedText,
      metadata: {
        filesDetected,
        highSignalFiles,
        ignoredFiles,
        riskyFiles,
        redactionCount: secretsRedactedCount,
        originalInputSize,
        sanitizedInputSize: finalRedactedText.length,
        wasFiltered: sanitizedLines.length < lines.length,
      },
    };
  }
}

export const gitPreprocessService = new GitPreprocessService();
