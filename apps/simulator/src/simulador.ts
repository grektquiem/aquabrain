#!/usr/bin/env node
/**
 * Simulador del gateway AquaBrain (ES3, RF06/RF14/HU10).
 *
 * Sustituye al ESP32-S3 mientras no hay hardware: genera mediciones realistas,
 * las valida contra el contrato compartido y las envía con las mismas cabeceras
 * del firmware. En modo `offline` acumula las lecturas con su hora de origen y
 * las sincroniza en lote (idempotente por `idExterno`), tal como hará el gateway
 * tras recuperar la conexión (RN-10).
 *
 * Uso:
 *   API_URL=http://localhost:3000/api/v1 \
 *   DEVICE_KEY=ak_live_... DEVICE_CODE=DEV-01 \
 *   SENSORES=TEMP-01,HUM-01,PH-01 MODO=online TICKS=6 INTERVALO_SEG=2 \
 *   node dist/simulador.js
 */

import { OpcionesSimulador, leerConfiguracion } from './config';
import { ClienteApi, ErrorApi, PayloadMedicion, RespuestaBulk } from './cliente';
import { Generador, Lectura, resolverSensor } from './generador';

interface Resumen {
  enviadas: number;
  duplicadas: number;
  errores: number;
  alertas: number;
  anomalias: number;
}

const dormir = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

function marca(): string {
  return new Date().toISOString().slice(11, 19);
}

function linea(lectura: Lectura): string {
  const aviso = lectura.fueraDeRango ? ' ⚠ fuera de rango' : '';
  return `${lectura.sensorCodigo.padEnd(10)} ${lectura.valor.toFixed(2).padStart(7)} ${lectura.unidad.padEnd(6)}${aviso}`;
}

