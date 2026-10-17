import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

/**
 * El refresh viaja en cookie `httpOnly` para el dashboard; los clientes no
 * navegador (app Android, simulador, pruebas) pueden enviarlo en el cuerpo.
 */
export class RefreshDto {
  @ApiPropertyOptional({ description: 'Refresh token vigente (alternativo a la cookie)' })
  @IsOptional()
  @IsString()
  @MinLength(20)
  refreshToken?: string;
}
