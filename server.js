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
  { nombre: "Iphone 16 Pro Max White Titanium r/8/256",  codigo: "Iphone_16_Pro_Max_white_titanium_256_8" },
  { nombre: "Iphone 13 Blanco r/4/128",                  codigo: "celular_iphone_13_blanco_r" },
  { nombre: "Iphone 16e Negro r/6/128",                  codigo: "iPhone_16e_128GB_negro_r" },
  { nombre: "Iphone 14 Midnight r/6/128",                codigo: "iphone_14_128gb_midnight_RA" }
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
        s.firmado,
        s.celular,
        s.keynua_id,
        s.slug,
        CONCAT(p.nombres, ' ', p.ape_pat, ' ', p.ape_mat) AS nombre_completo,
        p.celular AS persona_cel,
        prod.nombre AS producto_codigo,
        (SELECT COUNT(*) > 0 FROM documentacion d WHERE d.id_solicitud = s.id AND d.nombre LIKE '%Contrato%') AS formulario
      FROM solicitud s
      JOIN solicitante sol ON s.id_solicitante = sol.id
      JOIN persona p ON sol.id_persona = p.id
      JOIN categoria_producto_prestamo cpp ON s.id_categoria_producto_prestamo = cpp.id
      JOIN producto prod ON cpp.id_producto = prod.id
      WHERE prod.nombre IN (?)
        AND s.created_at >= '2025-07-14'
        AND p.nombres NOT LIKE '%Prueba%'
        AND p.ape_pat NOT LIKE '%Prueba%'
        AND (s.source IS NULL OR s.source NOT IN ('PruebaCash'))
        AND p.celular != 999999999
        AND p.documento != '70020010'
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
          formulario: row.formulario,
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
