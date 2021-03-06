module.exports = {
  root: true,
  env: {
    node: true,
    es2020: true,
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
    ecmaVersion: 'es2020',
  },
  plugins: ['@typescript-eslint/eslint-plugin', 'unicorn', 'sonarjs', 'eslint-comments'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
    'plugin:unicorn/recommended',
    'plugin:sonarjs/recommended',
    'plugin:eslint-comments/recommended',
    'prettier',
  ],
  rules: {
    'unicorn/filename-case': [
      'error',
      {
        cases: {
          kebabCase: true,
          camelCase: true,
        },
      },
    ],
  },
}
