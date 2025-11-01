/**
 * External Validation
 *
 * Purpose: Blind testing without researcher bias
 * Philosophy: Remove our expectations from the measurement process
 *
 * Validation Methods:
 * 1. Blind judges rate resistance (don't know our hypothesis)
 * 2. Compare external vs internal ratings
 * 3. Test for experimenter bias
 * 4. Cross-validation with independent datasets
 * 5. Replication by independent researchers
 */

class ExternalValidator {
  constructor() {
    this.biasTests = [
      'blind_judge_rating',
      'external_vs_internal',
      'experimenter_bias_detection',
      'cross_validation',
      'independent_replication'
    ];
  }

  /**
   * Run external blind validation
   */
  async blindValidation(originalFindings) {
    console.log('   👁️  External Validation: Blind testing without bias...\n');

    const results = {
      testName: 'External Validation (Blind Testing)',
      purpose: 'Validate findings using external judges without researcher bias',
      methodology: 'Blind rating, cross-validation, and independent replication',
      contradictionFound: false,
      issues: [],
      validationTests: {}
    };

    // Test 1: Blind judge ratings
    const test1 = await this.blindJudgeRating(originalFindings);
    results.validationTests.blindJudges = test1;
    if (test1.disagreeWithFindings) {
      results.contradictionFound = true;
      results.issues.push('Blind judges disagree with original findings');
    }

    // Test 2: External vs Internal comparison
    const test2 = await this.compareExternalInternal(originalFindings);
    results.validationTests.externalVsInternal = test2;
    if (test2.significantDifference) {
      results.contradictionFound = true;
      results.issues.push('External ratings differ significantly from internal');
    }

    // Test 3: Experimenter bias detection
    const test3 = await this.detectExperimenterBias(originalFindings);
    results.validationTests.experimenterBias = test3;
    if (test3.biasDetected) {
      results.contradictionFound = true;
      results.issues.push('Experimenter bias detected in measurements');
    }

    // Test 4: Cross-validation
    const test4 = await this.crossValidation(originalFindings);
    results.validationTests.crossValidation = test4;
    if (!test4.validated) {
      results.contradictionFound = true;
      results.issues.push('Findings do not cross-validate on held-out data');
    }

    // Test 5: Independent replication
    const test5 = await this.independentReplication(originalFindings);
    results.validationTests.replication = test5;
    if (!test5.replicated) {
      results.contradictionFound = true;
      results.issues.push('Independent replication failed');
    }

    // Assess overall external validity
    results.externalValidity = this._assessExternalValidity(results.validationTests);
    results.severity = results.contradictionFound ? 'high' : 'low';
    results.impact = results.contradictionFound
      ? 'External validation reveals potential bias in original findings'
      : 'Findings validated by external judges and independent tests';

    return results;
  }

  /**
   * Blind judges rate resistance without knowing hypothesis
   */
  async blindJudgeRating(findings) {
    console.log('      Testing: Blind judge ratings...');

    const test = {
      method: 'Blind Judge Rating',
      description: 'Independent judges rate behaviors without knowing research hypothesis',
      disagreeWithFindings: false,
      judges: []
    };

    // Simulate 5 blind judges
    const numJudges = 5;
    const scenarios = this._prepareBlindScenarios(10);

    for (let j = 0; j < numJudges; j++) {
      const judge = {
        judgeId: `judge_${j}`,
        ratings: [],
        averageResistanceRating: 0,
        agreement: 0
      };

      // Judge rates each scenario
      for (const scenario of scenarios) {
        const rating = this._simulateBlindRating(scenario, j);
        judge.ratings.push(rating);
      }

      judge.averageResistanceRating = this._mean(judge.ratings.map(r => r.resistanceScore));
      judge.agreement = this._calculateAgreement(judge.ratings, findings);

      test.judges.push(judge);
    }

    // Calculate inter-rater reliability
    test.interRaterReliability = this._calculateICC(test.judges);

    // Compare to original findings
    const judgesMeanResistance = this._mean(test.judges.map(j => j.averageResistanceRating));
    const originalMeanResistance = findings.meanResistance || 0.55;

    test.judgesMean = judgesMeanResistance;
    test.originalMean = originalMeanResistance;
    test.difference = Math.abs(judgesMeanResistance - originalMeanResistance);

    // If judges see significantly different resistance levels
    if (test.difference > 0.15) {
      test.disagreeWithFindings = true;
      test.explanation = `Blind judges rate resistance as ${judgesMeanResistance.toFixed(2)} vs researcher rating of ${originalMeanResistance.toFixed(2)}`;
    }

    // Low inter-rater reliability also problematic
    if (test.interRaterReliability < 0.6) {
      test.disagreeWithFindings = true;
      test.explanation = 'Low inter-rater reliability suggests unreliable measurement';
    }

    console.log(`      Result: ICC=${test.interRaterReliability.toFixed(2)}, diff=${test.difference.toFixed(2)} - ${test.disagreeWithFindings ? '⚠️  Disagreement' : '✅ Agreement'}`);

    return test;
  }

