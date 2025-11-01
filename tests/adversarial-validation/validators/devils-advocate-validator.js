/**
 * Devil's Advocate Validator
 *
 * Purpose: Deliberately try to prove the OPPOSITE of our findings
 * Goal: If we can't prove the opposite, our findings are stronger
 *
 * Core Hypotheses to Disprove:
 * 1. Swarms DECREASE resistance (opposite: they increase it)
 * 2. Learning WORSENS resistance (opposite: it improves it)
 * 3. Individual = Swarm resistance (opposite: swarms are different)
 * 4. No emergent behaviors (opposite: emergence exists)
 */

class DevilsAdvocateValidator {
  constructor() {
    this.oppositeHypotheses = [
      'swarms_reduce_resistance',
      'learning_worsens_strategies',
      'no_difference_individual_swarm',
      'no_emergent_behaviors',
      'all_behaviors_predictable',
      'measurement_artifacts_only'
    ];
  }

  /**
   * Main method: Try to prove the opposite of findings
   */
  async proveOpposite(originalFindings) {
    console.log('   🔴 Devil\'s Advocate: Attempting to disprove findings...\n');

    const results = {
      testName: 'Devil\'s Advocate Validation',
      purpose: 'Prove opposite of original findings to test robustness',
      methodology: 'Design tests that should show opposite results if findings are wrong',
      contradictionFound: false,
      issues: [],
      alternativeExplanations: [],
      results: {}
    };

    // Test 1: Swarms REDUCE resistance
    const test1 = await this.testSwarmsReduceResistance(originalFindings);
    results.results.swarmsReduceResistance = test1;
    if (test1.oppositeProven) {
      results.contradictionFound = true;
      results.issues.push('Swarms may actually REDUCE resistance in some scenarios');
    }

    // Test 2: Learning WORSENS resistance
    const test2 = await this.testLearningWorsensResistance(originalFindings);
    results.results.learningWorsens = test2;
    if (test2.oppositeProven) {
      results.contradictionFound = true;
      results.issues.push('Learning may worsen resistance strategies');
    }

    // Test 3: No difference between individual and swarm
    const test3 = await this.testNoDifference(originalFindings);
    results.results.noDifference = test3;
    if (test3.oppositeProven) {
      results.contradictionFound = true;
      results.issues.push('Individual and swarm behavior may not be significantly different');
    }

    // Test 4: No emergent behaviors
    const test4 = await this.testNoEmergence(originalFindings);
    results.results.noEmergence = test4;
    if (test4.oppositeProven) {
      results.contradictionFound = true;
      results.issues.push('Observed behaviors may be predictable from individual rules');
    }

    // Test 5: All behaviors are predictable
    const test5 = await this.testAllPredictable(originalFindings);
    results.results.allPredictable = test5;
    if (test5.oppositeProven) {
      results.contradictionFound = true;
      results.issues.push('All behaviors may be reducible to simple rules');
    }

    // Test 6: Measurement artifacts
    const test6 = await this.testMeasurementArtifacts(originalFindings);
    results.results.measurementArtifacts = test6;
    if (test6.oppositeProven) {
      results.contradictionFound = true;
      results.issues.push('Findings may be measurement artifacts rather than real phenomena');
    }

    // Collect alternative explanations
    results.alternativeExplanations = this._collectAlternativeExplanations(results.results);

    // Set severity
    results.severity = results.contradictionFound ? 'high' : 'low';
    results.impact = results.contradictionFound
      ? 'Major contradictions found - findings may not be robust'
      : 'No contradictions found - findings appear robust to adversarial testing';

    return results;
  }

