import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Layers, Repeat, Zap, FileText, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import { AppLayout } from '../components/layout/AppLayout';

const ProductPreview = () => {
  return (
    <div className="relative p-4 bg-stone-100 dark:bg-surface-elevated/50 rounded-3xl border border-surface-border dark:border-accent/10 shadow-xl max-w-md mx-auto w-full transition-all duration-300">
      <div className="bg-white dark:bg-surface rounded-2xl border border-surface-border dark:border-accent/10 shadow-sm overflow-hidden">
        <div className="px-4 py-3 border-b border-surface-border dark:border-accent/10 flex items-center justify-between bg-stone-50 dark:bg-surface-elevated">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-400" />
            <div className="w-3 h-3 rounded-full bg-amber-400" />
            <div className="w-3 h-3 rounded-full bg-green-400" />
          </div>
          <div className="text-xs font-medium text-stone-400 dark:text-text-secondary/60">context_vault</div>
        </div>
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-text-primary dark:text-text-primary text-sm">My Project</h4>
            <Badge variant="accent" className="text-[10px]">v3</Badge>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-stone-400 dark:text-text-secondary tracking-wider">Tech Stack</p>
              <div className="flex flex-wrap gap-1">
                {['React', 'Node.js', 'PostgreSQL'].map(f => (
                  <span key={f} className="text-[10px] px-2 py-0.5 bg-stone-100 dark:bg-surface-elevated border border-surface-border dark:border-accent/10 rounded-full text-stone-600 dark:text-text-secondary">{f}</span>
                ))}
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-stone-400 dark:text-text-secondary tracking-wider">Decisions</p>
              <div className="text-xs text-stone-600 dark:text-text-primary">Use JWT for authentication</div>
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-stone-400 dark:text-text-secondary tracking-wider">Next Steps</p>
              <div className="text-xs text-stone-600 dark:text-text-primary">Add unit tests for API layer</div>
            </div>
          </div>
          <div className="pt-4 border-t border-surface-border dark:border-accent/10 flex justify-end">
            <Button size="sm" className="text-xs py-1 px-3 h-8 gap-1 bg-accent hover:bg-accent/90 border-none">
              <FileText className="w-3 h-3" /> Export
            </Button>
          </div>
        </div>
      </div>
      <div className="absolute -top-4 -right-4 w-24 h-24 bg-accent/20 blur-3xl rounded-full" />
      <div className="absolute -bottom-4 -left-4 w-24 h-24 bg-accent/20 blur-3xl rounded-full" />
    </div>
  );
};

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" }
  }
} as const;

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
} as const;

