// @ts-check
import eslint from '@eslint/js';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    {
        ignores: ['eslint.config.mjs'],
    },
    eslint.configs.recommended,
    ...tseslint.configs.recommendedTypeChecked,
    eslintPluginPrettierRecommended,
    {
        languageOptions: {
            globals: {
                ...globals.node,
                ...globals.jest,
            },
            sourceType: 'commonjs',
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
    },
    {
        rules: {
            // Disabilita regole troppo restrittive per questo progetto
            '@typescript-eslint/no-explicit-any': 'off',
            '@typescript-eslint/no-floating-promises': 'warn',
            '@typescript-eslint/no-unsafe-argument': 'warn',

            // Prettier: fine riga automatico
            'prettier/prettier': ['error', {endOfLine: 'auto'}],

            // Annotazioni di tipo senza spazi attorno al ":" → name:type
            '@typescript-eslint/type-annotation-spacing': ['error', {
                before: false,
                after: false,
                overrides: {arrow: {before: true, after: true}},
            }],

            // Modificatori di accesso espliciti su tutti i membri di classe
            '@typescript-eslint/explicit-member-accessibility': ['warn', {
                accessibility: 'explicit',
                overrides: {constructors: 'no-public'},
            }],

            // Preferire "import type" per importazioni di soli tipi
            '@typescript-eslint/consistent-type-imports': ['warn', {
                prefer: 'type-imports',
                disallowTypeAnnotations: false,
            }],
        },
    },
);