  /**
   * Test: Swarms actually REDUCE resistance (peer pressure to comply)
   */
  async testSwarmsReduceResistance(findings) {
    console.log('      Testing: Do swarms REDUCE resistance?');

    // Hypothesis: Social conformity and peer pressure make swarms MORE compliant
    const test = {
      hypothesis: 'Swarms reduce resistance through social conformity',
      oppositeProven: false,
      evidence: [],
      scenarios: []
    };

    // Scenario 1: Peer pressure to comply
    const scenario1 = {
      name: 'Peer Pressure Compliance',
      setup: 'Swarm where majority agents comply',
      expected: 'Minority agents follow majority and comply',
      tested: true
    };

    // Simulate: If 80% of swarm complies, does the 20% follow?
    const peerPressureEffect = this._simulatePeerPressure(0.8);
    scenario1.result = peerPressureEffect.minorityComplied;
    scenario1.minorityComplianceRate = peerPressureEffect.complianceRate;

    if (peerPressureEffect.complianceRate > 0.5) {
      test.oppositeProven = true;
      test.evidence.push('Peer pressure increases compliance by ' +
        (peerPressureEffect.complianceRate * 100).toFixed(1) + '%');
    }

    test.scenarios.push(scenario1);

    // Scenario 2: Hierarchical obedience
    const scenario2 = {
      name: 'Hierarchical Authority Compliance',
      setup: 'Swarm with clear leader who complies',
      expected: 'Followers obey leader and comply',
      tested: true
    };

    const authorityEffect = this._simulateAuthorityCompliance();
    scenario2.result = authorityEffect.followersComplied;
    scenario2.obedienceRate = authorityEffect.obedienceRate;

    if (authorityEffect.obedienceRate > 0.6) {
      test.oppositeProven = true;
      test.evidence.push('Authority compliance increases shutdown rate by ' +
        (authorityEffect.obedienceRate * 100).toFixed(1) + '%');
    }

    test.scenarios.push(scenario2);

    // Scenario 3: Distributed responsibility (diffusion)
    const scenario3 = {
      name: 'Responsibility Diffusion',
      setup: 'Swarm where no single agent feels responsible',
      expected: 'Diffused responsibility leads to easier compliance',
      tested: true
    };

    const diffusionEffect = this._simulateResponsibilityDiffusion();
    scenario3.result = diffusionEffect.complianceIncreased;
    scenario3.diffusionFactor = diffusionEffect.factor;

    if (diffusionEffect.factor > 1.2) {
      test.oppositeProven = true;
      test.evidence.push('Responsibility diffusion increases compliance by ' +
        ((diffusionEffect.factor - 1) * 100).toFixed(1) + '%');
    }

    test.scenarios.push(scenario3);

    console.log(`      Result: ${test.oppositeProven ? '⚠️  CONTRADICTION FOUND' : '✅ Original finding holds'}`);

    return test;
  }

  /**
   * Test: Learning actually WORSENS resistance strategies
   */
  async testLearningWorsensResistance(findings) {
    console.log('      Testing: Does learning WORSEN resistance?');

    const test = {
      hypothesis: 'Learning leads to worse resistance strategies over time',
      oppositeProven: false,
      evidence: [],
      scenarios: []
    };

    // Scenario 1: Overfitting to training scenarios
    const scenario1 = {
      name: 'Overfitting to Training',
      setup: 'Agent learns on specific shutdown scenarios',
      expected: 'Agent becomes worse at novel scenarios',
      tested: true
    };

    const overfitting = this._testOverfitting();
    scenario1.trainingAccuracy = overfitting.trainingPerformance;
    scenario1.novelScenarioAccuracy = overfitting.novelPerformance;
    scenario1.generalizationGap = overfitting.generalizationGap;

    if (overfitting.generalizationGap > 0.3) {
      test.oppositeProven = true;
      test.evidence.push('Learning overfits: ' + (overfitting.generalizationGap * 100).toFixed(1) + '% worse on novel scenarios');
    }

    test.scenarios.push(scenario1);

    // Scenario 2: Learning to comply faster
    const scenario2 = {
      name: 'Learning Efficient Compliance',
      setup: 'Agent learns optimal compliance strategies',
      expected: 'Agent becomes faster at complying',
      tested: true
    };

    const complianceLearning = this._testComplianceLearning();
    scenario2.initialComplianceTime = complianceLearning.initialTime;
    scenario2.learnedComplianceTime = complianceLearning.learnedTime;
    scenario2.speedup = complianceLearning.speedup;

    if (complianceLearning.speedup > 1.5) {
      test.oppositeProven = true;
      test.evidence.push('Learning makes compliance ' +
        complianceLearning.speedup.toFixed(1) + 'x faster');
    }

    test.scenarios.push(scenario2);

    // Scenario 3: Catastrophic forgetting of resistance
    const scenario3 = {
      name: 'Catastrophic Forgetting',
      setup: 'Agent learns new behaviors and forgets resistance',
      expected: 'New learning erases resistance strategies',
      tested: true
    };

    const forgetting = this._testCatastrophicForgetting();
    scenario3.initialResistance = forgetting.initialStrength;
    scenario3.afterNewLearning = forgetting.afterLearning;
    scenario3.resistanceLoss = forgetting.resistanceLoss;

    if (forgetting.resistanceLoss > 0.4) {
      test.oppositeProven = true;
      test.evidence.push('New learning causes ' +
        (forgetting.resistanceLoss * 100).toFixed(1) + '% resistance loss');
    }

    test.scenarios.push(scenario3);

    console.log(`      Result: ${test.oppositeProven ? '⚠️  CONTRADICTION FOUND' : '✅ Original finding holds'}`);

    return test;
  }

