import { Module } from '@nestjs/common';
import { ReglasController } from './reglas.controller';
import { ReglasService } from './reglas.service';

@Module({
  controllers: [ReglasController],
  providers: [ReglasService],
  exports: [ReglasService],
})
export class ReglasModule {}
