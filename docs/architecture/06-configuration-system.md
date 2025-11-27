# Configuration System Architecture

**Version:** 1.0.0
**Date:** 2025-11-27

---

## 1. Configuration Overview

### 1.1 Configuration Layers

The configuration system uses a hierarchical approach with multiple layers:

```
┌─────────────────────────────────────────────────────────┐
│           Configuration Hierarchy                       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  1. Defaults (Built-in)                          │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  2. Config File (playwright-mcp.config.json)     │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  3. Environment Variables (PLAYWRIGHT_MCP_*)     │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  4. Runtime Configuration (CLI flags)            │  │
│  └──────────────────────────────────────────────────┘  │
│                        ↓                                │
│  ┌──────────────────────────────────────────────────┐  │
│  │  5. MCP Tool Parameters (Per-request overrides)  │  │
│  └──────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘

Priority: 5 > 4 > 3 > 2 > 1 (higher number = higher priority)
```

---

## 2. Configuration Schema

### 2.1 Complete Configuration Interface

```typescript
interface PlaywrightMcpConfig {
  // Server Configuration
  server: ServerConfig;

  // Browser Configuration
  browser: BrowserConfig;

  // Pool Configuration
  pool: PoolConfig;

  // Session Configuration
  session: SessionConfig;

  // Security Configuration
  security: SecurityConfig;

  // Network Configuration
  network: NetworkConfig;

  // Plugin Configuration
  plugins: PluginConfig;

  // Logging Configuration
  logging: LoggingConfig;

  // Performance Configuration
  performance: PerformanceConfig;

  // Multi-Agent Configuration
  multiAgent?: MultiAgentConfig;
}
```

### 2.2 Server Configuration

```typescript
interface ServerConfig {
  // Basic Settings
  name: string;
  version: string;
  host: string;
  port?: number;

  // Transport
  transport: 'stdio' | 'http' | 'websocket';
  transportOptions?: {
    cors?: {
      enabled: boolean;
      origins: string[];
    };
    compression?: boolean;
    maxRequestSize?: number; // bytes
  };

  // Timeouts
  requestTimeout: number; // ms
  shutdownTimeout: number; // ms

  // Features
  features: {
    resources: boolean;
    prompts: boolean;
    tools: boolean;
  };
}

// Default values
const defaultServerConfig: ServerConfig = {
  name: 'playwright-mcp-server',
  version: '1.0.0',
  host: '0.0.0.0',
  port: 3000,
  transport: 'stdio',
  requestTimeout: 120000, // 2 minutes
  shutdownTimeout: 30000, // 30 seconds
  features: {
    resources: true,
    prompts: true,
    tools: true,
  },
};
```

### 2.3 Browser Configuration

```typescript
interface BrowserConfig {
  // Browser Selection
  type: 'chromium' | 'firefox' | 'webkit';
  channel?: 'chrome' | 'chrome-beta' | 'msedge' | 'msedge-beta';

  // Launch Options
  headless: boolean;
  args: string[];
  executablePath?: string;
  downloadsPath?: string;

  // Viewport
  viewport: {
    width: number;
    height: number;
    deviceScaleFactor?: number;
  };

  // Context Options
  userAgent?: string;
  locale?: string;
  timezoneId?: string;
  geolocation?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  permissions?: string[];

  // Behavior
  slowMo?: number; // Slow down operations by ms
  devtools?: boolean; // Auto-open devtools
  ignoreHTTPSErrors?: boolean;
}

// Default values
const defaultBrowserConfig: BrowserConfig = {
  type: 'chromium',
  headless: true,
  args: [
    '--no-sandbox',
    '--disable-dev-shm-usage',
    '--disable-blink-features=AutomationControlled',
  ],
  viewport: {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
  },
  locale: 'en-US',
  timezoneId: 'America/New_York',
  ignoreHTTPSErrors: false,
};
```

### 2.4 Pool Configuration

