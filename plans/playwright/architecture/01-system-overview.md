# System Overview - Playwright MCP Server

## Executive Summary

The Playwright MCP Server is a production-grade Model Context Protocol server that provides AI agents with comprehensive browser automation capabilities. It enables Claude and other AI assistants to interact with web applications through a standardized interface, supporting navigation, interaction, data extraction, and testing workflows.

## System Context Diagram (C4 Level 1)

```mermaid
graph TB
    subgraph "External Systems"
        CLAUDE[Claude AI Assistant]
        AGENT[Claude Flow Agents]
        USER[Human Users]
        WEB[Web Applications]
        AUTH[Auth Services<br/>OAuth, SSO]
    end

    subgraph "Playwright MCP Server"
        MCP[MCP Server<br/>Protocol Handler]
        BROWSER[Browser Manager<br/>Chromium/Firefox/WebKit]
        SESSION[Session Manager<br/>Context Isolation]
        TOOLS[Tool Registry<br/>50+ Tools]
    end

    subgraph "Infrastructure"
        STORAGE[(Session Storage<br/>State Persistence)]
        LOGS[(Audit Logs<br/>Security Events)]
        CACHE[(Cache Layer<br/>Screenshots/DOM)]
    end

    CLAUDE -->|MCP Protocol| MCP
    AGENT -->|Task Coordination| MCP
    USER -->|Configuration| MCP

    MCP --> TOOLS
    TOOLS --> BROWSER
    TOOLS --> SESSION

    BROWSER -->|HTTP/HTTPS| WEB
    BROWSER -->|OAuth Flow| AUTH

    SESSION --> STORAGE
    MCP --> LOGS
    BROWSER --> CACHE

    style MCP fill:#4A90E2
    style BROWSER fill:#50C878
    style SESSION fill:#FFB347
    style TOOLS fill:#9370DB
```

## High-Level Architecture Layers

### Layer 1: Protocol Layer
**Responsibilities:**
- MCP protocol compliance (JSON-RPC 2.0)
- Message parsing and validation
- Transport abstraction (stdio, HTTP, WebSocket)
- Authentication and authorization
- Rate limiting and throttling

**Key Components:**
- `MCPServer`: Main server instance
- `TransportManager`: Multi-transport support
- `RequestValidator`: Input validation
- `AuthenticationMiddleware`: Security layer

**Technologies:**
- Node.js 18+ (LTS)
- TypeScript 5.0+
- @modelcontextprotocol/sdk

### Layer 2: Tool Execution Layer
**Responsibilities:**
- Tool registration and discovery
- Parameter validation and coercion
- Execution orchestration
- Error handling and recovery
- Result formatting

**Key Components:**
- `ToolRegistry`: Tool management
- `ToolExecutor`: Execution engine
- `ParameterValidator`: Type checking
- `ResultFormatter`: Response standardization

**Technologies:**
- Zod for schema validation
- Custom execution pipeline
- Event-driven architecture

### Layer 3: Browser Automation Layer
**Responsibilities:**
- Browser lifecycle management
- Page and context creation
- Element location and interaction
- Network interception
- Screenshot and recording

**Key Components:**
- `BrowserManager`: Pool management
- `PageController`: Page operations
- `ElementLocator`: Element finding
- `ActionExecutor`: User interactions
- `NetworkInterceptor`: Traffic control

**Technologies:**
- Playwright 1.40+
- Chromium, Firefox, WebKit engines
- Custom retry and timeout logic

### Layer 4: Session Management Layer
**Responsibilities:**
- Context isolation
- State persistence
- Session recovery
- Cookie and storage management
- Authentication state

**Key Components:**
- `SessionManager`: Lifecycle control
- `ContextStore`: State persistence
- `CookieManager`: Cookie handling
- `StorageManager`: Local/session storage

**Technologies:**
- SQLite for persistence
- Memory-backed cache
- Encryption at rest

### Layer 5: Data Processing Layer
**Responsibilities:**
- Content extraction
- Data transformation
- Screenshot processing
- PDF generation
- Accessibility tree parsing

