/**
 * Backwards Compatibility Layer - Main Exports
 *
 * Provides v1.x to v2.0 compatibility for AgenticFlow
 */

export { VersionDetector } from './VersionDetector';
export { V1toV2Adapter } from './V1toV2Adapter';
export { DeprecationWarnings } from './DeprecationWarnings';
export { MigrationUtilities } from './MigrationUtilities';

export type {
  APIVersion,
  CompatibilityConfig,
  V1Config,
  V2Config,
  DeprecationWarning,
  DeprecationConfig,
  MigrationReport,
  ValidationResult,
  VersionDetectionResult
} from './types';