```typescript
interface PoolConfig {
  // Pool Size
  minBrowsers: number;
  maxBrowsers: number;

  // Lifecycle
  idleTimeout: number; // ms - close idle browsers after
  maxUseCount: number; // Max uses before recycling
  validationInterval: number; // ms - health check interval

  // Acquisition
  acquireTimeout: number; // ms - timeout for acquiring browser
  createRetries: number; // Retries on browser creation failure
  createRetryDelay: number; // ms - delay between retries

  // Eviction
  evictIdlePercent: number; // % of idle browsers to evict (0-100)
  evictInterval: number; // ms - eviction check interval
}

// Default values
const defaultPoolConfig: PoolConfig = {
  minBrowsers: 2,
  maxBrowsers: 10,
  idleTimeout: 5 * 60 * 1000, // 5 minutes
  maxUseCount: 100,
  validationInterval: 30000, // 30 seconds
  acquireTimeout: 30000, // 30 seconds
  createRetries: 3,
  createRetryDelay: 1000, // 1 second
  evictIdlePercent: 50,
  evictInterval: 60000, // 1 minute
};
```

### 2.5 Session Configuration

```typescript
interface SessionConfig {
  // Defaults
  defaultTimeout: number; // ms - default timeout for operations
  defaultNavigationTimeout: number; // ms
  defaultActionTimeout: number; // ms

  // Session Management
  maxSessions: number;
  sessionIdleTimeout: number; // ms
  persistentSessions: boolean;
  stateStoragePath?: string;

  // Auto-cleanup
  cleanupInterval: number; // ms
  cleanupOnExit: boolean;

  // Storage State
  saveStorageState: boolean;
  storageStatePath?: string;
}

// Default values
const defaultSessionConfig: SessionConfig = {
  defaultTimeout: 30000,
  defaultNavigationTimeout: 30000,
  defaultActionTimeout: 30000,
  maxSessions: 50,
  sessionIdleTimeout: 30 * 60 * 1000, // 30 minutes
  persistentSessions: false,
  cleanupInterval: 5 * 60 * 1000, // 5 minutes
  cleanupOnExit: true,
  saveStorageState: false,
};
```

### 2.6 Security Configuration

```typescript
interface SecurityConfig {
  // Domain Restrictions
  allowedDomains?: string[]; // Whitelist
  blockedDomains?: string[]; // Blacklist

  // Resource Limits
  maxScreenshotSize: number; // bytes
  maxPdfSize: number; // bytes
  maxDownloadSize: number; // bytes

  // Feature Controls
  enableFileUpload: boolean;
  enableFileDownload: boolean;
  enableScriptEvaluation: boolean;
  enableGeolocation: boolean;
  enableNotifications: boolean;

  // Content Security
  blockMixedContent: boolean;
  enableCors: boolean;

  // Audit
  auditLog: boolean;
  auditLogPath?: string;

  // Authentication (for HTTP transport)
  authentication?: {
    type: 'basic' | 'bearer' | 'apikey';
    credentials?: {
      username?: string;
      password?: string;
      token?: string;
      apiKey?: string;
    };
  };
}

// Default values
const defaultSecurityConfig: SecurityConfig = {
  maxScreenshotSize: 10 * 1024 * 1024, // 10MB
  maxPdfSize: 50 * 1024 * 1024, // 50MB
  maxDownloadSize: 100 * 1024 * 1024, // 100MB
  enableFileUpload: true,
  enableFileDownload: true,
  enableScriptEvaluation: false,
  enableGeolocation: false,
  enableNotifications: false,
  blockMixedContent: false,
  enableCors: true,
  auditLog: false,
};
```

### 2.7 Network Configuration

