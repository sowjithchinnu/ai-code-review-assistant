import js from "@eslint/js";
import globals from "globals";

export default [
  {
    ignores: ["node_modules/**", "uploads/**"],
  },
  js.configs.recommended,
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: globals.node,
    },
    rules: {
      "no-undef": "error",
      "semi": ["error", "always"],
      "quotes": ["error", "single", { "avoidEscape": true, "allowTemplateLiterals": true }],
      "eqeqeq": ["error", "always"],
      "curly": ["error", "all"],
      "indent": ["error", 2, { "SwitchCase": 1 }],
      "no-console": "error",
      "no-var": "error",
      "prefer-const": "error",
    },
  },
];
