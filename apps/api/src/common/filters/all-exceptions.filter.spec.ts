import { ArgumentsHost, BadRequestException, ConflictException, ForbiddenException, HttpStatus, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AllExceptionsFilter } from './all-exceptions.filter';

function anfitrion(): { host: ArgumentsHost; estado: jest.Mock; json: jest.Mock } {
  const json = jest.fn();
  const estado = jest.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getResponse: () => ({ status: estado, json }),
      getRequest: () => ({ method: 'POST', url: '/api/v1/reglas' }),
    }),
  } as unknown as ArgumentsHost;
  return { host, estado, json };
}

describe('Filtro global de excepciones (EC-05, EC-07)', () => {
  const filtro = new AllExceptionsFilter();

  // TS-31 · error interno forzado
  it('TS-31: un error inesperado responde 500 genérico y sin stack trace', () => {
    const { host, estado, json } = anfitrion();
    filtro.catch(new Error('fallo de la base de datos con cadena de conexión secreta'), host);
    expect(estado).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    const cuerpo = json.mock.calls[0][0];
    expect(cuerpo.codigo).toBe('ERROR_INTERNO');
    expect(cuerpo.mensaje).toBe('Error interno del servidor');
    expect(JSON.stringify(cuerpo)).not.toMatch(/stack|conexión secreta|at Object/i);
  });

  it('traduce una excepción HTTP 404 con su código', () => {
    const { host, estado, json } = anfitrion();
    filtro.catch(new NotFoundException('No existe la regla'), host);
    expect(estado).toHaveBeenCalledWith(404);
    expect(json.mock.calls[0][0].codigo).toBe('NO_ENCONTRADO');
  });

  it('traduce 403 a PROHIBIDO sin filtrar detalles internos', () => {
    const { host, estado, json } = anfitrion();
    filtro.catch(new ForbiddenException('Permiso insuficiente'), host);
    expect(estado).toHaveBeenCalledWith(403);
    expect(json.mock.calls[0][0].codigo).toBe('PROHIBIDO');
  });

  it('traduce 400 a SOLICITUD_INVALIDA conservando el detalle de validación', () => {
    const { host, estado, json } = anfitrion();
    filtro.catch(new BadRequestException({ message: ['valor: debe ser un número'] }), host);
    expect(estado).toHaveBeenCalledWith(400);
    const cuerpo = json.mock.calls[0][0];
    expect(cuerpo.codigo).toBe('SOLICITUD_INVALIDA');
    expect(cuerpo.detalles).toEqual(['valor: debe ser un número']);
  });

  it('traduce el error de unicidad de Prisma a 409 DUPLICADO', () => {
    const { host, estado, json } = anfitrion();
    const error = new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
      code: 'P2002',
      clientVersion: '5.22.0',
    });
    filtro.catch(error, host);
    expect(estado).toHaveBeenCalledWith(409);
    expect(json.mock.calls[0][0].codigo).toBe('DUPLICADO');
  });

  it('traduce P2025 (registro inexistente) a 404 NO_ENCONTRADO', () => {
    const { host, estado, json } = anfitrion();
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.22.0',
    });
    filtro.catch(error, host);
    expect(estado).toHaveBeenCalledWith(404);
    expect(json.mock.calls[0][0].codigo).toBe('NO_ENCONTRADO');
  });

  it('un conflicto de unicidad lanzado por el servicio también es 409 DUPLICADO', () => {
    const { host, estado, json } = anfitrion();
    filtro.catch(new ConflictException('Ya existe un usuario con ese correo'), host);
    expect(estado).toHaveBeenCalledWith(409);
    expect(json.mock.calls[0][0].codigo).toBe('DUPLICADO');
  });

  it('un 422 con cuerpo de texto usa el código de solicitud inválida, no ERROR_INTERNO', () => {
    const { host, estado, json } = anfitrion();
    filtro.catch(new UnprocessableEntityException('Campo no declarado'), host);
    expect(estado).toHaveBeenCalledWith(422);
    expect(json.mock.calls[0][0].codigo).toBe('SOLICITUD_INVALIDA');
  });

  it('TS-30: un cuerpo sobredimensionado se traduce a 413 CARGA_EXCESIVA', () => {
    const { host, estado, json } = anfitrion();
    const error = Object.assign(new Error('request entity too large'), {
      type: 'entity.too.large',
      status: 413,
      statusCode: 413,
    });
    filtro.catch(error, host);
    expect(estado).toHaveBeenCalledWith(413);
    expect(json.mock.calls[0][0].codigo).toBe('CARGA_EXCESIVA');
    expect(json.mock.calls[0][0].mensaje).toMatch(/tamaño/i);
  });

  it('toda respuesta de error incluye ruta y sello de tiempo', () => {
    const { host, json } = anfitrion();
    filtro.catch(new NotFoundException(), host);
    const cuerpo = json.mock.calls[0][0];
    expect(cuerpo.ruta).toBe('/api/v1/reglas');
    expect(Number.isNaN(Date.parse(cuerpo.timestamp))).toBe(false);
  });
});