async function ejecutar(opciones: OpcionesSimulador): Promise<Resumen> {
  const cliente = new ClienteApi(opciones.apiUrl, opciones.deviceKey, opciones.deviceCode);
  const generador = new Generador(opciones.perfil);

  console.log('── Simulador AquaBrain ──────────────────────────────────────');
  console.log(`  API            : ${opciones.apiUrl}`);
  console.log(`  Dispositivo    : ${opciones.deviceCode}`);
  console.log(`  Sensores       : ${opciones.sensores.join(', ')}`);
  console.log(`  Modo           : ${opciones.modo}${opciones.modo === 'online' ? '' : ` (perfil ${opciones.perfil})`}`);
  console.log(`  Intervalo      : ${opciones.intervaloMs / 1000}s · lecturas: ${opciones.ticks || '∞'}`);
  console.log('');

  const salud = await cliente.comprobarConectividad();
  console.log(`[${marca()}] API operativa (estado=${salud.estado}, base de datos=${salud.baseDatos})`);

  const definiciones = opciones.sensores.map(resolverSensor);
  const resumen: Resumen = { enviadas: 0, duplicadas: 0, errores: 0, alertas: 0, anomalias: 0 };
  const pendientes: PayloadMedicion[] = [];
  let secuencia = 0;

  for (let tick = 0; tick < opciones.ticks || opciones.ticks === 0; tick++) {
    const forzarAnomalia = opciones.modo === 'anomalia' && tick > 0 && tick % opciones.cadaAnomalia === 0;
    const lecturas = definiciones.map((definicion) => generador.siguiente(definicion, tick, forzarAnomalia));
    const timestamp = new Date().toISOString();

    console.log(`[${marca()}] lectura ${tick + 1}${forzarAnomalia ? ' (anomalía inyectada)' : ''}`);
    for (const lectura of lecturas) {
      console.log(`          ${linea(lectura)}`);
      if (lectura.fueraDeRango) resumen.anomalias++;
    }

    if (opciones.modo === 'offline') {
      // Se conserva la hora de origen: al sincronizar, `origen = OFFLINE`.
      for (const lectura of lecturas) {
        pendientes.push({
          sensorCodigo: lectura.sensorCodigo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          timestamp,
          origen: 'OFFLINE',
          idExterno: `${opciones.deviceCode}-${timestamp}-${lectura.sensorCodigo}`,
        });
      }
      console.log(`          → almacenado en el búfer local (${pendientes.length} pendientes)`);
    } else {
      for (const lectura of lecturas) {
        const payload: PayloadMedicion = {
          sensorCodigo: lectura.sensorCodigo,
          valor: lectura.valor,
          unidad: lectura.unidad,
          timestamp,
          idExterno: `${opciones.deviceCode}-${timestamp}-${lectura.sensorCodigo}-${secuencia++}`,
        };
        try {
          const respuesta = await cliente.enviarMedicion(payload);
          if (respuesta.duplicada) {
            resumen.duplicadas++;
            console.log('          → duplicada (idempotencia)');
          } else {
            resumen.enviadas++;
            const alertas = respuesta.alertasGeneradas ?? [];
            resumen.alertas += alertas.length;
            for (const alerta of alertas) {
              console.log(`          → ⛔ alerta ${alerta.severidad}: ${alerta.regla} (valor ${alerta.valor})`);
            }
          }
        } catch (error) {
          resumen.errores++;
          console.error(`          → error: ${mensajeDe(error)}`);
          if (error instanceof ErrorApi && (error.estado === 401 || error.estado === 403)) {
            console.error('          → revise DEVICE_KEY / DEVICE_CODE (el dispositivo dejó de estar autorizado)');
            return resumen;
          }
        }
      }
    }

    if (tick + 1 < opciones.ticks) await dormir(opciones.intervaloMs);
  }

  if (opciones.modo === 'offline' && pendientes.length > 0) {
    console.log('');
    console.log(`[${marca()}] reconexión: sincronizando ${pendientes.length} lecturas en lote…`);
    try {
      const lote: RespuestaBulk = await cliente.enviarLote(pendientes);
      resumen.enviadas += lote.aceptadas;
      resumen.duplicadas += lote.duplicadas;
      resumen.errores += lote.rechazadas;
      resumen.alertas += lote.alertasGeneradas;
      console.log(
        `          → lote: recibidas=${lote.recibidas} aceptadas=${lote.aceptadas} duplicadas=${lote.duplicadas} rechazadas=${lote.rechazadas} alertas=${lote.alertasGeneradas}`,
      );
      // Un segundo envío demuestra la idempotencia de la sincronización (HU10).
      const repetido = await cliente.enviarLote(pendientes);
      console.log(`          → reenvío del mismo lote: duplicadas=${repetido.duplicadas} (idempotencia verificada)`);
    } catch (error) {
      resumen.errores += pendientes.length;
      console.error(`          → error al sincronizar: ${mensajeDe(error)}`);
    }
  }

  return resumen;
}

function mensajeDe(error: unknown): string {
  if (error instanceof ErrorApi) {
    return `${error.message} :: ${JSON.stringify(error.cuerpo).slice(0, 200)}`;
  }
  return error instanceof Error ? error.message : String(error);
}

async function principal(): Promise<void> {
  let opciones: OpcionesSimulador;
  try {
    opciones = leerConfiguracion();
  } catch (error) {
    console.error(`✗ ${mensajeDe(error)}`);
    console.error('  Variables: API_URL, DEVICE_KEY, DEVICE_CODE, SENSORES, MODO, PERFIL, INTERVALO_SEG, TICKS, CADA_ANOMALIA');
    process.exitCode = 2;
    return;
  }

  const resumen = await ejecutar(opciones);

  console.log('');
  console.log('── Resumen ──────────────────────────────────────────────────');
  console.log(`  mediciones aceptadas : ${resumen.enviadas}`);
  console.log(`  duplicadas (ignoradas): ${resumen.duplicadas}`);
  console.log(`  alertas generadas    : ${resumen.alertas}`);
  console.log(`  valores fuera de rango: ${resumen.anomalias}`);
  console.log(`  errores              : ${resumen.errores}`);
  if (resumen.errores > 0) process.exitCode = 1;
}

principal().catch((error) => {
  console.error(`✗ Fallo del simulador: ${mensajeDe(error)}`);
  process.exitCode = 1;
});
