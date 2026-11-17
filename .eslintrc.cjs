// Copyright 2026 Aragornb / MAGI-Hub. Licensed under the Apache License, Version 2.0.
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  extends: ['plugin:jsx-a11y/recommended'],
  plugins: ['jsx-a11y'],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    ecmaFeatures: { jsx: true },
  },
  rules: {
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/click-events-have-key-events': 'error',
    'jsx-a11y/no-static-element-interactions': 'error',
    'jsx-a11y/html-has-lang': 'error',
  },
};
