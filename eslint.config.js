import antfu from '@antfu/eslint-config';

export default antfu({
  ignores: ['**/vendor/**', '**/skills/**'],
  stylistic: {
    semi: true,
  },
});