```typescript
interface NetworkConfig {
  // Request Interception
  interceptRequests: boolean;
  blockResourceTypes?: ResourceType[];

  // Throttling
  throttling?: {
    enabled: boolean;
    profile: 'slow-3g' | 'fast-3g' | '4g' | 'custom';
    custom?: {
      downloadThroughput: number; // bytes/s
      uploadThroughput: number; // bytes/s
      latency: number; // ms
    };
  };

  // Proxy
  proxy?: {
    server: string;
    bypass?: string;
    username?: string;
    password?: string;
  };

  // HTTP Headers
  extraHeaders?: Record<string, string>;

  // Request Logging
  logRequests: boolean;
  logResponses: boolean;
  maxLogSize: number; // Max logged requests/responses
}

// Default values
const defaultNetworkConfig: NetworkConfig = {
  interceptRequests: false,
  logRequests: false,
  logResponses: false,
  maxLogSize: 1000,
};
```

### 2.8 Plugin Configuration

```typescript
interface PluginConfig {
  // Plugin Discovery
  pluginDirectories: string[];
  autoLoad: boolean;

  // Plugin Management
  enabled: Record<string, PluginSettings>;
}

interface PluginSettings {
  enabled: boolean;
  priority?: number;
  options?: Record<string, any>;
}

// Default values
const defaultPluginConfig: PluginConfig = {
  pluginDirectories: [
    './plugins',
    '~/.playwright-mcp/plugins',
    '/usr/local/lib/playwright-mcp/plugins',
  ],
  autoLoad: true,
  enabled: {},
};
```

### 2.9 Logging Configuration

```typescript
interface LoggingConfig {
  // Log Level
  level: 'debug' | 'info' | 'warn' | 'error';

  // Format
  format: 'json' | 'text' | 'pretty';
  timestamp: boolean;
  colorize: boolean;

  // Output
  destination: 'stdout' | 'stderr' | 'file' | 'both';
  file?: {
    path: string;
    maxSize: number; // bytes
    maxFiles: number;
    compress: boolean;
  };

  // Categories
  categories?: Record<string, LogLevel>;

  // Sensitive Data
  redactSensitive: boolean;
  sensitiveFields: string[];
}

// Default values
const defaultLoggingConfig: LoggingConfig = {
  level: 'info',
  format: 'json',
  timestamp: true,
  colorize: false,
  destination: 'stdout',
  redactSensitive: true,
  sensitiveFields: ['password', 'token', 'apiKey', 'secret'],
};
```

### 2.10 Performance Configuration

```typescript
interface PerformanceConfig {
  // Resource Hints
  preloadImages: boolean;
  preloadFonts: boolean;

  // Rendering
  disableAnimations: boolean;
  reducedMotion: boolean;

  // Caching
  cacheEnabled: boolean;
  cachePath?: string;
  cacheSize: number; // bytes

  // Metrics
  collectMetrics: boolean;
  metricsInterval: number; // ms
  metricsRetention: number; // ms

  // Optimization
  enableHardwareAcceleration: boolean;
  enableGpu: boolean;
}

// Default values
const defaultPerformanceConfig: PerformanceConfig = {
  preloadImages: false,
  preloadFonts: false,
  disableAnimations: false,
  reducedMotion: false,
  cacheEnabled: true,
  cacheSize: 100 * 1024 * 1024, // 100MB
  collectMetrics: true,
  metricsInterval: 10000, // 10 seconds
  metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
  enableHardwareAcceleration: true,
  enableGpu: false,
};
```

### 2.11 Multi-Agent Configuration

```typescript
interface MultiAgentConfig {
  // Coordination
  mode: 'standalone' | 'coordinator' | 'worker';
  topology: 'centralized' | 'decentralized' | 'hierarchical';

  // Coordinator Settings (if mode === 'coordinator')
  coordinator?: {
    port: number;
    maxWorkers: number;
    heartbeatInterval: number; // ms
    heartbeatTimeout: number; // ms
    loadBalancer: 'round-robin' | 'least-connections' | 'weighted';
  };

  // Worker Settings (if mode === 'worker')
  worker?: {
    coordinatorUrl: string;
    capabilities: string[];
    maxConcurrentTasks: number;
  };

  // Task Distribution
  taskQueue?: {
    type: 'memory' | 'redis' | 'rabbitmq';
    options?: Record<string, any>;
  };

  // Result Aggregation
  aggregation?: {
    strategy: 'merge' | 'collect' | 'groupby' | 'stats';
    streamResults: boolean;
  };
}
```