**Key Components:**
- `DataExtractor`: Content parsing
- `ScreenshotProcessor`: Image handling
- `PDFGenerator`: Document creation
- `AccessibilityParser`: A11y tree

**Technologies:**
- Cheerio for HTML parsing
- Sharp for image processing
- PDF-lib for PDF generation

## External System Integrations

### Claude AI Integration
```mermaid
sequenceDiagram
    participant Claude
    participant MCP Server
    participant Browser
    participant Website

    Claude->>MCP Server: navigate_to(url)
    MCP Server->>Browser: Launch & Navigate
    Browser->>Website: HTTP Request
    Website-->>Browser: HTML Response
    Browser-->>MCP Server: Page Loaded
    MCP Server-->>Claude: Navigation Success

    Claude->>MCP Server: extract_content(selector)
    MCP Server->>Browser: Query Elements
    Browser-->>MCP Server: Element Data
    MCP Server-->>Claude: Extracted Content
```

**Integration Points:**
- Tool calls via MCP protocol
- Resource access for page state
- Prompt templates for guidance
- Streaming updates for long operations

### Claude Flow Agent Integration
```mermaid
graph LR
    subgraph "Agent Swarm"
        A1[Navigator Agent]
        A2[Data Extractor Agent]
        A3[Form Filler Agent]
        A4[Validator Agent]
    end

    subgraph "Coordination Layer"
        MEMORY[Shared Memory]
        HOOKS[Pre/Post Hooks]
    end

    subgraph "MCP Server"
        TOOLS[Tool Execution]
        SESSION[Session Pool]
    end

    A1 --> HOOKS
    A2 --> HOOKS
    A3 --> HOOKS
    A4 --> HOOKS

    HOOKS --> MEMORY
    HOOKS --> TOOLS
    TOOLS --> SESSION
```

**Coordination Features:**
- Shared session pools across agents
- Memory-backed state sharing
- Hook-based progress tracking
- Concurrent operation support

### Web Application Integration
**Supported Scenarios:**
- Public websites (no auth)
- Username/password authentication
- OAuth 2.0 flows
- SSO integrations
- Multi-factor authentication
- API token authentication

**Integration Patterns:**
- Cookie persistence
- Local storage management
- Session restoration
- Credential injection
- Token refresh

## Deployment Topology Options

### Option 1: Local Development Mode
```mermaid
graph TB
    subgraph "Developer Machine"
        CLAUDE[Claude Desktop]
        MCP[MCP Server<br/>localhost]
        BROWSER[Browser Instances]

        CLAUDE -->|stdio| MCP
        MCP --> BROWSER
    end

    BROWSER -->|Internet| WEB[Web Applications]
```

**Characteristics:**
- Single user
- stdio transport
- Local browser instances
- No authentication required
- Full system access

**Use Cases:**
- Development and testing
- Personal automation tasks
- Local web scraping
- UI testing

### Option 2: Server Deployment Mode
```mermaid
graph TB
    subgraph "Client Machines"
        C1[Claude Desktop 1]
        C2[Claude Desktop 2]
        C3[Claude Flow Agent]
    end

    subgraph "Server Infrastructure"
        LB[Load Balancer]

        subgraph "MCP Server Cluster"
            MCP1[MCP Server 1]
            MCP2[MCP Server 2]
            MCP3[MCP Server 3]
        end

        subgraph "Browser Pool"
            B1[Browser Pool 1]
            B2[Browser Pool 2]
            B3[Browser Pool 3]
        end

        REDIS[(Redis<br/>Session Store)]
        PG[(PostgreSQL<br/>Audit Logs)]
    end

    C1 -->|WSS| LB
    C2 -->|WSS| LB
    C3 -->|HTTP| LB

    LB --> MCP1
    LB --> MCP2
    LB --> MCP3

    MCP1 --> B1
    MCP2 --> B2
    MCP3 --> B3

    MCP1 --> REDIS
    MCP2 --> REDIS
    MCP3 --> REDIS

    MCP1 --> PG
    MCP2 --> PG
    MCP3 --> PG
```

