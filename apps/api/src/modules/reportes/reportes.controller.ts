import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';
import { ReportesService } from './reportes.service';

@ApiTags('Reportes')
@Controller('reportes')
@ApiBearerAuth()
export class ReportesController {
  constructor(private readonly reportes: ReportesService) {}

  @Get('resumen')
  @RequierePermiso('medicion:leer') // Usamos el mismo permiso que ya tienes
  obtenerResumen() {
    return this.reportes.obtenerResumen();
  }
}