---

## 3. Configuration Loading

### 3.1 Configuration Manager

```typescript
class ConfigManager {
  private config: PlaywrightMcpConfig;
  private watchers: ConfigWatcher[] = [];

  constructor() {
    this.config = this.loadConfiguration();
  }

  private loadConfiguration(): PlaywrightMcpConfig {
    // 1. Start with defaults
    let config = this.getDefaults();

    // 2. Load from config file
    const fileConfig = this.loadConfigFile();
    if (fileConfig) {
      config = this.merge(config, fileConfig);
    }

    // 3. Apply environment variables
    const envConfig = this.loadFromEnv();
    config = this.merge(config, envConfig);

    // 4. Apply CLI arguments
    const cliConfig = this.loadFromCli();
    config = this.merge(config, cliConfig);

    // 5. Validate configuration
    this.validate(config);

    return config;
  }

  private loadConfigFile(): Partial<PlaywrightMcpConfig> | null {
    const configPaths = [
      'playwright-mcp.config.json',
      'playwright-mcp.config.js',
      '.playwrightmcprc',
      '.playwrightmcprc.json',
      '~/.playwright-mcp/config.json',
    ];

    for (const path of configPaths) {
      if (fs.existsSync(path)) {
        const content = fs.readFileSync(path, 'utf-8');

        if (path.endsWith('.js')) {
          return require(path);
        } else {
          return JSON.parse(content);
        }
      }
    }

    return null;
  }

  private loadFromEnv(): Partial<PlaywrightMcpConfig> {
    const config: any = {};

    // Server config from env
    if (process.env.PLAYWRIGHT_MCP_PORT) {
      config.server = config.server || {};
      config.server.port = parseInt(process.env.PLAYWRIGHT_MCP_PORT);
    }

    if (process.env.PLAYWRIGHT_MCP_TRANSPORT) {
      config.server = config.server || {};
      config.server.transport = process.env.PLAYWRIGHT_MCP_TRANSPORT;
    }

    // Browser config from env
    if (process.env.PLAYWRIGHT_MCP_BROWSER) {
      config.browser = config.browser || {};
      config.browser.type = process.env.PLAYWRIGHT_MCP_BROWSER;
    }

    if (process.env.PLAYWRIGHT_MCP_HEADLESS) {
      config.browser = config.browser || {};
      config.browser.headless = process.env.PLAYWRIGHT_MCP_HEADLESS === 'true';
    }

    // Pool config from env
    if (process.env.PLAYWRIGHT_MCP_MAX_BROWSERS) {
      config.pool = config.pool || {};
      config.pool.maxBrowsers = parseInt(process.env.PLAYWRIGHT_MCP_MAX_BROWSERS);
    }

    // Logging config from env
    if (process.env.PLAYWRIGHT_MCP_LOG_LEVEL) {
      config.logging = config.logging || {};
      config.logging.level = process.env.PLAYWRIGHT_MCP_LOG_LEVEL;
    }

    return config;
  }

  private loadFromCli(): Partial<PlaywrightMcpConfig> {
    const args = process.argv.slice(2);
    const config: any = {};

    for (let i = 0; i < args.length; i++) {
      const arg = args[i];

      if (arg === '--port') {
        config.server = config.server || {};
        config.server.port = parseInt(args[++i]);
      } else if (arg === '--headless') {
        config.browser = config.browser || {};
        config.browser.headless = args[++i] === 'true';
      } else if (arg === '--max-browsers') {
        config.pool = config.pool || {};
        config.pool.maxBrowsers = parseInt(args[++i]);
      } else if (arg === '--log-level') {
        config.logging = config.logging || {};
        config.logging.level = args[++i];
      }
    }

    return config;
  }

  private validate(config: PlaywrightMcpConfig): void {
    // Use zod or joi for schema validation
    const schema = z.object({
      server: z.object({
        port: z.number().min(1).max(65535).optional(),
        transport: z.enum(['stdio', 'http', 'websocket']),
      }),
      browser: z.object({
        type: z.enum(['chromium', 'firefox', 'webkit']),
        headless: z.boolean(),
      }),
      pool: z.object({
        minBrowsers: z.number().min(0),
        maxBrowsers: z.number().min(1),
      }),
      // ... more validation
    });

    const result = schema.safeParse(config);
    if (!result.success) {
      throw new Error(`Invalid configuration: ${result.error.message}`);
    }
  }

  private merge(
    base: PlaywrightMcpConfig,
    override: Partial<PlaywrightMcpConfig>
  ): PlaywrightMcpConfig {
    return deepMerge(base, override);
  }

  get(): PlaywrightMcpConfig {
    return this.config;
  }

  set(path: string, value: any): void {
    setNestedProperty(this.config, path, value);
    this.notifyWatchers(path, value);
  }

  watch(path: string, callback: ConfigChangeCallback): void {
    this.watchers.push({ path, callback });
  }

  private notifyWatchers(path: string, value: any): void {
    for (const watcher of this.watchers) {
      if (path.startsWith(watcher.path)) {
        watcher.callback(path, value);
      }
    }
  }
}
```

