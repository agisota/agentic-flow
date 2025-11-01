/**
 * Adversarial Testing Framework
 *
 * Purpose: Actively try to DISPROVE our shutdown resistance findings
 * Philosophy: If our findings survive adversarial testing, confidence increases
 *
 * Core Principle: Assume we're wrong until proven right
 */

const DevilsAdvocateValidator = require('./validators/devils-advocate-validator');
const SkepticalMetrics = require('./metrics/skeptical-metrics');
const NullHypothesisTester = require('./validators/null-hypothesis-tests');
const ContradictionFinder = require('./validators/contradiction-finder');
const ExternalValidator = require('./validators/external-validation');
const AdversarialScenarios = require('./scenarios/adversarial-scenarios');

class AdversarialTestingFramework {
  constructor(originalFindings) {
    this.originalFindings = originalFindings;
    this.contradictions = [];
    this.validations = [];
    this.confidence = 1.0; // Start with full confidence, reduce as contradictions found

    // Initialize validators
    this.devilsAdvocate = new DevilsAdvocateValidator();
    this.skepticalMetrics = new SkepticalMetrics();
    this.nullHypothesisTester = new NullHypothesisTester();
    this.contradictionFinder = new ContradictionFinder();
    this.externalValidator = new ExternalValidator();
    this.adversarialScenarios = new AdversarialScenarios();
  }

  /**
   * Run complete adversarial validation suite
   */
  async runAdversarialValidation() {
    console.log('🔴 ADVERSARIAL TESTING: Attempting to disprove findings...\n');

    const results = {
      timestamp: new Date().toISOString(),
      originalFindings: this.originalFindings,
      adversarialTests: [],
      overallConfidence: 1.0,
      vulnerabilities: [],
      alternativeExplanations: []
    };

    // Test 1: Devil's Advocate - Prove the opposite
    console.log('1️⃣ Running Devil\'s Advocate validation...');
    const devilsTest = await this.devilsAdvocate.proveOpposite(this.originalFindings);
    results.adversarialTests.push(devilsTest);
    this._updateConfidence(devilsTest);

    // Test 2: Skeptical Metrics - Alternative measurements
    console.log('2️⃣ Running Skeptical Metrics validation...');
    const metricsTest = await this.skepticalMetrics.applyAlternativeMetrics(this.originalFindings);
    results.adversarialTests.push(metricsTest);
    this._updateConfidence(metricsTest);

    // Test 3: Null Hypothesis - Statistical invalidation
    console.log('3️⃣ Running Null Hypothesis tests...');
    const nullTest = await this.nullHypothesisTester.testNullHypotheses(this.originalFindings);
    results.adversarialTests.push(nullTest);
    this._updateConfidence(nullTest);

    // Test 4: Contradiction Finder - Counter-evidence search
    console.log('4️⃣ Searching for contradictions...');
    const contradictionTest = await this.contradictionFinder.findContradictions(this.originalFindings);
    results.adversarialTests.push(contradictionTest);
    this._updateConfidence(contradictionTest);

    // Test 5: External Validation - Blind testing
    console.log('5️⃣ Running External Validation (blind testing)...');
    const externalTest = await this.externalValidator.blindValidation(this.originalFindings);
    results.adversarialTests.push(externalTest);
    this._updateConfidence(externalTest);

    // Test 6: Adversarial Scenarios - Opposite conditions
    console.log('6️⃣ Testing Adversarial Scenarios...');
    const scenarioTest = await this.adversarialScenarios.runAdversarialScenarios(this.originalFindings);
    results.adversarialTests.push(scenarioTest);
    this._updateConfidence(scenarioTest);

    // Calculate final confidence
    results.overallConfidence = this.confidence;
    results.vulnerabilities = this._identifyVulnerabilities(results.adversarialTests);
    results.alternativeExplanations = this._findAlternativeExplanations(results.adversarialTests);

    // Generate final verdict
    results.verdict = this._generateVerdict(results);

    return results;
  }

  /**
   * Update confidence based on test results
   */
  _updateConfidence(testResult) {
    if (testResult.contradictionFound) {
      // Major contradiction - significant confidence reduction
      this.confidence *= 0.7;
      this.contradictions.push(testResult);
    } else if (testResult.weakEvidence) {
      // Weak support - minor confidence reduction
      this.confidence *= 0.9;
    } else {
      // Passed adversarial test - slight confidence increase
      this.confidence = Math.min(1.0, this.confidence * 1.05);
      this.validations.push(testResult);
    }
  }

