import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Default truncation renders a queue comparison as
    // "expected [ …(5) ] to deeply equal [ …(5) ]" — contentless.
    // 0 disables truncation and restores a full diff with file:line.
    chaiConfig: { truncateThreshold: 0 },
    // Deliberately no `reporters`: Vitest switches to an agent-optimised
    // minimal reporter automatically, but only when none are configured.
  },
});
