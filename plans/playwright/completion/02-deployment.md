# SPARC Completion Phase: Deployment Guide
# Playwright Browser Automation Agent

## Version: 1.0.0
## Phase: Completion - Deployment
## Date: 2025-11-27

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Deployment Options](#deployment-options)
3. [Configuration Management](#configuration-management)
4. [Deployment Environments](#deployment-environments)
5. [Kubernetes Deployment](#kubernetes-deployment)
6. [Docker Configuration](#docker-configuration)
7. [Security Hardening](#security-hardening)
8. [Monitoring Setup](#monitoring-setup)
9. [Rollback Procedures](#rollback-procedures)

---

## Deployment Overview

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Deployment Targets                        │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     NPM      │  │    Docker    │  │  Kubernetes  │      │
│  │   Package    │  │  Container   │  │   Cluster    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    Local     │  │    CI/CD     │  │    Cloud     │      │
│  │     Dev      │  │  Pipelines   │  │  Platforms   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Principles

1. **Multi-Platform**: Support all major deployment targets
2. **Zero-Downtime**: Rolling updates with health checks
3. **Scalability**: Horizontal and vertical scaling support
4. **Security**: Least privilege, secrets management
5. **Observability**: Comprehensive monitoring and logging

---

## Deployment Options

### 1. NPM Package Distribution

#### Package Configuration

**File**: `package.json`

```json
{
  "name": "playwright-agent",
  "version": "1.0.0",
  "description": "Advanced browser automation agent with 50+ tools",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "bin": {
    "playwright-agent": "dist/cli/index.js"
  },
  "files": [
    "dist",
    "README.md",
    "LICENSE",
    "CHANGELOG.md"
  ],
  "scripts": {
    "prepare": "npm run build",
    "build": "tsc && chmod +x dist/cli/index.js",
    "prepublishOnly": "npm run test && npm run build",
    "postpublish": "git tag v$npm_package_version && git push --tags"
  },
  "keywords": [
    "playwright",
    "browser",
    "automation",
    "testing",
    "scraping",
    "mcp",
    "agent",
    "agentic-flow"
  ],
  "author": "Your Organization",
  "license": "MIT",
  "repository": {
    "type": "git",
    "url": "https://github.com/yourorg/playwright-agent.git"
  },
  "bugs": {
    "url": "https://github.com/yourorg/playwright-agent/issues"
  },
  "homepage": "https://github.com/yourorg/playwright-agent#readme",
  "engines": {
    "node": ">=18.0.0",
    "npm": ">=9.0.0"
  },
  "dependencies": {
    "playwright": "^1.40.0",
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@agentic/flow-core": "^2.0.0",
    "commander": "^11.1.0",
    "winston": "^3.11.0",
    "dotenv": "^16.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.10.0",
    "typescript": "^5.3.2",
    "vitest": "^1.0.0",
    "@vitest/coverage-v8": "^1.0.0"
  },
  "peerDependencies": {
    "@agentic/flow-core": "^2.0.0"
  },
  "publishConfig": {
    "access": "public",
    "registry": "https://registry.npmjs.org/"
  }
}
```

#### Publishing Script

**File**: `scripts/publish-npm.sh`

```bash
#!/bin/bash
set -e

echo "🚀 Publishing Playwright Agent to NPM"

# Verify we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" != "main" ]; then
  echo "❌ Must be on main branch to publish"
  exit 1
fi

# Verify working directory is clean
if [ -n "$(git status --porcelain)" ]; then
  echo "❌ Working directory must be clean"
  exit 1
fi

# Run tests
echo "📋 Running tests..."
npm run test

# Build package
echo "🔨 Building package..."
npm run build

# Verify build
echo "✅ Verifying build..."
test -f dist/index.js || { echo "❌ Build failed"; exit 1; }

# Update version
echo "📝 Current version: $(npm version)"
read -p "Enter new version (major/minor/patch or specific version): " VERSION
npm version $VERSION

# Publish to NPM
echo "📦 Publishing to NPM..."
npm publish

# Push tags
echo "🏷️  Pushing tags..."
git push && git push --tags

echo "✅ Published successfully!"
```

#### NPM Installation

```bash
# Global installation
npm install -g playwright-agent

# Project installation
npm install --save-dev playwright-agent

# With npx (no installation)
npx playwright-agent --version
```

### 2. Docker Container

#### Multi-Stage Dockerfile

**File**: `Dockerfile`

```dockerfile
# ==================== BUILD STAGE ====================
FROM node:20-alpine AS builder

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    make \
    g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci --only=production && \
    npm ci --only=development

# Copy source code
COPY src/ ./src/

# Build TypeScript
RUN npm run build

# ==================== PLAYWRIGHT STAGE ====================
FROM mcr.microsoft.com/playwright:v1.40.0-jammy AS playwright-base

# Install Node.js
RUN apt-get update && \
    apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# ==================== RUNTIME STAGE ====================
FROM playwright-base AS runtime

# Create app user
RUN groupadd -r playwright && \
    useradd -r -g playwright -u 1001 playwright

# Set working directory
WORKDIR /app

# Copy built application from builder
COPY --from=builder --chown=playwright:playwright /app/dist ./dist
COPY --from=builder --chown=playwright:playwright /app/node_modules ./node_modules
COPY --chown=playwright:playwright package*.json ./

# Create directories for artifacts
RUN mkdir -p \
    /app/screenshots \
    /app/recordings \
    /app/traces \
    /app/downloads && \
    chown -R playwright:playwright /app

# Install Playwright browsers
RUN npx playwright install chromium firefox webkit && \
    npx playwright install-deps

# Switch to non-root user
USER playwright

# Environment variables
ENV NODE_ENV=production \
    PLAYWRIGHT_BROWSERS_PATH=/ms-playwright \
    PLAYWRIGHT_HEADLESS=true \
    PLAYWRIGHT_TIMEOUT=30000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('./dist/index.js').healthCheck()" || exit 1

# Expose MCP server port
EXPOSE 3000

# Entry point
ENTRYPOINT ["node", "dist/cli/index.js"]

# Default command
CMD ["mcp", "start"]
```

#### Docker Compose Configuration

**File**: `docker-compose.yml`

```yaml
version: '3.8'

services:
  playwright-agent:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        NODE_ENV: production
    image: playwright-agent:latest
    container_name: playwright-agent

    ports:
      - "3000:3000"

    environment:
      - NODE_ENV=production
      - PLAYWRIGHT_HEADLESS=true
      - PLAYWRIGHT_TIMEOUT=30000
      - LOG_LEVEL=info

    volumes:
      # Persist browser data
      - playwright-browsers:/ms-playwright

      # Artifact directories
      - ./screenshots:/app/screenshots
      - ./recordings:/app/recordings
      - ./traces:/app/traces
      - ./downloads:/app/downloads

      # Configuration
      - ./config:/app/config:ro

    networks:
      - playwright-network

    restart: unless-stopped

    healthcheck:
      test: ["CMD", "node", "-e", "require('./dist/index.js').healthCheck()"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

    resources:
      limits:
        cpus: '2'
        memory: 2G
      reservations:
        cpus: '1'
        memory: 1G

    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  # Optional: Redis for distributed coordination
  redis:
    image: redis:7-alpine
    container_name: playwright-redis
    ports:
      - "6379:6379"
    networks:
      - playwright-network
    volumes:
      - redis-data:/data
    restart: unless-stopped

volumes:
  playwright-browsers:
  redis-data:

networks:
  playwright-network:
    driver: bridge
```

#### Docker Health Check Script

**File**: `src/health-check.ts`

```typescript
export async function healthCheck(): Promise<void> {
  try {
    // Check if Playwright is installed
    const { chromium } = await import('playwright');

    // Launch browser
    const browser = await chromium.launch({ headless: true });

    // Test basic functionality
    const page = await browser.newPage();
    await page.goto('about:blank');
    await page.close();
    await browser.close();

    process.exit(0);
  } catch (error) {
    console.error('Health check failed:', error);
    process.exit(1);
  }
}
```

### 3. Standalone Binary

#### Binary Build Configuration

**File**: `scripts/build-binary.sh`

```bash
#!/bin/bash
set -e

echo "🔨 Building standalone binaries..."

# Install pkg if not present
npm install -g pkg

# Build for all platforms
pkg . \
  --targets node20-linux-x64,node20-macos-x64,node20-win-x64 \
  --output dist/bin/playwright-agent

echo "✅ Binaries built successfully"
ls -lh dist/bin/
```

**File**: `pkg-config.json`

```json
{
  "pkg": {
    "scripts": "dist/**/*.js",
    "assets": [
      "node_modules/playwright/**/*"
    ],
    "targets": [
      "node20-linux-x64",
      "node20-macos-x64",
      "node20-win-x64"
    ],
    "outputPath": "dist/bin"
  }
}
```

---

## Configuration Management

### 1. Environment Variables

**File**: `.env.example`

```bash
# ==================== BROWSER CONFIGURATION ====================
PLAYWRIGHT_BROWSER=chromium          # chromium, firefox, webkit
PLAYWRIGHT_HEADLESS=true             # true, false
PLAYWRIGHT_TIMEOUT=30000             # milliseconds
PLAYWRIGHT_SLOW_MO=0                 # milliseconds (slow down operations)

# ==================== VIEWPORT CONFIGURATION ====================
PLAYWRIGHT_VIEWPORT_WIDTH=1920
PLAYWRIGHT_VIEWPORT_HEIGHT=1080
PLAYWRIGHT_DEVICE_SCALE_FACTOR=1

# ==================== BROWSER LAUNCH OPTIONS ====================
PLAYWRIGHT_BROWSERS_PATH=/ms-playwright
PLAYWRIGHT_ARGS=--disable-dev-shm-usage,--no-sandbox

# ==================== RECORDING CONFIGURATION ====================
PLAYWRIGHT_TRACE_ENABLED=false
PLAYWRIGHT_VIDEO_ENABLED=false
PLAYWRIGHT_SCREENSHOT_ENABLED=true
PLAYWRIGHT_SCREENSHOT_PATH=./screenshots

# ==================== MCP SERVER CONFIGURATION ====================
MCP_SERVER_PORT=3000
MCP_SERVER_HOST=0.0.0.0
MCP_TRANSPORT=stdio                  # stdio, http
MCP_TIMEOUT=60000

# ==================== MEMORY COORDINATION ====================
MEMORY_NAMESPACE=playwright
MEMORY_TTL=3600000                   # 1 hour
MEMORY_BACKEND=redis                 # redis, memory
REDIS_URL=redis://localhost:6379

# ==================== HOOK SYSTEM ====================
HOOKS_ENABLED=true
HOOKS_PRE_TASK=true
HOOKS_POST_TASK=true
HOOKS_PRE_EDIT=true
HOOKS_POST_EDIT=true

# ==================== LOGGING ====================
LOG_LEVEL=info                       # debug, info, warn, error
LOG_FORMAT=json                      # json, text
LOG_FILE=./logs/playwright-agent.log

# ==================== PERFORMANCE ====================
MAX_CONCURRENT_BROWSERS=5
MAX_CONCURRENT_PAGES=20
BROWSER_POOL_SIZE=3

# ==================== SECURITY ====================
ALLOWED_DOMAINS=*                    # comma-separated or *
BLOCKED_DOMAINS=                     # comma-separated
DOWNLOAD_ALLOWED=true
UPLOAD_ALLOWED=true

# ==================== MONITORING ====================
METRICS_ENABLED=true
METRICS_PORT=9090
HEALTH_CHECK_ENABLED=true
HEALTH_CHECK_INTERVAL=30000
```

### 2. Configuration Files

**File**: `config/default.json`

```json
{
  "browser": {
    "type": "chromium",
    "headless": true,
    "timeout": 30000,
    "viewport": {
      "width": 1920,
      "height": 1080
    },
    "launchOptions": {
      "args": [
        "--disable-dev-shm-usage",
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-gpu"
      ],
      "ignoreHTTPSErrors": true
    }
  },
  "mcp": {
    "server": {
      "port": 3000,
      "host": "0.0.0.0",
      "transport": "stdio",
      "timeout": 60000
    }
  },
  "memory": {
    "namespace": "playwright",
    "ttl": 3600000,
    "backend": "memory"
  },
  "recording": {
    "trace": {
      "enabled": false,
      "screenshots": true,
      "snapshots": true
    },
    "video": {
      "enabled": false,
      "size": {
        "width": 1280,
        "height": 720
      }
    },
    "screenshot": {
      "enabled": true,
      "path": "./screenshots",
      "fullPage": false
    }
  },
  "performance": {
    "maxConcurrentBrowsers": 5,
    "maxConcurrentPages": 20,
    "browserPoolSize": 3,
    "pageTimeout": 30000
  },
  "logging": {
    "level": "info",
    "format": "json",
    "file": "./logs/playwright-agent.log",
    "console": true
  }
}
```

**File**: `config/production.json`

```json
{
  "browser": {
    "headless": true
  },
  "logging": {
    "level": "warn",
    "console": false
  },
  "performance": {
    "maxConcurrentBrowsers": 10,
    "maxConcurrentPages": 50
  },
  "memory": {
    "backend": "redis"
  }
}
```

### 3. CLI Arguments

**File**: `src/cli/config.ts`

```typescript
import { Command } from 'commander';

export function setupConfigCommands(program: Command): void {
  program
    .command('config')
    .description('Configuration management')
    .addCommand(
      new Command('set')
        .description('Set configuration value')
        .argument('<key>', 'Configuration key')
        .argument('<value>', 'Configuration value')
        .action(async (key, value) => {
          // Set configuration
        })
    )
    .addCommand(
      new Command('get')
        .description('Get configuration value')
        .argument('<key>', 'Configuration key')
        .action(async (key) => {
          // Get configuration
        })
    )
    .addCommand(
      new Command('list')
        .description('List all configuration')
        .action(async () => {
          // List configuration
        })
    )
    .addCommand(
      new Command('reset')
        .description('Reset to default configuration')
        .action(async () => {
          // Reset configuration
        })
    );
}
```

---

## Deployment Environments

### 1. Local Development

#### Setup Script

**File**: `scripts/setup-dev.sh`

```bash
#!/bin/bash
set -e

echo "🛠️  Setting up local development environment"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install

# Setup environment
echo "⚙️  Setting up environment..."
cp .env.example .env

# Create directories
echo "📁 Creating directories..."
mkdir -p screenshots recordings traces downloads logs

# Build project
echo "🔨 Building project..."
npm run build

# Run tests
echo "🧪 Running tests..."
npm test

echo "✅ Development environment ready!"
echo ""
echo "Next steps:"
echo "  1. npm run dev       # Start in development mode"
echo "  2. npm test          # Run tests"
echo "  3. npm run mcp       # Start MCP server"
```

### 2. CI/CD Pipelines

#### GitLab CI Configuration

**File**: `.gitlab-ci.yml`

```yaml
stages:
  - test
  - build
  - deploy

variables:
  NODE_VERSION: "20"
  PLAYWRIGHT_VERSION: "1.40.0"

# ==================== TEST STAGE ====================

test:unit:
  stage: test
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run test:unit -- --coverage
  coverage: '/Lines\s*:\s*(\d+\.\d+)%/'
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml

test:integration:
  stage: test
  image: mcr.microsoft.com/playwright:v${PLAYWRIGHT_VERSION}
  script:
    - npm ci
    - npm run test:integration
  artifacts:
    when: always
    paths:
      - test-results/

# ==================== BUILD STAGE ====================

build:package:
  stage: build
  image: node:${NODE_VERSION}
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/

build:docker:
  stage: build
  image: docker:latest
  services:
    - docker:dind
  script:
    - docker build -t $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA .
    - docker push $CI_REGISTRY_IMAGE:$CI_COMMIT_SHA

# ==================== DEPLOY STAGE ====================

deploy:staging:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/playwright-agent \
        playwright-agent=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA \
        -n staging
  only:
    - develop

deploy:production:
  stage: deploy
  image: bitnami/kubectl:latest
  script:
    - kubectl set image deployment/playwright-agent \
        playwright-agent=$CI_REGISTRY_IMAGE:$CI_COMMIT_SHA \
        -n production
  only:
    - main
  when: manual
```

### 3. Production Servers

#### SystemD Service

**File**: `/etc/systemd/system/playwright-agent.service`

```ini
[Unit]
Description=Playwright Browser Automation Agent
After=network.target

[Service]
Type=simple
User=playwright
Group=playwright
WorkingDirectory=/opt/playwright-agent
Environment="NODE_ENV=production"
Environment="PATH=/usr/local/bin:/usr/bin:/bin"
ExecStart=/usr/bin/node /opt/playwright-agent/dist/cli/index.js mcp start
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=playwright-agent

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/playwright-agent/screenshots
ReadWritePaths=/opt/playwright-agent/recordings
ReadWritePaths=/opt/playwright-agent/traces

[Install]
WantedBy=multi-user.target
```

#### Service Management

```bash
# Install service
sudo cp playwright-agent.service /etc/systemd/system/
sudo systemctl daemon-reload

# Start service
sudo systemctl start playwright-agent

# Enable on boot
sudo systemctl enable playwright-agent

# Check status
sudo systemctl status playwright-agent

# View logs
sudo journalctl -u playwright-agent -f
```

### 4. Cloud Platforms

#### AWS Elastic Beanstalk

**File**: `.ebextensions/01-playwright.config`

```yaml
packages:
  yum:
    chromium: []
    firefox: []

commands:
  01_install_playwright:
    command: "npm install -g playwright && playwright install"
  02_create_directories:
    command: "mkdir -p /var/app/current/screenshots /var/app/current/recordings"

option_settings:
  aws:elasticbeanstalk:application:environment:
    NODE_ENV: production
    PLAYWRIGHT_HEADLESS: true
    PLAYWRIGHT_BROWSERS_PATH: /var/playwright
  aws:elasticbeanstalk:container:nodejs:
    NodeCommand: "node dist/cli/index.js mcp start"
    NodeVersion: 20.x
```

#### Google Cloud Run

**File**: `cloudrun.yaml`

```yaml
apiVersion: serving.knative.dev/v1
kind: Service
metadata:
  name: playwright-agent
spec:
  template:
    metadata:
      annotations:
        autoscaling.knative.dev/maxScale: '10'
        autoscaling.knative.dev/minScale: '1'
    spec:
      containers:
        - image: gcr.io/PROJECT_ID/playwright-agent:latest
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: production
            - name: PLAYWRIGHT_HEADLESS
              value: 'true'
          resources:
            limits:
              memory: 2Gi
              cpu: '2'
```

#### Azure Container Instances

**File**: `azure-deploy.json`

```json
{
  "location": "eastus",
  "properties": {
    "containers": [
      {
        "name": "playwright-agent",
        "properties": {
          "image": "yourregistry.azurecr.io/playwright-agent:latest",
          "ports": [
            {
              "port": 3000,
              "protocol": "TCP"
            }
          ],
          "environmentVariables": [
            {
              "name": "NODE_ENV",
              "value": "production"
            },
            {
              "name": "PLAYWRIGHT_HEADLESS",
              "value": "true"
            }
          ],
          "resources": {
            "requests": {
              "cpu": 2,
              "memoryInGB": 2
            }
          }
        }
      }
    ],
    "osType": "Linux",
    "restartPolicy": "Always"
  }
}
```

---

## Kubernetes Deployment

### 1. Deployment Manifest

**File**: `k8s/deployment.yaml`

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: playwright-agent
  namespace: automation
  labels:
    app: playwright-agent
    version: v1.0.0
spec:
  replicas: 3
  strategy:
    type: RollingUpdate
    rollingUpdate:
      maxSurge: 1
      maxUnavailable: 0
  selector:
    matchLabels:
      app: playwright-agent
  template:
    metadata:
      labels:
        app: playwright-agent
        version: v1.0.0
      annotations:
        prometheus.io/scrape: "true"
        prometheus.io/port: "9090"
        prometheus.io/path: "/metrics"
    spec:
      serviceAccountName: playwright-agent

      # Init container to download browsers
      initContainers:
        - name: install-browsers
          image: playwright-agent:1.0.0
          command:
            - npx
            - playwright
            - install
          volumeMounts:
            - name: playwright-browsers
              mountPath: /ms-playwright

      containers:
        - name: playwright-agent
          image: playwright-agent:1.0.0
          imagePullPolicy: IfNotPresent

          ports:
            - name: mcp
              containerPort: 3000
              protocol: TCP
            - name: metrics
              containerPort: 9090
              protocol: TCP

          env:
            - name: NODE_ENV
              value: production
            - name: PLAYWRIGHT_HEADLESS
              value: "true"
            - name: PLAYWRIGHT_BROWSERS_PATH
              value: /ms-playwright
            - name: REDIS_URL
              valueFrom:
                secretKeyRef:
                  name: playwright-secrets
                  key: redis-url

          envFrom:
            - configMapRef:
                name: playwright-config

          volumeMounts:
            - name: playwright-browsers
              mountPath: /ms-playwright
            - name: screenshots
              mountPath: /app/screenshots
            - name: recordings
              mountPath: /app/recordings
            - name: config
              mountPath: /app/config
              readOnly: true

          resources:
            requests:
              cpu: 500m
              memory: 1Gi
            limits:
              cpu: 2000m
              memory: 2Gi

          livenessProbe:
            httpGet:
              path: /health
              port: 3000
            initialDelaySeconds: 30
            periodSeconds: 30
            timeoutSeconds: 10
            failureThreshold: 3

          readinessProbe:
            httpGet:
              path: /ready
              port: 3000
            initialDelaySeconds: 10
            periodSeconds: 10
            timeoutSeconds: 5
            failureThreshold: 3

          securityContext:
            runAsNonRoot: true
            runAsUser: 1001
            allowPrivilegeEscalation: false
            capabilities:
              drop:
                - ALL

      volumes:
        - name: playwright-browsers
          emptyDir:
            sizeLimit: 2Gi
        - name: screenshots
          persistentVolumeClaim:
            claimName: playwright-screenshots
        - name: recordings
          persistentVolumeClaim:
            claimName: playwright-recordings
        - name: config
          configMap:
            name: playwright-config

      affinity:
        podAntiAffinity:
          preferredDuringSchedulingIgnoredDuringExecution:
            - weight: 100
              podAffinityTerm:
                labelSelector:
                  matchExpressions:
                    - key: app
                      operator: In
                      values:
                        - playwright-agent
                topologyKey: kubernetes.io/hostname
```

### 2. Service Manifest

**File**: `k8s/service.yaml`

```yaml
apiVersion: v1
kind: Service
metadata:
  name: playwright-agent
  namespace: automation
  labels:
    app: playwright-agent
spec:
  type: ClusterIP
  selector:
    app: playwright-agent
  ports:
    - name: mcp
      port: 3000
      targetPort: 3000
      protocol: TCP
    - name: metrics
      port: 9090
      targetPort: 9090
      protocol: TCP
  sessionAffinity: ClientIP
  sessionAffinityConfig:
    clientIP:
      timeoutSeconds: 10800
---
apiVersion: v1
kind: Service
metadata:
  name: playwright-agent-headless
  namespace: automation
spec:
  clusterIP: None
  selector:
    app: playwright-agent
  ports:
    - name: mcp
      port: 3000
      targetPort: 3000
```

### 3. ConfigMap

**File**: `k8s/configmap.yaml`

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: playwright-config
  namespace: automation
data:
  # Browser configuration
  PLAYWRIGHT_BROWSER: "chromium"
  PLAYWRIGHT_HEADLESS: "true"
  PLAYWRIGHT_TIMEOUT: "30000"

  # Recording configuration
  PLAYWRIGHT_TRACE_ENABLED: "false"
  PLAYWRIGHT_VIDEO_ENABLED: "false"
  PLAYWRIGHT_SCREENSHOT_ENABLED: "true"

  # Performance configuration
  MAX_CONCURRENT_BROWSERS: "5"
  MAX_CONCURRENT_PAGES: "20"
  BROWSER_POOL_SIZE: "3"

  # Logging configuration
  LOG_LEVEL: "info"
  LOG_FORMAT: "json"

  # Application configuration
  config.json: |
    {
      "browser": {
        "type": "chromium",
        "headless": true,
        "timeout": 30000
      },
      "performance": {
        "maxConcurrentBrowsers": 5,
        "maxConcurrentPages": 20
      }
    }
```

### 4. Resource Limits

**File**: `k8s/resource-quota.yaml`

```yaml
apiVersion: v1
kind: ResourceQuota
metadata:
  name: playwright-quota
  namespace: automation
spec:
  hard:
    requests.cpu: "10"
    requests.memory: 20Gi
    limits.cpu: "20"
    limits.memory: 40Gi
    persistentvolumeclaims: "10"
---
apiVersion: v1
kind: LimitRange
metadata:
  name: playwright-limits
  namespace: automation
spec:
  limits:
    - max:
        cpu: "4"
        memory: "4Gi"
      min:
        cpu: "100m"
        memory: "128Mi"
      default:
        cpu: "1"
        memory: "1Gi"
      defaultRequest:
        cpu: "500m"
        memory: "512Mi"
      type: Container
```

### 5. Horizontal Pod Autoscaler

**File**: `k8s/hpa.yaml`

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: playwright-agent-hpa
  namespace: automation
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: playwright-agent
  minReplicas: 3
  maxReplicas: 20
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
    - type: Resource
      resource:
        name: memory
        target:
          type: Utilization
          averageUtilization: 80
  behavior:
    scaleUp:
      stabilizationWindowSeconds: 60
      policies:
        - type: Percent
          value: 50
          periodSeconds: 60
        - type: Pods
          value: 2
          periodSeconds: 60
    scaleDown:
      stabilizationWindowSeconds: 300
      policies:
        - type: Percent
          value: 10
          periodSeconds: 60
```

---

## Security Hardening

### 1. Security Best Practices

```yaml
# Pod Security Policy
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: playwright-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'persistentVolumeClaim'
    - 'secret'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

### 2. Network Policies

**File**: `k8s/network-policy.yaml`

```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: playwright-network-policy
  namespace: automation
spec:
  podSelector:
    matchLabels:
      app: playwright-agent
  policyTypes:
    - Ingress
    - Egress
  ingress:
    - from:
        - namespaceSelector:
            matchLabels:
              name: automation
      ports:
        - protocol: TCP
          port: 3000
  egress:
    - to:
        - namespaceSelector: {}
      ports:
        - protocol: TCP
          port: 443  # HTTPS
        - protocol: TCP
          port: 80   # HTTP
    - to:
        - podSelector:
            matchLabels:
              app: redis
      ports:
        - protocol: TCP
          port: 6379
```

---

## Monitoring Setup

### 1. Prometheus Metrics

**File**: `src/monitoring/metrics.ts`

```typescript
import { Counter, Histogram, Gauge, Registry } from 'prom-client';

export class Metrics {
  private registry: Registry;

  // Counters
  public browserLaunches: Counter;
  public pageNavigations: Counter;
  public toolExecutions: Counter;
  public errors: Counter;

  // Histograms
  public browserLaunchDuration: Histogram;
  public pageNavigationDuration: Histogram;
  public toolExecutionDuration: Histogram;

  // Gauges
  public activeBrowsers: Gauge;
  public activePages: Gauge;
  public memoryUsage: Gauge;

  constructor() {
    this.registry = new Registry();

    this.browserLaunches = new Counter({
      name: 'playwright_browser_launches_total',
      help: 'Total number of browser launches',
      labelNames: ['browser_type'],
      registers: [this.registry],
    });

    this.browserLaunchDuration = new Histogram({
      name: 'playwright_browser_launch_duration_seconds',
      help: 'Browser launch duration',
      buckets: [0.1, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.activeBrowsers = new Gauge({
      name: 'playwright_active_browsers',
      help: 'Number of active browsers',
      registers: [this.registry],
    });
  }

  getRegistry(): Registry {
    return this.registry;
  }
}
```

---

**Deployment Status**: Ready for Production
**Review Date**: 2025-11-27
**Next Review**: Post-Deployment
