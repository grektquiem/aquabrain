import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

interface CuerpoError {
  codigo: string;
  mensaje: string;
  detalles?: unknown;
  ruta: string;
  timestamp: string;
}

/**
 * Respuesta de error homogénea y **sin datos sensibles** (EC-05, EC-07).
 * Traduce los errores conocidos de Prisma y nunca expone el stack al cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('Excepciones');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let codigo = 'ERROR_INTERNO';
    let mensaje = 'Error interno del servidor';
    let detalles: unknown;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const respuesta = exception.getResponse();
      if (typeof respuesta === 'string') {
        mensaje = respuesta;
      } else {
        const cuerpo = respuesta as Record<string, unknown>;
        mensaje = String(cuerpo.message ?? exception.message);
        detalles = cuerpo.message;
      }
      // Código derivado del estado: no depende de la forma del cuerpo, de modo
      // que un 500 nunca se etiqueta como error del cliente.
      codigo = codigoPorEstado(status, status >= 500 ? 'ERROR_INTERNO' : 'SOLICITUD_INVALIDA');
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          codigo = 'DUPLICADO';
          mensaje = 'El recurso ya existe (restricción de unicidad)';
          break;
        case 'P2003':
          status = HttpStatus.CONFLICT;
          codigo = 'REFERENCIA_INVALIDA';
          mensaje = 'La operación viola una referencia de integridad';
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          codigo = 'NO_ENCONTRADO';
          mensaje = 'El recurso solicitado no existe';
          break;
        default:
          status = HttpStatus.BAD_REQUEST;
          codigo = 'SOLICITUD_INVALIDA';
          mensaje = 'La solicitud no pudo procesarse';
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      codigo = 'SOLICITUD_INVALIDA';
      mensaje = 'Datos inválidos para la operación';
    } else if (esErrorHttpDeMiddleware(exception)) {
      // Errores de middleware (p. ej. body-parser): traen su propio estado.
      const propio = Number(
        (exception as { status?: number; statusCode?: number }).status ??
          (exception as { statusCode?: number }).statusCode,
      );
      if (propio >= 400 && propio < 500) {
        status = propio;
        codigo = codigoPorEstado(propio, 'SOLICITUD_INVALIDA');
        mensaje =
          propio === HttpStatus.PAYLOAD_TOO_LARGE
            ? 'El cuerpo de la solicitud excede el tamaño permitido'
            : 'La solicitud no pudo procesarse';
      }
    }

    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} → ${status}`, exception instanceof Error ? exception.stack : undefined);
    }

    const cuerpo: CuerpoError = {
      codigo,
      mensaje,
      ...(detalles ? { detalles } : {}),
      ruta: request.url,
      timestamp: new Date().toISOString(),
    };
    response.status(status).json(cuerpo);
  }
}

/**
 * Códigos de error por estado HTTP. Los conflictos de esta API son siempre por
 * unicidad (correo o código repetido), por lo que `409` se etiqueta `DUPLICADO`;
 * las violaciones de clave foránea de Prisma usan `REFERENCIA_INVALIDA` y se
 * resuelven antes de llegar aquí.
 */
function codigoPorEstado(status: number, porDefecto: string): string {
  switch (status) {
    case 400:
      return 'SOLICITUD_INVALIDA';
    case 401:
      return 'NO_AUTORIZADO';
    case 403:
      return 'PROHIBIDO';
    case 404:
      return 'NO_ENCONTRADO';
    case 409:
      return 'DUPLICADO';
    case 413:
      return 'CARGA_EXCESIVA';
    case 422:
      return 'SOLICITUD_INVALIDA';
    case 429:
      return 'DEMASIADAS_SOLICITUDES';
    default:
      return porDefecto;
  }
}

/** Los errores de `body-parser` no son `HttpException` pero exponen un estado 4xx. */
function esErrorHttpDeMiddleware(exception: unknown): boolean {
  if (typeof exception !== 'object' || exception === null) return false;
  const e = exception as { status?: unknown; statusCode?: unknown; type?: unknown };
  const propio = e.status ?? e.statusCode;
  return typeof propio === 'number' && typeof e.type === 'string';
}
