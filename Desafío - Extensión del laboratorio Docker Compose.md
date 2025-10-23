> Recomiendo enormemente abrir este documento desde visual studio code o cualquier editor que soporte markdown para una mejor experiencia de lectura.

> **URL del repositorio con la solución completa**:  
> [https://github.com/PhoenixDwarf/docker-desafio-repo.git](https://github.com/PhoenixDwarf/docker-desafio-repo.git)

**Objetivo**: Ampliar la API para incluir operaciones CRUD sobre una entidad simple (por ejemplo, usuarios) y conectar con una interfaz web básica.

## Parte 1: Agregar rutas CRUD en la API

**Entidad sugerida**: usuarios con campos id, nombre, email.

Tareas: 
- [Crear una tabla usuarios en PostgreSQL.](#crear-una-tabla-usuarios-en-postgresql)
- Agregar rutas en Express:
  - [GET /usuarios → listar todos.](#get-usuarios)
  - [POST /usuarios → crear uno.](#post-usuarios)
  - [PUT /usuarios/:id → actualizar.](#put-usuariosid)
  - [DELETE /usuarios/:id → eliminar.](#delete-usuariosid)

> **Tip extra**: Usar [body-parser](#body-parser) para manejar JSON en las peticiones.

## Parte 2: Conectar con una interfaz web

Opciones:

- [Crear una página HTML con fetch() para consumir la API.](#crear-una-página-html-con-fetch-para-consumir-la-api)
- [Usar una herramienta como Postman para probar las rutas.](#usar-una-herramienta-como-postman-para-probar-las-rutas)

Bonus:
- Mostrar los usuarios en una tabla HTML.
- Agregar formularios para crear y editar usuarios.

## Parte 3: Persistencia y reinicio

- [Usar volúmenes en PostgreSQL para mantener los datos.](#usar-volúmenes-en-postgresql-para-mantener-los-datos)
- [Probar que los datos persisten tras docker-compose down y up.](#probar-que-los-datos-persisten-tras-docker-compose-down-y-up)

## Parte 4: Documentar y presentar

- Documentar el código y los pasos.  
- Preparar una demo funcional.  
- [Reflexionar sobre cómo Docker Compose facilita la integración.](#reflexionar-sobre-cómo-docker-compose-facilita-la-integración)


## Solución:

### Crear una tabla usuarios en PostgreSQL.

```sql
CREATE TABLE usuarios (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE
);
```

### Agregar rutas en Express

```javascript
const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
```
### Body-parser

```javascript
app.use(bodyParser.json());
```

```javascript

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "db",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "postgres",
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
});

app.use(express.static("public"));
```

### GET /usuarios

```javascript
// GET /usuarios
app.get("/usuarios", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, nombre, email FROM usuarios ORDER BY id"
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener usuarios" });
  }
});
```

### POST /usuarios

```javascript
// POST /usuarios
app.post("/usuarios", async (req, res) => {
  const { nombre, email } = req.body;
  if (!nombre || !email)
    return res.status(400).json({ error: "nombre y email son requeridos" });
  try {
    const result = await pool.query(
      "INSERT INTO usuarios(nombre, email) VALUES($1, $2) RETURNING id, nombre, email",
      [nombre, email]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    if (err.code === "23505") {
      // unique_violation
      res.status(409).json({ error: "Email ya existe" });
    } else {
      res.status(500).json({ error: "Error al crear usuario" });
    }
  }
});
```

### PUT /usuarios/:id

```javascript
// PUT /usuarios/:id
app.put("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, email } = req.body;
  if (!nombre || !email)
    return res.status(400).json({ error: "nombre y email son requeridos" });
  try {
    const result = await pool.query(
      "UPDATE usuarios SET nombre=$1, email=$2 WHERE id=$3 RETURNING id, nombre, email",
      [nombre, email, id]
    );
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al actualizar usuario" });
  }
});
```

### DELETE /usuarios/:id

```javascript
// DELETE /usuarios/:id
app.delete("/usuarios/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query("DELETE FROM usuarios WHERE id=$1", [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "Usuario no encontrado" });
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al eliminar usuario" });
  }
});
```

```javascript
const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### Crear una página HTML con fetch() para consumir la API

```html
<!DOCTYPE html>
<html lang="es-LA">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Usuarios CRUD</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        margin: 20px;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      th,
      td {
        border: 1px solid #ccc;
        padding: 8px;
      }
      form {
        margin-bottom: 20px;
      }
    </style>
  </head>
  <body>
    <h1>Usuarios</h1>

    <form id="createForm">
      <h3>Crear usuario</h3>
      <input name="nombre" placeholder="Nombre" required />
      <input name="email" placeholder="Email" required />
      <button type="submit">Crear</button>
    </form>

    <table>
      <thead>
        <tr>
          <th>ID</th>
          <th>Nombre</th>
          <th>Email</th>
          <th>Acciones</th>
        </tr>
      </thead>
      <tbody id="usuariosBody"></tbody>
    </table>

    <template id="rowTpl">
      <tr>
        <td class="id"></td>
        <td class="nombre"></td>
        <td class="email"></td>
        <td>
          <button class="edit">Editar</button>
          <button class="delete">Eliminar</button>
        </td>
      </tr>
    </template>

    <script>
      const api = "/usuarios";

      async function fetchUsuarios() {
        const res = await fetch(api);
        const data = await res.json();
        const tbody = document.getElementById("usuariosBody");
        tbody.innerHTML = "";
        for (const u of data) {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td>${u.id}</td><td>${u.nombre}</td><td>${u.email}</td><td><button class="edit">Editar</button> <button class="delete">Eliminar</button></td>`;
          tr.querySelector(".delete").addEventListener("click", async () => {
            if (!confirm("Eliminar usuario?")) return;
            await fetch(`${api}/${u.id}`, { method: "DELETE" });
            fetchUsuarios();
          });
          tr.querySelector(".edit").addEventListener("click", () =>
            openEdit(u)
          );
          tbody.appendChild(tr);
        }
      }

      document
        .getElementById("createForm")
        .addEventListener("submit", async (e) => {
          e.preventDefault();
          const form = e.target;
          const nombre = form.nombre.value.trim();
          const email = form.email.value.trim();
          await fetch(api, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ nombre, email }),
          });
          form.reset();
          fetchUsuarios();
        });

      function openEdit(user) {
        const nombre = prompt("Nombre", user.nombre);
        if (nombre === null) return;
        const email = prompt("Email", user.email);
        if (email === null) return;
        fetch(`${api}/${user.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre, email }),
        }).then(() => fetchUsuarios());
      }

      fetchUsuarios();
    </script>
  </body>
</html>
```

### Usar una herramienta como Postman para probar las rutas.

- GET http://localhost:3000/usuarios

    ```json
    [
        {
            "id": 1,
            "nombre": "User A Updated",
            "email": "usera.updated@example.com"
        },
        {
            "id": 3,
            "nombre": "Edwin Nemeguen",
            "email": "zedwinxfabian@gmail.com"
        }
    ]
    ```
- POST http://localhost:3000/usuarios

    Body:

    ```json
    {
        "nombre": "Edwin Prueba",
        "email": "email@prueba.com"
    }
    ```

    Response:

    ```json
    {
        "id": 5,
        "nombre": "Edwin Prueba",
        "email": "email@prueba.com"
    }
    ```

- PUT http://localhost:3000/usuarios/5

    ```json
    {
        "nombre": "Edwin Prueba Actualizado",
        "email": "email@prueba.com"
    }
    ```

    Response:

    ```json
    {
        "id": 5,
        "nombre": "Edwin Prueba Actualizado",
        "email": "email@prueba.com"
    }
    ```

- DELETE http://localhost:3000/usuarios/5

    Response: 204 No Content

### Usar volúmenes en PostgreSQL para mantener los datos.
En `docker-compose.yml`, asegúrate de tener un volumen para PostgreSQL:

```yaml
services:
  db:
    image: postgres:15
    env_file:
      - .env
    environment:
      - POSTGRES_USER=${POSTGRES_USER}
      - POSTGRES_PASSWORD=${POSTGRES_PASSWORD}
      - POSTGRES_DB=${POSTGRES_DB}
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./init-db:/docker-entrypoint-initdb.d:ro
    ports:
      - "5433:5432"

  app:
    build: ./backend
    env_file:
      - .env
    depends_on:
      - db
    ports:
      - "3000:3000"
    volumes:
      - ./public:/usr/src/app/public:ro

volumes:
  pgdata:
    name: postgres_data
```
### Probar que los datos persisten tras docker-compose down y up.
1. Levanta los servicios:

    ```bash
    docker compose up --build -d
    ```

    ```bash
    [+] Running 4/5
    ✔ app                                  Built     0s 
    ✔ Network docker-desafio-repo_default  Created   0.1s
    ✔ Volume "postgres_data"               Created   0.0s
    ⠹ Container docker-desafio-repo-db-1   Starting  0.4s
    ✔ Container docker-desafio-repo-app-1  Created   0.1s
    ```

    ```bash
    [+] Running 2/2
    ✔ Container docker-desafio-repo-app-1  Started   0.8s 
    ✔ Container docker-desafio-repo-db-1   Started   0.5s 
    ```
2. Crea algunos usuarios usando la interfaz web o Postman.
3. Detén los servicios:

    ```bash
    docker compose down
    ```

    ```bash
    [+] Running 3/3
    ✔ Container docker-desafio-repo-app-1  Removed  0.8s 
    ✔ Container docker-desafio-repo-db-1   Removed  0.3s 
    ✔ Network docker-desafio-repo_default  Removed  0.2s 
    ```
4. Levanta los servicios nuevamente:

    ```bash
    docker compose up -d
    ```

    ```bash
    [+] Running 3/3
    ✔ Network docker-desafio-repo_default  Created  0.1s 
    ✔ Container docker-desafio-repo-db-1   Started  0.6s 
    ✔ Container docker-desafio-repo-app-1  Started  0.7s
    ```
5. Verifica que los usuarios creados anteriormente persisten.

- GET http://localhost:3000/usuarios

    ```json
    [
        {
            "id": 1,
            "nombre": "User A Updated",
            "email": "usera.updated@example.com"
        },
        {
            "id": 3,
            "nombre": "Edwin Nemeguen",
            "email": "zedwinxfabian@gmail.com"
        },
        {
            "id": 4,
            "nombre": "Edwin",
            "email": "Prueba"
        }
    ]
    ```

### Reflexionar sobre cómo Docker Compose facilita la integración.

Docker Compose simplifica enormemente la gestión de aplicaciones multi-contenedor al permitir definir todos los servicios, redes y volúmenes en un solo archivo YAML. 

Esto facilita la configuración, el despliegue y la escalabilidad de la aplicación. Además, al usar volúmenes para la persistencia de datos, Docker Compose asegura que los datos importantes no se pierdan al reiniciar los contenedores, lo que es crucial para aplicaciones que manejan información crítica como bases de datos. 

En resumen, Docker Compose agiliza el desarrollo y la operación de aplicaciones complejas al proporcionar una forma coherente y reproducible de gestionar entornos de contenedores sin recurrir a configuraciones manuales tediosas.