const path = require('path');
const eslint = require('@eslint/js');
const tseslint = require('typescript-eslint');

module.exports = [
  ...tseslint.config(
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    {
      languageOptions: {
        parserOptions: {
          tsconfigRootDir: path.resolve(__dirname),
          project: './tsconfig.eslint.json',
          projectFolderIgnoreList: ['**/node_modules/**', '**/dist/**', '**/dist-admin/**'],
          warnOnUnsupportedTypeScriptVersion: false,
          ecmaFeatures: {
            jsx: true,
          },
          ecmaVersion: 2023,
          sourceType: 'module',
        },
      },
      plugins: {
        prettier: require('eslint-plugin-prettier'),
      },
      ignores: ['**/node_modules/**', 'dist/**', 'cjs/**', 'esm/**', 'docs/**', 'mock/**', '**/*.js', '**/*.d.ts'],
      rules: {
        'prettier/prettier': 'warn',
        indent: ['off', 2],
        '@typescript-eslint/explicit-module-boundary-types': 'off',
        '@typescript-eslint/no-unused-vars': ['warn', { varsIgnorePattern: '^_', argsIgnorePattern: '^_', ignoreRestSiblings: true }],
        // todo
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/no-unsafe-call': 'off',
        '@typescript-eslint/no-floating-promises': 'off',
      },
      files: ['src/**/*.ts'],
    },
    {
      files: ['*.js', '*.cjs', '*.mjs'],
      ...tseslint.configs.disableTypeChecked,
    }
  ),
];