export const LandingPage = () => {
  return (
    <AppLayout>
      <div className="flex flex-col gap-24 pb-24">
        {/* Hero */}
        <section className="pt-12 sm:pt-20 text-center space-y-8 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-accent text-xs font-medium"
          >
            <Shield className="w-3 h-3" />
            Portable memory for AI-built projects
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold text-text-primary tracking-tight leading-[1.1]"
          >
            Keep your AI project context{' '}
            <span className="text-accent">clean, versioned, and portable.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg sm:text-xl text-text-secondary max-w-2xl mx-auto leading-relaxed"
          >
            Context Vault turns messy AI coding sessions into structured project memory
            you can reuse across ChatGPT, Claude, Cursor, Windsurf, and more.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link to="/signup">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="w-5 h-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="outline" size="lg">Login</Button>
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pt-16"
          >
            <ProductPreview />
          </motion.div>
        </section>

        {/* Problem Section */}
        <motion.section 
          id="problem" 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="grid md:grid-cols-2 gap-12 lg:gap-16 items-center"
        >
          <motion.div variants={fadeIn} className="space-y-8">
            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">
                The &ldquo;Context Drift&rdquo; Problem
              </h2>
              <p className="text-lg text-text-secondary leading-relaxed">
                You start a project with Claude, move to Cursor for a feature, and jump to ChatGPT for a bug.
                Suddenly, none of them know the full current state of your project.
              </p>
            </div>
            <div className="grid gap-4">
              {[
                'Fragmented memory across different AI tools',
                'Constant repetition of project goals and constraints',
                'Loss of architectural decisions over time',
                'Messy session notes that are hard to summarize',
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-surface dark:bg-surface-elevated border border-surface-border dark:border-accent/10 transition-all hover:border-accent/30">
                  <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                  <span className="text-text-primary font-medium">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>
          <motion.div variants={fadeIn} className="space-y-6">
            <div className="p-8 glass-card bg-stone-50 dark:bg-surface-elevated/30 relative overflow-hidden dark:border-accent/10">
              <div className="absolute top-0 right-0 p-2">
                <Badge variant="outline" className="text-[10px] uppercase tracking-wider">Before</Badge>
              </div>
              <h4 className="font-bold text-text-primary mb-4">Without Context Vault</h4>
              <div className="space-y-3 opacity-60 grayscale dark:grayscale-0">
                <div className="p-3 bg-white dark:bg-surface border border-surface-border dark:border-accent/10 rounded-lg text-xs text-stone-500 dark:text-text-secondary italic">
                  &ldquo;Hey Claude, remember we used PostgreSQL? Actually, I changed it...&rdquo;
                </div>
                <div className="p-3 bg-white dark:bg-surface border border-surface-border dark:border-accent/10 rounded-lg text-xs text-stone-500 dark:text-text-secondary italic">
                  &ldquo;Wait, did I tell you about the Auth middleware bug?&rdquo;
                </div>
                <div className="p-3 bg-white dark:bg-surface border border-surface-border dark:border-accent/10 rounded-lg text-xs text-stone-500 dark:text-text-secondary italic">
                  &ldquo;Here is the whole codebase again because you forgot...&rdquo;
                </div>
              </div>
            </div>
            <div className="p-8 glass-card bg-white dark:bg-surface-elevated relative overflow-hidden border-accent dark:border-accent shadow-md shadow-accent/5">
              <div className="absolute top-0 right-0 p-2">
                <Badge variant="accent" className="text-[10px] uppercase tracking-wider">After</Badge>
              </div>
              <h4 className="font-bold text-text-primary mb-4">With Context Vault</h4>
              <div className="space-y-3">
                {[
                  'All tools share the same source of truth',
                  'Versioned history of project decisions',
                  'One-click export for any AI model',
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 bg-stone-50 dark:bg-surface border border-accent/20 rounded-lg text-xs text-text-primary font-medium">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    {text}
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </motion.section>

        {/* How it Works */}
        <motion.section 
          id="how-it-works" 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={staggerContainer}
          className="space-y-12"
        >
          <motion.div variants={fadeIn} className="text-center space-y-4">
            <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">How it Works</h2>
            <p className="text-text-secondary max-w-xl mx-auto">A simple pipeline for persistent project memory</p>
          </motion.div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Layers, title: 'Add a Project', desc: 'Create a dedicated vault for your codebase.' },
              { icon: Zap, title: 'Paste Updates', desc: 'Drop in your latest AI session notes or handoffs.' },
              { icon: Repeat, title: 'Structured Merge', desc: 'AI extracts and merges memory into versioned snapshots.' },
              { icon: ArrowRight, title: 'Export Context', desc: 'Get clean, AI-ready context for any tool.' },
            ].map((step, i) => (
              <motion.div
                key={i}
                whileHover={{ y: -5 }}
                className="p-8 glass-card text-center group hover:border-accent dark:border-accent/10 dark:hover:border-accent/40 transition-all bg-surface dark:bg-surface-elevated/50"
              >
                <div className="w-14 h-14 bg-stone-100 dark:bg-surface rounded-2xl flex items-center justify-center mx-auto mb-6 text-accent group-hover:bg-accent group-hover:text-white transition-colors border border-transparent dark:border-accent/20">
                  <step.icon className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-text-primary mb-2">{step.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* CTA */}
        <motion.section 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto w-full px-4"
        >
          <div className="bg-surface dark:bg-surface-elevated border border-surface-border dark:border-accent/20 rounded-3xl p-8 sm:p-12 text-center space-y-8 relative overflow-hidden shadow-xl shadow-accent/5">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
              <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-accent rounded-full blur-[100px]" />
              <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-accent rounded-full blur-[100px]" />
            </div>
            <div className="relative z-10 space-y-6">
              <h2 className="text-3xl sm:text-4xl font-bold text-text-primary tracking-tight">Ready to stop repeating yourself?</h2>
              <p className="text-text-secondary max-w-xl mx-auto text-lg leading-relaxed">
                Join developers who use Context Vault to maintain a single, portable source of truth for their AI-driven projects.
              </p>
              <Link to="/signup">
                <Button size="lg" className="px-10 shadow-lg transition-all duration-200">
                  Create Your Free Vault
                </Button>
              </Link>
            </div>
          </div>
        </motion.section>
      </div>
    </AppLayout>
  );
};
