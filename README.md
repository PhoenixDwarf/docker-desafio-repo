# Aplicación CRUD con Express + PostgreSQL (Docker)

Instrucciones para levantar la aplicación con docker-compose, probar el CRUD y verificar persistencia.

1. Copiar `.env.example` a `.env` y ajustar si es necesario.
2. Levantar: `docker compose up --build -d`
3. Abrir `http://localhost:3000` para usar la interfaz.
4. Probar crear usuarios, luego `docker compose down` y `docker compose up -d` — los datos deben persistir.

Archivos importantes:
- `backend/` - servidor Express
- `public/` - frontend estático
- `init-db/` - script SQL para crear tabla
- `docker-compose.yml` - orquesta Postgres y backend
