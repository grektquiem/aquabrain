import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CultivosService } from './cultivos.service';
import { ActualizarCultivoDto, CrearCultivoDto } from './dto/cultivo.dto';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';

@ApiTags('Cultivos')
@ApiBearerAuth()
@Controller('cultivos')
export class CultivosController {
  constructor(private readonly cultivos: CultivosService) {}

  @Get()
  @RequierePermiso('cultivo:leer')
  @ApiQuery({ name: 'sistemaId', required: false })
  @ApiQuery({ name: 'estado', required: false })
  listar(@Query('sistemaId') sistemaId?: string, @Query('estado') estado?: string) {
    return this.cultivos.listar(sistemaId, estado);
  }

  @Get(':id')
  @RequierePermiso('cultivo:leer')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.cultivos.obtener(id);
  }

  @Post()
  @RequierePermiso('cultivo:escribir')
  crear(@Body() dto: CrearCultivoDto) {
    return this.cultivos.crear(dto);
  }

  @Patch(':id')
  @RequierePermiso('cultivo:escribir')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarCultivoDto) {
    return this.cultivos.actualizar(id, dto);
  }

  @Delete(':id')
  @RequierePermiso('cultivo:escribir')
  @ApiOperation({ summary: 'Cierra el cultivo (borrado lógico)' })
  cerrar(@Param('id', ParseUUIDPipe) id: string) {
    return this.cultivos.cerrar(id);
  }
}
