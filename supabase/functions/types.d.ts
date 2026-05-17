// Minimal type shim so the regular TypeScript language service stops
// complaining about Deno-only globals and URL imports in this directory.
//
// At runtime the edge functions run under Deno, which natively supports both.
// If you install the official VS Code "Deno" extension and let it manage this
// folder (see .vscode/settings.json), you'll get full Deno-aware type-checking
// instead and this shim becomes a no-op fallback.

declare const Deno: {
  env: {
    get(key: string): string | undefined
    toObject(): Record<string, string>
  }
  serve?: unknown
}

// Allow `import ... from "https://..."` without "Cannot find module" errors.
declare module 'https://*'
