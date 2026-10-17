/**
 * Pruebas de integración de la API (Supertest) contra PostgreSQL real.
 * Los `*.e2e-spec.ts` viven en `test/` y se ejecutan en serie (`--runInBand`).
 */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: 'test/.*\\.e2e-spec\\.ts$',
  transform: { '^.+\\.(t|j)s$': 'ts-jest' },
  testEnvironment: 'node',
  testTimeout: 60000,
  moduleNameMapper: { '^@aquabrain/shared$': '<rootDir>/../../packages/shared/src/index.ts' },
  collectCoverageFrom: [
    'src/**/*.(t|j)s',
    '!src/**/*.module.ts',
    '!src/main.ts',
    '!src/**/*.spec.ts',
    '!src/**/dto/**',
    '!src/**/*.dto.ts',
  ],
  coverageDirectory: 'coverage/e2e',
  coverageReporters: ['json', 'text-summary'],
};
