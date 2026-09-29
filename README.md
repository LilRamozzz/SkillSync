# SkillSync — Prototipo académico funcional

Plataforma de intercambio de conocimientos entre estudiantes universitarios.

> “Encuentra estudiantes que necesitan lo que tú sabes y saben lo que tú necesitas aprender.”

MVP demostrable: registro → verificación institucional **simulada** → perfil académico →
conocimientos (enseño / quiero aprender) → matching → matches → mensajes.

## Arquitectura

```
React + TypeScript (frontend/)
        ↓  REST JSON (JWT)
Node.js + Express + TypeScript (backend/)
        ↓  mysql2 (con respaldo en memoria si MySQL no está disponible)
MySQL (database/schema.sql + seed.sql)
```

Capas backend: `routes/` (presentación HTTP) → `config/db.ts` (acceso a datos) →
`services/` (negocio: matching, verificación) → `middleware/` (JWT).

## Requisitos previos

- Node.js 18+ (probado con 16.15; se recomienda 18 o 20)
- npm
- MySQL 8 (opcional para el prototipo: si no hay MySQL, el backend usa
  almacenamiento en memoria con los mismos datos demo y la app funciona igual)

## 1. Configuración de MySQL (opcional pero recomendado)

```bash
mysql -u root -p < database/schema.sql
# Edita los hashes reales antes si usarás este archivo directamente,
# o deja que el seed del backend los genere:
mysql -u root -p < database/seed.sql
```

Estructura: `users`, `universities`, `profiles`, `knowledge`,
`user_teach_knowledge`, `user_learn_knowledge`, `matches`,
`conversations`, `messages`. Ver `database/schema.sql`.

## 2. Variables de entorno

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# Edita backend/.env (DB_*, JWT_SECRET, PORT) si usas MySQL real.
```

## 3. Backend

```bash
cd backend
npm install
npm run seed   # puebla demos en MySQL si existe; si no, informa modo memoria
npm run dev    # http://localhost:3001  (salud: GET /api/health)
```

## 4. Frontend

```bash
cd frontend
npm install
npm run dev    # http://localhost:5173
```

## 5. Usuarios de prueba (clave: `Password123`)

| Email | Enseña | Aprende |
|---|---|---|
| leonardo.ramos@utp.edu.pe | Java, Git, HTML | Estadística |
| carlos.mendoza@unmsm.edu.pe | Estadística, Excel | Java |
| andrea.torres@pucp.edu.pe | Python, Machine Learning | Git |
| miguel.quispe@upc.edu.pe | Redes, Packet Tracer | Programación Web |

Leonardo ↔ Carlos = 100% (intercambio bidireccional perfecto para la demo).

## 6. Flujo principal a verificar

1. Abrir `http://localhost:5173` → Crear cuenta con correo institucional
   (ej. `nombre.apellido@universidad.edu.pe`).
2. Ver el código de 6 dígitos (prototipo: se muestra en pantalla; en producción
   llegaría por email — ver `backend/src/services/verification.ts`).
3. Verificar → completar perfil (carrera, ciclo, bio, universidad).
4. Agregar “Puedo enseñar” y “Quiero aprender” (chips).
5. Ir a **Descubrir** → ver por qué existe cada match
   (“Tú puedes enseñarle X / Él puede enseñarte Y ↕”).
6. **Conectar** → se crea la conversación → **Mensajes** → enviar mensaje.

## 7. Endpoints principales

```
POST /api/auth/register   { first_name, last_name, institutional_email, password, confirm_password, university_name }
POST /api/auth/verify     { email, code }
POST /api/auth/login      { email, password }

GET  /api/profile         (propio, con teach/learn)
PUT  /api/profile         { career, semester, bio, university_name? }
GET  /api/profile/:id     (público)

GET  /api/knowledge       (catálogo)
GET  /api/knowledge/mine
POST /api/knowledge       { teach?: string[], learn?: string[] }

GET  /api/matches         (ordenados: bidireccionales primero)
GET  /api/matches/discover?university=&career=&knowledge=
POST /api/matches         { user_id }  → { conversationId }

GET  /api/conversations
GET  /api/conversations/:id/messages
POST /api/conversations/:id/messages  { body }
```

## 8. Algoritmo de matching (sin IA)

```
A→B = {lo que A enseña} ∩ {lo que B quiere aprender}
B→A = {lo que B enseña} ∩ {lo que A quiere aprender}

compatibilidad = (|A→B| + |B→A|) / (|Aprende_A| + |Aprende_B|) × 100
```

- 100% = intercambio total (ej. Leonardo ↔ Carlos).
- Parcial = coincidencia unidireccional (se muestra, sin destacar).
- 0% = no es match.
- El % es una **métrica técnica de coincidencia de conocimientos**, no una
  evaluación de la persona. Implementación: `computeCompatibility` en
  `backend/src/config/db.ts`.

## 9. Seguridad (mínimo del MVP)

- Contraseñas con bcrypt (`bcryptjs`, cost 10). Nunca en texto plano.
- JWT (`Bearer`) de 7 días; rutas privadas tras `requireAuth`.
- Validación de email/contraseña/duplicados; mensajes sin exponer hashes.
- Sin secretos hardcodeados (todo por `.env`).

## 10. Decisiones técnicas (MVP)

- **Sin MySQL también funciona**: `initDb()` intenta MySQL 3s; si falla,
  usa memoria con los mismos 4 demos. Paridad total de API. Para la
  presentación esto garantiza la demo; para producción se usa MySQL.
- **Verificación mock**: el código se devuelve en `/register` y se muestra
  en `/verificar`. Punto único de reemplazo: `services/verification.ts`.
- **CSS propio** en vez de Tailwind: menos dependencias, suficiente para el MVP.
- **`bcryptjs`** en vez de `bcrypt` nativo: evita compilación en la demo.

## 11. Lo que NO incluye (fuera de alcance)

IA generativa, videollamadas/voz, gamificación, pagos, ranking, likes,
seguidores, geolocalización, app nativa. Ver especificación del proyecto.
