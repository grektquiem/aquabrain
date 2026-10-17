import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ReglasService } from './reglas.service';
import { ActualizarReglaDto, CrearReglaDto, ProbarReglaDto } from './dto/regla.dto';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';
import { UsuarioActual } from '../../common/decorators/usuario-actual.decorator';

@ApiTags('Reglas de alerta')
@ApiBearerAuth()
@Controller('reglas')
export class ReglasController {
  constructor(private readonly reglas: ReglasService) {}

  @Get()
  @RequierePermiso('regla:leer')
  @ApiQuery({ name: 'soloActivas', required: false, type: Boolean })
  listar(@Query('soloActivas') soloActivas?: string) {
    return this.reglas.listar(soloActivas === 'true');
  }

  @Get(':id')
  @RequierePermiso('regla:leer')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.reglas.obtener(id);
  }

  @Post()
  @RequierePermiso('regla:escribir')
  crear(@Body() dto: CrearReglaDto, @UsuarioActual('id') usuarioId: string) {
    return this.reglas.crear(dto, usuarioId);
  }

  @Patch(':id')
  @RequierePermiso('regla:escribir')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarReglaDto) {
    return this.reglas.actualizar(id, dto);
  }

  @Delete(':id')
  @RequierePermiso('regla:escribir')
  eliminar(@Param('id', ParseUUIDPipe) id: string) {
    return this.reglas.eliminar(id);
  }

  @Post('probar/simulacion')
  @RequierePermiso('regla:escribir')
  probar(@Body() dto: ProbarReglaDto) {
    return this.reglas.probar(dto);
  }
}
