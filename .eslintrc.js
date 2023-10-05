module.exports = {
    root: true,
    env: {
        browser: true,
        node: true,
        es6: true,
    },

    // overrides: [
    // 	{
    // 		files: ['*.{ts,tsx}'],
    parser: '@typescript-eslint/parser',
    parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
    },
    plugins: ['@typescript-eslint'],
    extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:prettier/recommended'],
    // },
    // ],

    // extends: ['eslint:recommended', 'plugin:prettier/recommended'],
    // parserOptions: {
    // 	parser: '@babel/eslint-parser',
    // 	requireConfigFile: false,
    // 	ecmaVersion: 'latest',
    // 	sourceType: 'module',
    // 	ecmaFeatures: {
    // 		globalReturn: true,
    // 		impliedStrict: false,
    // 		jsx: true,
    // 	},
    // },

    rules: {
        // 和 vscode 配置中需要一致
        'prettier/prettier': [
            'warn',
            {
                arrowParens: 'avoid',
                endOfLine: 'lf',
                htmlWhitespaceSensitivity: 'ignore',
                singleQuote: true,
                jsxSingleQuote: true,
                useTabs: false,
                tabWidth: 4,
                printWidth: 120,
            },
        ],
        '@typescript-eslint/no-explicit-any': 'off',
        '@typescript-eslint/no-unused-vars': 'warn',
    },
};
