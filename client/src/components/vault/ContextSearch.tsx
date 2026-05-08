import { useState, useMemo, useEffect } from 'react';
import { Search, X, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils';
import { Button } from '../ui/Button';
import type { ProjectContext } from '../../types/context.types';

interface SearchResult {
  versionNumber?: number;
  createdAt?: string;
  section: string;
  sectionId: string;
  text: string;
  matchIndex: number;
}

interface ContextSearchProps {
  context: ProjectContext | null;
  history: { versionNumber: number; createdAt: string; contextJson: ProjectContext }[];
  onJumpToSection: (sectionId: string) => void;
  onVersionSelect: (versionNumber: number) => void;
}

export const ContextSearch = ({ context, history, onJumpToSection, onVersionSelect }: ContextSearchProps) => {
  const [query, setQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchScope, setSearchScope] = useState<'latest' | 'all'>('latest');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen || !isFocused) return;
      if (e.key === 'Escape') {
        setQuery('');
        setIsFocused(false);
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFocused, isOpen]);

  const allResults = useMemo(() => {
    if (!query.trim()) return [];

    const searchLower = query.trim().toLowerCase();
    const matches: SearchResult[] = [];

    const sections: { id: string; label: string; fields: (keyof ProjectContext)[] }[] = [
      { id: 'overview', label: 'Overview', fields: ['project_goal'] },
      { id: 'features', label: 'Features', fields: ['features', 'removed_features'] },
      { id: 'decisions', label: 'Decisions', fields: ['decisions'] },
      { id: 'issues', label: 'Issues', fields: ['current_issues', 'resolved_issues'] },
      { id: 'dependencies', label: 'Dependencies', fields: ['dependencies'] },
      { id: 'constraints', label: 'Constraints', fields: ['important_constraints'] },
      { id: 'next_steps', label: 'Next Steps', fields: ['next_steps'] },
    ];

    const performSearch = (ctx: ProjectContext, versionNumber?: number, createdAt?: string) => {
      sections.forEach(section => {
        section.fields.forEach(field => {
          const value = ctx[field];
          if (!value) return;

          if (Array.isArray(value)) {
            value.forEach(item => {
              if (typeof item === 'string' && item.toLowerCase().includes(searchLower)) {
                matches.push({
                  versionNumber,
                  createdAt,
                  section: section.label,
                  sectionId: section.id,
                  text: item,
                  matchIndex: item.toLowerCase().indexOf(searchLower),
                });
              }
            });
          } else if (typeof value === 'string' && value.toLowerCase().includes(searchLower)) {
            matches.push({
              versionNumber,
              createdAt,
              section: section.label,
              sectionId: section.id,
              text: value,
              matchIndex: value.toLowerCase().indexOf(searchLower),
            });
          }
        });
      });
    };

    if (searchScope === 'latest') {
      if (context) performSearch(context);
    } else {
      history.forEach(v => {
        performSearch(v.contextJson, v.versionNumber, v.createdAt);
      });
    }

    return matches;
  }, [context, history, query, searchScope]);

  const filteredResults = useMemo(() => {
    if (!activeFilter) return allResults;
    return allResults.filter(r => r.section === activeFilter);
  }, [allResults, activeFilter]);

  const sectionCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allResults.forEach(r => {
      counts[r.section] = (counts[r.section] || 0) + 1;
    });
    return counts;
  }, [allResults]);

  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const lowerText = text.toLowerCase();
    const lowerQuery = query.trim().toLowerCase();
    const index = lowerText.indexOf(lowerQuery);
    if (index === -1) return text;

    return (
      <>
        {text.substring(0, index)}
        <span className="bg-accent/30 dark:bg-accent/40 text-accent dark:text-accent font-medium rounded-sm px-0.5">
          {text.substring(index, index + query.trim().length)}
        </span>
        {text.substring(index + query.trim().length)}
      </>
    );
  };

  return (
    <div className="relative w-auto mb-0">
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          onClick={() => {
            setIsOpen(!isOpen);
            if (!isOpen) setTimeout(() => setIsFocused(true), 100);
          }}
          className={cn(
            "h-10 px-4 rounded-xl border transition-all gap-2 text-sm font-medium",
            isOpen 
              ? "bg-surface dark:bg-surface-elevated border-accent ring-2 ring-accent/20 text-accent" 
              : "border-surface-border dark:border-accent/20 text-text-secondary hover:text-primary"
          )}
        >
          <Search className="w-4 h-4" />
          <span>Search Context</span>
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute top-full right-0 mt-2 w-full min-w-[400px] bg-surface dark:bg-surface-elevated border border-surface-border dark:border-accent/20 rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-4 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="inline-flex p-1 bg-stone-100 dark:bg-surface rounded-lg border border-surface-border dark:border-accent/10">
                    <button
                      onClick={() => { setSearchScope('latest'); setActiveFilter(null); }}
                      className={cn(
                        "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all",
                        searchScope === 'latest' 
                          ? "bg-white dark:bg-surface-elevated text-primary dark:text-accent shadow-sm" 
                          : "text-text-secondary hover:text-primary"
                      )}
                    >
                      Latest
                    </button>
                    <button
                      onClick={() => { setSearchScope('all'); setActiveFilter(null); }}
                      className={cn(
                        "px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all",
                        searchScope === 'all' 
                          ? "bg-white dark:bg-surface-elevated text-primary dark:text-accent shadow-sm" 
                          : "text-text-secondary hover:text-primary"
                      )}
                    >
                      All Versions
                    </button>
                  </div>
                  <button 
                    onClick={() => setIsOpen(false)}
                    className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-surface text-stone-400 dark:text-text-secondary transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className={cn(
                  "relative flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-200",
                  isFocused 
                    ? "border-accent ring-2 ring-accent/20 bg-surface dark:bg-surface-elevated" 
                    : "border-surface-border dark:border-accent/20 bg-stone-50 dark:bg-surface"
                )}>
                  <Search className="w-4 h-4 text-stone-400 dark:text-text-secondary" />
                  <input
                    type="text"
                    autoFocus
                    value={query}
                    onChange={(e) => {
                      setQuery(e.target.value);
                      setActiveFilter(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && filteredResults.length > 0) {
                        const first = filteredResults[0];
                        if (first.versionNumber !== undefined) {
                          onVersionSelect(first.versionNumber);
                        }
                        onJumpToSection(first.sectionId);
                        setQuery('');
                        setIsOpen(false);
                      }
                    }}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder="Search context..."
                    className="flex-1 bg-transparent border-none outline-none text-sm text-primary dark:text-text-primary placeholder:text-stone-400 dark:placeholder:text-text-secondary"
                  />
                  {query && (
                    <button 
                      onClick={() => {
                        setQuery('');
                        setActiveFilter(null);
                      }}
                      className="p-1 rounded-md hover:bg-stone-100 dark:hover:bg-surface text-stone-400 dark:text-text-secondary transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[320px] overflow-y-auto custom-scrollbar">
                {query.trim() ? (
                  allResults.length > 0 ? (
                    <div className="space-y-4">
                      <div className="px-1 pb-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-medium text-text-secondary">
                            {allResults.length} {allResults.length === 1 ? 'match' : 'matches'} found
                            {searchScope === 'all' && ` across ${new Set(allResults.map(r => r.versionNumber)).size} versions`}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <button
                            onClick={() => setActiveFilter(null)}
                            className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-colors",
                              !activeFilter 
                                ? "bg-accent text-white" 
                                : "bg-stone-100 dark:bg-surface text-text-secondary hover:bg-stone-200 dark:hover:bg-surface-elevated"
                            )}
                          >
                            All
                          </button>
                          {Object.entries(sectionCounts).map(([section, count]) => (
                            <button
                              key={section}
                              onClick={() => setActiveFilter(section)}
                              className={cn(
                                "px-2 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider transition-colors",
                                activeFilter === section 
                                  ? "bg-accent text-white" 
                                  : "bg-stone-100 dark:bg-surface text-text-secondary hover:bg-stone-200 dark:hover:bg-surface-elevated"
                                )}
                            >
                              {section} ({count})
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1">
                        {filteredResults.slice(0, 15).map((result, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              if (result.versionNumber !== undefined) {
                                onVersionSelect(result.versionNumber);
                              }
                              onJumpToSection(result.sectionId);
                              setQuery('');
                              setIsOpen(false);
                            }}
                            className="w-full flex items-center justify-between gap-4 p-2.5 rounded-xl hover:bg-stone-50 dark:hover:bg-surface transition-colors text-left group"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-[9px] font-bold text-accent dark:text-accent uppercase tracking-wider">
                                  {result.versionNumber !== undefined ? `v${result.versionNumber}` : 'Latest'}
                                </span>
                                <span className="text-stone-300 dark:text-text-secondary/30 text-[9px]">•</span>
                                <span className="text-[9px] font-bold text-stone-400 dark:text-text-secondary uppercase tracking-wider">
                                  {result.section}
                                </span>
                              </div>
                              <p className="text-xs text-primary dark:text-text-primary truncate">
                                {highlightMatch(result.text, query)}
                              </p>
                            </div>
                            <ArrowRight className="w-3 h-3 text-stone-300 group-hover:text-accent transition-colors" />
                          </button>
                        ))}
                        {filteredResults.length > 15 && (
                          <div className="p-2 text-center">
                            <span className="text-[9px] text-text-secondary italic">
                              Showing first 15 of {filteredResults.length} matches
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="py-12 px-4 text-center space-y-2">
                      <p className="text-xs text-text-secondary dark:text-text-secondary">
                        {searchScope === 'latest' 
                          ? 'No matches found in the current context.' 
                          : 'No matches found across version history.'}
                      </p>
                      <p className="text-[10px] text-stone-400 dark:text-text-secondary/50">
                        Try searching for a feature, decision, issue, or dependency.
                      </p>
                    </div>
                   )
                 ) : null}
               </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
