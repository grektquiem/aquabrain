import { Module } from '@nestjs/common';
import { DispositivosController } from './dispositivos.controller';
import { DispositivosService } from './dispositivos.service';
import { SensoresController } from './sensores.controller';

@Module({
  controllers: [DispositivosController, SensoresController],
  providers: [DispositivosService],
  exports: [DispositivosService],
})
export class DispositivosModule {}
