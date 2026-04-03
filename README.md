# Pago Nacional — Sistema de cambio de echeqs

Sistema web completo para la gestion de solicitudes de cambio de echeqs para camioneros.

---

## Stack

| Capa | Herramienta | Costo |
|---|---|---|
| Frontend + hosting | HTML/JS vanilla + Vercel | Gratis |
| Base de datos | Supabase (Postgres) | Gratis hasta 500MB |
| Imagenes DNI | Cloudinary | Gratis hasta 25GB |
| Emails | Resend | Gratis hasta 3.000 emails/mes |

---

## Estructura del proyecto

```
pago-nacional/
├── src/
│   ├── lib/
│   │   ├── supabase.js        # Cliente Supabase + todas las queries
│   │   ├── emails.js          # Emails con Resend (verificacion, confirmacion, admin)
│   │   └── exportExcel.js     # Exportacion a .xlsx con SheetJS
│   └── pages/
│       ├── registro.html      # Paso 1: registro del camionero
│       ├── solicitud.html     # Paso 2: carga del echeq
│       └── admin.html         # Panel de administracion
├── supabase/
│   └── schema.sql             # Esquema completo de la base de datos
├── .env.example               # Variables de entorno necesarias
└── package.json
```

---

## Setup paso a paso

### 1. Supabase

1. Crear cuenta en https://supabase.com
2. Crear nuevo proyecto
3. Ir a SQL Editor y ejecutar el contenido de `supabase/schema.sql`
4. En Project Settings > API, copiar:
   - Project URL -> `VITE_SUPABASE_URL`
   - anon public key -> `VITE_SUPABASE_ANON_KEY`

### 2. Cloudinary

1. Crear cuenta en https://cloudinary.com
2. En Settings > Upload, crear un Upload Preset:
   - Name: `pago_nacional_preset`
   - Signing Mode: Unsigned
   - Folder: `pago-nacional`
   - Transformations: quality auto, format auto (compresion automatica)
3. Copiar Cloud Name -> `VITE_CLOUDINARY_CLOUD_NAME`

### 3. Resend

1. Crear cuenta en https://resend.com
2. Verificar el dominio de tu cliente (o usar el dominio de prueba de Resend)
3. Crear API Key y configurarla como **`RESEND_API_KEY`** en Vercel (variable de servidor; **no** uses `VITE_*` — la API de Resend no admite llamadas desde el navegador por CORS).
4. El envío se hace desde **`/api/email`** (`api/email.js`). El remitente sale de **`RESEND_FROM_EMAIL`** en Vercel (opcional). Si no la definís, se usa `notificaciones@pagonacional.com.ar`, y **ese dominio tiene que estar verificado** en [Resend → Domains](https://resend.com/domains) (registrá los registros DNS que te indiquen). Para pruebas sin dominio propio podés usar `RESEND_FROM_EMAIL=onboarding@resend.dev` (con las limitaciones que indique Resend).
5. Para probar emails en local: `npx vercel dev` (incluye la función serverless). Con solo `npm run dev` no existe `/api/email`.

### 4. Variables de entorno

```bash
cp .env.example .env
# Completar todos los valores
```

### 5. Deploy en Vercel

```bash
npm install -g vercel
vercel
# Seguir los pasos del CLI
# Agregar las variables de entorno en el dashboard de Vercel
```

---

## Flujo del sistema

```
Camionero escribe por WhatsApp
        |
Bot responde con link: /registro.html
        |
Camionero completa: nombre, apellido, DNI, CUIT, celular, email, contrasena
        |
Sistema envia email de verificacion (Resend)
        |
Camionero hace click en el link -> cuenta verificada
        |
Camionero carga en /solicitud.html:
  - CBU/CVU
  - N° echeq, monto, banco, vencimiento
  - Foto DNI frente + dorso (sube a Cloudinary)
  - Acepta T&C
        |
Sistema guarda en Supabase + envia emails a camionero y admin
        |
Admin entra en /admin.html con usuario/contrasena
  - Ve todas las solicitudes con filtros y buscador
  - Ve N° echeq, monto, banco, datos del camionero, fotos DNI
  - Aprueba o rechaza cada solicitud
  - Exporta a Excel
```

---

## Panel admin

- URL: `/admin.html`
- Usuario: definido en `VITE_ADMIN_USER` (default: admin)
- Contrasena: definida en `VITE_ADMIN_PASS` (default: 123456)

Funcionalidades:
- Estadisticas: total, pendientes, aprobadas, rechazadas, monto total
- Tabla de solicitudes con: N° solicitud, N° echeq, camionero, DNI, monto, banco, vencimiento, estado, fecha
- Buscador por nombre, apellido, DNI, N° solicitud, N° echeq
- Filtros por estado y rango de fechas
- Modal de detalle con todos los datos y fotos del DNI
- Aprobar / rechazar solicitudes
- Exportar a Excel (solicitudes y camioneros)
- Tab de camioneros registrados

---

## Consideraciones de seguridad para produccion

1. Mover la logica de emails a una Supabase Edge Function para no exponer la API key de Resend en el frontend
2. Implementar autenticacion real con Supabase Auth en lugar de usuario/contrasena hardcodeado en el admin
3. Agregar rate limiting en el formulario de registro
4. Configurar CORS en Supabase para solo permitir el dominio de produccion
5. Usar tokens firmados para los links de verificacion de email


cuentas
Supabase: administracion@pagonacional.com - BuenosAires2026!
Vercel: administracion@pagonacional.com - BuenosAires2026!
