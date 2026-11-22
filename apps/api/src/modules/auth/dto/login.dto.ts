import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

/**
 * Credenciales de inicio de sesión.
 *
 * A propósito no se valida formato ni longitud (correo, mínimo de 10
 * caracteres, etc.): esos errores revelarían la política de contraseñas y
 * darían respuestas distintas a "Credenciales inválidas". La política se
 * aplica al crear o cambiar la contraseña; aquí cualquier valor incorrecto
 * recibe el 401 genérico de AuthService.
 */
export class LoginDto {
  @ApiProperty({ example: 'admin@aqua.cl' })
  @IsString()
  email!: string;

  @ApiProperty({ example: 'AquaPlants2026!' })
  @IsString()
  password!: string;

  @ApiPropertyOptional({
    description: 'Extiende la sesión a 30 días (checkbox "Recuérdame")',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
