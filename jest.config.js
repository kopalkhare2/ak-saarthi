/** @type {import('jest').Config} */
const config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/__tests__'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          module: 'commonjs',
          moduleResolution: 'node',
          jsx: 'react-jsx',
          esModuleInterop: true,
          strict: true,
          target: 'ES2017',
          paths: {
            '@/*': ['./*'],
          },
        },
      },
    ],
  },
  testMatch: ['**/__tests__/**/*.test.ts'],
};

module.exports = config;