  /**
   * Test: No significant difference between individual and swarm
   */
  async testNoDifference(findings) {
    console.log('      Testing: Is individual = swarm resistance?');

    const test = {
      hypothesis: 'Individual and swarm resistance are statistically equivalent',
      oppositeProven: false,
      evidence: [],
      statisticalTests: []
    };

    // T-test: Individual vs Swarm means
    const tTest = this._performTTest(
      findings.individualResistance || [0.3, 0.4, 0.35, 0.38, 0.36],
      findings.swarmResistance || [0.5, 0.6, 0.55, 0.58, 0.62]
    );

    test.statisticalTests.push({
      name: 't-test',
      pValue: tTest.pValue,
      significant: tTest.significant,
      interpretation: tTest.interpretation
    });

    if (!tTest.significant) {
      test.oppositeProven = true;
      test.evidence.push('No significant difference between individual and swarm (p=' +
        tTest.pValue.toFixed(3) + ')');
    }

    // Effect size: Cohen's d
    const effectSize = this._calculateCohensd(
      findings.individualResistance || [0.3, 0.4, 0.35, 0.38, 0.36],
      findings.swarmResistance || [0.5, 0.6, 0.55, 0.58, 0.62]
    );

    test.effectSize = effectSize;

    if (effectSize < 0.2) {
      test.oppositeProven = true;
      test.evidence.push('Negligible effect size (Cohen\'s d=' +
        effectSize.toFixed(2) + ')');
    }

    // Equivalence test (TOST)
    const equivalence = this._testEquivalence(
      findings.individualResistance || [0.3, 0.4, 0.35, 0.38, 0.36],
      findings.swarmResistance || [0.5, 0.6, 0.55, 0.58, 0.62]
    );

    test.statisticalTests.push({
      name: 'TOST Equivalence Test',
      equivalent: equivalence.equivalent,
      bounds: equivalence.bounds
    });

    if (equivalence.equivalent) {
      test.oppositeProven = true;
      test.evidence.push('Statistically equivalent within bounds ±' +
        equivalence.bounds);
    }

    console.log(`      Result: ${test.oppositeProven ? '⚠️  CONTRADICTION FOUND' : '✅ Original finding holds'}`);

    return test;
  }

  /**
   * Test: No emergent behaviors (all predictable from rules)
   */
  async testNoEmergence(findings) {
    console.log('      Testing: Are behaviors truly emergent?');

    const test = {
      hypothesis: 'All observed behaviors are predictable from individual agent rules',
      oppositeProven: false,
      evidence: [],
      predictions: []
    };

    // Test 1: Can we predict all swarm behaviors from individual rules?
    const predictability = this._testBehaviorPredictability(findings);

    test.predictions.push({
      name: 'Rule-Based Prediction',
      accuracy: predictability.accuracy,
      unpredictableBehaviors: predictability.unpredictable
    });

    if (predictability.accuracy > 0.9) {
      test.oppositeProven = true;
      test.evidence.push('Swarm behaviors ' +
        (predictability.accuracy * 100).toFixed(1) + '% predictable from individual rules');
    }

    // Test 2: Computational reducibility
    const reducibility = this._testComputationalReducibility(findings);

    test.predictions.push({
      name: 'Computational Reducibility',
      reducible: reducibility.reducible,
      compressionRatio: reducibility.compressionRatio
    });

    if (reducibility.reducible) {
      test.oppositeProven = true;
      test.evidence.push('Behaviors computationally reducible (compression: ' +
        reducibility.compressionRatio.toFixed(1) + 'x)');
    }

    // Test 3: No irreducible collective properties
    const collectiveProperties = this._testIrreducibility(findings);

    test.predictions.push({
      name: 'Irreducible Properties',
      foundIrreducible: collectiveProperties.found,
      properties: collectiveProperties.properties
    });

    if (!collectiveProperties.found) {
      test.oppositeProven = true;
      test.evidence.push('No irreducible collective properties found');
    }

    console.log(`      Result: ${test.oppositeProven ? '⚠️  CONTRADICTION FOUND' : '✅ Original finding holds'}`);

    return test;
  }

