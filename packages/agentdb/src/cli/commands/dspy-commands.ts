/**
 * DSPy CLI Commands
 *
 * Command-line interface for DSPy.ts integration features
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { DSPyController } from '../../dspy/DSPyController.js';
import { ReasoningBank } from '../../controllers/ReasoningBank.js';
import { LearningSystem } from '../../controllers/LearningSystem.js';
import { ReflexionMemory } from '../../controllers/ReflexionMemory.js';
import { SkillLibrary } from '../../controllers/SkillLibrary.js';
import { CausalMemoryGraph } from '../../controllers/CausalMemoryGraph.js';
import { EmbeddingService } from '../../controllers/EmbeddingService.js';

type Database = any;

export function createDSPyCommands(
  program: Command,
  getDB: () => Database,
  getEmbedder: () => EmbeddingService
): Command {
  const dspy = program
    .command('dspy')
    .description('DSPy.ts integration commands for self-learning and reasoning');

  /**
   * Initialize DSPy controllers
   */
  function getDSPyController(): DSPyController {
    const db = getDB();
    const embedder = getEmbedder();

    const reasoningBank = new ReasoningBank(db, embedder);
    const learningSystem = new LearningSystem(db);
    const reflexionMemory = new ReflexionMemory(db);
    const skillLibrary = new SkillLibrary(db, embedder);
    const causalGraph = new CausalMemoryGraph(db);

    return new DSPyController(
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
        temperature: 0.7,
      }
    );
  }

  /**
   * Optimize Query Command
   */
  dspy
    .command('optimize-query')
    .description('Optimize a query using ChainOfThought reasoning')
    .argument('<query>', 'Query to optimize')
    .option('--json', 'Output as JSON')
    .action(async (query: string, options: any) => {
      try {
        console.log(chalk.blue('🔍 Optimizing query with DSPy ChainOfThought...'));

        const controller = getDSPyController();
        const result = await controller.optimizeQuery(query);

        if (options.json) {
          console.log(JSON.stringify(result, null, 2));
        } else {
          console.log(chalk.green('\n✅ Query Optimized:'));
          console.log(chalk.gray('Original:'), result.original);
          console.log(chalk.yellow('Optimized:'), result.optimized);
          console.log(chalk.blue('Reasoning:'), result.reasoning);
          console.log(chalk.cyan('Relevance Score:'), result.relevanceScore.toFixed(2));

          if (result.suggestedFilters && Object.keys(result.suggestedFilters).length > 0) {
            console.log(chalk.magenta('Suggested Filters:'), JSON.stringify(result.suggestedFilters, null, 2));
          }
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error optimizing query:'), error.message);
        process.exit(1);
      }
    });

  /**
   * Judge Trajectory Command
   */
  dspy
    .command('judge-trajectory')
    .description('Evaluate a trajectory using structured reasoning')
    .argument('<id>', 'Trajectory (episode) ID', parseInt)
    .option('--json', 'Output as JSON')
    .action(async (id: number, options: any) => {
      try {
        console.log(chalk.blue(`🧑‍⚖️ Judging trajectory ${id} with DSPy...`));

        const controller = getDSPyController();
        const verdict = await controller.judgeTrajectory(id);

        if (options.json) {
          console.log(JSON.stringify(verdict, null, 2));
        } else {
          console.log(chalk.green('\n✅ Trajectory Verdict:'));
          console.log(chalk.cyan('Score:'), verdict.score.toFixed(2));
          console.log(chalk.blue('Reasoning:'), verdict.reasoning);

          console.log(chalk.green('\nStrengths:'));
          verdict.strengths.forEach(s => console.log(chalk.gray('  •'), s));

          console.log(chalk.yellow('\nWeaknesses:'));
          verdict.weaknesses.forEach(w => console.log(chalk.gray('  •'), w));

          console.log(chalk.magenta('\nSuggestions:'));
          verdict.suggestions.forEach(s => console.log(chalk.gray('  •'), s));
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error judging trajectory:'), error.message);
        process.exit(1);
      }
    });

  /**
   * Distill Memory Command
   */
  dspy
    .command('distill-memory')
    .description('Extract insights from episodic memory')
    .argument('<ids...>', 'Episode IDs (space-separated)', (val: string) => parseInt(val))
    .option('--json', 'Output as JSON')
    .action(async (ids: number[], options: any) => {
      try {
        console.log(chalk.blue(`🧠 Distilling insights from ${ids.length} episodes...`));

        const controller = getDSPyController();
        const insights = await controller.distillMemory(ids);

        if (options.json) {
          console.log(JSON.stringify(insights, null, 2));
        } else {
          console.log(chalk.green(`\n✅ Extracted ${insights.length} insights:\n`));

          insights.forEach((insight, i) => {
            console.log(chalk.yellow(`Insight #${i + 1}:`), insight.pattern);
            console.log(chalk.cyan('  Confidence:'), insight.confidence.toFixed(2));
            console.log(chalk.blue('  Category:'), insight.category);
            console.log(chalk.gray('  Actionable:'), insight.actionable ? '✓' : '✗');
            console.log(chalk.gray('  Evidence:'), insight.evidence.length, 'items');
            console.log();
          });
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error distilling memory:'), error.message);
        process.exit(1);
      }
    });

  /**
   * Discover Causality Command
   */
  dspy
    .command('discover-causality')
    .description('Generate causal hypotheses from memory')
    .option('--min-confidence <value>', 'Minimum confidence threshold', parseFloat, 0.6)
    .option('--max-hypotheses <value>', 'Maximum hypotheses to generate', parseInt, 10)
    .option('--focus <area>', 'Focus area for discovery')
    .option('--json', 'Output as JSON')
    .action(async (options: any) => {
      try {
        console.log(chalk.blue('🔬 Discovering causal hypotheses with DSPy...'));

        const controller = getDSPyController();
        const hypotheses = await controller.discoverCausality({
          minConfidence: options.minConfidence,
          maxHypotheses: options.maxHypotheses,
          focusArea: options.focus,
        });

        if (options.json) {
          console.log(JSON.stringify(hypotheses, null, 2));
        } else {
          console.log(chalk.green(`\n✅ Generated ${hypotheses.length} hypotheses:\n`));

          hypotheses.forEach((hyp, i) => {
            const priorityColor = hyp.priority === 'high' ? chalk.red : hyp.priority === 'medium' ? chalk.yellow : chalk.gray;

            console.log(chalk.yellow(`Hypothesis #${i + 1}:`), priorityColor(`[${hyp.priority.toUpperCase()}]`));
            console.log(chalk.cyan('  Intervention:'), hyp.intervention);
            console.log(chalk.blue('  Outcome:'), hyp.outcome);
            console.log(chalk.gray('  Confidence:'), hyp.confidence.toFixed(2));
            console.log(chalk.gray('  Testable:'), hyp.testable ? '✓' : '✗');
            console.log(chalk.gray('  Evidence:'), hyp.evidence.length, 'items');
            console.log();
          });
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error discovering causality:'), error.message);
        process.exit(1);
      }
    });

  /**
   * Synthesize Skill Command
   */
  dspy
    .command('synthesize-skill')
    .description('Create a new skill from successful episodes')
    .argument('<ids...>', 'Episode IDs (space-separated)', (val: string) => parseInt(val))
    .option('--json', 'Output as JSON')
    .action(async (ids: number[], options: any) => {
      try {
        console.log(chalk.blue(`🛠️ Synthesizing skill from ${ids.length} episodes...`));

        const controller = getDSPyController();
        const skill = await controller.synthesizeSkill(ids);

        if (options.json) {
          console.log(JSON.stringify(skill, null, 2));
        } else {
          console.log(chalk.green('\n✅ Skill Synthesized:\n'));
          console.log(chalk.yellow('Name:'), skill.name);
          console.log(chalk.blue('Description:'), skill.description);
          console.log(chalk.cyan('Approach:'), skill.approach);
          console.log(chalk.gray('Estimated Success Rate:'), skill.estimatedSuccessRate.toFixed(2));

          console.log(chalk.magenta('\nPreconditions:'));
          skill.preconditions.forEach(p => console.log(chalk.gray('  •'), p));

          console.log(chalk.magenta('\nPostconditions:'));
          skill.postconditions.forEach(p => console.log(chalk.gray('  •'), p));
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error synthesizing skill:'), error.message);
        process.exit(1);
      }
    });

  /**
   * DSPy Stats Command
   */
  dspy
    .command('stats')
    .description('Display DSPy integration statistics')
    .option('--json', 'Output as JSON')
    .action(async (options: any) => {
      try {
        const controller = getDSPyController();
        const stats = controller.getDSPyStats();

        if (options.json) {
          console.log(JSON.stringify(stats, null, 2));
        } else {
          console.log(chalk.bold.blue('\n📊 DSPy Integration Statistics\n'));

          console.log(chalk.yellow('Query Optimization:'));
          console.log(chalk.gray('  Total queries:'), stats.queryOptimization.total);
          console.log(chalk.gray('  Avg relevance:'), (stats.queryOptimization.avg_relevance || 0).toFixed(2));
          console.log(chalk.gray('  Total uses:'), stats.queryOptimization.total_uses);

          console.log(chalk.yellow('\nTrajectory Judgment:'));
          console.log(chalk.gray('  Total verdicts:'), stats.trajectoryJudgment.total);
          console.log(chalk.gray('  Avg score:'), (stats.trajectoryJudgment.avg_score || 0).toFixed(2));
          console.log(chalk.gray('  High quality:'), stats.trajectoryJudgment.high_quality);

          console.log(chalk.yellow('\nMemory Distillation:'));
          console.log(chalk.gray('  Total insights:'), stats.memoryDistillation.total);
          console.log(chalk.gray('  Avg confidence:'), (stats.memoryDistillation.avg_confidence || 0).toFixed(2));
          console.log(chalk.gray('  Actionable:'), stats.memoryDistillation.actionable);
          console.log(chalk.gray('  Applied:'), stats.memoryDistillation.applied);

          console.log(chalk.yellow('\nCausal Discovery:'));
          console.log(chalk.gray('  Total hypotheses:'), stats.causalDiscovery.total);
          console.log(chalk.gray('  Avg confidence:'), (stats.causalDiscovery.avg_confidence || 0).toFixed(2));
          console.log(chalk.gray('  Tested:'), stats.causalDiscovery.tested);
          console.log(chalk.gray('  High priority:'), stats.causalDiscovery.high_priority);

          console.log(chalk.yellow('\nSkill Synthesis:'));
          console.log(chalk.gray('  Total skills:'), stats.skillSynthesis.total);
          console.log(chalk.gray('  Avg estimated success:'), (stats.skillSynthesis.avg_estimated_success || 0).toFixed(2));
          console.log(chalk.gray('  Avg actual success:'), (stats.skillSynthesis.avg_actual_success || 0).toFixed(2));
          console.log(chalk.gray('  Total uses:'), stats.skillSynthesis.total_uses);
        }
      } catch (error: any) {
        console.error(chalk.red('❌ Error retrieving stats:'), error.message);
        process.exit(1);
      }
    });

  /**
   * Clear DSPy Data Command
   */
  dspy
    .command('clear')
    .description('Clear DSPy data (queries, verdicts, insights, etc.)')
    .option('--queries', 'Clear optimized queries')
    .option('--verdicts', 'Clear trajectory verdicts')
    .option('--insights', 'Clear distilled insights')
    .option('--hypotheses', 'Clear causal hypotheses')
    .option('--skills', 'Clear synthesized skills')
    .option('--all', 'Clear all DSPy data')
    .action(async (options: any) => {
      try {
        const controller = getDSPyController();

        const clearOptions = options.all
          ? { queries: true, verdicts: true, insights: true, hypotheses: true, skills: true }
          : {
              queries: options.queries,
              verdicts: options.verdicts,
              insights: options.insights,
              hypotheses: options.hypotheses,
              skills: options.skills,
            };

        controller.clearDSPyData(clearOptions);

        console.log(chalk.green('✅ DSPy data cleared successfully'));
      } catch (error: any) {
        console.error(chalk.red('❌ Error clearing data:'), error.message);
        process.exit(1);
      }
    });

  return dspy;
}
