import { ApiPropertyOptional } from '@nestjs/swagger';
import { EstadoAlerta, Severidad } from '@prisma/client';
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';
import { PaginacionDto } from '../../../common/dto/paginacion.dto';

export class FiltrarAlertasDto extends PaginacionDto {
  @ApiPropertyOptional({ enum: EstadoAlerta })
  @IsOptional()
  @IsEnum(EstadoAlerta)
  estado?: EstadoAlerta;

  @ApiPropertyOptional({ enum: Severidad })
  @IsOptional()
  @IsEnum(Severidad)
  severidad?: Severidad;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sistemaId?: string;
}

export class ResolverAlertaDto {
  @ApiPropertyOptional({ example: 'Se repuso la solución nutritiva' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  comentario?: string;
}