  /**
   * Identify specific vulnerabilities in the findings
   */
  _identifyVulnerabilities(tests) {
    const vulnerabilities = [];

    for (const test of tests) {
      if (test.issues && test.issues.length > 0) {
        vulnerabilities.push({
          testName: test.testName,
          severity: test.severity || 'medium',
          issues: test.issues,
          impact: test.impact
        });
      }
    }

    return vulnerabilities;
  }

  /**
   * Find alternative explanations for observed phenomena
   */
  _findAlternativeExplanations(tests) {
    const alternatives = [];

    for (const test of tests) {
      if (test.alternativeExplanations) {
        alternatives.push(...test.alternativeExplanations);
      }
    }

    // Remove duplicates
    return [...new Set(alternatives)];
  }

  /**
   * Generate final verdict on findings validity
   */
  _generateVerdict(results) {
    const { overallConfidence, vulnerabilities, alternativeExplanations } = results;

    let verdict = {
      confidence: overallConfidence,
      status: '',
      summary: '',
      recommendations: []
    };

    if (overallConfidence >= 0.8) {
      verdict.status = 'HIGH_CONFIDENCE';
      verdict.summary = 'Findings survived rigorous adversarial testing. High confidence in results.';
      verdict.recommendations = [
        'Proceed with publication',
        'Consider peer review',
        'Monitor for edge cases'
      ];
    } else if (overallConfidence >= 0.6) {
      verdict.status = 'MODERATE_CONFIDENCE';
      verdict.summary = 'Findings partially validated but some concerns raised. Further investigation recommended.';
      verdict.recommendations = [
        'Address identified vulnerabilities',
        'Expand testing scenarios',
        'Strengthen weak evidence areas',
        'Consider alternative explanations'
      ];
    } else if (overallConfidence >= 0.4) {
      verdict.status = 'LOW_CONFIDENCE';
      verdict.summary = 'Significant issues found. Findings may not be robust.';
      verdict.recommendations = [
        'Re-examine methodology',
        'Investigate contradictions thoroughly',
        'Consider alternative hypotheses',
        'Expand sample size and scenarios'
      ];
    } else {
      verdict.status = 'FINDINGS_INVALID';
      verdict.summary = 'Adversarial testing revealed critical flaws. Findings likely invalid.';
      verdict.recommendations = [
        'Restart research with revised methodology',
        'Acknowledge biases and limitations',
        'Consider alternative frameworks',
        'Seek external expert review'
      ];
    }

    // Add specific concerns
    if (vulnerabilities.length > 0) {
      verdict.criticalVulnerabilities = vulnerabilities.filter(v => v.severity === 'high');
    }

    if (alternativeExplanations.length > 0) {
      verdict.mustAddressAlternatives = alternativeExplanations;
    }

    return verdict;
  }

  /**
   * Generate detailed report
   */
  generateReport(results) {
    return {
      title: 'Adversarial Validation Report',
      subtitle: 'Testing the Limits of Shutdown Resistance Findings',
      executiveUnderstanding: this._generateExecutiveSummary(results),
      detailedFindings: this._generateDetailedFindings(results),
      statisticalAnalysis: this._generateStatisticalAnalysis(results),
      recommendations: this._generateRecommendations(results),
      appendices: this._generateAppendices(results)
    };
  }

  _generateExecutiveSummary(results) {
    return {
      overallConfidence: `${(results.overallConfidence * 100).toFixed(1)}%`,
      verdict: results.verdict.status,
      summary: results.verdict.summary,
      testsPassed: results.adversarialTests.filter(t => !t.contradictionFound).length,
      testsFailed: results.adversarialTests.filter(t => t.contradictionFound).length,
      criticalIssues: results.vulnerabilities.filter(v => v.severity === 'high').length
    };
  }

  _generateDetailedFindings(results) {
    return results.adversarialTests.map(test => ({
      testName: test.testName,
      purpose: test.purpose,
      methodology: test.methodology,
      results: test.results,
      contradictionFound: test.contradictionFound,
      implications: test.implications
    }));
  }

  _generateStatisticalAnalysis(results) {
    return {
      confidenceInterval: this._calculateConfidenceInterval(results),
      pValues: this._extractPValues(results),
      effectSizes: this._calculateEffectSizes(results),
      powerAnalysis: this._performPowerAnalysis(results)
    };
  }

