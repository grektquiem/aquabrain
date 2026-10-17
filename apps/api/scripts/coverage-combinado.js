#!/usr/bin/env node
/**
 * Cobertura combinada de la API (TS-44, RNF09).
 *
 * Jest no puede acumular la cobertura de dos corridas distintas, así que se
 * ejecutan por separado:
 *
 *   jest --config jest.config.js     --coverage --coverageDirectory coverage/unit
 *   jest --config jest.e2e.config.js --coverage --coverageDirectory coverage/e2e
 *
 * y este script fusiona ambos mapas de cobertura (formato Istanbul) sobre el
 * mismo conjunto de archivos fuente, aplica el umbral y publica el informe.
 * El umbral se evalúa sobre el **conjunto de pruebas completo** (unitarias +
 * integración), que es la suite del proyecto; la cobertura de las unitarias por
 * sí solas se informa aparte como referencia.
 */
const fs = require('fs');
const path = require('path');
const libCoverage = require('istanbul-lib-coverage');
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

const RAIZ = path.resolve(__dirname, '..');
const DIR_COMBINADO = path.join(RAIZ, 'coverage', 'combinado');
const FUENTES = [
  path.join(RAIZ, 'coverage', 'unit', 'coverage-final.json'),
  path.join(RAIZ, 'coverage', 'e2e', 'coverage-final.json'),
];
const UMBRALES = { lines: 70, statements: 70, functions: 60, branches: 60 };

/** Mismas exclusiones que `collectCoverageFrom` de `jest.config.js`. */
function esFuente(archivo) {
  const p = archivo.replace(/\\/g, '/');
  if (!/\/src\//.test(p)) return false;
  if (p.endsWith('.module.ts')) return false;
  if (p.endsWith('/main.ts')) return false;
  if (p.endsWith('.spec.ts')) return false;
  if (/\/dto\//.test(p)) return false;
  if (/\.dto\.ts$/.test(p)) return false;
  return true;
}

function cargar(ruta) {
  if (!fs.existsSync(ruta)) {
    console.error(`✗ Falta el mapa de cobertura ${path.relative(RAIZ, ruta)}`);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(ruta, 'utf8'));
}

const combinado = libCoverage.createCoverageMap({});
for (const ruta of FUENTES) {
  for (const [archivo, datos] of Object.entries(cargar(ruta))) {
    if (esFuente(archivo)) {
      combinado.addFileCoverage(datos);
    }
  }
}

if (combinado.files().length === 0) {
  console.error('✗ La cobertura combinada no incluye ningún archivo fuente');
  process.exit(1);
}

fs.mkdirSync(DIR_COMBINADO, { recursive: true });
const contexto = libReport.createContext({ dir: DIR_COMBINADO, coverageMap: combinado });
for (const reporter of ['text-summary', 'text', 'lcov', 'json-summary', 'html']) {
  reports.create(reporter).execute(contexto);
}

const resumen = combinado.getCoverageSummary();
const tabla = ['lines', 'statements', 'functions', 'branches'];
const filas = tabla.map((m) => ({
  metrica: m,
  cobertura: resumen[m].pct,
  umbral: UMBRALES[m],
  cumple: resumen[m].pct >= UMBRALES[m],
}));

fs.writeFileSync(
  path.join(DIR_COMBINADO, 'resumen.json'),
  JSON.stringify({ archivos: combinado.files().length, filas }, null, 2),
);

console.log('\n── Cobertura combinada (unitarias + integración) ──');
for (const f of filas) {
  console.log(
    `${f.cumple ? '✓' : '✗'} ${f.metrica.padEnd(11)} ${String(f.cobertura).padStart(6)}% (umbral ${f.umbral}%)`,
  );
}

const fallidas = filas.filter((f) => !f.cumple);
if (fallidas.length > 0) {
  console.error(`\n✗ Umbral de cobertura no alcanzado en: ${fallidas.map((f) => f.metrica).join(', ')}`);
  process.exit(1);
}
console.log('✓ Umbral de cobertura alcanzado');