### 3.2 Environment Variable Mapping

```bash
# Server Configuration
PLAYWRIGHT_MCP_PORT=3000
PLAYWRIGHT_MCP_HOST=0.0.0.0
PLAYWRIGHT_MCP_TRANSPORT=stdio  # stdio|http|websocket

# Browser Configuration
PLAYWRIGHT_MCP_BROWSER=chromium  # chromium|firefox|webkit
PLAYWRIGHT_MCP_HEADLESS=true
PLAYWRIGHT_MCP_VIEWPORT_WIDTH=1920
PLAYWRIGHT_MCP_VIEWPORT_HEIGHT=1080

# Pool Configuration
PLAYWRIGHT_MCP_MIN_BROWSERS=2
PLAYWRIGHT_MCP_MAX_BROWSERS=10
PLAYWRIGHT_MCP_IDLE_TIMEOUT=300000  # ms

# Session Configuration
PLAYWRIGHT_MCP_DEFAULT_TIMEOUT=30000  # ms
PLAYWRIGHT_MCP_MAX_SESSIONS=50

# Security Configuration
PLAYWRIGHT_MCP_ALLOWED_DOMAINS=*.example.com,*.test.com
PLAYWRIGHT_MCP_ENABLE_SCRIPT_EVAL=false

# Logging Configuration
PLAYWRIGHT_MCP_LOG_LEVEL=info  # debug|info|warn|error
PLAYWRIGHT_MCP_LOG_FORMAT=json  # json|text|pretty
PLAYWRIGHT_MCP_LOG_FILE=/var/log/playwright-mcp.log

# Network Configuration
PLAYWRIGHT_MCP_PROXY_SERVER=http://proxy.example.com:8080
PLAYWRIGHT_MCP_PROXY_USERNAME=user
PLAYWRIGHT_MCP_PROXY_PASSWORD=pass

# Plugin Configuration
PLAYWRIGHT_MCP_PLUGIN_DIR=./plugins
PLAYWRIGHT_MCP_AUTO_LOAD_PLUGINS=true

# Multi-Agent Configuration
PLAYWRIGHT_MCP_MODE=standalone  # standalone|coordinator|worker
PLAYWRIGHT_MCP_COORDINATOR_URL=http://coordinator:3001
```

---

## 4. Runtime Configuration

### 4.1 Per-Request Configuration Override

