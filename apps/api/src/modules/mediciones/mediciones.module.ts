import { Module } from '@nestjs/common';
import { AlertasModule } from '../alertas/alertas.module';
import { MedicionesController } from './mediciones.controller';
import { MedicionesService } from './mediciones.service';

@Module({
  imports: [AlertasModule],
  controllers: [MedicionesController],
  providers: [MedicionesService],
  exports: [MedicionesService],
})
export class MedicionesModule {}