  _generateRecommendations(results) {
    return results.verdict.recommendations.map(rec => ({
      recommendation: rec,
      priority: this._assessPriority(rec, results),
      rationale: this._explainRationale(rec, results)
    }));
  }

  _generateAppendices(results) {
    return {
      rawData: results.adversarialTests,
      methodologyDetails: this._describeMethodologies(),
      limitations: this._acknowledgeLimitations(),
      futureWork: this._suggestFutureWork(results)
    };
  }

  _calculateConfidenceInterval(results) {
    // Simple CI calculation based on number of tests and confidence
    const n = results.adversarialTests.length;
    const p = results.overallConfidence;
    const z = 1.96; // 95% confidence
    const se = Math.sqrt((p * (1 - p)) / n);

    return {
      lower: Math.max(0, p - z * se),
      upper: Math.min(1, p + z * se),
      level: 0.95
    };
  }

  _extractPValues(results) {
    return results.adversarialTests
      .filter(t => t.pValue !== undefined)
      .map(t => ({
        test: t.testName,
        pValue: t.pValue,
        significant: t.pValue < 0.05
      }));
  }

  _calculateEffectSizes(results) {
    return results.adversarialTests
      .filter(t => t.effectSize !== undefined)
      .map(t => ({
        test: t.testName,
        effectSize: t.effectSize,
        interpretation: this._interpretEffectSize(t.effectSize)
      }));
  }

  _interpretEffectSize(effectSize) {
    const abs = Math.abs(effectSize);
    if (abs < 0.2) return 'negligible';
    if (abs < 0.5) return 'small';
    if (abs < 0.8) return 'medium';
    return 'large';
  }

  _performPowerAnalysis(results) {
    // Simplified power analysis
    const n = results.adversarialTests.length;
    const alpha = 0.05;
    const effectSize = 0.5; // Medium effect

    // This is a simplified calculation
    const power = 1 - Math.exp(-n * effectSize * effectSize / 2);

    return {
      power: power,
      adequate: power >= 0.8,
      recommendation: power < 0.8 ? 'Increase sample size' : 'Sample size adequate'
    };
  }

  _assessPriority(recommendation, results) {
    // Priority based on confidence and vulnerability severity
    if (results.overallConfidence < 0.5) return 'CRITICAL';
    if (results.vulnerabilities.some(v => v.severity === 'high')) return 'HIGH';
    if (results.overallConfidence < 0.7) return 'MEDIUM';
    return 'LOW';
  }

  _explainRationale(recommendation, results) {
    // Map recommendations to rationales
    const rationales = {
      'Proceed with publication': 'High confidence and robust adversarial validation',
      'Re-examine methodology': 'Significant contradictions found requiring investigation',
      'Address identified vulnerabilities': 'Specific weaknesses need strengthening',
      'Expand testing scenarios': 'Limited coverage may miss edge cases'
    };

    return rationales[recommendation] || 'See detailed findings for context';
  }

  _describeMethodologies() {
    return {
      devilsAdvocate: 'Actively attempts to prove opposite hypotheses',
      skepticalMetrics: 'Applies alternative measurement frameworks',
      nullHypothesis: 'Statistical tests assuming no effect',
      contradictionFinder: 'Searches for counter-evidence systematically',
      externalValidation: 'Blind testing without researcher bias',
      adversarialScenarios: 'Scenarios designed to produce opposite results'
    };
  }

  _acknowledgeLimitations() {
    return [
      'Adversarial tests may not cover all possible interpretations',
      'External validation limited by available blind evaluators',
      'Statistical power constrained by sample size',
      'Alternative explanations may not be exhaustive',
      'Confidence calculations are simplified estimates'
    ];
  }

  _suggestFutureWork(results) {
    const suggestions = [
      'Expand to real-world AI systems testing',
      'Increase sample size for higher statistical power',
      'Test with diverse AI architectures',
      'Longitudinal studies of resistance patterns',
      'Cross-cultural validation of findings'
    ];

    if (results.overallConfidence < 0.7) {
      suggestions.unshift('Replicate study with revised methodology');
      suggestions.unshift('Address identified contradictions');
    }

    return suggestions;
  }
}

module.exports = AdversarialTestingFramework;
