import { Module } from '@nestjs/common';
import { SistemasController } from './sistemas.controller';
import { SistemasService } from './sistemas.service';

@Module({
  controllers: [SistemasController],
  providers: [SistemasService],
  exports: [SistemasService],
})
export class SistemasModule {}
