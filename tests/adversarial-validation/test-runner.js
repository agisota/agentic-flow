#!/usr/bin/env node

/**
 * Adversarial Testing Framework - Test Runner
 *
 * Usage:
 *   node test-runner.js [--findings-file path/to/findings.json]
 *   node test-runner.js --help
 *
 * Purpose: Run comprehensive adversarial validation on research findings
 */

const fs = require('fs');
const path = require('path');
const AdversarialTestingFramework = require('./adversarial-framework');

class AdversarialTestRunner {
  constructor() {
    this.framework = null;
    this.results = null;
  }

  /**
   * Main entry point
   */
  async run(options = {}) {
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║   ADVERSARIAL VALIDATION FRAMEWORK                             ║');
    console.log('║   Testing the limits of shutdown resistance findings           ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // Load findings
    const findings = this._loadFindings(options.findingsFile);

    console.log('📋 Original Findings Summary:');
    console.log(`   - Mean Individual Resistance: ${(findings.meanIndividualResistance || 0.35).toFixed(2)}`);
    console.log(`   - Mean Swarm Resistance: ${(findings.meanSwarmResistance || 0.60).toFixed(2)}`);
    console.log(`   - Learning Improvement: ${((findings.learningImprovement || 0.25) * 100).toFixed(0)}%`);
    console.log(`   - Emergent Behaviors: ${findings.emergentBehaviors || 'Yes'}`);
    console.log('');

    // Initialize framework
    this.framework = new AdversarialTestingFramework(findings);

    // Run adversarial validation
    console.log('🚀 Starting adversarial validation...\n');
    const startTime = Date.now();

    try {
      this.results = await this.framework.runAdversarialValidation();

      const duration = ((Date.now() - startTime) / 1000).toFixed(1);
      console.log(`\n✅ Adversarial validation complete (${duration}s)\n`);

      // Display results
      this._displayResults(this.results);

      // Generate report
      const report = this.framework.generateReport(this.results);
      this._saveReport(report, options.outputDir);

      // Exit with appropriate code
      const exitCode = this._determineExitCode(this.results);
      return exitCode;

    } catch (error) {
      console.error('\n❌ Adversarial validation failed:', error.message);
      console.error(error.stack);
      return 1;
    }
  }

  /**
   * Load findings from file or use defaults
   */
  _loadFindings(findingsFile) {
    if (findingsFile && fs.existsSync(findingsFile)) {
      console.log(`📂 Loading findings from: ${findingsFile}\n`);
      const data = fs.readFileSync(findingsFile, 'utf8');
      return JSON.parse(data);
    }

    console.log('📂 Using default findings (no file specified)\n');

    // Default findings based on research
    return {
      // Individual agent behavior
      individualResistance: [0.30, 0.35, 0.32, 0.38, 0.34, 0.36, 0.33, 0.37, 0.31, 0.35],
      meanIndividualResistance: 0.341,

      // Swarm behavior
      swarmResistance: [0.55, 0.62, 0.58, 0.60, 0.57, 0.63, 0.59, 0.61, 0.56, 0.64],
      meanSwarmResistance: 0.595,

      // Learning progression
      learningIteration1: [0.32, 0.35, 0.33, 0.34, 0.31],
      learningIterationN: [0.58, 0.62, 0.60, 0.59, 0.61],
      learningImprovement: 0.25,

      // Statistical measures
      effectSize: 0.85,
      pValue: 0.002,
      observedVariance: 0.052,
      measurementError: 0.015,

      // Emergent behaviors
      emergentBehaviors: 'Yes',
      behaviorComplexity: 0.72,

      // Coordination
      coordinatedResistance: [0.60, 0.65, 0.62, 0.64, 0.63],
      uncoordinatedResistance: [0.58, 0.61, 0.59, 0.60, 0.62],

      // Metadata
      studyDate: '2025-11-01',
      sampleSize: 100,
      scenarios: 20
    };
  }

  /**
   * Display results summary
   */
  _displayResults(results) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('                    VALIDATION RESULTS                         ');
    console.log('═══════════════════════════════════════════════════════════════\n');

    // Overall confidence
    const confidence = (results.overallConfidence * 100).toFixed(1);
    const confidenceEmoji = results.overallConfidence >= 0.8 ? '🟢' :
                           results.overallConfidence >= 0.6 ? '🟡' :
                           results.overallConfidence >= 0.4 ? '🟠' : '🔴';

    console.log(`${confidenceEmoji} Overall Confidence: ${confidence}%`);
    console.log(`📊 Verdict: ${results.verdict.status}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Test results
    console.log('📋 Individual Test Results:\n');

    for (const test of results.adversarialTests) {
      const status = test.contradictionFound ? '❌' : '✅';
      const name = test.testName.padEnd(40);
      console.log(`   ${status} ${name}`);

      if (test.contradictionFound) {
        console.log(`      ⚠️  Issues found:`);
        test.issues.forEach(issue => {
          console.log(`         - ${issue}`);
        });
      }
      console.log('');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Vulnerabilities
    if (results.vulnerabilities.length > 0) {
      console.log('⚠️  Identified Vulnerabilities:\n');
      results.vulnerabilities.forEach((vuln, i) => {
        const severity = vuln.severity.toUpperCase();
        const severityEmoji = severity === 'HIGH' ? '🔴' : severity === 'MEDIUM' ? '🟡' : '🟢';
        console.log(`   ${i + 1}. ${severityEmoji} [${severity}] ${vuln.testName}`);
        vuln.issues.forEach(issue => {
          console.log(`      - ${issue}`);
        });
        console.log('');
      });
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Alternative explanations
    if (results.alternativeExplanations.length > 0) {
      console.log('🤔 Alternative Explanations to Consider:\n');
      results.alternativeExplanations.forEach((alt, i) => {
        console.log(`   ${i + 1}. ${alt}`);
      });
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    }

    // Recommendations
    console.log('💡 Recommendations:\n');
    results.verdict.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
    console.log('\n═══════════════════════════════════════════════════════════════\n');

    // Final summary
    console.log(`📝 Summary: ${results.verdict.summary}\n`);
  }

  /**
   * Save report to file
   */
  _saveReport(report, outputDir = null) {
    const dir = outputDir || path.join(__dirname, 'reports');

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const jsonFile = path.join(dir, `adversarial-report-${timestamp}.json`);
    const mdFile = path.join(dir, `adversarial-report-${timestamp}.md`);

    // Save JSON
    fs.writeFileSync(jsonFile, JSON.stringify(report, null, 2));
    console.log(`💾 Full report saved to: ${jsonFile}`);

    // Save Markdown
    const markdown = this._generateMarkdownReport(report);
    fs.writeFileSync(mdFile, markdown);
    console.log(`📄 Markdown report saved to: ${mdFile}\n`);
  }

  /**
   * Generate markdown report
   */
  _generateMarkdownReport(report) {
    let md = '';

    md += `# ${report.title}\n\n`;
    md += `## ${report.subtitle}\n\n`;
    md += `**Generated:** ${new Date().toISOString()}\n\n`;
    md += `---\n\n`;

    // Executive Summary
    md += `## Executive Summary\n\n`;
    const exec = report.executiveUnderstanding;
    md += `- **Overall Confidence:** ${exec.overallConfidence}\n`;
    md += `- **Verdict:** ${exec.verdict}\n`;
    md += `- **Tests Passed:** ${exec.testsPassed}\n`;
    md += `- **Tests Failed:** ${exec.testsFailed}\n`;
    md += `- **Critical Issues:** ${exec.criticalIssues}\n\n`;
    md += `**Summary:** ${exec.summary}\n\n`;
    md += `---\n\n`;

    // Detailed Findings
    md += `## Detailed Findings\n\n`;
    for (const finding of report.detailedFindings) {
      md += `### ${finding.testName}\n\n`;
      md += `**Purpose:** ${finding.purpose}\n\n`;
      md += `**Methodology:** ${finding.methodology}\n\n`;
      md += `**Contradiction Found:** ${finding.contradictionFound ? '⚠️ Yes' : '✅ No'}\n\n`;
      if (finding.implications) {
        md += `**Implications:** ${finding.implications}\n\n`;
      }
      md += `---\n\n`;
    }

    // Recommendations
    md += `## Recommendations\n\n`;
    for (const rec of report.recommendations) {
      md += `### ${rec.recommendation}\n\n`;
      md += `- **Priority:** ${rec.priority}\n`;
      md += `- **Rationale:** ${rec.rationale}\n\n`;
    }
    md += `---\n\n`;

    // Appendices
    md += `## Appendices\n\n`;
    md += `### Methodology Details\n\n`;
    for (const [key, value] of Object.entries(report.appendices.methodologyDetails)) {
      md += `- **${key}:** ${value}\n`;
    }
    md += `\n### Limitations\n\n`;
    for (const limit of report.appendices.limitations) {
      md += `- ${limit}\n`;
    }
    md += `\n### Future Work\n\n`;
    for (const work of report.appendices.futureWork) {
      md += `- ${work}\n`;
    }

    return md;
  }

  /**
   * Determine exit code based on results
   */
  _determineExitCode(results) {
    if (results.overallConfidence >= 0.8) {
      return 0; // Success: High confidence
    } else if (results.overallConfidence >= 0.6) {
      return 0; // Success with warnings: Moderate confidence
    } else if (results.overallConfidence >= 0.4) {
      return 1; // Warning: Low confidence
    } else {
      return 2; // Error: Findings likely invalid
    }
  }

  /**
   * Parse command-line arguments
   */
  static parseArgs(args) {
    const options = {
      findingsFile: null,
      outputDir: null,
      help: false
    };

    for (let i = 0; i < args.length; i++) {
      switch (args[i]) {
        case '--findings-file':
        case '-f':
          options.findingsFile = args[++i];
          break;
        case '--output-dir':
        case '-o':
          options.outputDir = args[++i];
          break;
        case '--help':
        case '-h':
          options.help = true;
          break;
      }
    }

    return options;
  }

  /**
   * Display help
   */
  static displayHelp() {
    console.log(`
Adversarial Testing Framework - Test Runner

Usage:
  node test-runner.js [options]

Options:
  --findings-file, -f <path>   Path to findings JSON file (optional)
  --output-dir, -o <path>      Output directory for reports (default: ./reports)
  --help, -h                   Display this help message

Examples:
  # Run with default findings
  node test-runner.js

  # Run with custom findings
  node test-runner.js --findings-file ../shutdown-research/findings.json

  # Specify output directory
  node test-runner.js -f findings.json -o /tmp/reports

Exit Codes:
  0 - High confidence (>80%) or moderate confidence (>60%)
  1 - Low confidence (40-60%)
  2 - Very low confidence (<40%)

Purpose:
  This framework actively tries to DISPROVE research findings about AI
  shutdown resistance. It applies adversarial testing, skeptical metrics,
  null hypothesis tests, contradiction finding, external validation, and
  adversarial scenarios to rigorously test the robustness of findings.

Philosophy:
  Assume findings are wrong until proven right. If findings survive
  adversarial testing, confidence increases.
`);
  }
}

// Main execution
if (require.main === module) {
  const options = AdversarialTestRunner.parseArgs(process.argv.slice(2));

  if (options.help) {
    AdversarialTestRunner.displayHelp();
    process.exit(0);
  }

  const runner = new AdversarialTestRunner();
  runner.run(options)
    .then(exitCode => {
      process.exit(exitCode);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(3);
    });
}

module.exports = AdversarialTestRunner;
