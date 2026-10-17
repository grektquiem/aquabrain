import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Paginación estándar (límite acotado para no agotar memoria). */
export class PaginacionDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(200)
  porPagina = 20;

  get skip(): number {
    return (this.pagina - 1) * this.porPagina;
  }

  get take(): number {
    return this.porPagina;
  }
}
