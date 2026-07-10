require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const IPHONES = [
  { nombre: "Iphone 16 White r/6/128",                   codigo: "IPHONE 16 128GB GRADO A - WHITE - JM4P5X4H4T" },
  { nombre: "Iphone 16 Ultramarine r/6/128",             codigo: "IPHONE 16 128GB GRADO A - ULTRAMARINE - GPJFF4DRH9" },
  { nombre: "Iphone 16 Teal r/6/128",                    codigo: "IPHONE 16 128GB GRADO A - TEAL - L2Y6VRH3JL" },
  { nombre: "Iphone 15 Rosa r/6/128",                    codigo: "Iphone_15_Pink_6_128" },
  { nombre: "Iphone 15 Negro r/6/128",                   codigo: "Iphone_15_Negro_6_128" },
  { nombre: "Iphone 13 Midnight r/4/128",                codigo: "Iphone_13_Midnight_4_128" },
  { nombre: "Iphone 16 Pro Desert Titanium r/8/128",     codigo: "Iphone_16_Pro_Desert_Titanium_8_128" },
  { nombre: "Iphone 16 Pro Natural Titanium r/8/128",    codigo: "iphone_16_pro_128gb_grado_a_natural_titanium_C957X0YG3G" },
  { nombre: "Iphone 16 Pro Black Titanium r/8/128",      codigo: "Iphone_16_Pro_Black_Titanium_8_128" },
  { nombre: "Iphone 15 Pro Black Titanium r/8/128",      codigo: "Iphone_15_Pro_Black_Titanium_r_8_128" },
  { nombre: "Iphone 16 Pro Max Desert Titanium r/8/256", codigo: "Iphone_16_Pro_Max_Desert_Titanium_8_256" },
  { nombre: "Iphone 16 Pro Max Natural Titanium r/8/256",codigo: "Iphone_16_Pro_Max_Natural_Titanium_8_256" },
  { nombre: "Iphone 16 Pro Max Black Titanium r/8/256",  codigo: "Iphone_16_Pro_Max_Black_Titanium_r_8_256" },
  { nombre: "Iphone 16 Pro Max White Titanium r/8/256",  codigo: "Iphone_16_Pro_Max_white_titanium_256_8" }
];

let pool;

function getPool() {
  if (!pool) {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      user: process.env.DB_USER,
      password: process.env.DB_PASS,
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 10000,
    });
  }
  return pool;
}

app.get('/api/config', (_req, res) => {
  res.json({ iphones: IPHONES });
});

app.get('/api/solicitudes', async (_req, res) => {
  try {
    const db = getPool();
    const codigos = IPHONES.map(i => i.codigo);

    const [rows] = await db.query(`
      SELECT
        s.id,
        s.status,
        s.created_at,
        s.nota,
        s.firmado,
        s.celular,
        s.keynua_id,
        s.slug,
        CONCAT(p.nombres, ' ', p.ape_pat, ' ', p.ape_mat) AS nombre_completo,
        p.celular AS persona_cel,
        prod.nombre AS producto_codigo
      FROM solicitud s
      JOIN solicitante sol ON s.id_solicitante = sol.id
      JOIN persona p ON sol.id_persona = p.id
      JOIN categoria_producto_prestamo cpp ON s.id_categoria_producto_prestamo = cpp.id
      JOIN producto prod ON cpp.id_producto = prod.id
      WHERE prod.nombre IN (?)
        AND p.nombres NOT LIKE '%Prueba%'
        AND p.ape_pat NOT LIKE '%Prueba%'
        AND s.id NOT IN (67012,68608,68610,76722,108317,108318,108319,108320,108321,108322,108323,108324,108325,108326,108327,108328,109218,118569,118608,118625,118626)
      ORDER BY s.created_at DESC
    `, [codigos]);

    // Group by producto_codigo
    const grouped = {};
    for (const codigo of codigos) {
      grouped[codigo] = [];
    }
    for (const row of rows) {
      if (grouped[row.producto_codigo]) {
        grouped[row.producto_codigo].push({
          id: row.id,
          nombre: row.nombre_completo,
          celular: row.celular || row.persona_cel,
          status: row.status,
          nota: row.nota,
          firmado: row.firmado,
          keynua_id: row.keynua_id,
          slug: row.slug,
          created_at: row.created_at,
        });
      }
    }

    res.json(grouped);
  } catch (err) {
    console.error('DB Error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