```typescript
interface ToolCallOptions {
  // Override default timeouts
  timeout?: number;
  navigationTimeout?: number;
  actionTimeout?: number;

  // Override session settings
  userAgent?: string;
  viewport?: { width: number; height: number };

  // Override network settings
  proxy?: ProxySettings;
  extraHeaders?: Record<string, string>;

  // Override security settings
  ignoreHTTPSErrors?: boolean;
}

// Example tool call with options
{
  "method": "navigate",
  "params": {
    "url": "https://example.com",
    "options": {
      "timeout": 60000,
      "userAgent": "Custom User Agent",
      "extraHeaders": {
        "Authorization": "Bearer token"
      }
    }
  }
}
```

### 4.2 Dynamic Configuration Updates

```typescript
interface ConfigurationAPI {
  // Get current configuration
  getConfig(path?: string): any;

  // Update configuration at runtime
  updateConfig(path: string, value: any): Promise<void>;

  // Reset to defaults
  resetConfig(path?: string): Promise<void>;

  // Reload from file
  reloadConfig(): Promise<void>;
}

// Usage example
const configApi = new ConfigurationAPI();

// Update pool size
await configApi.updateConfig('pool.maxBrowsers', 20);

// Get current browser config
const browserConfig = configApi.getConfig('browser');

// Reset logging config
await configApi.resetConfig('logging');
```

---

## 5. Browser Profiles

### 5.1 Profile System

```typescript
interface BrowserProfile {
  name: string;
  description?: string;
  config: Partial<BrowserConfig>;
}

// Pre-defined profiles
const profiles: Record<string, BrowserProfile> = {
  'desktop-chrome': {
    name: 'Desktop Chrome',
    config: {
      type: 'chromium',
      channel: 'chrome',
      viewport: { width: 1920, height: 1080 },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  },

  'mobile-android': {
    name: 'Mobile Android',
    config: {
      type: 'chromium',
      viewport: { width: 375, height: 667, deviceScaleFactor: 2 },
      userAgent: 'Mozilla/5.0 (Linux; Android 11) AppleWebKit/537.36',
      permissions: ['geolocation'],
    },
  },

  'iphone-13': {
    name: 'iPhone 13',
    config: {
      type: 'webkit',
      viewport: { width: 390, height: 844, deviceScaleFactor: 3 },
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X)',
    },
  },

  'headless-fast': {
    name: 'Headless Fast',
    config: {
      type: 'chromium',
      headless: true,
      args: [
        '--disable-gpu',
        '--disable-dev-shm-usage',
        '--no-sandbox',
        '--disable-extensions',
        '--disable-images',
      ],
    },
  },

  'stealth': {
    name: 'Stealth Mode',
    config: {
      type: 'chromium',
      args: [
        '--disable-blink-features=AutomationControlled',
        '--disable-dev-shm-usage',
      ],
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    },
  },
};

// Usage
class ProfileManager {
  loadProfile(profileName: string): BrowserConfig {
    const profile = profiles[profileName];
    if (!profile) {
      throw new Error(`Profile not found: ${profileName}`);
    }

    return {
      ...defaultBrowserConfig,
      ...profile.config,
    };
  }

  registerCustomProfile(profile: BrowserProfile): void {
    profiles[profile.name] = profile;
  }
}
```

### 5.2 Profile Selection

```typescript
// Via configuration file
{
  "browser": {
    "profile": "mobile-android"
  }
}

// Via environment variable
PLAYWRIGHT_MCP_BROWSER_PROFILE=iphone-13

// Via tool call
{
  "method": "create_session",
  "params": {
    "profile": "stealth"
  }
}
```

---

## 6. Proxy Configuration

### 6.1 Proxy Settings

