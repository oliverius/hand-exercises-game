import js from '@eslint/js';
import globals from 'globals';
export default [
  { ignores: ['temp/**', 'node_modules/**', 'src/vendor/**'] },
  js.configs.recommended,
  { languageOptions: { globals: globals.node } },
  { files: ['src/js/**/*.js'], languageOptions: { globals: globals.browser } },
];
