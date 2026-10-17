-- ============================================================
-- AQUAPLANTS / AQUABRAIN — Esquema físico de referencia
-- ES2 · doc 05 (Modelo de datos) · PostgreSQL 15+
-- Archivo: docs/ES2/aquaplants_schema.sql
-- ============================================================
-- Convenciones (doc 05 §3):
--   * PK UUID en entidades de dominio (MC-04). La aplicación genera
--     UUID v7; en base de datos se usa gen_random_uuid() como respaldo.
--   * BIGINT + secuencia para tablas de alto volumen (medicion, auditoria).
--   * Enumeraciones como TYPE nativo (MC-05); NUMERIC para magnitudes (MC-06).
--   * medicion es APPEND-ONLY y está PARTICIONADA por rango de timestamp (MC-07).
-- Trazabilidad: MC-01…MC-09 · RN-01…RN-12 · RF01…RF15 · RNF01…RNF11.
-- ============================================================

-- Limpieza (solo desarrollo): descomenta para recrear desde cero.
-- DROP TABLE IF EXISTS medicion, medicion_idempotencia, estado_sensor_actual,
--   alerta, regla_alerta, evento, cultivo_sensor, sensor, tipo_variable,
--   dispositivo, planta, cultivo, sistema, auditoria, refresh_token, usuario,
--   rol_permiso, permiso, rol CASCADE;
-- DROP TYPE IF EXISTS estado_sistema, estado_cultivo, estado_planta,
--   estado_conexion, origen_dato, origen_medicion, calidad_medicion,
--   operador_regla, severidad, estado_alerta, tipo_alerta, tipo_evento CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()

-- ------------------------------------------------------------
-- 0) TIPOS ENUMERADOS (MC-05)
-- ------------------------------------------------------------
CREATE TYPE estado_sistema   AS ENUM ('ACTIVO','MANTENCION','INACTIVO');
CREATE TYPE estado_cultivo   AS ENUM ('ACTIVO','COSECHADO','CERRADO');
CREATE TYPE estado_planta    AS ENUM ('SANA','EN_RIESGO','RETIRADA');
CREATE TYPE estado_conexion  AS ENUM ('EN_LINEA','SIN_COMUNICACION','INACTIVO','DESCONOCIDO');
CREATE TYPE origen_dato      AS ENUM ('REAL','SIMULADO');
CREATE TYPE origen_medicion  AS ENUM ('ONLINE','OFFLINE','MANUAL');
CREATE TYPE calidad_medicion AS ENUM ('OK','SOSPECHOSA','ANULADA');
CREATE TYPE operador_regla   AS ENUM ('MAYOR_QUE','MENOR_QUE','FUERA_DE_RANGO','DENTRO_DE_RANGO','SIN_DATOS');
CREATE TYPE severidad        AS ENUM ('ALTA','MEDIA','BAJA','INFO');
CREATE TYPE estado_alerta    AS ENUM ('ACTIVA','RESUELTA');
CREATE TYPE tipo_alerta      AS ENUM ('UMBRAL','SIN_COMUNICACION','SINCRONIZACION','ERROR_DISPOSITIVO');
CREATE TYPE tipo_evento      AS ENUM ('SIN_COMUNICACION','RECONEXION','REINTENTO_SINCRONIZACION',
                                      'ERROR_SENSOR','CAMBIO_CONFIGURACION','DESPLIEGUE');

