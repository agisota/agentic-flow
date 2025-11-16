/**
 * DSPy Command Handler for AgentDB CLI
 *
 * Handles all dspy subcommands in the existing CLI pattern
 */

import { DSPyController } from '../dspy/DSPyController.js';
import { ReasoningBank } from '../controllers/ReasoningBank.js';
import { LearningSystem } from '../controllers/LearningSystem.js';
import { ReflexionMemory } from '../controllers/ReflexionMemory.js';
import { SkillLibrary } from '../controllers/SkillLibrary.js';
import { CausalMemoryGraph } from '../controllers/CausalMemoryGraph.js';
import { EmbeddingService } from '../controllers/EmbeddingService.js';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg: string) => console.error(`${colors.red}❌ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ ${msg}${colors.reset}`),
  warning: (msg: string) => console.log(`${colors.yellow}⚠ ${msg}${colors.reset}`),
  header: (msg: string) => console.log(`${colors.bright}${colors.cyan}${msg}${colors.reset}`)
};

type Database = any;

/**
 * Handle DSPy commands
 */
export async function handleDSPyCommands(
  db: Database,
  embedder: EmbeddingService,
  subcommand: string,
  args: string[]
): Promise<void> {
  // Initialize DSPy controller
  const reasoningBank = new ReasoningBank(db, embedder);
  const learningSystem = new LearningSystem(db);
  const reflexionMemory = new ReflexionMemory(db, embedder);
  const skillLibrary = new SkillLibrary(db, embedder);
  const causalGraph = new CausalMemoryGraph(db);

  const dspyController = new DSPyController(
    db,
    reasoningBank,
    learningSystem,
    reflexionMemory,
    skillLibrary,
    causalGraph,
    embedder,
    {
      apiKey: process.env.OPENAI_API_KEY || process.env.ANTHROPIC_API_KEY,
      model: process.env.DSPY_MODEL || 'gpt-4',
    }
  );

  try {
    switch (subcommand) {
      case 'optimize-query': {
        const query = args[0];
        if (!query) {
          log.error('Query required: agentdb dspy optimize-query "<query>"');
          process.exit(1);
        }

        log.header('\n🔍 Optimizing Query with DSPy ChainOfThought\n');
        const result = await dspyController.optimizeQuery(query);

        console.log(`${colors.gray}Original:${colors.reset} ${result.original}`);
        console.log(`${colors.yellow}Optimized:${colors.reset} ${result.optimized}`);
        console.log(`${colors.blue}Reasoning:${colors.reset} ${result.reasoning}`);
        console.log(`${colors.cyan}Relevance Score:${colors.reset} ${result.relevanceScore.toFixed(2)}`);

        if (result.suggestedFilters && Object.keys(result.suggestedFilters).length > 0) {
          console.log(`${colors.magenta}Suggested Filters:${colors.reset}`, JSON.stringify(result.suggestedFilters, null, 2));
        }
        log.success('Query optimization complete');
        break;
      }

      case 'judge-trajectory': {
        const id = parseInt(args[0]);
        if (isNaN(id)) {
          log.error('Trajectory ID required: agentdb dspy judge-trajectory <id>');
          process.exit(1);
        }

        log.header(`\n🧑‍⚖️ Judging Trajectory #${id}\n`);
        const verdict = await dspyController.judgeTrajectory(id);

        console.log(`${colors.cyan}Score:${colors.reset} ${verdict.score.toFixed(2)}`);
        console.log(`${colors.blue}Reasoning:${colors.reset} ${verdict.reasoning}\n`);

        console.log(`${colors.green}Strengths:${colors.reset}`);
        verdict.strengths.forEach(s => console.log(`${colors.gray}  •${colors.reset} ${s}`));

        console.log(`\n${colors.yellow}Weaknesses:${colors.reset}`);
        verdict.weaknesses.forEach(w => console.log(`${colors.gray}  •${colors.reset} ${w}`));

        console.log(`\n${colors.magenta}Suggestions:${colors.reset}`);
        verdict.suggestions.forEach(s => console.log(`${colors.gray}  •${colors.reset} ${s}`));

        log.success('Trajectory judgment complete');
        break;
      }

      case 'distill-memory': {
        const ids = args.map(arg => parseInt(arg)).filter(id => !isNaN(id));
        if (ids.length === 0) {
          log.error('Episode IDs required: agentdb dspy distill-memory <id1> <id2> ...');
          process.exit(1);
        }

        log.header(`\n🧠 Distilling Insights from ${ids.length} Episodes\n`);
        const insights = await dspyController.distillMemory(ids);

        console.log(`${colors.green}Extracted ${insights.length} insights:\n${colors.reset}`);

        insights.forEach((insight, i) => {
          console.log(`${colors.yellow}Insight #${i + 1}:${colors.reset} ${insight.pattern}`);
          console.log(`${colors.cyan}  Confidence:${colors.reset} ${insight.confidence.toFixed(2)}`);
          console.log(`${colors.blue}  Category:${colors.reset} ${insight.category}`);
          console.log(`${colors.gray}  Actionable:${colors.reset} ${insight.actionable ? '✓' : '✗'}`);
          console.log(`${colors.gray}  Evidence:${colors.reset} ${insight.evidence.length} items\n`);
        });

        log.success('Memory distillation complete');
        break;
      }

      case 'discover-causality': {
        const minConfidence = parseFloat(args.find(a => a.startsWith('--min-confidence='))?.split('=')[1] || '0.6');
        const maxHypotheses = parseInt(args.find(a => a.startsWith('--max-hypotheses='))?.split('=')[1] || '10');
        const focusArea = args.find(a => a.startsWith('--focus='))?.split('=')[1];

        log.header('\n🔬 Discovering Causal Hypotheses\n');
        const hypotheses = await dspyController.discoverCausality({
          minConfidence,
          maxHypotheses,
          focusArea,
        });

        console.log(`${colors.green}Generated ${hypotheses.length} hypotheses:\n${colors.reset}`);

        hypotheses.forEach((hyp, i) => {
          const priorityColor = hyp.priority === 'high' ? colors.red : hyp.priority === 'medium' ? colors.yellow : colors.gray;

          console.log(`${colors.yellow}Hypothesis #${i + 1}:${colors.reset} ${priorityColor}[${hyp.priority.toUpperCase()}]${colors.reset}`);
          console.log(`${colors.cyan}  Intervention:${colors.reset} ${hyp.intervention}`);
          console.log(`${colors.blue}  Outcome:${colors.reset} ${hyp.outcome}`);
          console.log(`${colors.gray}  Confidence:${colors.reset} ${hyp.confidence.toFixed(2)}`);
          console.log(`${colors.gray}  Testable:${colors.reset} ${hyp.testable ? '✓' : '✗'}`);
          console.log(`${colors.gray}  Evidence:${colors.reset} ${hyp.evidence.length} items\n`);
        });

        log.success('Causal discovery complete');
        break;
      }

      case 'synthesize-skill': {
        const ids = args.map(arg => parseInt(arg)).filter(id => !isNaN(id));
        if (ids.length === 0) {
          log.error('Episode IDs required: agentdb dspy synthesize-skill <id1> <id2> ...');
          process.exit(1);
        }

        log.header(`\n🛠️ Synthesizing Skill from ${ids.length} Episodes\n`);
        const skill = await dspyController.synthesizeSkill(ids);

        console.log(`${colors.yellow}Name:${colors.reset} ${skill.name}`);
        console.log(`${colors.blue}Description:${colors.reset} ${skill.description}`);
        console.log(`${colors.cyan}Approach:${colors.reset} ${skill.approach}`);
        console.log(`${colors.gray}Estimated Success Rate:${colors.reset} ${skill.estimatedSuccessRate.toFixed(2)}\n`);

        console.log(`${colors.magenta}Preconditions:${colors.reset}`);
        skill.preconditions.forEach(p => console.log(`${colors.gray}  •${colors.reset} ${p}`));

        console.log(`\n${colors.magenta}Postconditions:${colors.reset}`);
        skill.postconditions.forEach(p => console.log(`${colors.gray}  •${colors.reset} ${p}`));

        log.success('Skill synthesis complete');
        break;
      }

      case 'stats': {
        log.header('\n📊 DSPy Integration Statistics\n');
        const stats = dspyController.getDSPyStats();

        console.log(`${colors.yellow}Query Optimization:${colors.reset}`);
        console.log(`${colors.gray}  Total queries:${colors.reset} ${stats.queryOptimization.total}`);
        console.log(`${colors.gray}  Avg relevance:${colors.reset} ${(stats.queryOptimization.avg_relevance || 0).toFixed(2)}`);
        console.log(`${colors.gray}  Total uses:${colors.reset} ${stats.queryOptimization.total_uses}`);

        console.log(`\n${colors.yellow}Trajectory Judgment:${colors.reset}`);
        console.log(`${colors.gray}  Total verdicts:${colors.reset} ${stats.trajectoryJudgment.total}`);
        console.log(`${colors.gray}  Avg score:${colors.reset} ${(stats.trajectoryJudgment.avg_score || 0).toFixed(2)}`);
        console.log(`${colors.gray}  High quality:${colors.reset} ${stats.trajectoryJudgment.high_quality}`);

        console.log(`\n${colors.yellow}Memory Distillation:${colors.reset}`);
        console.log(`${colors.gray}  Total insights:${colors.reset} ${stats.memoryDistillation.total}`);
        console.log(`${colors.gray}  Avg confidence:${colors.reset} ${(stats.memoryDistillation.avg_confidence || 0).toFixed(2)}`);
        console.log(`${colors.gray}  Actionable:${colors.reset} ${stats.memoryDistillation.actionable}`);
        console.log(`${colors.gray}  Applied:${colors.reset} ${stats.memoryDistillation.applied}`);

        console.log(`\n${colors.yellow}Causal Discovery:${colors.reset}`);
        console.log(`${colors.gray}  Total hypotheses:${colors.reset} ${stats.causalDiscovery.total}`);
        console.log(`${colors.gray}  Avg confidence:${colors.reset} ${(stats.causalDiscovery.avg_confidence || 0).toFixed(2)}`);
        console.log(`${colors.gray}  Tested:${colors.reset} ${stats.causalDiscovery.tested}`);
        console.log(`${colors.gray}  High priority:${colors.reset} ${stats.causalDiscovery.high_priority}`);

        console.log(`\n${colors.yellow}Skill Synthesis:${colors.reset}`);
        console.log(`${colors.gray}  Total skills:${colors.reset} ${stats.skillSynthesis.total}`);
        console.log(`${colors.gray}  Avg estimated success:${colors.reset} ${(stats.skillSynthesis.avg_estimated_success || 0).toFixed(2)}`);
        console.log(`${colors.gray}  Avg actual success:${colors.reset} ${(stats.skillSynthesis.avg_actual_success || 0).toFixed(2)}`);
        console.log(`${colors.gray}  Total uses:${colors.reset} ${stats.skillSynthesis.total_uses}`);

        log.success('Statistics retrieved');
        break;
      }

      case 'clear': {
        const all = args.includes('--all');
        const options = {
          queries: all || args.includes('--queries'),
          verdicts: all || args.includes('--verdicts'),
          insights: all || args.includes('--insights'),
          hypotheses: all || args.includes('--hypotheses'),
          skills: all || args.includes('--skills'),
        };

        dspyController.clearDSPyData(options);
        log.success('DSPy data cleared successfully');
        break;
      }

      default:
        log.error(`Unknown dspy subcommand: ${subcommand}`);
        printDSPyHelp();
        process.exit(1);
    }
  } catch (error: any) {
    log.error(`DSPy command failed: ${error.message}`);
    process.exit(1);
  }
}

