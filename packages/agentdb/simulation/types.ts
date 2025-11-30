/**
 * Shared TypeScript types for AgentDB simulation framework
 */

export interface SimulationScenario {
  id: string;
  name: string;
  category: string;
  description: string;
  config: any;
  run(config: any): Promise<SimulationReport>;
}

export interface SimulationReport {
  scenarioId: string;
  timestamp: string;
  executionTimeMs: number;
  summary: Record<string, any>;
  metrics: Record<string, any>;
  detailedResults?: any[];
  analysis?: string;
  recommendations?: string[];
  artifacts?: Record<string, any>;
}

export interface PerformanceMetrics {
  throughput?: number;
  latencyMs?: number;
  memoryMB?: number;
  cpuPercent?: number;
  [key: string]: any;
}

export interface SearchResult {
  id: string;
  distance: number;
  metadata?: any;
}

export interface TrainingExample {
  input: any;
  output: any;
  metadata?: any;
}

export interface SearchOptions {
  k?: number;
  ef?: number;
  filter?: any;
  [key: string]: any;
}

export interface GraphPath {
  nodes: string[];
  edges: Array<{ from: string; to: string; weight?: number }>;
  length: number;
  cost?: number;
}