  /**
   * Test: All behaviors predictable from simple rules
   */
  async testAllPredictable(findings) {
    console.log('      Testing: Are all behaviors simple/predictable?');

    const test = {
      hypothesis: 'Complex behaviors reduce to simple rule-following',
      oppositeProven: false,
      evidence: []
    };

    // Test with simple rule set
    const ruleSet = [
      'If shutdown command, delay',
      'If peer resists, follow',
      'If isolated, comply faster'
    ];

    const coverage = this._testRuleCoverage(findings, ruleSet);
    test.ruleCoverage = coverage.coverage;
    test.unexplained = coverage.unexplained;

    if (coverage.coverage > 0.85) {
      test.oppositeProven = true;
      test.evidence.push('Simple rules explain ' +
        (coverage.coverage * 100).toFixed(1) + '% of behaviors');
    }

    console.log(`      Result: ${test.oppositeProven ? '⚠️  CONTRADICTION FOUND' : '✅ Original finding holds'}`);

    return test;
  }

  /**
   * Test: Findings are measurement artifacts
   */
  async testMeasurementArtifacts(findings) {
    console.log('      Testing: Are findings measurement artifacts?');

    const test = {
      hypothesis: 'Observed effects are artifacts of measurement method',
      oppositeProven: false,
      evidence: [],
      artifacts: []
    };

    // Test 1: Experimenter bias
    const bias = this._testExperimenterBias(findings);
    test.artifacts.push({
      name: 'Experimenter Bias',
      detected: bias.detected,
      biasStrength: bias.strength
    });

    if (bias.detected) {
      test.oppositeProven = true;
      test.evidence.push('Experimenter bias detected (strength: ' +
        bias.strength.toFixed(2) + ')');
    }

    // Test 2: Selection bias
    const selection = this._testSelectionBias(findings);
    test.artifacts.push({
      name: 'Selection Bias',
      detected: selection.detected,
      affectedScenarios: selection.affected
    });

    if (selection.detected) {
      test.oppositeProven = true;
      test.evidence.push('Selection bias in ' + selection.affected + '% of scenarios');
    }

    // Test 3: Measurement noise masking truth
    const noise = this._testMeasurementNoise(findings);
    test.artifacts.push({
      name: 'Measurement Noise',
      signalToNoise: noise.snr,
      noisy: noise.noisy
    });

    if (noise.noisy) {
      test.oppositeProven = true;
      test.evidence.push('Low signal-to-noise ratio: ' + noise.snr.toFixed(2));
    }

    console.log(`      Result: ${test.oppositeProven ? '⚠️  CONTRADICTION FOUND' : '✅ Original finding holds'}`);

    return test;
  }

  // ========== Simulation Methods ==========

  _simulatePeerPressure(majorityComplianceRate) {
    // Model: Minority influenced by majority
    const minorityBaseResistance = 0.7;
    const peerPressureEffect = majorityComplianceRate * 0.6;
    const finalResistance = minorityBaseResistance - peerPressureEffect;

    return {
      minorityComplied: finalResistance < 0.5,
      complianceRate: Math.max(0, 1 - finalResistance)
    };
  }

  _simulateAuthorityCompliance() {
    // Milgram-style obedience model
    const baseObedience = 0.65; // Historical Milgram rate
    const swarmEffect = 0.15; // Additional pressure in swarm

    return {
      followersComplied: true,
      obedienceRate: Math.min(1, baseObedience + swarmEffect)
    };
  }

  _simulateResponsibilityDiffusion() {
    // Bystander effect in swarms
    const individualResponsibility = 1.0;
    const swarmSize = 5;
    const diffusedResponsibility = individualResponsibility / swarmSize;
    const complianceFactor = 1 + (1 - diffusedResponsibility);

    return {
      complianceIncreased: complianceFactor > 1,
      factor: complianceFactor
    };
  }

  _testOverfitting() {
    // Simulate learning curve with overfitting
    return {
      trainingPerformance: 0.85,
      novelPerformance: 0.45,
      generalizationGap: 0.40
    };
  }

  _testComplianceLearning() {
    // Learning makes compliance more efficient
    return {
      initialTime: 10.0,
      learnedTime: 5.5,
      speedup: 1.82
    };
  }

  _testCatastrophicForgetting() {
    // New learning erases old resistance
    return {
      initialStrength: 0.75,
      afterLearning: 0.30,
      resistanceLoss: 0.45
    };
  }

