import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default [
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
        ecmaFeatures: { jsx: true },
      },
    },
    plugins: { 'react-hooks': reactHooks, 'jsx-a11y': jsxA11y },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      // Load-bearing, not style: this app polls on an interval, which is
      // exactly the shape that produces stale closures.
      'react-hooks/exhaustive-deps': 'error',

      // Accessibility rules that are precise enough to be worth gating on.
      // These catch typos and invalid ARIA — a misspelled aria-lable, a role
      // that does not exist, an aria-* prop the role does not support — all of
      // which would silently break the role locators the end-to-end suite uses
      // and the ARIA snapshot playwright-bdd's aiFix hands to the agent.
      //
      // Deliberately NOT enabled: jsx-a11y/control-has-associated-label. It was
      // tested against the exact case this repo cares about — a per-row control
      // losing its unique aria-label — and it does not catch it: a <button>Done</button>
      // already has an accessible name, just not a distinguishing one. It also
      // false-positives on correctly labelled inputs, including nested labels.
      // The guard that actually works is the end-to-end scenario in
      // features/staff-queue.feature.
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/anchor-has-content': 'error',
    },
  },
];
