import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CrearUsuarioDto {
  @ApiProperty({ example: 'Ana Pérez' })
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ example: 'ana@aqua.cl' })
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @ApiProperty({ example: 'Secreta2026!', minLength: 10, maxLength: 128, description: 'Mínimo 10 caracteres' })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @ApiProperty({ description: 'Rol asignado (nunca se toma del token)' })
  @IsUUID()
  rolId!: string;
}

export class ActualizarUsuarioDto extends PartialType(CrearUsuarioDto) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
