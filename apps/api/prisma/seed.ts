/**
 * Semilla de AquaBrain (doc 05 §9).
 *
 * Crea el catálogo de permisos y roles, tres usuarios (Administrador,
 * Supervisor, Encargado de cultivo), tipos de variable, dos sistemas con sus
 * cultivos, dos dispositivos con diez sensores, cinco reglas de alerta y
 * **30 días de mediciones sintéticas deterministas** (semilla fija) para que los
 * históricos y las pruebas de rendimiento de ES3 tengan volumen real.
 *
 * Ejecutar:  npm run seed --workspace @aquabrain/api
 */
import { PrismaClient, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';

const prisma = new PrismaClient();

const BCRYPT_COST = Number(process.env.BCRYPT_COST ?? 12);
const DIAS_HISTORICO = Number(process.env.SEED_DIAS ?? 30);
const INTERVALO_MIN = Number(process.env.SEED_INTERVALO_MIN ?? 10);

/** RNG determinista (mulberry32): la misma semilla produce los mismos datos. */
function rng(seed: number) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PERMISOS: Array<[string, string]> = [
  ['usuario:leer', 'Ver usuarios'],
  ['usuario:escribir', 'Crear, actualizar o desactivar usuarios'],
  ['rol:leer', 'Ver roles'],
  ['rol:asignar', 'Asignar rol a un usuario'],
  ['sistema:leer', 'Ver sistemas'],
  ['sistema:escribir', 'Crear, actualizar o desactivar sistemas'],
  ['cultivo:leer', 'Ver cultivos'],
  ['cultivo:escribir', 'Gestionar cultivos'],
  ['dispositivo:leer', 'Ver dispositivos'],
  ['dispositivo:escribir', 'Gestionar dispositivos'],
  ['dispositivo:rotar_clave', 'Rotar la credencial de un dispositivo'],
  ['sensor:leer', 'Ver sensores'],
  ['sensor:escribir', 'Gestionar sensores'],
  ['medicion:leer', 'Consultar mediciones'],
  ['medicion:escribir', 'Registrar mediciones (identidad de dispositivo)'],
  ['alerta:leer', 'Ver alertas'],
  ['alerta:resolver', 'Marcar alertas como resueltas'],
  ['regla:leer', 'Ver reglas de alerta'],
  ['regla:escribir', 'Gestionar reglas de alerta'],
  ['estado:leer', 'Ver el estado de conexión'],
  ['auditoria:leer', 'Consultar la auditoría'],
];

/** Permisos de los roles Supervisor y Encargado (solo lectura + resolver). */
const LECTURA = [
  'sistema:leer',
  'cultivo:leer',
  'dispositivo:leer',
  'sensor:leer',
  'medicion:leer',
  'alerta:leer',
  'alerta:resolver',
  'regla:leer',
  'estado:leer',
];

/** Un sensor por tipo y dispositivo; valores base para la serie sintética. */
const SENSORES = [
  { codigo: 'TEMP-01', nombre: 'Temperatura ambiente', tipo: 'TEMPERATURA', min: 10, max: 35, base: 23.5, amp: 3 },
  { codigo: 'HUM-01', nombre: 'Humedad relativa', tipo: 'HUMEDAD', min: 30, max: 90, base: 62, amp: 12 },
  { codigo: 'DIST-01', nombre: 'Nivel del depósito', tipo: 'DISTANCIA', min: 2, max: 40, base: 18, amp: 8 },
  { codigo: 'PH-01', nombre: 'pH de la solución', tipo: 'PH', min: 5.5, max: 7.5, base: 6.4, amp: 0.4 },
  { codigo: 'CAUDAL-01', nombre: 'Caudal de riego', tipo: 'CAUDAL', min: 0, max: 5, base: 2.4, amp: 1.2 },
];

async function main() {
  const t0 = Date.now();
  console.log('▶ Semilla AquaBrain');

  await prisma.permiso.createMany({
    data: PERMISOS.map(([codigo, descripcion]) => ({ codigo, descripcion })),
    skipDuplicates: true,
  });
  const permisos = await prisma.permiso.findMany();

  const roles = {
    admin: await prisma.rol.upsert({
      where: { nombre: 'Administrador' },
      update: {},
      create: { nombre: 'Administrador', descripcion: 'Acceso total' },
    }),
    supervisor: await prisma.rol.upsert({
      where: { nombre: 'Supervisor' },
      update: {},
      create: { nombre: 'Supervisor', descripcion: 'Lectura y monitoreo' },
    }),
    encargado: await prisma.rol.upsert({
      where: { nombre: 'Encargado' },
      update: {},
      create: { nombre: 'Encargado', descripcion: 'Operación y mantenimiento' },
    }),
  };

  for (const p of permisos) {
    await prisma.rolPermiso.upsert({
      where: { rolId_permisoId: { rolId: roles.admin.id, permisoId: p.id } },
      update: {},
      create: { rolId: roles.admin.id, permisoId: p.id },
    });
    if (LECTURA.includes(p.codigo)) {
      await prisma.rolPermiso.upsert({
        where: { rolId_permisoId: { rolId: roles.supervisor.id, permisoId: p.id } },
        update: {},
        create: { rolId: roles.supervisor.id, permisoId: p.id },
      });
      await prisma.rolPermiso.upsert({
        where: { rolId_permisoId: { rolId: roles.encargado.id, permisoId: p.id } },
        update: {},
        create: { rolId: roles.encargado.id, permisoId: p.id },
      });
    }
  }

  // --- Usuarios (la política de contraseña de doc 06 §2.1 exige ≥10) ---
  const PASSWORD = 'AquaPlants2026!';
  const passwordHash = await bcrypt.hash(PASSWORD, BCRYPT_COST);
  const usuarios = [
    { nombre: 'Administrador Aqua', email: 'admin@aqua.cl', rolId: roles.admin.id },
    { nombre: 'Supervisor Aqua', email: 'supervisor@aqua.cl', rolId: roles.supervisor.id },
    { nombre: 'Encargado Aqua', email: 'encargado@aqua.cl', rolId: roles.encargado.id },
  ];
  for (const u of usuarios) {
    await prisma.usuario.upsert({ where: { email: u.email }, update: { ...u, passwordHash }, create: { ...u, passwordHash } });
  }
  const admin = await prisma.usuario.findUniqueOrThrow({ where: { email: 'admin@aqua.cl' } });

  for (const t of [
    { codigo: 'TEMPERATURA', nombre: 'Temperatura', unidad: '°C', origen: 'REAL', min: 10, max: 35 },
    { codigo: 'HUMEDAD', nombre: 'Humedad relativa', unidad: '%', origen: 'REAL', min: 30, max: 90 },
    { codigo: 'DISTANCIA', nombre: 'Distancia (nivel)', unidad: 'cm', origen: 'REAL', min: 2, max: 40 },
    { codigo: 'PH', nombre: 'pH', unidad: 'pH', origen: 'SIMULADO', min: 5.5, max: 7.5 },
    { codigo: 'CAUDAL', nombre: 'Caudal', unidad: 'L/min', origen: 'SIMULADO', min: 0, max: 5 },
  ]) {
    await prisma.tipoVariable.upsert({
      where: { codigo: t.codigo },
      update: {},
      create: {
        codigo: t.codigo,
        nombre: t.nombre,
        unidadDefecto: t.unidad,
        origenDato: t.origen as any,
        valorMin: new Prisma.Decimal(t.min),
        valorMax: new Prisma.Decimal(t.max),
      },
    });
  }

  await prisma.tipoVariable.count();
  const tipoPorCodigo = new Map((await prisma.tipoVariable.findMany()).map((t) => [t.codigo, t]));

  const sistemas = [
    { codigo: 'INV-NORTE-01', nombre: 'Invernadero Norte', descripcion: 'Línea A de cultivo', ubicacion: 'Santiago Norte', lat: -33.4172, lon: -70.6066 },
    { codigo: 'INV-SUR-02', nombre: 'Invernadero Sur', descripcion: 'Línea B de cultivo', ubicacion: 'Santiago Sur', lat: -33.5172, lon: -70.6466 },
  ];
  for (const s of sistemas) {
    await prisma.sistema.upsert({
      where: { codigo: s.codigo },
      update: { nombre: s.nombre },
      create: {
        codigo: s.codigo,
        nombre: s.nombre,
        descripcion: s.descripcion,
        ubicacion: s.ubicacion,
        latitud: new Prisma.Decimal(s.lat),
        longitud: new Prisma.Decimal(s.lon),
        estado: 'ACTIVO',
      },
    });
  }
  const sistemaPorCodigo = new Map((await prisma.sistema.findMany()).map((s) => [s.codigo, s]));

  const cultivos = [
    { nombre: 'Lechuga romana A', especie: 'Lactuca sativa', variedad: 'Romana', sistema: 'INV-NORTE-01' },
    { nombre: 'Albahaca A', especie: 'Ocimum basilicum', variedad: 'Genovesa', sistema: 'INV-NORTE-01' },
    { nombre: 'Rúcula B', especie: 'Eruca sativa', variedad: 'Común', sistema: 'INV-SUR-02' },
  ];
  for (const c of cultivos) {
    const existente = await prisma.cultivo.findFirst({ where: { nombre: c.nombre } });
    if (!existente) {
      await prisma.cultivo.create({
        data: {
          sistemaId: sistemaPorCodigo.get(c.sistema)!.id,
          nombre: c.nombre,
          especie: c.especie,
          variedad: c.variedad,
          fechaInicio: new Date('2026-03-01'),
          fechaFinEstimada: new Date('2026-06-30'),
          estado: 'ACTIVO',
          fotoperiodoHoras: new Prisma.Decimal(16),
        },
      });
    }
  }

  // --- Dispositivos con credencial propia (bcrypt + pepper) ---
  const pepper = process.env.DEVICE_KEY_PEPPER ?? '';
  const credenciales: Array<{ codigo: string; apiKey: string }> = [];
  const dispositivos: Array<{ codigo: string; sistema: string }> = [
    { codigo: 'DEV-01', sistema: 'INV-NORTE-01' },
    { codigo: 'DEV-02', sistema: 'INV-SUR-02' },
  ];
  for (const d of dispositivos) {
    const apiKey = `ak_live_${randomBytes(32).toString('base64url')}`;
    const apiKeyHash = await bcrypt.hash(apiKey + pepper, BCRYPT_COST);
    credenciales.push({ codigo: d.codigo, apiKey });
    await prisma.dispositivo.upsert({
      where: { codigo: d.codigo },
      update: { apiKeyHash, apiKeyUltimos4: apiKey.slice(-4) },
      create: {
        sistemaId: sistemaPorCodigo.get(d.sistema)!.id,
        codigo: d.codigo,
        modelo: 'ESP32-S3',
        firmware: '1.4.2',
        intervaloReporteSeg: 300,
        apiKeyHash,
        apiKeyUltimos4: apiKey.slice(-4),
        estadoConexion: 'EN_LINEA',
      },
    });
  }
  const dispositivosDb = await prisma.dispositivo.findMany({ where: { codigo: { in: dispositivos.map((d) => d.codigo) } } });

  const sensores: Array<{ id: string; dispositivoId: string; unidad: string; base: number; amp: number; min: number; max: number }> = [];
  for (const [i, d] of dispositivosDb.entries()) {
    for (const s of SENSORES) {
      const tipo = tipoPorCodigo.get(s.tipo)!;
      const sensor = await prisma.sensor.upsert({
        where: { dispositivoId_codigo: { dispositivoId: d.id, codigo: s.codigo } },
        update: {},
        create: {
          dispositivoId: d.id,
          tipoVariableId: tipo.id,
          codigo: s.codigo,
          nombre: s.nombre,
          unidad: tipo.unidadDefecto,
          rangoMin: new Prisma.Decimal(s.min),
          rangoMax: new Prisma.Decimal(s.max),
          ubicacionFisica: i === 0 ? 'Nivel 1' : 'Nivel 2',
        },
      });
      sensores.push({ id: sensor.id, dispositivoId: d.id, unidad: sensor.unidad, base: s.base, amp: s.amp, min: s.min, max: s.max });
    }
  }

  // --- Reglas de alerta (RN-07: alcance por sensor o por tipo, no ambos) ---
  // (re)creación idempotente de reglas
  await prisma.reglaAlerta.deleteMany({ where: { nombre: { in: ['Temperatura alta', 'Humedad baja', 'pH fuera de rango', 'Nivel bajo del depósito'] } } });
  await prisma.reglaAlerta.createMany({
    data: [
      { nombre: 'Temperatura alta', operador: 'MAYOR_QUE', umbralMax: new Prisma.Decimal(32), severidad: 'MEDIA', tipoVariableId: tipoPorCodigo.get('TEMPERATURA')!.id, creadoPor: admin.id },
      { nombre: 'Humedad baja', operador: 'MENOR_QUE', umbralMin: new Prisma.Decimal(40), severidad: 'MEDIA', tipoVariableId: tipoPorCodigo.get('HUMEDAD')!.id, creadoPor: admin.id },
      { nombre: 'pH fuera de rango', operador: 'FUERA_DE_RANGO', umbralMin: new Prisma.Decimal(6), umbralMax: new Prisma.Decimal(7), severidad: 'ALTA', tipoVariableId: tipoPorCodigo.get('PH')!.id, creadoPor: admin.id },
      { nombre: 'Nivel bajo del depósito', operador: 'MENOR_QUE', umbralMin: new Prisma.Decimal(5), severidad: 'ALTA', sensorId: sensores[2].id, creadoPor: admin.id },
    ],
  });

  // --- 30 días de mediciones (una por sensor cada SEED_INTERVALO_MIN) ---
  const yaHay = await prisma.medicion.count();
  if (yaHay > 0) {
    console.log(`= ${yaHay} mediciones ya presentes; no se vuelve a sembrar`);
  } else {
    const ahora = new Date();
    const inicio = new Date(ahora.getTime() - DIAS_HISTORICO * 24 * 60 * 60 * 1000);
    const pasoMs = INTERVALO_MIN * 60 * 1000;
    const puntos = Math.floor((DIAS_HISTORICO * 24 * 60) / INTERVALO_MIN);
    const puntosPorDia = (24 * 60) / INTERVALO_MIN;
    const r = rng(20260401);

    for (const s of sensores) {
      const lote: Prisma.MedicionCreateManyInput[] = [];
      for (let k = 0; k < puntos; k++) {
        const fase = (k % puntosPorDia) / puntosPorDia;
        const onda = Math.sin(fase * Math.PI * 2);
        const ruido = (r() - 0.5) * 2;
        let valor = base(s.base, s.amp, onda, ruido);
        valor = clamp(round2(valor), s.min, s.max);
        lote.push({
          sensorId: s.id,
          dispositivoId: s.dispositivoId,
          valor: new Prisma.Decimal(valor),
          unidad: s.unidad,
          timestamp: new Date(inicio.getTime() + k * pasoMs),
          origen: 'ONLINE',
          calidad: 'OK',
        });
      }
      await prisma.medicion.createMany({ data: lote });
      const ultima = lote[lote.length - 1];
      await prisma.estadoSensorActual.upsert({
        where: { sensorId: s.id },
        update: { valor: ultima.valor, unidad: ultima.unidad, timestamp: ultima.timestamp as Date, dispositivoId: s.dispositivoId },
        create: { sensorId: s.id, dispositivoId: s.dispositivoId, valor: ultima.valor, unidad: ultima.unidad, timestamp: ultima.timestamp as Date },
      });
      console.log('  · %s: %d mediciones', s.unidad, lote.length);
    }
    await prisma.dispositivo.updateMany({ data: { estadoConexion: 'EN_LINEA' } });
  }

  console.log('\n✔ Semilla aplicada en %d ms', Date.now() - t0);
  console.log('\nCredenciales de dispositivo (se muestran una sola vez):');
  for (const c of credenciales) console.log(`  ${c.codigo}  ${c.apiKey}`);
  console.log('\nUsuarios demo (contraseña %s):', PASSWORD);
  for (const u of usuarios) console.log(`  ${u.email}  (${u.nombre})`);
}

function base(b: number, a: number, onda: number, ruido: number) {
  return b + a * (onda + ruido) * 0.5;
}
function round2(n: number) {
  return Math.round(n * 100) / 100;
}
function clamp(n: number, lo: number, hi: number) {
  return Math.min(Math.max(n, lo), hi);
}

void (async () => {
  try {
    await main();
  } catch (e) {
    console.error(e);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
