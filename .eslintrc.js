module.exports = {
    root: true,
    parser: '@typescript-eslint/parser',
    parserOptions: {
        tsconfigRootDir: __dirname,
        project: ['./tsconfig-eslint.json'],
        extraFileExtensions: ['.json']
    },
    plugins: ['prettier'],
    env: {
        node: true
    },
    extends: ['plugin:prettier/recommended'],
    settings: {
        'import/resolver': {
            typescript: {}
        }
    },
    rules: {
        'prettier/prettier': 'error',
        'no-console': 'error',
        '@typescript-eslint/explicit-function-return-type': 'error',
        '@typescript-eslint/explicit-member-accessibility': 'error'
    }
};
