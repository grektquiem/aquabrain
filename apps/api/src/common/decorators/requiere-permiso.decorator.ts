import { SetMetadata } from '@nestjs/common';

export const PERMISOS_KEY = 'permisosRequeridos';

/**
 * Declara los permisos que exige la ruta (catálogo `recurso:accion`,
 * doc 06 §3.2 y §3.3). Denegar por defecto: sin permiso declarado, la guarda
 * de permisos no autoriza por sí sola.
 */
export const RequierePermiso = (...permisos: string[]) => SetMetadata(PERMISOS_KEY, permisos);
