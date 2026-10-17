import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { ActualizarUsuarioDto, CrearUsuarioDto } from './dto/usuario.dto';
import { PaginacionDto } from '../../common/dto/paginacion.dto';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';

@ApiTags('Usuarios')
@ApiBearerAuth()
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuarios: UsuariosService) {}

  @Get()
  @RequierePermiso('usuario:leer')
  listar(@Query() paginacion: PaginacionDto) {
    return this.usuarios.listar(paginacion);
  }

  @Get(':id')
  @RequierePermiso('usuario:leer')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuarios.obtener(id);
  }

  @Post()
  @RequierePermiso('usuario:escribir')
  crear(@Body() dto: CrearUsuarioDto) {
    return this.usuarios.crear(dto);
  }

  @Patch(':id')
  @RequierePermiso('usuario:escribir')
  @ApiOperation({ summary: 'Actualiza un usuario (no permite auto-elevación de rol)' })
  actualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ActualizarUsuarioDto,
    @UsuarioActual('id') solicitanteId: string,
  ) {
    return this.usuarios.actualizar(id, dto, solicitanteId);
  }

  @Delete(':id')
  @RequierePermiso('usuario:escribir')
  @ApiOperation({ summary: 'Desactiva al usuario y revoca sus sesiones (borrado lógico)' })
  desactivar(@Param('id', ParseUUIDPipe) id: string, @UsuarioActual('id') solicitanteId: string) {
    return this.usuarios.desactivar(id, solicitanteId);
  }
}