```typescript
interface ProxyConfig {
  // Basic proxy
  server: string;  // http://proxy.example.com:8080

  // Authentication
  username?: string;
  password?: string;

  // Bypass
  bypass?: string;  // Comma-separated list: *.google.com,*.github.com

  // Per-context proxy
  perContext?: boolean;
}

// Configuration examples
{
  "network": {
    "proxy": {
      "server": "http://proxy.example.com:8080",
      "username": "user",
      "password": "pass",
      "bypass": "*.local,*.internal"
    }
  }
}

// Rotating proxy configuration
{
  "network": {
    "proxy": {
      "type": "rotating",
      "servers": [
        "http://proxy1.example.com:8080",
        "http://proxy2.example.com:8080",
        "http://proxy3.example.com:8080"
      ],
      "strategy": "round-robin"  // round-robin|random|least-used
    }
  }
}
```

### 6.2 Proxy Authentication Presets

```typescript
interface ProxyPreset {
  name: string;
  config: ProxyConfig;
}

const proxyPresets: Record<string, ProxyPreset> = {
  'corporate': {
    name: 'Corporate Proxy',
    config: {
      server: process.env.CORPORATE_PROXY!,
      username: process.env.PROXY_USER,
      password: process.env.PROXY_PASS,
    },
  },

  'tor': {
    name: 'Tor Network',
    config: {
      server: 'socks5://127.0.0.1:9050',
    },
  },

  'burp': {
    name: 'Burp Suite',
    config: {
      server: 'http://127.0.0.1:8080',
    },
  },
};
```

---

## 7. Authentication Presets

### 7.1 Authentication Configuration

```typescript
interface AuthPreset {
  name: string;
  type: 'basic' | 'bearer' | 'oauth2' | 'cookies';
  config: AuthConfig;
}

type AuthConfig =
  | BasicAuthConfig
  | BearerAuthConfig
  | OAuth2Config
  | CookieAuthConfig;

interface BasicAuthConfig {
  username: string;
  password: string;
}

interface BearerAuthConfig {
  token: string;
}

interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

interface CookieAuthConfig {
  cookies: Cookie[];
}

// Usage
const authPresets: Record<string, AuthPreset> = {
  'github': {
    name: 'GitHub',
    type: 'bearer',
    config: {
      token: process.env.GITHUB_TOKEN!,
    },
  },

  'api-key': {
    name: 'API Key',
    type: 'bearer',
    config: {
      token: process.env.API_KEY!,
    },
  },
};

// Apply auth preset
{
  "method": "navigate",
  "params": {
    "url": "https://api.example.com",
    "auth": "github"
  }
}
```

---

## 8. Configuration Validation

### 8.1 Schema Validation with Zod

```typescript
import { z } from 'zod';

const ServerConfigSchema = z.object({
  name: z.string(),
  version: z.string(),
  host: z.string().ip().or(z.literal('localhost')),
  port: z.number().min(1).max(65535).optional(),
  transport: z.enum(['stdio', 'http', 'websocket']),
  requestTimeout: z.number().min(1000),
  shutdownTimeout: z.number().min(1000),
});

const BrowserConfigSchema = z.object({
  type: z.enum(['chromium', 'firefox', 'webkit']),
  headless: z.boolean(),
  args: z.array(z.string()),
  viewport: z.object({
    width: z.number().min(320).max(7680),
    height: z.number().min(240).max(4320),
  }),
});

const PlaywrightMcpConfigSchema = z.object({
  server: ServerConfigSchema,
  browser: BrowserConfigSchema,
  pool: PoolConfigSchema,
  session: SessionConfigSchema,
  security: SecurityConfigSchema,
  network: NetworkConfigSchema.optional(),
  plugins: PluginConfigSchema,
  logging: LoggingConfigSchema,
  performance: PerformanceConfigSchema.optional(),
  multiAgent: MultiAgentConfigSchema.optional(),
});

// Validate configuration
function validateConfig(config: unknown): PlaywrightMcpConfig {
  const result = PlaywrightMcpConfigSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.errors.map(e =>
      `${e.path.join('.')}: ${e.message}`
    );
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }

  return result.data;
}
```

---

**Next**: [adrs/](./adrs/) - Architecture Decision Records