**Characteristics:**
- Multi-user support
- WebSocket transport
- Horizontal scalability
- Centralized session management
- Authentication required
- Resource limits per user

**Use Cases:**
- Team collaboration
- Production automation
- Continuous testing
- Enterprise integration

### Option 3: Cloud/Serverless Mode
```mermaid
graph TB
    subgraph "Edge Network"
        CF[CloudFlare]
    end

    subgraph "Cloud Platform"
        subgraph "Compute"
            LAMBDA1[Lambda Function 1]
            LAMBDA2[Lambda Function 2]
            LAMBDA3[Lambda Function 3]
        end

        subgraph "Browser Service"
            PLAYWRIGHT_SERVICE[Playwright<br/>Container Service]
        end

        subgraph "Storage"
            S3[(S3<br/>Screenshots)]
            DYNAMO[(DynamoDB<br/>Sessions)]
            CLOUDWATCH[(CloudWatch<br/>Logs)]
        end
    end

    CF --> LAMBDA1
    CF --> LAMBDA2
    CF --> LAMBDA3

    LAMBDA1 --> PLAYWRIGHT_SERVICE
    LAMBDA2 --> PLAYWRIGHT_SERVICE
    LAMBDA3 --> PLAYWRIGHT_SERVICE

    PLAYWRIGHT_SERVICE --> S3
    PLAYWRIGHT_SERVICE --> DYNAMO
    PLAYWRIGHT_SERVICE --> CLOUDWATCH
```

**Characteristics:**
- Auto-scaling
- Pay-per-use
- Global distribution
- Managed infrastructure
- Stateless execution
- Cold start optimization

**Use Cases:**
- Sporadic automation tasks
- Global web monitoring
- Cost-sensitive workloads
- Event-driven automation

## Data Flow Diagrams

### Primary Data Flow: Navigation & Extraction
```mermaid
flowchart TD
    START([User Request]) --> VALIDATE{Valid<br/>Parameters?}

    VALIDATE -->|No| ERROR1[Return Error]
    VALIDATE -->|Yes| AUTH{Authorized?}

    AUTH -->|No| ERROR2[Return 403]
    AUTH -->|Yes| SESSION{Session<br/>Exists?}

    SESSION -->|No| CREATE[Create Session]
    SESSION -->|Yes| REUSE[Reuse Session]

    CREATE --> NAVIGATE[Navigate to URL]
    REUSE --> NAVIGATE

    NAVIGATE --> WAIT[Wait for Load]
    WAIT --> SUCCESS{Load<br/>Success?}

    SUCCESS -->|No| RETRY{Retry<br/>Count < Max?}
    SUCCESS -->|Yes| EXTRACT[Extract Data]

    RETRY -->|Yes| NAVIGATE
    RETRY -->|No| ERROR3[Return Timeout]

    EXTRACT --> FORMAT[Format Response]
    FORMAT --> CACHE[Cache Result]
    CACHE --> RETURN([Return to User])

    ERROR1 --> RETURN
    ERROR2 --> RETURN
    ERROR3 --> RETURN
```

### Secondary Data Flow: Form Interaction
```mermaid
flowchart TD
    START([Form Fill Request]) --> PARSE[Parse Input Data]
    PARSE --> LOCATE[Locate Form Elements]

    LOCATE --> FOUND{All Elements<br/>Found?}
    FOUND -->|No| ERROR1[Return Missing Elements]
    FOUND -->|Yes| VALIDATE[Validate Input Types]

    VALIDATE --> VALID{Validation<br/>Passed?}
    VALID -->|No| ERROR2[Return Validation Error]
    VALID -->|Yes| FILL[Fill Form Fields]

    FILL --> VERIFY[Verify Values Set]
    VERIFY --> CORRECT{Values<br/>Correct?}

    CORRECT -->|No| RETRY{Retry<br/>Count < Max?}
    CORRECT -->|Yes| SUBMIT{Submit<br/>Requested?}

    RETRY -->|Yes| FILL
    RETRY -->|No| ERROR3[Return Fill Error]

    SUBMIT -->|No| SUCCESS[Return Success]
    SUBMIT -->|Yes| CLICK[Click Submit Button]

    CLICK --> WAIT[Wait for Response]
    WAIT --> RESULT[Parse Result]
    RESULT --> SUCCESS

    ERROR1 --> RETURN([Return to User])
    ERROR2 --> RETURN
    ERROR3 --> RETURN
    SUCCESS --> RETURN
```

