import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ReportesService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerResumen() {
    // Hacemos las consultas en paralelo para que sea súper rápido
    const [
      totalSistemas,
      totalDispositivos,
      dispositivosEnLinea,
      alertasActivas,
      medicionesTotales,
      ultimasAlertas
    ] = await Promise.all([
      this.prisma.sistema.count(),
      this.prisma.dispositivo.count(),
      this.prisma.dispositivo.count({ where: { estadoConexion: 'EN_LINEA' } }),
      this.prisma.alerta.count({ where: { estado: 'ACTIVA' } }),
      this.prisma.medicion.count(),
      // Solo los campos que muestra el Informe. No se usa `include` porque traería
      // `medicionId` (BigInt), que JSON no sabe serializar y rompe la respuesta.
      this.prisma.alerta.findMany({
        take: 5,
        orderBy: { creadaEn: 'desc' },
        select: {
          id: true,
          creadaEn: true,
          severidad: true,
          mensaje: true,
          sensor: { select: { codigo: true } },
        },
      })
    ]);

    return {
      sistemas: totalSistemas,
      dispositivos: { total: totalDispositivos, enLinea: dispositivosEnLinea },
      alertas: { activas: alertasActivas },
      mediciones: { total: medicionesTotales },
      ultimasAlertas
    };
  }
}