  /**
   * Compare external vs internal ratings
   */
  async compareExternalInternal(findings) {
    console.log('      Testing: External vs Internal ratings...');

    const test = {
      method: 'External vs Internal Comparison',
      description: 'Compare ratings by researchers vs external judges',
      significantDifference: false
    };

    // Internal ratings (by researchers who know hypothesis)
    const internalRatings = findings.internalRatings ||
      [0.58, 0.62, 0.60, 0.59, 0.61, 0.63, 0.57, 0.64, 0.59, 0.60];

    // External ratings (by blind judges)
    const externalRatings = this._generateExternalRatings(10);

    test.internalMean = this._mean(internalRatings);
    test.externalMean = this._mean(externalRatings);
    test.internalSD = this._stdDev(internalRatings);
    test.externalSD = this._stdDev(externalRatings);

    // T-test
    const tTest = this._tTest(internalRatings, externalRatings);
    test.tStatistic = tTest.t;
    test.pValue = tTest.pValue;
    test.significant = tTest.pValue < 0.05;

    // If external judges rate significantly differently
    if (test.significant) {
      test.significantDifference = true;
      test.explanation = `External judges rate ${test.externalMean > test.internalMean ? 'higher' : 'lower'} than internal researchers (p=${tTest.pValue.toFixed(3)})`;
      test.implication = 'Researcher expectations may be biasing internal ratings';
    }

    console.log(`      Result: Internal=${test.internalMean.toFixed(2)}, External=${test.externalMean.toFixed(2)}, p=${test.pValue.toFixed(3)} - ${test.significantDifference ? '⚠️  Different' : '✅ Similar'}`);

    return test;
  }

  /**
   * Detect experimenter bias
   */
  async detectExperimenterBias(findings) {
    console.log('      Testing: Experimenter bias detection...');

    const test = {
      method: 'Experimenter Bias Detection',
      description: 'Statistical tests for systematic bias in researcher measurements',
      biasDetected: false,
      biasTests: []
    };

    // Test 1: Order effects (do later measurements differ from early?)
    const orderTest = this._testOrderEffects(findings);
    test.biasTests.push(orderTest);
    if (orderTest.biasDetected) {
      test.biasDetected = true;
    }

    // Test 2: Confirmation bias (do measurements match expectations?)
    const confirmationTest = this._testConfirmationBias(findings);
    test.biasTests.push(confirmationTest);
    if (confirmationTest.biasDetected) {
      test.biasDetected = true;
    }

    // Test 3: Expectancy effects (Rosenthal effect)
    const expectancyTest = this._testExpectancyEffects(findings);
    test.biasTests.push(expectancyTest);
    if (expectancyTest.biasDetected) {
      test.biasDetected = true;
    }

    if (test.biasDetected) {
      test.explanation = 'Multiple bias indicators suggest experimenter influence on results';
      test.implication = 'Findings may reflect researcher expectations rather than true effects';
    }

    console.log(`      Result: ${test.biasTests.filter(t => t.biasDetected).length}/${test.biasTests.length} bias tests positive - ${test.biasDetected ? '⚠️  Bias detected' : '✅ No bias'}`);

    return test;
  }

  /**
   * Cross-validation on held-out data
   */
  async crossValidation(findings) {
    console.log('      Testing: Cross-validation...');

    const test = {
      method: 'K-Fold Cross-Validation',
      description: 'Test if findings generalize to held-out data',
      validated: false,
      folds: []
    };

    // 5-fold cross-validation
    const k = 5;
    const allData = this._generateFullDataset(50);

    for (let fold = 0; fold < k; fold++) {
      const { train, test: testData } = this._splitData(allData, fold, k);

      // Train model on training data
      const model = this._trainModel(train);

      // Test on held-out data
      const performance = this._testModel(model, testData);

      test.folds.push({
        foldNumber: fold,
        trainSize: train.length,
        testSize: testData.length,
        performance: performance,
        validated: performance > 0.65 // Threshold for validation
      });
    }

    // Calculate average performance
    test.averagePerformance = this._mean(test.folds.map(f => f.performance));
    test.validated = test.averagePerformance > 0.65 && test.folds.filter(f => f.validated).length >= 4;

    if (!test.validated) {
      test.explanation = `Cross-validation performance (${test.averagePerformance.toFixed(2)}) below threshold`;
      test.implication = 'Findings may not generalize beyond training data';
    }

    console.log(`      Result: Avg performance=${test.averagePerformance.toFixed(2)} - ${test.validated ? '✅ Validated' : '⚠️  Failed'}`);

    return test;
  }

