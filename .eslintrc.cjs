/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
    root: true,
    extends: ['plugin:vue/vue3-essential', 'eslint:recommended', '@vue/eslint-config-prettier'],
    parserOptions: {
        ecmaVersion: 'latest'
    },
    parser: '@typescript-eslint/parser',
    extends: ['airbnb-base', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended', 'prettier'],
    rules: {
        'vue/multi-word-component-names': 'off',
        'vue/no-reserved-component-names': 'off',
        'vue/component-tags-order': [
            'error',
            {
                order: ['script', 'template', 'style']
            }
        ],
        '@typescript-eslint/no-unused-vars': [
            'error',
            {
                argsIgnorePattern: '_'
            }
        ],
        'no-useless-constructor': 'off',
        '@typescript-eslint/naming-convention': [
            'error',
            {
                selector: 'interface',
                format: ['PascalCase'],
                custom: {
                    regex: '^I[A-Z]',
                    match: true
                }
            }
        ],
        'prettier/prettier': [
            'off',
            {
                singleQuote: true
            }
        ],
        'max-classes-per-file': 'off'
    }
};
