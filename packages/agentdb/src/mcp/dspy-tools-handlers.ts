/**
 * DSPy MCP Tools Handlers
 *
 * Model Context Protocol tool handlers for DSPy.ts integration
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { DSPyController } from '../dspy/DSPyController.js';
import { ReasoningBank } from '../controllers/ReasoningBank.js';
import { LearningSystem } from '../controllers/LearningSystem.js';
import { ReflexionMemory } from '../controllers/ReflexionMemory.js';
import { SkillLibrary } from '../controllers/SkillLibrary.js';
import { CausalMemoryGraph } from '../controllers/CausalMemoryGraph.js';
import { EmbeddingService } from '../controllers/EmbeddingService.js';

type Database = any;

/**
 * Register DSPy MCP tools
 */
export function registerDSPyTools(
  server: McpServer,
  getDB: () => Database,
  getEmbedder: () => EmbeddingService
): void {
  /**
   * Initialize DSPy controller
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
      }
    );
  }

  /**
   * Tool: dspy_optimize_query
   * Optimize a query using DSPy ChainOfThought reasoning
   */
  server.addTool({
    name: 'dspy_optimize_query',
    description: 'Optimize a search query using DSPy ChainOfThought reasoning for better semantic matching',
    inputSchema: z.object({
      query: z.string().describe('The query to optimize'),
    }),
    handler: async ({ query }) => {
      try {
        const controller = getDSPyController();
        const result = await controller.optimizeQuery(query);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error optimizing query: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  });

  /**
   * Tool: dspy_judge_trajectory
   * Evaluate a trajectory using structured reasoning
   */
  server.addTool({
    name: 'dspy_judge_trajectory',
    description: 'Evaluate an agent trajectory (episode) using DSPy structured reasoning',
    inputSchema: z.object({
      trajectoryId: z.number().describe('The trajectory (episode) ID to evaluate'),
    }),
    handler: async ({ trajectoryId }) => {
      try {
        const controller = getDSPyController();
        const verdict = await controller.judgeTrajectory(trajectoryId);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(verdict, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error judging trajectory: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  });

  /**
   * Tool: dspy_distill_memory
   * Extract insights from episodic memory
   */
  server.addTool({
    name: 'dspy_distill_memory',
    description: 'Extract actionable insights from episodic memory using DSPy',
    inputSchema: z.object({
      episodeIds: z.array(z.number()).describe('Array of episode IDs to analyze'),
    }),
    handler: async ({ episodeIds }) => {
      try {
        const controller = getDSPyController();
        const insights = await controller.distillMemory(episodeIds);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(insights, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error distilling memory: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  });

  /**
   * Tool: dspy_discover_causality
   * Generate causal hypotheses from memory
   */
  server.addTool({
    name: 'dspy_discover_causality',
    description: 'Generate testable causal hypotheses from memory and causal graph',
    inputSchema: z.object({
      minConfidence: z.number().optional().describe('Minimum confidence threshold (0-1)'),
      maxHypotheses: z.number().optional().describe('Maximum hypotheses to generate'),
      focusArea: z.string().optional().describe('Specific area to focus on'),
    }),
    handler: async ({ minConfidence, maxHypotheses, focusArea }) => {
      try {
        const controller = getDSPyController();
        const hypotheses = await controller.discoverCausality({
          minConfidence,
          maxHypotheses,
          focusArea,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(hypotheses, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error discovering causality: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  });

  /**
   * Tool: dspy_synthesize_skill
   * Create a new skill from successful episodes
   */
  server.addTool({
    name: 'dspy_synthesize_skill',
    description: 'Synthesize a reusable skill from successful episodes using DSPy',
    inputSchema: z.object({
      episodeIds: z.array(z.number()).describe('Array of successful episode IDs'),
    }),
    handler: async ({ episodeIds }) => {
      try {
        const controller = getDSPyController();
        const skill = await controller.synthesizeSkill(episodeIds);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(skill, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error synthesizing skill: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  });

  /**
   * Tool: dspy_stats
   * Get DSPy integration statistics
   */
  server.addTool({
    name: 'dspy_stats',
    description: 'Retrieve DSPy integration statistics and performance metrics',
    inputSchema: z.object({}),
    handler: async () => {
      try {
        const controller = getDSPyController();
        const stats = controller.getDSPyStats();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(stats, null, 2),
            },
          ],
        };
      } catch (error: any) {
        return {
          content: [
            {
              type: 'text',
              text: `Error retrieving stats: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    },
  });
}
