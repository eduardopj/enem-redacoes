/**
 * Production entry point for PM2 cluster mode.
 * Registers the tsx ESM loader programmatically BEFORE importing server.js,
 * so TypeScript files in src/trpc/ are resolved at runtime without a build step.
 *
 * Why not --import tsx/esm in interpreter_args?
 * PM2 cluster workers inherit execArgv from the primary process, but the
 * inter-process communication path with wait_ready: true is unreliable when
 * the flag is injected via interpreter_args. Using register() here guarantees
 * the hook is active in every worker before any TypeScript import fires.
 */
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';

register('tsx/esm', pathToFileURL('./'));

await import('./src/server.js');