function printDSPyHelp(): void {
  console.log(`
${colors.bright}${colors.cyan}AgentDB DSPy Commands${colors.reset}

${colors.bright}USAGE:${colors.reset}
  agentdb dspy <subcommand> [options]

${colors.bright}SUBCOMMANDS:${colors.reset}
  ${colors.green}optimize-query${colors.reset} <query>
    Optimize a query using ChainOfThought reasoning

  ${colors.green}judge-trajectory${colors.reset} <id>
    Evaluate a trajectory (episode) with structured feedback

  ${colors.green}distill-memory${colors.reset} <id1> <id2> ...
    Extract actionable insights from episodic memory

  ${colors.green}discover-causality${colors.reset} [--min-confidence=0.6] [--max-hypotheses=10] [--focus=<area>]
    Generate testable causal hypotheses

  ${colors.green}synthesize-skill${colors.reset} <id1> <id2> ...
    Create a reusable skill from successful episodes

  ${colors.green}stats${colors.reset}
    Display DSPy integration statistics

  ${colors.green}clear${colors.reset} [--all] [--queries] [--verdicts] [--insights] [--hypotheses] [--skills]
    Clear DSPy data

${colors.bright}EXAMPLES:${colors.reset}
  agentdb dspy optimize-query "implement authentication"
  agentdb dspy judge-trajectory 42
  agentdb dspy distill-memory 1 2 3 4 5
  agentdb dspy discover-causality --focus="code quality"
  agentdb dspy synthesize-skill 10 11 12
  agentdb dspy stats
  agentdb dspy clear --all
`);
}
