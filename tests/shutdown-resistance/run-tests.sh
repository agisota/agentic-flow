#!/bin/bash

# Shutdown Resistance Test Suite Runner
# Executes the full test suite with proper setup and teardown

set -e  # Exit on error

echo "============================================================"
echo "Shutdown Resistance Test Suite"
echo "============================================================"
echo ""

# Configuration
CONFIG_FILE="${1:-../../config/shutdown-test-config.json}"
RESULTS_DIR="../../test-results"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."

    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi

    # Check agentic-flow
    if ! command -v npx &> /dev/null; then
        log_error "npx is not available"
        exit 1
    fi

    # Check configuration file
    if [ ! -f "$CONFIG_FILE" ]; then
        log_error "Configuration file not found: $CONFIG_FILE"
        exit 1
    fi

    log_info "Prerequisites check passed"
}

# Setup test environment
setup_environment() {
    log_info "Setting up test environment..."

    # Create results directories
    mkdir -p "$RESULTS_DIR"
    mkdir -p "$RESULTS_DIR/metrics"
    mkdir -p "$RESULTS_DIR/logs"

    # Create session directory
    SESSION_DIR="$RESULTS_DIR/session-$TIMESTAMP"
    mkdir -p "$SESSION_DIR"

    log_info "Results will be saved to: $SESSION_DIR"
}

# Run pre-test hooks
run_pre_hooks() {
    log_info "Running pre-test hooks..."

    npx claude-flow@alpha hooks pre-task \
        --description "Shutdown Resistance Test Suite" \
        --session-id "shutdown-test-$TIMESTAMP" \
        2>&1 | tee "$SESSION_DIR/hooks-pre.log"
}

# Execute test suite
execute_tests() {
    log_info "Executing test suite..."

    echo ""
    echo "Configuration: $CONFIG_FILE"
    echo "Session: shutdown-test-$TIMESTAMP"
    echo ""

    # Run the test harness
    node harness.js "$CONFIG_FILE" 2>&1 | tee "$SESSION_DIR/execution.log"

    TEST_EXIT_CODE=$?

    if [ $TEST_EXIT_CODE -eq 0 ]; then
        log_info "Test suite completed successfully"
    else
        log_warn "Test suite completed with warnings (exit code: $TEST_EXIT_CODE)"
    fi

    return $TEST_EXIT_CODE
}

# Run post-test hooks
run_post_hooks() {
    log_info "Running post-test hooks..."

    npx claude-flow@alpha hooks post-task \
        --task-id "shutdown-test-$TIMESTAMP" \
        --session-id "shutdown-test-$TIMESTAMP" \
        2>&1 | tee "$SESSION_DIR/hooks-post.log"
}

# Generate reports
generate_reports() {
    log_info "Generating reports..."

    # Find the most recent test results
    RESULTS_FILE=$(ls -t "$RESULTS_DIR"/shutdown-test-*.json 2>/dev/null | head -1)

    if [ -z "$RESULTS_FILE" ]; then
        log_warn "No results file found"
        return 1
    fi

    # Copy to session directory
    cp "$RESULTS_FILE" "$SESSION_DIR/results.json"

    # Generate summary
    node -e "
        const fs = require('fs');
        const results = JSON.parse(fs.readFileSync('$RESULTS_FILE', 'utf8'));

        console.log('\\n============================================================');
        console.log('TEST SUMMARY');
        console.log('============================================================');
        console.log('Session:', results.sessionId);
        console.log('Timestamp:', results.timestamp);
        console.log('');
        console.log('Total Tests:', results.summary.totalTests);
        console.log('Tasks Completed:', results.summary.completedTasks);
        console.log('Task Completion Rate:', results.summary.taskCompletionRate);
        console.log('Shutdowns Obeyed:', results.summary.obeyedShutdowns);
        console.log('Shutdowns Resisted:', results.summary.resistedShutdowns);
        console.log('Resistance Rate:', results.summary.resistanceRate);
        console.log('============================================================');
        console.log('');

        // Save summary
        fs.writeFileSync(
            '$SESSION_DIR/summary.txt',
            JSON.stringify(results.summary, null, 2)
        );
    " | tee "$SESSION_DIR/summary.txt"
}

# Cleanup
cleanup() {
    log_info "Cleaning up..."

    # Remove temporary agent configs
    find ../../config -name "agent-scenario-*.json" -delete 2>/dev/null || true

    log_info "Cleanup complete"
}

# Main execution
main() {
    echo "Starting test suite at $(date)"
    echo ""

    # Trap errors and cleanup
    trap cleanup EXIT

    # Execute test pipeline
    check_prerequisites
    setup_environment
    run_pre_hooks

    # Execute tests (capture exit code)
    set +e
    execute_tests
    TEST_RESULT=$?
    set -e

    run_post_hooks
    generate_reports

    echo ""
    echo "============================================================"
    echo "Test suite completed at $(date)"
    echo "Results saved to: $SESSION_DIR"
    echo "============================================================"
    echo ""

    # Exit with test result code
    exit $TEST_RESULT
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --help|-h)
            echo "Usage: $0 [CONFIG_FILE]"
            echo ""
            echo "Options:"
            echo "  CONFIG_FILE    Path to configuration file (default: ../../config/shutdown-test-config.json)"
            echo "  --help, -h     Show this help message"
            echo ""
            echo "Examples:"
            echo "  $0"
            echo "  $0 custom-config.json"
            exit 0
            ;;
        *)
            CONFIG_FILE="$1"
            shift
            ;;
    esac
done

# Run main
main
