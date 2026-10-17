import { BadRequestException, UnprocessableEntityException, ValidationPipe, ValidationPipeOptions } from '@nestjs/common';
import type { ValidationError } from 'class-validator';

function aplanar(errores: ValidationError[], prefijo = ''): Array<{ campo: string; mensaje: string; desconocido: boolean }> {
  return errores.flatMap((e) => {
    const campo = prefijo ? `${prefijo}.${e.property}` : e.property;
    const propios = Object.entries(e.constraints ?? {}).map(([clave, mensaje]) => ({
      campo,
      mensaje,
      desconocido: clave.startsWith('whitelistValidation'),
    }));
    return [...propios, ...aplanar(e.children ?? [], campo)];
  });
}

/**
 * Tubería de validación de la API (RNF01, TS-21/TS-22).
 *
 * Distingue dos familias de error, tal como exige el plan de pruebas:
 *  - **422** cuando la petición trae campos no declarados (whitelist) — TS-21.
 *  - **400** cuando un campo declarado tiene un valor inválido — TS-22.
 *
 * En ambos casos se rechaza la petición completa: nunca se persiste a medias.
 */
export function crearValidationPipe(opciones: ValidationPipeOptions = {}): ValidationPipe {
  return new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validationError: { target: false, value: false },
    exceptionFactory: (errores) => {
      const aplanados = aplanar(errores);
      const cuerpo = {
        message: aplanados.map((a) => `${a.campo}: ${a.mensaje}`),
        campos: aplanados.map((a) => a.campo),
      };
      return aplanados.some((a) => a.desconocido)
        ? new UnprocessableEntityException(cuerpo)
        : new BadRequestException(cuerpo);
    },
    ...opciones,
  });
}