-- ============================================================
-- 1) SEGURIDAD Y USUARIOS  (doc 05 §3.1 · doc 06 §2–§3)
-- ============================================================
CREATE TABLE rol (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre       VARCHAR(50)  NOT NULL UNIQUE,
  descripcion  VARCHAR(200),
  creado_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE permiso (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo       VARCHAR(60) NOT NULL UNIQUE,   -- formato 'recurso:accion'
  descripcion  VARCHAR(200)
);

CREATE TABLE rol_permiso (
  rol_id      UUID NOT NULL REFERENCES rol(id)     ON DELETE CASCADE,
  permiso_id  UUID NOT NULL REFERENCES permiso(id) ON DELETE CASCADE,
  PRIMARY KEY (rol_id, permiso_id)
);

-- Un rol por usuario (doc 05 §3.1). Si más adelante se requiere N:M,
-- la extensión es una tabla usuario_rol y se conserva rol_id como rol primario.
CREATE TABLE usuario (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre             VARCHAR(120) NOT NULL,
  email              VARCHAR(180) NOT NULL,
  password_hash      VARCHAR(60)  NOT NULL,   -- bcrypt cost 12 (RNF01)
  rol_id             UUID NOT NULL REFERENCES rol(id) ON DELETE RESTRICT,
  activo             BOOLEAN NOT NULL DEFAULT TRUE,
  intentos_fallidos  SMALLINT NOT NULL DEFAULT 0 CHECK (intentos_fallidos >= 0),
  bloqueado_hasta    TIMESTAMPTZ,
  ultimo_acceso      TIMESTAMPTZ,
  creado_en          TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX uq_usuario_email ON usuario (lower(email));   -- I-09 · RF01

CREATE TABLE refresh_token (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usuario_id  UUID NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL UNIQUE,
  expira_en   TIMESTAMPTZ NOT NULL,
  revocado_en TIMESTAMPTZ,
  user_agent  VARCHAR(255),
  ip          INET,
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_token_expira ON refresh_token (expira_en);   -- I-11

CREATE TABLE auditoria (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  usuario_id     UUID REFERENCES usuario(id) ON DELETE SET NULL,
  accion         VARCHAR(40) NOT NULL,
  entidad        VARCHAR(40),
  entidad_id     VARCHAR(64),
  datos_antes    JSONB,
  datos_despues  JSONB,
  ip             INET,
  ocurrido_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_auditoria_ocurrido ON auditoria (ocurrido_en DESC);              -- I-10
CREATE INDEX idx_auditoria_usuario  ON auditoria (usuario_id, ocurrido_en DESC);

-- ============================================================
-- 1) DOMINIO: SISTEMAS, CULTIVOS, DISPOSITIVOS Y SENSORES
-- ============================================================
CREATE TABLE sistema (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          VARCHAR(30) NOT NULL UNIQUE,
  nombre          VARCHAR(120) NOT NULL,
  descripcion     VARCHAR(255),
  ubicacion       VARCHAR(80),
  latitud         NUMERIC(9,6) CHECK (latitud  BETWEEN  -90 AND  90),
  longitud        NUMERIC(9,6) CHECK (longitud BETWEEN -180 AND 180),
  estado          estado_sistema NOT NULL DEFAULT 'ACTIVO',
  creado_en       TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE cultivo (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sistema_id          UUID NOT NULL REFERENCES sistema(id) ON DELETE RESTRICT,
  nombre              VARCHAR(120) NOT NULL,
  especie             VARCHAR(80)  NOT NULL,
  variedad            VARCHAR(80),
  fecha_inicio        DATE NOT NULL,
  fecha_fin_estimada  DATE,
  estado              estado_cultivo NOT NULL DEFAULT 'ACTIVO',
  fotoperiodo_horas   NUMERIC(4,1) CHECK (fotoperiodo_horas BETWEEN 0 AND 24),
  creado_en           TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT cultivo_fechas_ok CHECK (fecha_fin_estimada IS NULL OR fecha_fin_estimada >= fecha_inicio)
);

CREATE TABLE planta (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cultivo_id  UUID NOT NULL REFERENCES cultivo(id) ON DELETE CASCADE,
  codigo      VARCHAR(30) NOT NULL,
  posicion    VARCHAR(30),
  estado      estado_planta NOT NULL DEFAULT 'SANA',
  creado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (cultivo_id, codigo)
);

CREATE TABLE dispositivo (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sistema_id             UUID NOT NULL REFERENCES sistema(id) ON DELETE RESTRICT,
  codigo                 VARCHAR(40) NOT NULL UNIQUE,
  modelo                 VARCHAR(60) NOT NULL DEFAULT 'AquaBrain',
  firmware               VARCHAR(30),
  intervalo_reporte_seg  INTEGER NOT NULL DEFAULT 300 CHECK (intervalo_reporte_seg > 0),
  api_key_hash           VARCHAR(255) NOT NULL,   -- bcrypt de la API key (RNF01)
  api_key_ultimos4       VARCHAR(4),
  estado_conexion        estado_conexion NOT NULL DEFAULT 'DESCONOCIDO',
  ultima_comunicacion    TIMESTAMPTZ,
  activo                 BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en              TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en         TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_dispositivo_sistema_estado ON dispositivo (sistema_id, estado_conexion);   -- I-08

CREATE TABLE tipo_variable (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo          VARCHAR(30) NOT NULL UNIQUE,
  nombre          VARCHAR(80) NOT NULL,
  unidad_defecto  VARCHAR(20) NOT NULL,
  origen_dato     origen_dato NOT NULL,   -- REAL (AHT10/HC-SR04) o SIMULADO (pH, caudal)
  valor_min       NUMERIC(12,4),
  valor_max       NUMERIC(12,4)
);

CREATE TABLE sensor (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id   UUID NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
  tipo_variable_id UUID NOT NULL REFERENCES tipo_variable(id) ON DELETE RESTRICT,
  codigo           VARCHAR(40) NOT NULL,
  nombre           VARCHAR(80) NOT NULL,
  unidad           VARCHAR(20) NOT NULL,
  rango_min        NUMERIC(12,4),
  rango_max        NUMERIC(12,4),
  ubicacion_fisica VARCHAR(80),
  activo           BOOLEAN NOT NULL DEFAULT TRUE,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dispositivo_id, codigo),
  CONSTRAINT sensor_rango_ok CHECK (rango_min IS NULL OR rango_max IS NULL OR rango_min < rango_max)
);

CREATE TABLE cultivo_sensor (
  cultivo_id  UUID NOT NULL REFERENCES cultivo(id) ON DELETE CASCADE,
  sensor_id   UUID NOT NULL REFERENCES sensor(id)  ON DELETE CASCADE,
  PRIMARY KEY (cultivo_id, sensor_id)
);

-- ============================================================
-- 3) MEDICIONES (append-only, PARTICIONADA — MC-07)
-- ============================================================
CREATE SEQUENCE medicion_id_seq AS BIGINT;

CREATE TABLE medicion (
  id               BIGINT NOT NULL DEFAULT nextval('medicion_id_seq'),
  sensor_id        UUID NOT NULL REFERENCES sensor(id) ON DELETE RESTRICT,
  dispositivo_id   UUID NOT NULL REFERENCES dispositivo(id) ON DELETE RESTRICT,   -- DN-01
  valor            NUMERIC(12,4),
  valor_texto      VARCHAR(120),
  unidad           VARCHAR(20) NOT NULL,           -- copiada del sensor (DN-02)
  timestamp        TIMESTAMPTZ NOT NULL,           -- hora de origen (RN-08/RN-10)
  recibido_en      TIMESTAMPTZ NOT NULL DEFAULT now(),
  origen           origen_medicion NOT NULL DEFAULT 'ONLINE',
  id_externo       VARCHAR(80),                    -- idempotencia (HU10)
  calidad          calidad_medicion NOT NULL DEFAULT 'OK',
  alerta_generada  BOOLEAN NOT NULL DEFAULT FALSE,
  payload_crudo_id VARCHAR(64),                    -- enlace al documento en MongoDB
  PRIMARY KEY (id, timestamp),                     -- la PK incluye la clave de partición
  CONSTRAINT medicion_valor_presente CHECK (valor IS NOT NULL OR valor_texto IS NOT NULL),
  CONSTRAINT medicion_no_futuro      CHECK (timestamp <= recibido_en + INTERVAL '5 minutes')  -- RN-09
) PARTITION BY RANGE (timestamp);

-- Particiones mensuales (el job las crea por adelantado — doc 05 §6)
CREATE TABLE medicion_2026_09 PARTITION OF medicion FOR VALUES FROM ('2026-09-01') TO ('2026-10-01');
CREATE TABLE medicion_2026_10 PARTITION OF medicion FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');
CREATE TABLE medicion_default  PARTITION OF medicion DEFAULT;

CREATE INDEX idx_medicion_sensor_ts      ON medicion (sensor_id, timestamp DESC);       -- I-01
CREATE INDEX idx_medicion_dispositivo_ts ON medicion (dispositivo_id, timestamp DESC);  -- I-02
CREATE INDEX idx_medicion_timestamp      ON medicion (timestamp);                       -- I-03

-- Idempotencia de reenvíos offline (MC-08). PostgreSQL exige que todo índice
-- único de una tabla particionada incluya la clave de partición; por eso la
-- unicidad (dispositivo_id, id_externo) vive en esta tabla de apoyo, que el
-- servicio de ingesta inserta en la MISMA transacción que la medición.
CREATE TABLE medicion_idempotencia (
  dispositivo_id UUID NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
  id_externo     VARCHAR(80) NOT NULL,
  medicion_id    BIGINT NOT NULL,
  timestamp      TIMESTAMPTZ NOT NULL,
  recibido_en    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (dispositivo_id, id_externo)
);

-- Estado actual por sensor (DN-05, I-12): la consulta más frecuente del dashboard.
-- La mantiene el servicio de ingesta dentro de la misma transacción.
CREATE TABLE estado_sensor_actual (
  sensor_id      UUID PRIMARY KEY REFERENCES sensor(id) ON DELETE CASCADE,
  dispositivo_id UUID NOT NULL REFERENCES dispositivo(id) ON DELETE CASCADE,
  valor          NUMERIC(12,4),
  valor_texto    VARCHAR(120),
  unidad         VARCHAR(20) NOT NULL,
  timestamp      TIMESTAMPTZ NOT NULL,
  actualizado_en TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 4) REGLAS, ALERTAS Y EVENTOS
-- ============================================================
CREATE TABLE regla_alerta (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sensor_id        UUID REFERENCES sensor(id) ON DELETE CASCADE,
  tipo_variable_id UUID REFERENCES tipo_variable(id) ON DELETE CASCADE,
  nombre           VARCHAR(120) NOT NULL,
  operador         operador_regla NOT NULL,
  umbral_min       NUMERIC(12,4),
  umbral_max       NUMERIC(12,4),
  severidad        severidad NOT NULL,
  cooldown_seg     INTEGER NOT NULL DEFAULT 900 CHECK (cooldown_seg >= 60),
  activa           BOOLEAN NOT NULL DEFAULT TRUE,
  creado_por       UUID NOT NULL REFERENCES usuario(id) ON DELETE RESTRICT,
  creado_en        TIMESTAMPTZ NOT NULL DEFAULT now(),
  actualizado_en   TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT regla_alerta_alcance CHECK (                    -- XOR (RN-07)
    (sensor_id IS NOT NULL AND tipo_variable_id IS NULL) OR
    (sensor_id IS NULL     AND tipo_variable_id IS NOT NULL)
  )
);
CREATE INDEX idx_regla_activa_sensor ON regla_alerta (activa, sensor_id);          -- I-07
CREATE INDEX idx_regla_activa_tipo   ON regla_alerta (activa, tipo_variable_id);   -- I-07

CREATE TABLE alerta (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regla_id               UUID REFERENCES regla_alerta(id) ON DELETE SET NULL,
  medicion_id            BIGINT,                       -- FK lógica → medicion(id); nula para SIN_DATOS
  sensor_id              UUID NOT NULL REFERENCES sensor(id) ON DELETE RESTRICT,
  sistema_id             UUID NOT NULL REFERENCES sistema(id) ON DELETE RESTRICT,   -- DN-03
  tipo                   tipo_alerta NOT NULL DEFAULT 'UMBRAL',
  severidad              severidad NOT NULL,
  estado                 estado_alerta NOT NULL DEFAULT 'ACTIVA',
  mensaje                VARCHAR(300) NOT NULL,
  valor_detectado        NUMERIC(12,4),                -- DN-04
  umbral_aplicado        VARCHAR(60),                  -- DN-04
  creada_en              TIMESTAMPTZ NOT NULL DEFAULT now(),
  resuelta_por           UUID REFERENCES usuario(id) ON DELETE SET NULL,
  resuelta_en            TIMESTAMPTZ,
  comentario_resolucion  TEXT
);
CREATE INDEX idx_alerta_estado ON alerta (estado, creada_en DESC);                 -- I-05
CREATE UNIQUE INDEX uq_alerta_activa ON alerta (regla_id, sensor_id)
  WHERE estado = 'ACTIVA';                                                          -- I-06 / RN-04

CREATE TABLE evento (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dispositivo_id UUID REFERENCES dispositivo(id) ON DELETE SET NULL,
  sistema_id     UUID NOT NULL REFERENCES sistema(id) ON DELETE RESTRICT,
  tipo           tipo_evento NOT NULL,
  severidad      severidad NOT NULL,
  descripcion    VARCHAR(300) NOT NULL,
  datos          JSONB,
  ocurrido_en    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_evento_ocurrido ON evento (ocurrido_en DESC);                     -- I-10

-- ============================================================
-- 5) DATOS INICIALES (seed mínimo — doc 05 §9)
-- ============================================================
INSERT INTO rol (nombre, descripcion) VALUES
  ('Administrador','Gestión completa de la plataforma'),
  ('Supervisor','Comparación entre sistemas y análisis de tendencias'),
  ('Encargado','Operación diaria del cultivo');

-- Catálogo de permisos = doc 06 §3.2
INSERT INTO permiso (codigo, descripcion) VALUES
  ('usuario:leer','Ver usuarios'),
  ('usuario:escribir','Crear, editar y desactivar usuarios'),
  ('rol:leer','Ver roles'),
  ('rol:asignar','Asignar roles'),
  ('sistema:leer','Ver sistemas/instalaciones'),
  ('sistema:escribir','Gestionar sistemas/instalaciones'),
  ('cultivo:leer','Ver cultivos'),
  ('cultivo:escribir','Gestionar cultivos'),
  ('dispositivo:leer','Ver dispositivos'),
  ('dispositivo:escribir','Gestionar dispositivos'),
  ('dispositivo:rotar_clave','Rotar credencial de dispositivo'),
  ('sensor:leer','Ver sensores'),
  ('sensor:escribir','Gestionar sensores'),
  ('medicion:leer','Consultar mediciones'),
  ('medicion:escribir','Enviar mediciones'),
  ('alerta:leer','Ver alertas'),
  ('alerta:resolver','Marcar alertas como resueltas'),
  ('regla:leer','Ver reglas de alerta'),
  ('regla:escribir','Gestionar reglas de alerta'),
  ('estado:leer','Ver estado de conexión'),
  ('auditoria:leer','Consultar auditoría');

-- Administrador: todos los permisos
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id FROM rol r CROSS JOIN permiso p WHERE r.nombre = 'Administrador';

-- Supervisor y Encargado: solo lectura + resolver alertas (doc 06 §3.3)
INSERT INTO rol_permiso (rol_id, permiso_id)
SELECT r.id, p.id
FROM rol r
JOIN permiso p ON p.codigo IN (
  'sistema:leer','cultivo:leer','dispositivo:leer','sensor:leer',
  'medicion:leer','alerta:leer','alerta:resolver','regla:leer','estado:leer')
WHERE r.nombre IN ('Supervisor','Encargado');

-- Usuarios (hashes de ejemplo: REEMPLAZAR por bcrypt real en el despliegue)
INSERT INTO usuario (nombre, email, password_hash, rol_id)
SELECT 'Administrador Demo','admin@aqua.cl',
       '$2b$12$REEMPLAZAR_CON_HASH_BCRYPT_REAL_000000000000000000000000', id
FROM rol WHERE nombre='Administrador';
INSERT INTO usuario (nombre, email, password_hash, rol_id)
SELECT 'Supervisor Demo','supervisor@aqua.cl',
       '$2b$12$REEMPLAZAR_CON_HASH_BCRYPT_REAL_000000000000000000000000', id
FROM rol WHERE nombre='Supervisor';
INSERT INTO usuario (nombre, email, password_hash, rol_id)
SELECT 'Encargado Demo','encargado@aqua.cl',
       '$2b$12$REEMPLAZAR_CON_HASH_BCRYPT_REAL_000000000000000000000000', id
FROM rol WHERE nombre='Encargado';

-- Catálogo de variables (doc 05 §3.3)
INSERT INTO tipo_variable (codigo, nombre, unidad_defecto, origen_dato) VALUES
  ('TEMPERATURA','Temperatura','°C','REAL'),
  ('HUMEDAD','Humedad relativa','%','REAL'),
  ('DISTANCIA','Nivel (distancia)','cm','REAL'),
  ('PH','pH','pH','SIMULADO'),
  ('CAUDAL','Caudal','L/min','SIMULADO');

-- 2 sistemas
INSERT INTO sistema (codigo, nombre, ubicacion, descripcion) VALUES
  ('INV-NORTE-01','Sistema Norte','Laboratorio INACAP','Sistema aeropónico de prueba'),
  ('INV-SUR-01','Sistema Sur','Invernadero de práctica','Sistema para comparación');

-- 3 cultivos
INSERT INTO cultivo (sistema_id, nombre, especie, variedad, fecha_inicio)
SELECT id,'Lechuga romana','Lactuca sativa','Romana',DATE '2026-03-01' FROM sistema WHERE codigo='INV-NORTE-01';
INSERT INTO cultivo (sistema_id, nombre, especie, variedad, fecha_inicio)
SELECT id,'Albahaca','Ocimum basilicum','Genovesa',DATE '2026-03-10' FROM sistema WHERE codigo='INV-NORTE-01';
INSERT INTO cultivo (sistema_id, nombre, especie, variedad, fecha_inicio)
SELECT id,'Lechuga romana','Lactuca sativa','Romana',DATE '2026-03-05' FROM sistema WHERE codigo='INV-SUR-01';

-- 2 dispositivos (uno por sistema)
INSERT INTO dispositivo (sistema_id, codigo, modelo, firmware, api_key_hash, api_key_ultimos4, estado_conexion, ultima_comunicacion)
SELECT id,'DEV-01','AquaBrain','1.4.2','$2b$12$REEMPLAZAR_CON_HASH_BCRYPT_REAL_000000000000000000000000','0001','EN_LINEA',now()
FROM sistema WHERE codigo='INV-NORTE-01';
INSERT INTO dispositivo (sistema_id, codigo, modelo, firmware, api_key_hash, api_key_ultimos4, estado_conexion, ultima_comunicacion)
SELECT id,'DEV-02','AquaBrain','1.4.2','$2b$12$REEMPLAZAR_CON_HASH_BCRYPT_REAL_000000000000000000000000','0002','EN_LINEA',now()
FROM sistema WHERE codigo='INV-SUR-01';

-- 10 sensores = 2 dispositivos × 5 variables
INSERT INTO sensor (dispositivo_id, tipo_variable_id, codigo, nombre, unidad, activo)
SELECT d.id, tv.id,
       upper(left(replace(tv.codigo,'_','-'), 9)) || '-' || right(d.codigo, 2),
       tv.nombre, tv.unidad_defecto, TRUE
FROM dispositivo d CROSS JOIN tipo_variable tv
ORDER BY d.codigo, tv.codigo;

-- 5 reglas de alerta sobre los sensores de DEV-01
WITH admin AS (SELECT id FROM usuario WHERE email='admin@aqua.cl')
INSERT INTO regla_alerta (sensor_id, nombre, operador, umbral_min, umbral_max, severidad, creado_por)
SELECT s.id, r.nombre, r.operador::operador_regla, r.umbral_min, r.umbral_max, r.severidad::severidad, admin.id
FROM (VALUES
  ('TEMPERATURA','Temperatura alta','MAYOR_QUE',      30.0, NULL, 'ALTA'),
  ('HUMEDAD',    'Humedad baja',    'MENOR_QUE',      40.0, NULL, 'MEDIA'),
  ('DISTANCIA',  'Nivel bajo',      'MENOR_QUE',      15.0, NULL, 'ALTA'),
  ('PH',         'pH fuera de rango','FUERA_DE_RANGO', 5.5,  6.5, 'INFO'),
  ('CAUDAL',     'Caudal bajo',     'MENOR_QUE',       0.5,  NULL,'MEDIA')
) AS r(tipo, nombre, operador, umbral_min, umbral_max, severidad)
JOIN tipo_variable tv ON tv.codigo = r.tipo
JOIN sensor s        ON s.tipo_variable_id = tv.id
JOIN dispositivo d   ON d.id = s.dispositivo_id AND d.codigo = 'DEV-01'
CROSS JOIN admin;

-- 30 días de mediciones sintéticas (1 por hora) para los sensores de temperatura
INSERT INTO medicion (sensor_id, dispositivo_id, valor, unidad, timestamp, origen)
SELECT s.id, s.dispositivo_id,
       round((20 + random()*6)::numeric, 2), s.unidad, g.ts, 'ONLINE'
FROM sensor s
JOIN tipo_variable tv ON tv.id = s.tipo_variable_id AND tv.codigo = 'TEMPERATURA'
CROSS JOIN LATERAL generate_series(now() - INTERVAL '30 days', now(), INTERVAL '1 hour') AS g(ts);

-- Puebla el estado actual a partir de la última medición (denormalización DN-05)
INSERT INTO estado_sensor_actual (sensor_id, dispositivo_id, valor, valor_texto, unidad, timestamp)
SELECT DISTINCT ON (sensor_id) sensor_id, dispositivo_id, valor, valor_texto, unidad, timestamp
FROM medicion
ORDER BY sensor_id, timestamp DESC
ON CONFLICT (sensor_id) DO UPDATE
  SET dispositivo_id = EXCLUDED.dispositivo_id,
      valor          = EXCLUDED.valor,
      valor_texto    = EXCLUDED.valor_texto,
      unidad         = EXCLUDED.unidad,
      timestamp      = EXCLUDED.timestamp,
      actualizado_en = now();

-- ------------------------------------------------------------
-- Verificación rápida (opcional)
-- ------------------------------------------------------------
-- SELECT 'roles', count(*) FROM rol
-- UNION ALL SELECT 'permisos', count(*) FROM permiso
-- UNION ALL SELECT 'sensores', count(*) FROM sensor
-- UNION ALL SELECT 'reglas', count(*) FROM regla_alerta
-- UNION ALL SELECT 'mediciones', count(*) FROM medicion;
