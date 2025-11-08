module.exports = {
  root: true,
  env: { browser: true, node: true, es2022: true, jest: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaFeatures: { jsx: true }, ecmaVersion: "latest", sourceType: "module" },
  plugins: ["@typescript-eslint", "react", "react-hooks", "import", "jsx-a11y"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended",
    "plugin:jsx-a11y/recommended",
    "plugin:import/recommended",
    "plugin:import/typescript",
    "prettier"
  ],
  settings: { react: { version: "detect" } },
  rules: {
    "react/react-in-jsx-scope": "off",
    "import/order": [
      "warn",
      { "groups": [["builtin", "external"], ["internal"], ["parent", "sibling", "index"]], "newlines-between": "always" }
    ]
  },
  ignorePatterns: ["dist", "build", "coverage", "node_modules"]
};
