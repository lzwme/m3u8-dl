// @ts-check
const path = require('path');
const rootDir = path.resolve(__dirname);

/** @type {import('eslint').Linter.Config} */
module.exports = {
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
  env: {
    browser: true,
    es2021: true,
    node: true,
  },
  globals: {
    SharedArrayBuffer: 'readonly',
  },
  parser: '@typescript-eslint/parser',
  parserOptions: {
    tsconfigRootDir: rootDir,
    project: path.resolve(rootDir, './tsconfig.eslint.json'),
    projectFolderIgnoreList: ['**/node_modules/**', '**/dist/**', '**/dist-admin/**'],
    warnOnUnsupportedTypeScriptVersion: false,
    // createDefaultProgram: true,
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2020,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint'],
  ignorePatterns: ['**/node_modules/**', 'dist/**', 'esm/**', 'cjs/**', 'docs/**', 'mock/**', '**/*.js', '**/*.d.ts'],
  rules: {
    'prettier/prettier': 'warn',
    // 关闭 eslint 的 indent，使用 prettier 格式化格式
    indent: ['off', 2],
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true }],
    '@typescript-eslint/ban-ts-comment': 'off',
  },
};