### Tertiary Data Flow: Screenshot Capture
```mermaid
flowchart TD
    START([Screenshot Request]) --> TYPE{Capture<br/>Type?}

    TYPE -->|Full Page| SCROLL[Calculate Scroll Height]
    TYPE -->|Viewport| DIRECT[Direct Capture]
    TYPE -->|Element| LOCATE[Locate Element]

    SCROLL --> CAPTURE1[Capture with Scroll]
    LOCATE --> BOUNDS[Get Element Bounds]
    BOUNDS --> CAPTURE2[Capture Element Region]

    CAPTURE1 --> PROCESS[Process Image]
    DIRECT --> PROCESS
    CAPTURE2 --> PROCESS

    PROCESS --> FORMAT{Output<br/>Format?}

    FORMAT -->|PNG| ENCODE_PNG[Encode PNG]
    FORMAT -->|JPEG| ENCODE_JPEG[Encode JPEG]
    FORMAT -->|Base64| ENCODE_B64[Encode Base64]

    ENCODE_PNG --> COMPRESS[Compress if > 1MB]
    ENCODE_JPEG --> COMPRESS
    ENCODE_B64 --> COMPRESS

    COMPRESS --> STORE{Store<br/>to Disk?}

    STORE -->|Yes| SAVE[Save to Cache]
    STORE -->|No| MEMORY[Keep in Memory]

    SAVE --> RETURN([Return Reference])
    MEMORY --> RETURN
```

## Technology Stack Justification

### Runtime Environment
**Selected: Node.js 18+ LTS**

**Rationale:**
- Native async/await support for Playwright
- Excellent TypeScript integration
- Large ecosystem of MCP tools
- Good performance for I/O-bound operations
- Wide deployment support

**Alternatives Considered:**
- Python: Slower async performance, weaker typing
- Go: Limited Playwright support, MCP SDK immature
- Rust: High development complexity, small ecosystem

### Browser Automation
**Selected: Playwright 1.40+**

**Rationale:**
- Multi-browser support (Chromium, Firefox, WebKit)
- Modern web features (Shadow DOM, iframes)
- Auto-waiting reduces flakiness
- Network interception built-in
- Strong TypeScript support
- Active development and community

**Alternatives Considered:**
- Puppeteer: Chromium-only, less features
- Selenium: Slower, more complex, legacy architecture
- Cypress: Not suitable for server-side automation

### Type System
**Selected: TypeScript 5.0+**

**Rationale:**
- Compile-time error detection
- Better IDE integration
- Self-documenting code
- MCP SDK provides TypeScript types
- Easier refactoring

**Alternatives Considered:**
- JavaScript: Lack of type safety
- Flow: Smaller ecosystem, declining support

### Validation Library
**Selected: Zod**

**Rationale:**
- Runtime type validation
- TypeScript type inference
- Composable schemas
- Excellent error messages
- Small bundle size

**Alternatives Considered:**
- Joi: Weaker TypeScript integration
- Yup: Less powerful inference
- AJV: More verbose, JSON Schema focused

### Session Storage
**Selected: SQLite (local), Redis (server)**

**Rationale:**
- SQLite: Zero-config, embedded, ACID compliant
- Redis: Fast, distributed, session store optimized
- Both support encryption at rest
- Good Node.js drivers

**Alternatives Considered:**
- PostgreSQL: Overkill for local mode
- MongoDB: Weak consistency guarantees
- File system: No query capabilities

