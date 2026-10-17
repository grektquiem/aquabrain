-- CreateEnum
CREATE TYPE "EstadoSistema" AS ENUM ('ACTIVO', 'MANTENCION', 'INACTIVO');

-- CreateEnum
CREATE TYPE "EstadoCultivo" AS ENUM ('ACTIVO', 'COSECHADO', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoPlanta" AS ENUM ('SANA', 'EN_RIESGO', 'RETIRADA');

-- CreateEnum
CREATE TYPE "EstadoConexion" AS ENUM ('EN_LINEA', 'SIN_COMUNICACION', 'INACTIVO', 'DESCONOCIDO');

-- CreateEnum
CREATE TYPE "OrigenDato" AS ENUM ('REAL', 'SIMULADO');

-- CreateEnum
CREATE TYPE "OrigenMedicion" AS ENUM ('ONLINE', 'OFFLINE', 'MANUAL');

-- CreateEnum
CREATE TYPE "CalidadMedicion" AS ENUM ('OK', 'SOSPECHOSA', 'ANULADA');

-- CreateEnum
CREATE TYPE "OperadorRegla" AS ENUM ('MAYOR_QUE', 'MENOR_QUE', 'FUERA_DE_RANGO', 'DENTRO_DE_RANGO', 'SIN_DATOS');

-- CreateEnum
CREATE TYPE "Severidad" AS ENUM ('ALTA', 'MEDIA', 'BAJA', 'INFO');

-- CreateEnum
CREATE TYPE "EstadoAlerta" AS ENUM ('ACTIVA', 'RESUELTA');

-- CreateEnum
CREATE TYPE "TipoAlerta" AS ENUM ('UMBRAL', 'SIN_COMUNICACION', 'SINCRONIZACION', 'ERROR_DISPOSITIVO');

-- CreateEnum
CREATE TYPE "TipoEvento" AS ENUM ('SIN_COMUNICACION', 'RECONEXION', 'REINTENTO_SINCRONIZACION', 'ERROR_SENSOR', 'CAMBIO_CONFIGURACION', 'DESPLIEGUE');

-- CreateTable
CREATE TABLE "rol" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(50) NOT NULL,
    "descripcion" VARCHAR(200),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "rol_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "permiso" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(60) NOT NULL,
    "descripcion" VARCHAR(200),

    CONSTRAINT "permiso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rol_permiso" (
    "rol_id" UUID NOT NULL,
    "permiso_id" UUID NOT NULL,

    CONSTRAINT "rol_permiso_pkey" PRIMARY KEY ("rol_id","permiso_id")
);

-- CreateTable
CREATE TABLE "usuario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "nombre" VARCHAR(120) NOT NULL,
    "email" VARCHAR(180) NOT NULL,
    "password_hash" VARCHAR(60) NOT NULL,
    "rol_id" UUID NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "intentos_fallidos" SMALLINT NOT NULL DEFAULT 0,
    "bloqueado_hasta" TIMESTAMPTZ(6),
    "ultimo_acceso" TIMESTAMPTZ(6),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usuario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_token" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "usuario_id" UUID NOT NULL,
    "token_hash" VARCHAR(255) NOT NULL,
    "expira_en" TIMESTAMPTZ(6) NOT NULL,
    "revocado_en" TIMESTAMPTZ(6),
    "user_agent" VARCHAR(255),
    "ip" INET,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "refresh_token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auditoria" (
    "id" BIGSERIAL NOT NULL,
    "usuario_id" UUID,
    "accion" VARCHAR(40) NOT NULL,
    "entidad" VARCHAR(40),
    "entidad_id" VARCHAR(64),
    "datos_antes" JSONB,
    "datos_despues" JSONB,
    "ip" INET,
    "ocurrido_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sistema" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "descripcion" VARCHAR(255),
    "ubicacion" VARCHAR(80),
    "latitud" DECIMAL(9,6),
    "longitud" DECIMAL(9,6),
    "estado" "EstadoSistema" NOT NULL DEFAULT 'ACTIVO',
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sistema_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cultivo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sistema_id" UUID NOT NULL,
    "nombre" VARCHAR(120) NOT NULL,
    "especie" VARCHAR(80) NOT NULL,
    "variedad" VARCHAR(80),
    "fecha_inicio" DATE NOT NULL,
    "fecha_fin_estimada" DATE,
    "estado" "EstadoCultivo" NOT NULL DEFAULT 'ACTIVO',
    "fotoperiodo_horas" DECIMAL(4,1),
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cultivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "cultivo_id" UUID NOT NULL,
    "codigo" VARCHAR(30) NOT NULL,
    "posicion" VARCHAR(30),
    "estado" "EstadoPlanta" NOT NULL DEFAULT 'SANA',
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "dispositivo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sistema_id" UUID NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "modelo" VARCHAR(60) NOT NULL DEFAULT 'AquaBrain',
    "firmware" VARCHAR(30),
    "intervalo_reporte_seg" INTEGER NOT NULL DEFAULT 300,
    "api_key_hash" VARCHAR(255) NOT NULL,
    "api_key_ultimos4" VARCHAR(4),
    "estado_conexion" "EstadoConexion" NOT NULL DEFAULT 'DESCONOCIDO',
    "ultima_comunicacion" TIMESTAMPTZ(6),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "dispositivo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tipo_variable" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "codigo" VARCHAR(30) NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "unidad_defecto" VARCHAR(20) NOT NULL,
    "origen_dato" "OrigenDato" NOT NULL,
    "valor_min" DECIMAL(12,4),
    "valor_max" DECIMAL(12,4),

    CONSTRAINT "tipo_variable_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sensor" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispositivo_id" UUID NOT NULL,
    "tipo_variable_id" UUID NOT NULL,
    "codigo" VARCHAR(40) NOT NULL,
    "nombre" VARCHAR(80) NOT NULL,
    "unidad" VARCHAR(20) NOT NULL,
    "rango_min" DECIMAL(12,4),
    "rango_max" DECIMAL(12,4),
    "ubicacion_fisica" VARCHAR(80),
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sensor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cultivo_sensor" (
    "cultivo_id" UUID NOT NULL,
    "sensor_id" UUID NOT NULL,

    CONSTRAINT "cultivo_sensor_pkey" PRIMARY KEY ("cultivo_id","sensor_id")
);

-- CreateTable
CREATE TABLE "medicion" (
    "id" BIGSERIAL NOT NULL,
    "sensor_id" UUID NOT NULL,
    "dispositivo_id" UUID NOT NULL,
    "valor" DECIMAL(12,4),
    "valor_texto" VARCHAR(120),
    "unidad" VARCHAR(20) NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "recibido_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "origen" "OrigenMedicion" NOT NULL DEFAULT 'ONLINE',
    "id_externo" VARCHAR(80),
    "calidad" "CalidadMedicion" NOT NULL DEFAULT 'OK',
    "alerta_generada" BOOLEAN NOT NULL DEFAULT false,
    "payload_crudo_id" VARCHAR(64),

    CONSTRAINT "medicion_pkey" PRIMARY KEY ("id","timestamp")
);

-- CreateTable
CREATE TABLE "medicion_idempotencia" (
    "dispositivo_id" UUID NOT NULL,
    "id_externo" VARCHAR(80) NOT NULL,
    "sensor_id" UUID NOT NULL,
    "recibido_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medicion_idempotencia_pkey" PRIMARY KEY ("dispositivo_id","id_externo")
);

-- CreateTable
CREATE TABLE "estado_sensor_actual" (
    "sensor_id" UUID NOT NULL,
    "dispositivo_id" UUID NOT NULL,
    "valor" DECIMAL(12,4),
    "valor_texto" VARCHAR(120),
    "unidad" VARCHAR(20) NOT NULL,
    "timestamp" TIMESTAMPTZ(6) NOT NULL,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "estado_sensor_actual_pkey" PRIMARY KEY ("sensor_id")
);

-- CreateTable
CREATE TABLE "regla_alerta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "sensor_id" UUID,
    "tipo_variable_id" UUID,
    "nombre" VARCHAR(120) NOT NULL,
    "operador" "OperadorRegla" NOT NULL,
    "umbral_min" DECIMAL(12,4),
    "umbral_max" DECIMAL(12,4),
    "severidad" "Severidad" NOT NULL,
    "cooldown_seg" INTEGER NOT NULL DEFAULT 900,
    "activa" BOOLEAN NOT NULL DEFAULT true,
    "creado_por" UUID NOT NULL,
    "creado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizado_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "regla_alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alerta" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "regla_id" UUID,
    "medicion_id" BIGINT,
    "sensor_id" UUID NOT NULL,
    "sistema_id" UUID NOT NULL,
    "tipo" "TipoAlerta" NOT NULL DEFAULT 'UMBRAL',
    "severidad" "Severidad" NOT NULL,
    "estado" "EstadoAlerta" NOT NULL DEFAULT 'ACTIVA',
    "mensaje" VARCHAR(300) NOT NULL,
    "valor_detectado" DECIMAL(12,4),
    "umbral_aplicado" VARCHAR(60),
    "creada_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resuelta_por" UUID,
    "resuelta_en" TIMESTAMPTZ(6),
    "comentario_resolucion" TEXT,

    CONSTRAINT "alerta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "dispositivo_id" UUID,
    "sistema_id" UUID NOT NULL,
    "tipo" "TipoEvento" NOT NULL,
    "severidad" "Severidad" NOT NULL,
    "descripcion" VARCHAR(300) NOT NULL,
    "datos" JSONB,
    "ocurrido_en" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evento_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rol_nombre_key" ON "rol"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "permiso_codigo_key" ON "permiso"("codigo");

-- CreateIndex
CREATE INDEX "usuario_rol_id_idx" ON "usuario"("rol_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_usuario_email" ON "usuario"("email");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_token_token_hash_key" ON "refresh_token"("token_hash");

-- CreateIndex
CREATE INDEX "idx_refresh_token_expira" ON "refresh_token"("expira_en");

-- CreateIndex
CREATE INDEX "idx_auditoria_ocurrido" ON "auditoria"("ocurrido_en" DESC);

-- CreateIndex
CREATE INDEX "idx_auditoria_usuario" ON "auditoria"("usuario_id", "ocurrido_en" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "sistema_codigo_key" ON "sistema"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "planta_cultivo_id_codigo_key" ON "planta"("cultivo_id", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "dispositivo_codigo_key" ON "dispositivo"("codigo");

-- CreateIndex
CREATE INDEX "idx_dispositivo_sistema_estado" ON "dispositivo"("sistema_id", "estado_conexion");

-- CreateIndex
CREATE UNIQUE INDEX "tipo_variable_codigo_key" ON "tipo_variable"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "sensor_dispositivo_id_codigo_key" ON "sensor"("dispositivo_id", "codigo");

-- CreateIndex
CREATE INDEX "idx_medicion_sensor_ts" ON "medicion"("sensor_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_medicion_dispositivo_ts" ON "medicion"("dispositivo_id", "timestamp" DESC);

-- CreateIndex
CREATE INDEX "idx_medicion_timestamp" ON "medicion"("timestamp");

-- CreateIndex
CREATE INDEX "idx_regla_activa_sensor" ON "regla_alerta"("activa", "sensor_id");

-- CreateIndex
CREATE INDEX "idx_regla_activa_tipo" ON "regla_alerta"("activa", "tipo_variable_id");

-- CreateIndex
CREATE INDEX "idx_alerta_estado" ON "alerta"("estado", "severidad", "creada_en" DESC);

-- CreateIndex
CREATE INDEX "alerta_sistema_id_estado_idx" ON "alerta"("sistema_id", "estado");

-- CreateIndex
CREATE INDEX "idx_evento_ocurrido" ON "evento"("ocurrido_en" DESC);

-- AddForeignKey
ALTER TABLE "rol_permiso" ADD CONSTRAINT "rol_permiso_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rol_permiso" ADD CONSTRAINT "rol_permiso_permiso_id_fkey" FOREIGN KEY ("permiso_id") REFERENCES "permiso"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usuario" ADD CONSTRAINT "usuario_rol_id_fkey" FOREIGN KEY ("rol_id") REFERENCES "rol"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_token" ADD CONSTRAINT "refresh_token_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "auditoria" ADD CONSTRAINT "auditoria_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cultivo" ADD CONSTRAINT "cultivo_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "planta" ADD CONSTRAINT "planta_cultivo_id_fkey" FOREIGN KEY ("cultivo_id") REFERENCES "cultivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "dispositivo" ADD CONSTRAINT "dispositivo_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor" ADD CONSTRAINT "sensor_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sensor" ADD CONSTRAINT "sensor_tipo_variable_id_fkey" FOREIGN KEY ("tipo_variable_id") REFERENCES "tipo_variable"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cultivo_sensor" ADD CONSTRAINT "cultivo_sensor_cultivo_id_fkey" FOREIGN KEY ("cultivo_id") REFERENCES "cultivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cultivo_sensor" ADD CONSTRAINT "cultivo_sensor_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicion" ADD CONSTRAINT "medicion_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicion" ADD CONSTRAINT "medicion_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicion_idempotencia" ADD CONSTRAINT "medicion_idempotencia_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "medicion_idempotencia" ADD CONSTRAINT "medicion_idempotencia_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_sensor_actual" ADD CONSTRAINT "estado_sensor_actual_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estado_sensor_actual" ADD CONSTRAINT "estado_sensor_actual_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_alerta" ADD CONSTRAINT "regla_alerta_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_alerta" ADD CONSTRAINT "regla_alerta_tipo_variable_id_fkey" FOREIGN KEY ("tipo_variable_id") REFERENCES "tipo_variable"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "regla_alerta" ADD CONSTRAINT "regla_alerta_creado_por_fkey" FOREIGN KEY ("creado_por") REFERENCES "usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_regla_id_fkey" FOREIGN KEY ("regla_id") REFERENCES "regla_alerta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_sensor_id_fkey" FOREIGN KEY ("sensor_id") REFERENCES "sensor"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alerta" ADD CONSTRAINT "alerta_resuelta_por_fkey" FOREIGN KEY ("resuelta_por") REFERENCES "usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_dispositivo_id_fkey" FOREIGN KEY ("dispositivo_id") REFERENCES "dispositivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evento" ADD CONSTRAINT "evento_sistema_id_fkey" FOREIGN KEY ("sistema_id") REFERENCES "sistema"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
