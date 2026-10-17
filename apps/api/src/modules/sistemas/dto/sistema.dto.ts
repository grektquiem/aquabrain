import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EstadoSistema } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsLatitude,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CrearSistemaDto {
  @ApiProperty({ example: 'INV-NORTE-01' })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  codigo!: string;

  @ApiProperty({ example: 'Invernadero Norte' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  descripcion?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ubicacion?: string;

  @ApiPropertyOptional({ example: -33.4172 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @IsLatitude()
  latitud?: number;

  @ApiPropertyOptional({ example: -70.6066 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  longitud?: number;

  @ApiPropertyOptional({ enum: EstadoSistema })
  @IsOptional()
  @IsEnum(EstadoSistema)
  estado?: EstadoSistema;
}

export class ActualizarSistemaDto extends PartialType(CrearSistemaDto) {}
