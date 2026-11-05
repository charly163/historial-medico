# MediQuX

<p align="center">
  <img src=".github/logo.svg" width="88" alt="Logo de MediQuX" />
</p>

<h1 align="center">MediQuX</h1>

<p align="center">
  Un sistema autoalojado (self-hosted) de gestión de historias clínicas y registros médicos para individuos y familias.
</p>

<p align="center">
  <a href="https://www.gnu.org/licenses/agpl-3.0"><img src="https://img.shields.io/badge/Licencia-AGPL%20v3-blue.svg" alt="Licencia: AGPL v3" /></a>
  <a href="https://docker.com"><img src="https://img.shields.io/badge/Docker-Contenedorizado-blue" alt="Docker" /></a>
  <a href="https://postgresql.org"><img src="https://img.shields.io/badge/PostgreSQL-17-blue" alt="PostgreSQL" /></a>
</p>

Pacientes, médicos, turnos, recetas, análisis de laboratorio y estudios de diagnóstico, todo en un único lugar y ejecutándose enteramente en tu propia infraestructura.

> **Privacidad total:** Todos los datos permanecen bajo tu propio control. Sin dependencias de la nube externa, sin llamadas a APIs de terceros y sin telemetría ni rastreo.

<p align="center">
  <img src="screenshots/mediqux-walkthrough.gif" alt="Demostración de MediQuX" />
</p>

Puedes ver más capturas en [SCREENSHOTS.md](SCREENSHOTS.md).

---

## 🚀 Características Principales

- **Historial del paciente:** Datos de contacto, antecedentes y una vista integral de turnos, recetas médicas, análisis de laboratorio y estudios diagnósticos relacionados.
- **Profesionales e instituciones:** Gestión de médicos y centros de salud, vinculados directamente a las consultas y prescripciones correspondientes.
- **Turnos y consultas:** Registro de citas médicas, notas diagnósticas y seguimiento de tratamientos.
- **Recetas y medicamentos:** Control de medicamentos activos, dosis, indicaciones y estado por receta.
- **Informes de laboratorio:** Carga de documentos en PDF o ingreso manual de resultados comparados contra paneles de referencia predefinidos.
- **Estudios de diagnóstico:** Archivos de imágenes médicas y otros estudios vinculados al paciente, médico e institución.
- **Cuentas multi-paciente:** Un único inicio de sesión puede tener acceso a múltiples miembros de la familia.
- **Control de acceso basado en roles (RBAC):** Roles de Administrador y Usuario estándar. Los usuarios comunes solo acceden a los pacientes asignados, con validación tanto en lectura como en escritura.
- **Puerto único expuesto:** Caddy actúa como proxy inverso y gestiona las solicitudes a la API y archivos subidos de manera interna. Ningún otro servicio queda expuesto a internet.

---

## 🛠️ Stack Tecnológico

| Componente | Tecnologías |
|------------|-------------|
| **Backend** | Node.js, Express, PostgreSQL (vía `pg` y Sequelize) |
| **Frontend** | React, Vite, Tailwind CSS, TanStack Query, Radix UI, Lucide Icons |
| **Proxy inverso** | Caddy Server |
| **Despliegue** | Docker & Docker Compose |

---

## ⚡ Inicio Rápido (Docker)

### 1. Preparar el directorio y descargar archivos

```bash
mkdir mediqux && cd mediqux

# Descargar la configuración de Docker Compose y el archivo de entorno
curl -O https://raw.githubusercontent.com/charly163/historial-medico/main/docker-compose.yml
curl -o .env https://raw.githubusercontent.com/charly163/historial-medico/main/.env.example
```

### 2. Configurar variables de entorno

Edita el archivo `.env`. Como mínimo, define contraseñas seguras para la base de datos y JWT, y el puerto deseado:

```bash
POSTGRES_PASSWORD=tu_contraseña_segura_de_base_de_datos
JWT_SECRET=tu_clave_secreta_jwt_muy_larga_y_segura
APP_PORT=8080
```

### 3. Iniciar el sistema

```bash
docker compose up -d
```

Abre tu navegador en `http://localhost:8080` (o la IP de tu servidor). En el primer inicio verás la pantalla de configuración inicial para crear la **cuenta de Administrador**. Las cuentas adicionales se crean posteriormente desde el panel de Usuarios por el administrador.

---

## 💻 Entorno de Desarrollo Local

Si deseas clonar el repositorio y trabajar en el código:

```bash
# Clonar el repositorio
git clone https://github.com/charly163/historial-medico.git
cd historial-medico

# Copiar el archivo de entorno de ejemplo
cp .env.example .env

# Levantar con docker-compose de desarrollo
docker compose -f docker-compose.dev.yml up -d
```

O si ejecutas localmente con Node.js en Windows:
- Puedes usar los scripts auxiliares incluidos:
  - `./setup-db.ps1`: Configura la base de datos inicial.
  - `./start-dev.ps1`: Inicia backend y frontend en paralelo.

---

## ⚙️ Configuración (`.env`)

Todas las opciones de configuración se definen en el archivo `.env`:

```bash
# Base de Datos
POSTGRES_DB=mediqux_db
POSTGRES_USER=mediqux_user
POSTGRES_PASSWORD=cambiar_por_una_contraseña_segura

# Seguridad y Autenticación
JWT_SECRET=cambiar_por_una_clave_secreta_larga_y_aleatoria

# Configuración de la Aplicación
APP_PORT=8080
MAX_FILE_SIZE=10MB
LOG_LEVEL=info   # opciones: error, warn, info, debug

# Permisos de archivos en Linux (opcional)
PUID=1000
PGID=1000
```

### Uso detrás de otro Proxy Inverso (Nginx, Traefik, Cloudflare Tunnel)

Si colocas otro proxy inverso delante de MediQuX, configura los saltos en la variable `TRUST_PROXY_HOPS`:

```bash
TRUST_PROXY_HOPS=2
```

Si usas el Caddy integrado directamente (predeterminado), déjalo sin definir.

---

## 🔧 Mantenimiento y Operaciones

### Ver registros (Logs)
```bash
docker compose logs -f backend
```

### Comprobación de estado (Health Check)
```bash
curl http://localhost:8080/api/health
```

### Copias de seguridad (Backup y Restauración)

**Crear una copia de seguridad:**
```bash
docker exec mediqux_postgres pg_dump -U mediqux_user mediqux_db > backup.sql
```

**Restaurar una copia de seguridad:**
```bash
docker exec -i mediqux_postgres psql -U mediqux_user mediqux_db < backup.sql
```

### Actualización a nuevas versiones
```bash
docker compose pull && docker compose up -d
```

---

## 📄 Licencia

Este proyecto está distribuido bajo la licencia [AGPL v3](https://www.gnu.org/licenses/agpl-3.0). Eres libre de usarlo, modificarlo y autoalojarlo libremente. Si ejecutas una versión modificada como un servicio de red, debes poner a disposición el código fuente de esa versión para sus usuarios bajo esta misma licencia.

---

## 🩺 Aviso de Responsabilidad

> Este software se proporciona "tal cual" (*as-is*) para fines personales y organizativos. Evalúa su conveniencia y realiza copias de seguridad periódicas antes de almacenar información clínica sensible.
