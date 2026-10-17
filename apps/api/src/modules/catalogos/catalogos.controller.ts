import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';

/** Catálogos de solo lectura que alimentan los formularios del dashboard. */
@ApiTags('Catálogos')
@ApiBearerAuth()
@Controller()
export class CatalogosController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('roles')
  @RequierePermiso('rol:leer')
  @ApiOperation({ summary: 'Roles con sus permisos efectivos' })
  roles() {
    return this.prisma.rol.findMany({
      select: {
        id: true,
        nombre: true,
        descripcion: true,
        rolPermisos: { select: { permiso: { select: { codigo: true, descripcion: true } } } },
      },
      orderBy: { nombre: 'asc' },
    });
  }

  @Get('permisos')
  @RequierePermiso('rol:leer')
  @ApiOperation({ summary: 'Catálogo de permisos `recurso:accion`' })
  permisos() {
    return this.prisma.permiso.findMany({ select: { codigo: true, descripcion: true }, orderBy: { codigo: 'asc' } });
  }

  @Get('tipos-variable')
  @RequierePermiso('sensor:leer')
  @ApiOperation({ summary: 'Tipos de variable (temperatura, humedad, pH, caudal, distancia)' })
  tiposVariable() {
    return this.prisma.tipoVariable.findMany({
      select: { id: true, codigo: true, nombre: true, unidadDefecto: true, origenDato: true, valorMin: true, valorMax: true },
      orderBy: { nombre: 'asc' },
    });
  }
}
