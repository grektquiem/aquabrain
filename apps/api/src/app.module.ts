import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './common/prisma/prisma.module';
import { AuditoriaInterceptor } from './common/interceptors/auditoria.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { PermisosGuard } from './common/guards/permisos.guard';
import { crearValidationPipe } from './common/pipes/validation.pipe';
import { validateEnv } from './config/env.validation';

import { AuthModule } from './modules/auth/auth.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { SistemasModule } from './modules/sistemas/sistemas.module';
import { CultivosModule } from './modules/cultivos/cultivos.module';
import { DispositivosModule } from './modules/dispositivos/dispositivos.module';
import { MedicionesModule } from './modules/mediciones/mediciones.module';
import { ReglasModule } from './modules/reglas/reglas.module';
import { AlertasModule } from './modules/alertas/alertas.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { AuditoriaModule } from './modules/auditoria/auditoria.module';
import { CatalogosModule } from './modules/catalogos/catalogos.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: ['.env'], validate: validateEnv, cache: true }),
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 300 }]),
    PrismaModule,
    AuthModule,
    UsuariosModule,
    SistemasModule,
    CultivosModule,
    DispositivosModule,
    MedicionesModule,
    ReglasModule,
    AlertasModule,
    DashboardModule,
    AuditoriaModule,
    CatalogosModule,
    HealthModule,
  ],
  providers: [
    // Orden de guardas: límite de tasa → autenticación → autorización por permiso.
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: PermisosGuard },
    { provide: APP_INTERCEPTOR, useClass: AuditoriaInterceptor },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    {
      provide: APP_PIPE,
      useValue: crearValidationPipe(),
    },
  ],
})
export class AppModule {}
