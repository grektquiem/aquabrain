import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsInt, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CrearDispositivoDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sistemaId!: string;

  @ApiProperty({ example: 'DEV-01' })
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  codigo!: string;

  @ApiPropertyOptional({ example: 'ESP32-S3' })
  @IsOptional()
  @IsString()
  @MaxLength(60)
  modelo?: string;

  @ApiPropertyOptional({ example: '1.4.2' })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  firmware?: string;

  @ApiPropertyOptional({ example: 300, description: 'Intervalo de reporte en segundos' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(30)
  @Max(86400)
  intervaloReporteSeg?: number;
}

export class ActualizarDispositivoDto extends PartialType(CrearDispositivoDto) {
  @ApiPropertyOptional({ description: 'Dispositivo habilitado' })
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}

/** Filtro de listado por sistema (TS-20): un UUID inválido se rechaza con 400. */
export class ListarDispositivosDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  sistemaId?: string;
}

export class CrearSensorDto {
  @ApiProperty({ example: 'TEMPERATURA', description: 'Código del tipo de variable' })
  @IsString()
  @MinLength(2)
  @MaxLength(30)
  tipoVariableCodigo!: string;

  @ApiProperty({ example: 'TEMP-01' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  codigo!: string;

  @ApiProperty({ example: 'Temperatura ambiente' })
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  nombre!: string;

  @ApiProperty({ example: '°C' })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  unidad!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rangoMin?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  rangoMax?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  ubicacionFisica?: string;
}

export class ActualizarSensorDto extends PartialType(CrearSensorDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
