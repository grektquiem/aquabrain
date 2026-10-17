import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { OperadorRegla, Severidad } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CrearReglaDto {
  @ApiProperty({ example: 'pH fuera de rango' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @ApiPropertyOptional({ format: 'uuid', description: 'Alcance por sensor (excluyente con tipo)' })
  @IsOptional()
  @IsUUID()
  sensorId?: string;

  @ApiPropertyOptional({ example: 'PH', description: 'Alcance por tipo de variable (excluyente con sensor)' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  tipoVariableCodigo?: string;

  @ApiProperty({ enum: OperadorRegla })
  @IsEnum(OperadorRegla)
  operador!: OperadorRegla;

  @ApiPropertyOptional({ example: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  umbralMin?: number;

  @ApiPropertyOptional({ example: 7 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  umbralMax?: number;

  @ApiProperty({ enum: Severidad })
  @IsEnum(Severidad)
  severidad!: Severidad;

  @ApiPropertyOptional({ example: 900, description: 'Enfriamiento en segundos antes de repetir la alerta' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(60)
  @Max(86400)
  cooldownSeg?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}

export class ActualizarReglaDto extends PartialType(CrearReglaDto) {}

export class ProbarReglaDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Regla existente a probar' })
  @IsOptional()
  @IsUUID()
  reglaId?: string;

  @ApiPropertyOptional({ description: 'Regla en línea (aún no guardada)' })
  @IsOptional()
  regla?: CrearReglaDto;

  @ApiProperty({ example: 8.4, description: 'Valor simulado de la medición' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valor?: number | null;
}