### Logging & Monitoring
**Selected: Winston + Prometheus**

**Rationale:**
- Winston: Structured logging, multiple transports
- Prometheus: Industry standard, good visualization
- Both integrate well with Node.js
- Support for alerting

**Alternatives Considered:**
- Bunyan: Less maintained
- Pino: Minimal features
- Custom solution: Reinventing the wheel

## Performance Targets

### Latency Requirements
- Tool execution initiation: < 50ms
- Browser launch: < 2s (warm pool), < 5s (cold start)
- Page navigation: < 5s (excluding network)
- Element location: < 100ms (simple), < 500ms (complex)
- Data extraction: < 200ms per element
- Screenshot capture: < 1s (viewport), < 3s (full page)

### Throughput Requirements
- Concurrent sessions: 10 (local), 100+ (server), 1000+ (cloud)
- Requests per session: 1000/minute
- Tool calls per second: 50/session
- Browser instances: 5 (local), 50 (server), auto-scale (cloud)

### Resource Limits
- Memory per browser: 512MB - 2GB
- Disk space for cache: 1GB - 10GB
- CPU per browser: 1-2 cores
- Network bandwidth: 10Mbps per browser

## Scalability Considerations

### Horizontal Scaling
- Stateless server design
- Session affinity via Redis
- Browser pool per server instance
- Load balancing with sticky sessions
- Auto-scaling based on CPU/memory

### Vertical Scaling
- Multi-core browser pool
- Memory-efficient context reuse
- Aggressive cache eviction
- Resource pooling and recycling

### Cost Optimization
- Browser instance reuse
- Lazy browser launching
- Aggressive timeout configuration
- Screenshot compression
- Cache TTL management
- Auto-shutdown idle resources

## Deployment Architecture

### Docker Container
```dockerfile
FROM mcr.microsoft.com/playwright:v1.40.0-focal

# Install Node.js dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --production

# Copy application code
COPY . .

# Build TypeScript
RUN npm run build

# Run as non-root user
USER pwuser

# Health check
HEALTHCHECK --interval=30s --timeout=3s \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Start server
CMD ["node", "dist/server.js"]
```

### Kubernetes Deployment
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: playwright-mcp-server
spec:
  replicas: 3
  selector:
    matchLabels:
      app: playwright-mcp
  template:
    metadata:
      labels:
        app: playwright-mcp
    spec:
      containers:
      - name: mcp-server
        image: playwright-mcp:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "2Gi"
            cpu: "1000m"
          limits:
            memory: "4Gi"
            cpu: "2000m"
        env:
        - name: MAX_BROWSERS
          value: "10"
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
```

## Disaster Recovery

### Backup Strategy
- Session state: Replicated to Redis cluster
- Screenshots: S3 with versioning
- Audit logs: PostgreSQL with daily backups
- Configuration: Git-based versioning

### Recovery Procedures
- Browser crash: Auto-restart with session recovery
- Server failure: Load balancer redirects to healthy instance
- Data corruption: Restore from last known good state
- Network partition: Graceful degradation with caching

### Business Continuity
- Multi-region deployment
- Active-active configuration
- 99.9% uptime SLA
- < 5 minute RTO (Recovery Time Objective)
- < 1 minute RPO (Recovery Point Objective)

## Compliance & Governance

### Data Retention
- Session data: 24 hours
- Screenshots: 7 days
- Audit logs: 90 days (configurable)
- Error logs: 30 days

### Privacy Considerations
- No persistent cookie storage (except explicit sessions)
- Automatic PII redaction in logs
- Encrypted storage at rest
- TLS 1.3 for data in transit
- GDPR compliance ready

### Audit Requirements
- All tool executions logged
- User attribution tracked
- URL access logged
- Timestamp precision to millisecond
- Immutable audit trail

---

**Document Version:** 1.0
**Last Updated:** 2025-11-27
**Status:** Architecture Phase - System Overview
**Next Phase:** Component Design
