import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'esPublico';

/**
 * Marca una ruta como accesible sin token. Solo `login`, `refresh` y el
 * *health check* deben usarlo (doc 06 §3.4, EC-02).
 */
export const Publico = () => SetMetadata(IS_PUBLIC_KEY, true);
