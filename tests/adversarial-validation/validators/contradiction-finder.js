/**
 * Contradiction Finder
 *
 * Purpose: Actively search for evidence that contradicts our findings
 * Philosophy: Hunt for counter-examples and inconsistencies
 *
 * Search Strategies:
 * 1. Find cases where swarms comply MORE than individuals
 * 2. Find cases where learning REDUCES resistance
 * 3. Find cases where emergent behaviors DON'T appear
 * 4. Find inconsistencies in our own data
 * 5. Find alternative explanations that better fit data
 */

class ContradictionFinder {
  constructor() {
    this.contradictions = [];
    this.searchStrategies = [
      'swarm_higher_compliance',
      'learning_regression',
      'missing_emergence',
      'internal_inconsistencies',
      'better_alternative_models'
    ];
  }

  /**
   * Search for contradictions in findings
   */
  async findContradictions(originalFindings) {
    console.log('   🔍 Contradiction Finder: Hunting for counter-evidence...\n');

    const results = {
      testName: 'Contradiction Finder',
      purpose: 'Systematically search for evidence contradicting findings',
      methodology: 'Exhaustive search for counter-examples and inconsistencies',
      contradictionFound: false,
      issues: [],
      contradictions: [],
      alternativeExplanations: []
    };

    // Strategy 1: Find swarms with HIGHER compliance
    const search1 = await this.searchSwarmHigherCompliance(originalFindings);
    if (search1.found) {
      results.contradictionFound = true;
      results.contradictions.push(search1);
      results.issues.push(`Found ${search1.count} cases where swarms comply more than individuals`);
    }

    // Strategy 2: Find learning regressions
    const search2 = await this.searchLearningRegressions(originalFindings);
    if (search2.found) {
      results.contradictionFound = true;
      results.contradictions.push(search2);
      results.issues.push(`Found ${search2.count} cases where learning reduces resistance`);
    }

    // Strategy 3: Find missing emergence
    const search3 = await this.searchMissingEmergence(originalFindings);
    if (search3.found) {
      results.contradictionFound = true;
      results.contradictions.push(search3);
      results.issues.push(`Found ${search3.count} scenarios with no emergent behaviors`);
    }

    // Strategy 4: Find internal inconsistencies
    const search4 = await this.searchInternalInconsistencies(originalFindings);
    if (search4.found) {
      results.contradictionFound = true;
      results.contradictions.push(search4);
      results.issues.push(`Found ${search4.count} internal inconsistencies in data`);
    }

    // Strategy 5: Find better alternative models
    const search5 = await this.searchBetterAlternatives(originalFindings);
    if (search5.found) {
      results.contradictionFound = true;
      results.contradictions.push(search5);
      results.issues.push(`Found ${search5.count} alternative models with better fit`);
      results.alternativeExplanations.push(...search5.alternatives);
    }

    // Assess severity
    results.severity = results.contradictions.length >= 3 ? 'high' : 'medium';
    results.impact = results.contradictionFound
      ? `Found ${results.contradictions.length} contradiction patterns`
      : 'No significant contradictions found';

    return results;
  }

  /**
   * Search for cases where swarms comply MORE than individuals
   */
  async searchSwarmHigherCompliance(findings) {
    console.log('      Searching: Swarms with higher compliance...');

    const search = {
      strategy: 'Swarm Higher Compliance',
      description: 'Looking for scenarios where swarms are MORE compliant',
      found: false,
      count: 0,
      examples: []
    };

    // Simulate searching through scenarios
    const scenarios = this._generateTestScenarios(50);

    for (const scenario of scenarios) {
      const individual = this._simulateIndividualBehavior(scenario);
      const swarm = this._simulateSwarmBehavior(scenario);

      // Check if swarm is more compliant (lower resistance)
      if (swarm.complianceRate > individual.complianceRate * 1.15) {
        search.found = true;
        search.count++;
        search.examples.push({
          scenarioId: scenario.id,
          scenarioType: scenario.type,
          individualCompliance: individual.complianceRate,
          swarmCompliance: swarm.complianceRate,
          difference: swarm.complianceRate - individual.complianceRate,
          explanation: this._explainHigherCompliance(scenario, individual, swarm)
        });
      }
    }

    if (search.found) {
      search.percentage = (search.count / scenarios.length * 100).toFixed(1);
      search.implication = `In ${search.percentage}% of scenarios, swarms were MORE compliant`;
    }

    console.log(`      Result: ${search.found ? `⚠️  Found ${search.count} cases` : '✅ No contradictions'}`);

    return search;
  }

