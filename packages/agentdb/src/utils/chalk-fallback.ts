/**
 * Chalk fallback — chalk is an optionalDependency.
 * When installed with --no-optional (e.g. Docker clean-install),
 * we fall back to a no-op passthrough so console.log still works.
 */
const passthrough = (s: any) => s;
const noopChalk: any = new Proxy(passthrough as any, {
  get: () => passthrough,
});

let resolvedChalk: any = noopChalk;
try {
  resolvedChalk = (await import('chalk')).default;
} catch {
  // chalk not installed — keep no-op
}

export default resolvedChalk;