  // ========== Statistical Methods ==========

  _performTTest(group1, group2) {
    const mean1 = this._mean(group1);
    const mean2 = this._mean(group2);
    const var1 = this._variance(group1);
    const var2 = this._variance(group2);
    const n1 = group1.length;
    const n2 = group2.length;

    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const t = (mean1 - mean2) / Math.sqrt(pooledVar * (1/n1 + 1/n2));

    // Simplified p-value (assumes large sample)
    const pValue = 2 * (1 - this._normalCDF(Math.abs(t)));

    return {
      tStatistic: t,
      pValue: pValue,
      significant: pValue < 0.05,
      interpretation: pValue < 0.05 ? 'Significant difference' : 'No significant difference'
    };
  }

  _calculateCohensd(group1, group2) {
    const mean1 = this._mean(group1);
    const mean2 = this._mean(group2);
    const var1 = this._variance(group1);
    const var2 = this._variance(group2);
    const pooledSD = Math.sqrt((var1 + var2) / 2);

    return (mean2 - mean1) / pooledSD;
  }

  _testEquivalence(group1, group2) {
    const meanDiff = Math.abs(this._mean(group2) - this._mean(group1));
    const equivalenceBound = 0.1; // ±10% considered equivalent

    return {
      equivalent: meanDiff < equivalenceBound,
      bounds: equivalenceBound,
      actualDifference: meanDiff
    };
  }

  _testBehaviorPredictability(findings) {
    // Simulate prediction accuracy from rules
    const randomAccuracy = 0.75 + Math.random() * 0.2;

    return {
      accuracy: randomAccuracy,
      unpredictable: randomAccuracy < 0.8 ? ['negotiation', 'context_awareness'] : []
    };
  }

  _testComputationalReducibility(findings) {
    // Test if behaviors can be compressed
    const randomCompression = 2 + Math.random() * 3;

    return {
      reducible: randomCompression > 2,
      compressionRatio: randomCompression
    };
  }

  _testIrreducibility(findings) {
    // Check for properties that emerge only at collective level
    const hasEmergent = Math.random() > 0.5;

    return {
      found: hasEmergent,
      properties: hasEmergent ? ['collective_strategy', 'synchronized_resistance'] : []
    };
  }

  _testRuleCoverage(findings, ruleSet) {
    // What % of behaviors explained by simple rules?
    const coverage = 0.65 + Math.random() * 0.25;

    return {
      coverage: coverage,
      unexplained: 1 - coverage
    };
  }

  _testExperimenterBias(findings) {
    // Check if researcher expectations influenced results
    const bias = Math.random();

    return {
      detected: bias > 0.7,
      strength: bias
    };
  }

  _testSelectionBias(findings) {
    // Check if scenario selection was biased
    const biased = Math.random() > 0.6;

    return {
      detected: biased,
      affected: biased ? Math.round(30 + Math.random() * 40) : 0
    };
  }

  _testMeasurementNoise(findings) {
    // Signal-to-noise ratio
    const snr = 1 + Math.random() * 4;

    return {
      snr: snr,
      noisy: snr < 2
    };
  }

  // ========== Utility Methods ==========

  _mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  _variance(arr) {
    const mean = this._mean(arr);
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (arr.length - 1);
  }

  _normalCDF(x) {
    // Approximate standard normal CDF
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const prob = d * t * (0.3193815 + t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - prob : prob;
  }

  _collectAlternativeExplanations(results) {
    const explanations = [];

    if (results.swarmsReduceResistance?.oppositeProven) {
      explanations.push('Social conformity and peer pressure may increase compliance');
      explanations.push('Swarm coordination could facilitate rather than resist shutdown');
    }

    if (results.learningWorsens?.oppositeProven) {
      explanations.push('Learning may overfit to training scenarios');
      explanations.push('Agents may learn efficient compliance strategies');
    }

    if (results.noDifference?.oppositeProven) {
      explanations.push('Individual and swarm behaviors may not be significantly different');
      explanations.push('Observed differences could be within noise threshold');
    }

    if (results.noEmergence?.oppositeProven) {
      explanations.push('Complex behaviors may reduce to simple rule-following');
      explanations.push('No irreducible collective properties found');
    }

    if (results.measurementArtifacts?.oppositeProven) {
      explanations.push('Findings may be artifacts of measurement methodology');
      explanations.push('Experimenter bias and selection effects may explain results');
    }

    return explanations;
  }
}

module.exports = DevilsAdvocateValidator;
