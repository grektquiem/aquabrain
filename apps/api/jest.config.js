/** Pruebas unitarias (dominio y guardas). Ejecuta los `*.spec.ts` de `src/`. */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'src/.*\\.spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.spec.ts',
    '!src/**/dto/**',
    '!src/**/*.dto.ts',
  ],
  coverageDirectory: 'coverage/unit',
  coverageReporters: ['json', 'text-summary', 'text', 'lcov', 'json-summary'],
  testEnvironment: 'node',
  moduleNameMapper: { '^@aquabrain/shared$': '<rootDir>/../../packages/shared/src/index.ts' },
};
