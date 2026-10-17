import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { EstadoCultivo } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from 'class-validator';

export class CrearCultivoDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  sistemaId!: string;

  @ApiProperty({ example: 'Lechuga romana A' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ example: 'Lactuca sativa' })
  @IsString()
  @MinLength(3)
  @MaxLength(80)
  especie!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(80)
  variedad?: string;

  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  fechaInicio!: string;

  @ApiPropertyOptional({ example: '2026-06-30' })
  @IsOptional()
  @IsDateString()
  fechaFinEstimada?: string;

  @ApiPropertyOptional({ enum: EstadoCultivo })
  @IsOptional()
  @IsEnum(EstadoCultivo)
  estado?: EstadoCultivo;

  @ApiPropertyOptional({ example: 16 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(24)
  fotoperiodoHoras?: number;
}

export class ActualizarCultivoDto extends PartialType(CrearCultivoDto) {}
