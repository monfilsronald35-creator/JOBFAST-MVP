/** @type {import('@commitlint/types').UserConfig} */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // New feature
        'fix',      // Bug fix
        'docs',     // Documentation only
        'style',    // Formatting, missing semicolons, etc.
        'refactor', // Code change that neither fixes a bug nor adds a feature
        'perf',     // Performance improvement
        'test',     // Adding tests
        'build',    // Changes to build system or dependencies
        'ci',       // CI/CD changes
        'chore',    // Other changes that don't modify src or test files
        'revert',   // Revert a previous commit
        'security', // Security fix
        'i18n',     // Internationalization
        'a11y',     // Accessibility
        'ux',       // User experience
        'data',     // Data/schema migration
        'infra',    // Infrastructure
      ],
    ],
    'scope-enum': [
      2,
      'always',
      [
        'frontend',
        'backend',
        'auth',
        'chat',
        'jobs',
        'profile',
        'marketplace',
        'payments',
        'notifications',
        'search',
        'maps',
        'admin',
        'worker',
        'employer',
        'enterprise',
        'i18n',
        'ui',
        'hooks',
        'services',
        'api',
        'types',
        'config',
        'ci',
        'deps',
        '*',
      ],
    ],
    'subject-case': [2, 'always', 'lower-case'],
    'header-max-length': [2, 'always', 100],
    'body-max-line-length': [1, 'always', 200],
  },
};