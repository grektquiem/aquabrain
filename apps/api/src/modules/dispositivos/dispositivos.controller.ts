import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { DispositivosService } from './dispositivos.service';
import {
  ActualizarDispositivoDto,
  ActualizarSensorDto,
  CrearDispositivoDto,
  CrearSensorDto,
  ListarDispositivosDto,
} from './dto/dispositivo.dto';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';

@ApiTags('Dispositivos')
@ApiBearerAuth()
@Controller('dispositivos')
export class DispositivosController {
  constructor(private readonly dispositivos: DispositivosService) {}

  @Get()
  @RequierePermiso('dispositivo:leer')
  @ApiOperation({ summary: 'Lista dispositivos (opcionalmente por sistema)' })
  listar(@Query() filtro: ListarDispositivosDto) {
    return this.dispositivos.listar(filtro.sistemaId);
  }

  @Get(':id')
  @RequierePermiso('dispositivo:leer')
  obtener(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispositivos.obtener(id);
  }

  @Post()
  @RequierePermiso('dispositivo:escribir')
  @ApiOperation({ summary: 'Alta de dispositivo; devuelve la API key una sola vez' })
  crear(@Body() dto: CrearDispositivoDto) {
    return this.dispositivos.crear(dto);
  }

  @Patch(':id')
  @RequierePermiso('dispositivo:escribir')
  actualizar(@Param('id', ParseUUIDPipe) id: string, @Body() dto: ActualizarDispositivoDto) {
    return this.dispositivos.actualizar(id, dto);
  }

  @Delete(':id')
  @RequierePermiso('dispositivo:escribir')
  @ApiOperation({ summary: 'Baja lógica del dispositivo (revoca la credencial)' })
  desactivar(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispositivos.desactivar(id);
  }

  @Post(':id/rotar-clave')
  @RequierePermiso('dispositivo:rotar_clave')
  @ApiOperation({ summary: 'Rota la API key del dispositivo (RF14)' })
  rotarClave(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispositivos.rotarClave(id);
  }

  @Get(':id/sensores')
  @RequierePermiso('sensor:leer')
  listarSensores(@Param('id', ParseUUIDPipe) id: string) {
    return this.dispositivos.listarSensores(id);
  }

  @Post(':id/sensores')
  @RequierePermiso('sensor:escribir')
  crearSensor(@Param('id', ParseUUIDPipe) id: string, @Body() dto: CrearSensorDto) {
    return this.dispositivos.crearSensor(id, dto);
  }

  @Patch(':id/sensores/:sensorId')
  @RequierePermiso('sensor:escribir')
  actualizarSensor(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('sensorId', ParseUUIDPipe) sensorId: string,
    @Body() dto: ActualizarSensorDto,
  ) {
    return this.dispositivos.actualizarSensor(id, sensorId, dto);
  }
}
