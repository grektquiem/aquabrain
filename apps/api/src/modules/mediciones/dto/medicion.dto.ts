import { MAX_BULK_ITEMS } from '@aquabrain/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OrigenMedicion } from '@prisma/client';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsIn,
  IsISO8601,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';

/** Payload que envía el gateway ESP32-S3 o el simulador (RN-11). */
export class CrearMedicionDto {
  @ApiPropertyOptional({ format: 'uuid', description: 'Identificador interno del sensor' })
  @IsOptional()
  @IsUUID()
  sensorId?: string;

  @ApiPropertyOptional({ example: 'TEMP-01', description: 'Código del sensor dentro del dispositivo' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  sensorCodigo?: string;

  @ApiPropertyOptional({ example: 23.42 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  valor?: number;

  @ApiPropertyOptional({ example: 'ALTA' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  valorTexto?: string;

  @ApiPropertyOptional({ example: '°C' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  unidad?: string;

  @ApiProperty({ example: '2026-10-16T12:00:00.000Z', description: 'Instante de la lectura (UTC)' })
  @IsISO8601({ strict: false })
  timestamp!: string;

  @ApiPropertyOptional({ description: 'Clave de idempotencia del envío offline (HU10)' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  idExterno?: string;

  @ApiPropertyOptional({ enum: OrigenMedicion })
  @IsOptional()
  @IsEnum(OrigenMedicion)
  origen?: OrigenMedicion;
}

export class BulkMedicionesDto {
  @ApiProperty({
    type: [CrearMedicionDto],
    maxItems: MAX_BULK_ITEMS,
    description: `Lote de hasta ${MAX_BULK_ITEMS} lecturas almacenadas offline`,
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(MAX_BULK_ITEMS)
  @ValidateNested({ each: true })
  @Type(() => CrearMedicionDto)
  items!: CrearMedicionDto[];
}

export class ConsultarSerieDto {
  @ApiProperty({
    example: 'b6f1c2e0-0000-4000-8000-000000000000',
    description: 'Uno o más UUID de sensor, separados por coma',
  })
  @Transform(({ value }) => (typeof value === 'string' ? value.split(',').map((v) => v.trim()).filter(Boolean) : value))
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('4', { each: true })
  sensores!: string[];

  @ApiProperty({ example: '2026-10-01T00:00:00.000Z' })
  @IsISO8601()
  desde!: string;

  @ApiProperty({ example: '2026-10-16T00:00:00.000Z' })
  @IsISO8601()
  hasta!: string;

  @ApiPropertyOptional({ enum: ['5m', '15m', '1h', '6h', '1d'], default: '1h' })
  @IsOptional()
  @IsIn(['5m', '15m', '1h', '6h', '1d'])
  bucket?: '5m' | '15m' | '1h' | '6h' | '1d';
}
