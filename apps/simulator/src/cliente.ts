/**
 * Cliente HTTP del simulador (protocolo del gateway real, MC-09).
 *
 * Cada carga útil se valida **antes** de enviarse con el esquema Zod de
 * `@aquabrain/shared`: si el contrato cambia, el simulador deja de compilar o de
 * enviar, que es exactamente lo que se busca con una única fuente de verdad.
 */

import { MAX_BULK_ITEMS, medicionBulkSchema, medicionSchema } from '@aquabrain/shared';

export interface PayloadMedicion {
  sensorCodigo: string;
  valor: number;
  unidad: string;
  timestamp: string;
  origen?: 'ONLINE' | 'OFFLINE' | 'MANUAL';
  idExterno?: string;
}

export interface RespuestaMedicion {
  duplicada: boolean;
  id?: string;
  sensorCodigo?: string;
  alertasGeneradas?: Array<{ regla: string; severidad: string; valor: number }>;
}

export interface RespuestaBulk {
  recibidas: number;
  aceptadas: number;
  duplicadas: number;
  rechazadas: number;
  alertasGeneradas: number;
  muestraRechazos?: Array<{ indice: number; motivo: string }>;
}

export class ErrorApi extends Error {
  constructor(
    readonly estado: number,
    readonly cuerpo: unknown,
    mensaje: string,
  ) {
    super(mensaje);
  }
}

export class ClienteApi {
  constructor(
    private readonly apiUrl: string,
    private readonly deviceKey: string,
    private readonly deviceCode: string,
  ) {}

  private get cabeceras(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-Device-Key': this.deviceKey,
      'X-Device-Code': this.deviceCode,
    };
  }

  private async enviar(ruta: string, cuerpo: unknown): Promise<{ estado: number; cuerpo: unknown }> {
    const respuesta = await fetch(`${this.apiUrl}${ruta}`, {
      method: 'POST',
      headers: this.cabeceras,
      body: JSON.stringify(cuerpo),
    });
    const texto = await respuesta.text();
    const parseado = texto ? JSON.parse(texto) : null;
    if (!respuesta.ok && respuesta.status !== 207) {
      throw new ErrorApi(respuesta.status, parseado, `La API respondió ${respuesta.status} en ${ruta}`);
    }
    return { estado: respuesta.status, cuerpo: parseado };
  }

  /** `POST /mediciones` — una lectura individual. */
  async enviarMedicion(payload: PayloadMedicion): Promise<RespuestaMedicion> {
    const validado = medicionSchema.parse(payload);
    const { cuerpo } = await this.enviar('/mediciones', validado);
    return cuerpo as RespuestaMedicion;
  }

  /**
   * `POST /mediciones/bulk` — sincronización offline (HU10).
   *
   * El lote se trocea en bloques de `MAX_BULK_ITEMS` (500) porque el contrato
   * compartido rechaza lotes mayores; así el simulador nunca genera un 422.
   */
  async enviarLote(payloads: PayloadMedicion[]): Promise<RespuestaBulk> {
    const acumulado: RespuestaBulk = {
      recibidas: 0,
      aceptadas: 0,
      duplicadas: 0,
      rechazadas: 0,
      alertasGeneradas: 0,
    };

    for (let i = 0; i < payloads.length; i += MAX_BULK_ITEMS) {
      const bloque = payloads.slice(i, i + MAX_BULK_ITEMS);
      const validado = medicionBulkSchema.parse({ items: bloque });
      const { cuerpo } = await this.enviar('/mediciones/bulk', validado);
      const parcial = cuerpo as RespuestaBulk;
      acumulado.recibidas += parcial.recibidas;
      acumulado.aceptadas += parcial.aceptadas;
      acumulado.duplicadas += parcial.duplicadas;
      acumulado.rechazadas += parcial.rechazadas;
      acumulado.alertasGeneradas += parcial.alertasGeneradas;
      if (parcial.muestraRechazos?.length) {
        acumulado.muestraRechazos = [...(acumulado.muestraRechazos ?? []), ...parcial.muestraRechazos];
      }
    }
    return acumulado;
  }

  /**
   * Comprueba que la API responde antes de empezar (sonda pública `/health`).
   * Las credenciales del dispositivo no se pueden verificar sin escribir, así
   * que un rechazo 401/403 se informa en el primer envío con un mensaje claro.
   */
  async comprobarConectividad(): Promise<{ estado: string; baseDatos: string }> {
    const respuesta = await fetch(`${this.apiUrl.replace(/\/api\/v1$/, '')}/health`);
    if (!respuesta.ok) {
      throw new ErrorApi(respuesta.status, null, `La API no responde en ${this.apiUrl} (${respuesta.status})`);
    }
    return (await respuesta.json()) as { estado: string; baseDatos: string };
  }
}