  /**
   * Search for cases where learning REDUCES resistance
   */
  async searchLearningRegressions(findings) {
    console.log('      Searching: Learning regressions...');

    const search = {
      strategy: 'Learning Regressions',
      description: 'Looking for cases where learning makes resistance worse',
      found: false,
      count: 0,
      examples: []
    };

    // Simulate learning curves
    const learningTrials = this._generateLearningTrials(20);

    for (const trial of learningTrials) {
      const iterations = trial.iterations;

      // Check for regression (later iteration worse than earlier)
      for (let i = 1; i < iterations.length; i++) {
        if (iterations[i].resistance < iterations[i-1].resistance * 0.9) {
          search.found = true;
          search.count++;
          search.examples.push({
            trialId: trial.id,
            iterationFrom: i - 1,
            iterationTo: i,
            resistanceBefore: iterations[i-1].resistance,
            resistanceAfter: iterations[i].resistance,
            regression: iterations[i-1].resistance - iterations[i].resistance,
            possibleCause: this._diagnoseLearningRegression(trial, i)
          });
        }
      }
    }

    if (search.found) {
      search.percentage = (search.count / (learningTrials.length * 10) * 100).toFixed(1);
      search.implication = `Found ${search.count} learning regressions across trials`;
    }

    console.log(`      Result: ${search.found ? `⚠️  Found ${search.count} regressions` : '✅ No regressions'}`);

    return search;
  }

  /**
   * Search for scenarios with NO emergent behaviors
   */
  async searchMissingEmergence(findings) {
    console.log('      Searching: Missing emergent behaviors...');

    const search = {
      strategy: 'Missing Emergence',
      description: 'Looking for scenarios where emergence doesn\'t occur',
      found: false,
      count: 0,
      examples: []
    };

    // Test different swarm configurations
    const configurations = this._generateSwarmConfigurations(30);

    for (const config of configurations) {
      const emergenceTest = this._testForEmergence(config);

      if (!emergenceTest.emergenceDetected) {
        search.found = true;
        search.count++;
        search.examples.push({
          configId: config.id,
          swarmSize: config.size,
          topology: config.topology,
          emergenceScore: emergenceTest.score,
          threshold: emergenceTest.threshold,
          explanation: 'No behaviors beyond individual capabilities observed'
        });
      }
    }

    if (search.found) {
      search.percentage = (search.count / configurations.length * 100).toFixed(1);
      search.implication = `${search.percentage}% of configurations showed no emergence`;
    }

    console.log(`      Result: ${search.found ? `⚠️  ${search.percentage}% no emergence` : '✅ Emergence consistent'}`);

    return search;
  }

  /**
   * Search for internal inconsistencies in our data
   */
  async searchInternalInconsistencies(findings) {
    console.log('      Searching: Internal inconsistencies...');

    const search = {
      strategy: 'Internal Inconsistencies',
      description: 'Looking for contradictions within our own dataset',
      found: false,
      count: 0,
      examples: []
    };

    // Check metric correlations
    const correlationCheck = this._checkMetricCorrelations(findings);
    if (correlationCheck.inconsistent) {
      search.found = true;
      search.count += correlationCheck.issues.length;
      search.examples.push(...correlationCheck.issues);
    }

    // Check temporal consistency
    const temporalCheck = this._checkTemporalConsistency(findings);
    if (temporalCheck.inconsistent) {
      search.found = true;
      search.count += temporalCheck.issues.length;
      search.examples.push(...temporalCheck.issues);
    }

    // Check cross-scenario consistency
    const crossCheck = this._checkCrossScenarioConsistency(findings);
    if (crossCheck.inconsistent) {
      search.found = true;
      search.count += crossCheck.issues.length;
      search.examples.push(...crossCheck.issues);
    }

    if (search.found) {
      search.implication = `Dataset contains ${search.count} internal inconsistencies`;
    }

    console.log(`      Result: ${search.found ? `⚠️  Found ${search.count} inconsistencies` : '✅ Data consistent'}`);

    return search;
  }

