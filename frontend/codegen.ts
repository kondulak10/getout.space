import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'http://localhost:4000/graphql',
  documents: ['src/**/*.graphql', 'src/**/*.tsx', 'src/**/*.ts'],
  ignoreNoDocuments: true,
  generates: {
    './src/gql/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typed-document-node',
      ],
      config: {
        // Apollo Client 4 recommended settings
        avoidOptionals: {
          field: true,
          inputValue: false,
        },
        defaultScalarType: 'unknown',
        nonOptionalTypename: true,
        skipTypeNameForRoot: true,
      },
    },
  },
};

export default config;
