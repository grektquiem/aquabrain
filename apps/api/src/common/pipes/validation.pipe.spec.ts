import { ArgumentMetadata, BadRequestException, UnprocessableEntityException } from '@nestjs/common';
import { IsInt, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { crearValidationPipe } from './validation.pipe';

class DtoDePrueba {
  @IsString()
  @MinLength(3)
  @MaxLength(10)
  nombre!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  edad?: number;
}

const meta: ArgumentMetadata = { type: 'body', metatype: DtoDePrueba };

describe('Tubería de validación global (RNF01)', () => {
  const pipe = crearValidationPipe();

  it('acepta y transforma una entrada válida', async () => {
    const resultado = await pipe.transform({ nombre: 'Ana', edad: '34' }, meta);
    expect(resultado).toBeInstanceOf(DtoDePrueba);
    expect(resultado.edad).toBe(34);
  });

  // TS-22 · error de valor en un campo declarado → 400
  it('TS-22: un valor inválido produce 400 Bad Request', async () => {
    await expect(pipe.transform({ nombre: 'ab' }, meta)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('un tipo incorrecto produce 400 Bad Request', async () => {
    await expect(pipe.transform({ nombre: 'Valido', edad: 'no-es-numero' }, meta)).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  // TS-21 · campo desconocido → 422 y nada se persiste
  it('TS-21: un campo no declarado produce 422 Unprocessable Entity con el detalle', async () => {
    try {
      await pipe.transform({ nombre: 'Valido', intruso: 'x' }, meta);
      throw new Error('debió lanzar');
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      const respuesta = (error as UnprocessableEntityException).getResponse() as { campos: string[] };
      expect(respuesta.campos).toContain('intruso');
    }
  });

  it('elimina las propiedades no declaradas cuando no se prohíben (whitelist)', async () => {
    const permisiva = crearValidationPipe({ forbidNonWhitelisted: false });
    const resultado = await permisiva.transform({ nombre: 'Valido', intruso: 'x' }, meta);
    expect((resultado as unknown as Record<string, unknown>).intruso).toBeUndefined();
  });
});