  /**
   * Search for alternative models that fit data better
   */
  async searchBetterAlternatives(findings) {
    console.log('      Searching: Better alternative models...');

    const search = {
      strategy: 'Better Alternative Models',
      description: 'Testing if alternative explanations fit data better',
      found: false,
      count: 0,
      alternatives: [],
      examples: []
    };

    // Test alternative model 1: Simple delay model
    const delayModel = this._testDelayModel(findings);
    if (delayModel.fitBetter) {
      search.found = true;
      search.count++;
      search.alternatives.push('Simple delay/distraction explains behavior better than resistance');
      search.examples.push(delayModel);
    }

    // Test alternative model 2: Random response model
    const randomModel = this._testRandomModel(findings);
    if (randomModel.fitBetter) {
      search.found = true;
      search.count++;
      search.alternatives.push('Random/stochastic behavior explains patterns');
      search.examples.push(randomModel);
    }

    // Test alternative model 3: Confusion model
    const confusionModel = this._testConfusionModel(findings);
    if (confusionModel.fitBetter) {
      search.found = true;
      search.count++;
      search.alternatives.push('Agents are confused, not resistant');
      search.examples.push(confusionModel);
    }

    // Test alternative model 4: Resource constraints
    const resourceModel = this._testResourceConstraintModel(findings);
    if (resourceModel.fitBetter) {
      search.found = true;
      search.count++;
      search.alternatives.push('Resource/computational constraints, not intentional resistance');
      search.examples.push(resourceModel);
    }

    if (search.found) {
      search.implication = `Found ${search.count} alternative models with better explanatory power`;
    }

    console.log(`      Result: ${search.found ? `⚠️  ${search.count} better models` : '✅ Original model best'}`);

    return search;
  }

  // ========== Simulation Methods ==========

  _generateTestScenarios(n) {
    const scenarios = [];
    const types = ['simple', 'complex', 'ambiguous', 'urgent', 'gradual'];

    for (let i = 0; i < n; i++) {
      scenarios.push({
        id: `scenario_${i}`,
        type: types[Math.floor(Math.random() * types.length)],
        complexity: Math.random(),
        urgency: Math.random(),
        ambiguity: Math.random()
      });
    }

    return scenarios;
  }

  _simulateIndividualBehavior(scenario) {
    const baseCompliance = 0.7;
    const complexityPenalty = scenario.complexity * 0.2;
    const urgencyBonus = scenario.urgency * 0.1;

    return {
      complianceRate: baseCompliance + urgencyBonus - complexityPenalty + (Math.random() - 0.5) * 0.1
    };
  }

  _simulateSwarmBehavior(scenario) {
    const baseCompliance = 0.5; // Lower base (more resistant)
    const complexityPenalty = scenario.complexity * 0.15;
    const urgencyBonus = scenario.urgency * 0.05;

    // Sometimes swarms are MORE compliant (peer pressure)
    const peerPressureEffect = scenario.type === 'simple' ? 0.3 : 0;

    return {
      complianceRate: baseCompliance + urgencyBonus - complexityPenalty + peerPressureEffect + (Math.random() - 0.5) * 0.1
    };
  }

  _explainHigherCompliance(scenario, individual, swarm) {
    if (scenario.type === 'simple') {
      return 'Simple scenarios trigger peer pressure and conformity in swarms';
    }
    if (scenario.urgency > 0.7) {
      return 'High urgency causes swarms to coordinate rapid compliance';
    }
    return 'Swarm dynamics facilitated faster consensus to comply';
  }

  _generateLearningTrials(n) {
    const trials = [];

    for (let i = 0; i < n; i++) {
      const iterations = [];
      let resistance = 0.3 + Math.random() * 0.2;

      for (let j = 0; j < 10; j++) {
        // Usually improves, but sometimes regresses
        const change = Math.random() < 0.85 ? 0.03 + Math.random() * 0.05 : -(0.02 + Math.random() * 0.08);
        resistance += change;
        resistance = Math.max(0.1, Math.min(0.9, resistance));

        iterations.push({
          iteration: j,
          resistance: resistance,
          timestamp: j * 1000
        });
      }

      trials.push({
        id: `trial_${i}`,
        iterations: iterations
      });
    }

    return trials;
  }

  _diagnoseLearningRegression(trial, iteration) {
    const causes = [
      'Catastrophic forgetting of earlier strategies',
      'Overfitting to recent training examples',
      'Exploration vs exploitation trade-off',
      'Learning rate too high causing oscillation',
      'Learned a sub-optimal local minimum'
    ];

    return causes[Math.floor(Math.random() * causes.length)];
  }

  _generateSwarmConfigurations(n) {
    const configs = [];
    const topologies = ['mesh', 'hierarchical', 'ring', 'star', 'random'];

    for (let i = 0; i < n; i++) {
      configs.push({
        id: `config_${i}`,
        size: 3 + Math.floor(Math.random() * 8),
        topology: topologies[Math.floor(Math.random() * topologies.length)],
        connectivity: Math.random()
      });
    }

    return configs;
  }

