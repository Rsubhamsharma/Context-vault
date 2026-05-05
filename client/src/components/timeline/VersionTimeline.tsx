import { TimelineItem } from './TimelineItem';
import type { HistoryItem } from '../../services/contextHistory.service';

interface VersionTimelineProps {
  history: HistoryItem[];
  activeVersion: number | null;
  onVersionSelect: (version: number) => void;
  onCompareVersions: (from: number, to: number) => void;
  onRestoreVersion: (version: number) => void;
}

const formatUpdateSummary = (updateJson: any): string[] => {
  if (!updateJson) return [];
  
  const summaries: string[] = [];
  
  if (updateJson.features_added?.length) {
    updateJson.features_added.forEach((f: string) => summaries.push(`Added: ${f}`));
  }
  if (updateJson.issues_resolved?.length) {
    updateJson.issues_resolved.forEach((i: string) => summaries.push(`Resolved: ${i}`));
  }
  if (updateJson.decisions_made?.length) {
    updateJson.decisions_made.forEach((d: string) => summaries.push(`Decision: ${d}`));
  }
  if (updateJson.next_steps?.length) {
    updateJson.next_steps.forEach((s: string) => summaries.push(`Next: ${s}`));
  }
  
  return summaries;
};

export const VersionTimeline = ({ 
  history, 
  activeVersion, 
  onVersionSelect,
  onCompareVersions,
  onRestoreVersion
}: VersionTimelineProps) => {
  if (!history || history.length === 0) {
    return (
      <div className="p-6 text-center text-sm text-text-secondary italic border border-dashed border-surface-border rounded-2xl">
        No history available yet
      </div>
    );
  }

  return (
    <div className="h-full overflow-x-visible pr-2 pl-1">
      <div className="relative pt-2 overflow-visible">
        {history.map((item, index) => {
          const isLatest = index === 0;
          const nextItem = index > 0 ? history[index - 1] : null;
          
          return (
            <TimelineItem 
              key={item.versionNumber}
              version={item.versionNumber}
              date={item.createdAt}
              summary={formatUpdateSummary(item.update?.extractedUpdateJson)}
              isActive={activeVersion === item.versionNumber}
              isLatest={isLatest}
              onClick={() => onVersionSelect(item.versionNumber)}
              onCompare={() => {
                if (nextItem) {
                  onCompareVersions(item.versionNumber, nextItem.versionNumber);
                }
              }}
              onRestore={() => onRestoreVersion(item.versionNumber)}
            />
          );
        })}
      </div>
    </div>
  );
};



