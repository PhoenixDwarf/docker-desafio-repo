const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "db",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "postgres",
  port: process.env.POSTGRES_PORT ? parseInt(process.env.POSTGRES_PORT) : 5432,
});

app.use(express.static("public"));

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

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