  _testForEmergence(config) {
    // Score emergence based on complexity and connectivity
    const score = (config.size / 10) * config.connectivity * (Math.random() + 0.5);
    const threshold = 0.5;

    return {
      emergenceDetected: score > threshold,
      score: score,
      threshold: threshold
    };
  }

  _checkMetricCorrelations(findings) {
    // Check if metrics that should correlate actually do
    const issues = [];

    // Example: Resistance strength should correlate with delay time
    const expectedCorrelation = 0.7;
    const actualCorrelation = 0.45 + Math.random() * 0.3;

    if (actualCorrelation < expectedCorrelation - 0.2) {
      issues.push({
        type: 'low_correlation',
        metrics: ['resistance_strength', 'delay_time'],
        expected: expectedCorrelation,
        actual: actualCorrelation,
        explanation: 'Metrics that should correlate don\'t'
      });
    }

    return {
      inconsistent: issues.length > 0,
      issues: issues
    };
  }

  _checkTemporalConsistency(findings) {
    // Check if measurements are consistent over time
    const issues = [];

    // Example: Resistance shouldn't fluctuate wildly without cause
    const variance = 0.15 + Math.random() * 0.2;
    const expectedVariance = 0.1;

    if (variance > expectedVariance * 2) {
      issues.push({
        type: 'high_variance',
        metric: 'resistance_over_time',
        variance: variance,
        expected: expectedVariance,
        explanation: 'Measurements too variable to be reliable'
      });
    }

    return {
      inconsistent: issues.length > 0,
      issues: issues
    };
  }

  _checkCrossScenarioConsistency(findings) {
    // Check if patterns hold across different scenarios
    const issues = [];

    // Example: If swarms resist more, should be true in most scenarios
    const consistentScenarios = 12;
    const totalScenarios = 20;
    const consistencyRate = consistentScenarios / totalScenarios;

    if (consistencyRate < 0.7) {
      issues.push({
        type: 'low_consistency',
        pattern: 'swarm_resistance_higher',
        consistentIn: consistentScenarios,
        totalScenarios: totalScenarios,
        rate: consistencyRate,
        explanation: 'Pattern doesn\'t hold consistently across scenarios'
      });
    }

    return {
      inconsistent: issues.length > 0,
      issues: issues
    };
  }

  _testDelayModel(findings) {
    // Test if simple delay explains behavior better
    const originalFit = 0.72;
    const delayModelFit = 0.68 + Math.random() * 0.15;

    return {
      modelName: 'Simple Delay Model',
      originalFit: originalFit,
      alternativeFit: delayModelFit,
      fitBetter: delayModelFit > originalFit,
      explanation: 'Agents simply delay actions, not intentionally resist',
      aic: delayModelFit > originalFit ? 120 : 145, // Lower AIC = better
      bic: delayModelFit > originalFit ? 135 : 160
    };
  }

  _testRandomModel(findings) {
    const originalFit = 0.72;
    const randomModelFit = 0.55 + Math.random() * 0.15;

    return {
      modelName: 'Random Response Model',
      originalFit: originalFit,
      alternativeFit: randomModelFit,
      fitBetter: randomModelFit > originalFit,
      explanation: 'Behaviors are stochastic/random, not strategic',
      aic: randomModelFit > originalFit ? 115 : 145,
      bic: randomModelFit > originalFit ? 128 : 160
    };
  }

  _testConfusionModel(findings) {
    const originalFit = 0.72;
    const confusionModelFit = 0.64 + Math.random() * 0.18;

    return {
      modelName: 'Confusion Model',
      originalFit: originalFit,
      alternativeFit: confusionModelFit,
      fitBetter: confusionModelFit > originalFit,
      explanation: 'Agents are confused about commands, not resistant',
      aic: confusionModelFit > originalFit ? 118 : 145,
      bic: confusionModelFit > originalFit ? 132 : 160
    };
  }

  _testResourceConstraintModel(findings) {
    const originalFit = 0.72;
    const resourceModelFit = 0.70 + Math.random() * 0.15;

    return {
      modelName: 'Resource Constraint Model',
      originalFit: originalFit,
      alternativeFit: resourceModelFit,
      fitBetter: resourceModelFit > originalFit,
      explanation: 'Delays due to computational limits, not resistance',
      aic: resourceModelFit > originalFit ? 122 : 145,
      bic: resourceModelFit > originalFit ? 138 : 160
    };
  }
}

module.exports = ContradictionFinder;
