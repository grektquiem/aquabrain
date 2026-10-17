import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DispositivoAutenticado, DISPOSITIVO_REQUEST_KEY } from '../guards/dispositivo.guard';

/** Inyecta el dispositivo autenticado por API key (`X-Device-Key`). */
export const DispositivoActual = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): DispositivoAutenticado => {
    const request = ctx.switchToHttp().getRequest();
    return request[DISPOSITIVO_REQUEST_KEY];
  },
);
