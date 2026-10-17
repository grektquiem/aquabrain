import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';
import { RequierePermiso } from '../../common/decorators/requiere-permiso.decorator';

@ApiTags('Dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('estado')
  @RequierePermiso('estado:leer')
  @ApiQuery({ name: 'sistemaId', required: false })
  @ApiOperation({ summary: 'Estado de dispositivos, sensores y alertas activas' })
  estado(@Query('sistemaId') sistemaId?: string) {
    return this.dashboard.estado(sistemaId);
  }
}
