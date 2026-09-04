import nextConfig from 'eslint-config-next';

export default [
  ...nextConfig,
  {
    settings: {
      react: {
        version: '19.0.0',
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn',
    },
  },
  {
    ignores: ['.next/**', 'out/**', 'build/**', 'coverage/**', 'node_modules/**', 'next-env.d.ts'],
  },
];
