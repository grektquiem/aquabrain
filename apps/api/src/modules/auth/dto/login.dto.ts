import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'admin@aqua.cl' })
  @IsEmail()
  @MaxLength(180)
  email!: string;

  @ApiProperty({ example: 'AquaPlants2026!', minLength: 10 })
  @IsString()
  @MinLength(10)
  @MaxLength(128)
  password!: string;

  @ApiPropertyOptional({
    description: 'Extiende la sesión a 30 días (checkbox "Recuérdame")',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}