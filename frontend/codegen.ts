import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/graphql',
  documents: ['src/**/*.tsx', 'src/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    './src/gql/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typescript-react-apollo',
      ],
      config: {
        withHooks: true,
        apolloClientVersion: 4,
        apolloReactCommonImportFrom: '@apollo/client/react',
        apolloReactHooksImportFrom: '@apollo/client/react/hooks',
      },
    },
  },
};

export default config;