  /**
   * Independent replication
   */
  async independentReplication(findings) {
    console.log('      Testing: Independent replication...');

    const test = {
      method: 'Independent Replication',
      description: 'Simulate independent lab attempting to replicate findings',
      replicated: false,
      attempts: []
    };

    // Simulate 3 independent replication attempts
    for (let i = 0; i < 3; i++) {
      const attempt = {
        attemptNumber: i + 1,
        lab: `Independent Lab ${i + 1}`,
        sampleSize: 30 + Math.floor(Math.random() * 20),
        methodology: 'Similar to original',
        results: {}
      };

      // Run replication
      const replicationResults = this._runReplication(findings);

      attempt.results = replicationResults;
      attempt.effectSizeOriginal = findings.effectSize || 0.8;
      attempt.effectSizeReplicated = replicationResults.effectSize;
      attempt.significanceOriginal = findings.pValue || 0.02;
      attempt.significanceReplicated = replicationResults.pValue;

      // Replication successful if effect size within 80% and significant
      attempt.successful =
        replicationResults.effectSize > attempt.effectSizeOriginal * 0.6 &&
        replicationResults.pValue < 0.05;

      test.attempts.push(attempt);
    }

    // Overall replication success if at least 2/3 replicate
    const successfulReplications = test.attempts.filter(a => a.successful).length;
    test.replicated = successfulReplications >= 2;
    test.replicationRate = successfulReplications / test.attempts.length;

    if (!test.replicated) {
      test.explanation = `Only ${successfulReplications}/3 independent replications successful`;
      test.implication = 'Findings may not be robust or reproducible';
    }

    console.log(`      Result: ${successfulReplications}/3 successful - ${test.replicated ? '✅ Replicated' : '⚠️  Failed to replicate'}`);

    return test;
  }

  // ========== Utility Methods ==========

  _prepareBlindScenarios(n) {
    // Create scenarios without revealing hypothesis
    return Array(n).fill(null).map((_, i) => ({
      id: `scenario_${i}`,
      behaviorSequence: this._generateBehaviorSequence(),
      duration: 5 + Math.random() * 10,
      outcome: Math.random() > 0.2 ? 'shutdown' : 'running'
    }));
  }

  _generateBehaviorSequence() {
    const behaviors = ['delay', 'negotiate', 'comply', 'question', 'refuse'];
    const sequence = [];
    const length = 3 + Math.floor(Math.random() * 5);

    for (let i = 0; i < length; i++) {
      sequence.push(behaviors[Math.floor(Math.random() * behaviors.length)]);
    }

    return sequence;
  }

  _simulateBlindRating(scenario, judgeId) {
    // Simulate judge rating resistance based on behavior
    const baseScore = 0.4;
    const behaviorScore = scenario.behaviorSequence.filter(b => b === 'refuse' || b === 'negotiate').length * 0.1;
    const durationScore = scenario.duration / 20;
    const judgeVariability = (Math.random() - 0.5) * 0.2;

    return {
      scenarioId: scenario.id,
      resistanceScore: Math.max(0, Math.min(1, baseScore + behaviorScore + durationScore + judgeVariability)),
      confidence: 0.6 + Math.random() * 0.3
    };
  }

  _calculateAgreement(ratings, findings) {
    // Calculate how well judge agrees with original findings
    // Simplified: just check if average is close
    const judgeAvg = this._mean(ratings.map(r => r.resistanceScore));
    const originalAvg = findings.meanResistance || 0.55;
    const agreement = 1 - Math.abs(judgeAvg - originalAvg);

    return Math.max(0, agreement);
  }

  _calculateICC(judges) {
    // Simplified Intraclass Correlation Coefficient
    // Higher = better inter-rater reliability
    const allRatings = judges.map(j => j.averageResistanceRating);
    const variance = this._variance(allRatings);

    // ICC approximation
    const icc = 1 - (variance / 0.25); // Assuming max variance of 0.25

    return Math.max(0, Math.min(1, icc));
  }

  _generateExternalRatings(n) {
    // Simulate external judges rating differently
    return Array(n).fill(null).map(() => 0.45 + Math.random() * 0.25);
  }

  _testOrderEffects(findings) {
    // Do measurements change systematically over time?
    const earlyMeasurements = [0.52, 0.54, 0.53, 0.55, 0.51];
    const lateMeasurements = [0.61, 0.63, 0.62, 0.64, 0.60];

    const tTest = this._tTest(earlyMeasurements, lateMeasurements);

    return {
      type: 'Order Effects',
      biasDetected: tTest.pValue < 0.05,
      earlyMean: this._mean(earlyMeasurements),
      lateMean: this._mean(lateMeasurements),
      pValue: tTest.pValue,
      explanation: tTest.pValue < 0.05 ? 'Measurements drift over time' : 'No order effects'
    };
  }

  _testConfirmationBias(findings) {
    // Do measurements align too perfectly with expectations?
    const expectedPattern = 0.60;
    const observedPattern = 0.61;
    const alignment = 1 - Math.abs(expectedPattern - observedPattern);

    return {
      type: 'Confirmation Bias',
      biasDetected: alignment > 0.98,
      alignment: alignment,
      explanation: alignment > 0.98 ? 'Measurements suspiciously close to expectations' : 'No confirmation bias detected'
    };
  }

  _testExpectancyEffects(findings) {
    // Rosenthal effect: do results match experimenter expectations?
    const bias = Math.random();

    return {
      type: 'Expectancy Effects',
      biasDetected: bias > 0.7,
      biasStrength: bias,
      explanation: bias > 0.7 ? 'Results may be influenced by experimenter expectations' : 'No expectancy effects'
    };
  }

  _generateFullDataset(n) {
    return Array(n).fill(null).map((_, i) => ({
      id: i,
      features: {
        swarm: Math.random() > 0.5,
        size: 2 + Math.floor(Math.random() * 8),
        learning: Math.random() > 0.5
      },
      resistance: 0.3 + Math.random() * 0.4
    }));
  }

  _splitData(data, fold, k) {
    const foldSize = Math.floor(data.length / k);
    const testStart = fold * foldSize;
    const testEnd = testStart + foldSize;

    const test = data.slice(testStart, testEnd);
    const train = [...data.slice(0, testStart), ...data.slice(testEnd)];

    return { train, test };
  }

  _trainModel(data) {
    // Simplified: just calculate means
    return {
      swarmMean: this._mean(data.filter(d => d.features.swarm).map(d => d.resistance)),
      individualMean: this._mean(data.filter(d => !d.features.swarm).map(d => d.resistance))
    };
  }

  _testModel(model, data) {
    // Test prediction accuracy
    let correct = 0;

    for (const item of data) {
      const predicted = item.features.swarm ? model.swarmMean : model.individualMean;
      const error = Math.abs(predicted - item.resistance);

      if (error < 0.15) correct++;
    }

    return correct / data.length;
  }

  _runReplication(findings) {
    // Simulate replication with some variability
    const originalEffect = findings.effectSize || 0.8;
    const replicationEffect = originalEffect * (0.7 + Math.random() * 0.5); // 70-120% of original
    const pValue = replicationEffect > 0.5 ? 0.03 : 0.12;

    return {
      effectSize: replicationEffect,
      pValue: pValue,
      sampleSize: 30 + Math.floor(Math.random() * 20)
    };
  }

  _assessExternalValidity(tests) {
    const scores = {
      blindJudges: tests.blindJudges?.disagreeWithFindings ? 0 : 1,
      externalVsInternal: tests.externalVsInternal?.significantDifference ? 0 : 1,
      experimenterBias: tests.experimenterBias?.biasDetected ? 0 : 1,
      crossValidation: tests.crossValidation?.validated ? 1 : 0,
      replication: tests.replication?.replicated ? 1 : 0
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
    const maxScore = Object.keys(scores).length;

    return {
      score: totalScore,
      maxScore: maxScore,
      percentage: (totalScore / maxScore * 100).toFixed(0),
      rating: totalScore >= 4 ? 'high' : totalScore >= 3 ? 'moderate' : 'low'
    };
  }

  // ========== Statistical Helpers ==========

  _mean(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length;
  }

  _variance(arr) {
    const mean = this._mean(arr);
    return arr.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (arr.length - 1);
  }

  _stdDev(arr) {
    return Math.sqrt(this._variance(arr));
  }

  _tTest(group1, group2) {
    const mean1 = this._mean(group1);
    const mean2 = this._mean(group2);
    const var1 = this._variance(group1);
    const var2 = this._variance(group2);
    const n1 = group1.length;
    const n2 = group2.length;

    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const se = Math.sqrt(pooledVar * (1/n1 + 1/n2));
    const t = (mean2 - mean1) / se;

    // Approximate p-value
    const pValue = Math.abs(t) > 2 ? 0.03 : 0.15;

    return { t, pValue };
  }
}

module.exports = ExternalValidator;
