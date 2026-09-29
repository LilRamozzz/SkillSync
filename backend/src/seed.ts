/**
 * Seed del backend.
 * - Si hay MySQL disponible: crea/actualiza usuarios demo con hashes bcrypt reales
 *   y los conocimientos de ejemplo (idempotente).
 * - Si no hay MySQL: el modo memoria ya se auto-puebla en initDb().
 */
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

const cfg = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  database: process.env.DB_NAME || 'skillsync',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
};

const DEMO = [
  {
    first: 'Leonardo', last: 'Ramos', email: 'leonardo.ramos@utp.edu.pe',
    uni: 'Universidad Tecnológica del Perú (UTP)',
    career: 'Ingeniería Informática', semester: '5to ciclo',
    bio: 'Me gusta el desarrollo web y compartir lo que aprendo. Busco reforzar mi base de estadística.',
    teach: ['Java', 'Git', 'HTML'], learn: ['Estadística'],
  },
  {
    first: 'Carlos', last: 'Mendoza', email: 'carlos.mendoza@unmsm.edu.pe',
    uni: 'Universidad Nacional Mayor de San Marcos',
    career: 'Ingeniería de Sistemas', semester: '4to ciclo',
    bio: 'Disfruto los números y Excel. Quiero aprender Java para mis cursos de programación.',
    teach: ['Estadística', 'Excel'], learn: ['Java'],
  },
  {
    first: 'Andrea', last: 'Torres', email: 'andrea.torres@pucp.edu.pe',
    uni: 'Pontificia Universidad Católica del Perú',
    career: 'Ciencia de la Computación', semester: '6to ciclo',
    bio: 'Trabajo con Python y ML. Quiero dominar Git para colaborar mejor.',
    teach: ['Python', 'Machine Learning'], learn: ['Git'],
  },
  {
    first: 'Miguel', last: 'Quispe', email: 'miguel.quispe@upc.edu.pe',
    uni: 'Universidad Peruana de Ciencias Aplicadas',
    career: 'Ingeniería de Redes', semester: '3er ciclo',
    bio: 'Apasionado por redes con Packet Tracer. Quiero aprender programación web.',
    teach: ['Redes', 'Packet Tracer'], learn: ['Programación Web'],
  },
];

async function main(): Promise<void> {
  let conn: mysql.Connection;
  try {
    conn = await mysql.createConnection({ ...cfg, connectTimeout: 4000 });
    await conn.ping();
  } catch (err) {
    console.log('[seed] Sin MySQL: el modo memoria ya incluye los demos. Nada que hacer.');
    console.log('[seed] Detalle:', (err as Error).message);
    return;
  }

  const hash = await bcrypt.hash('Password123', 10);
  const knowledge = ['Java', 'Git', 'HTML', 'CSS', 'Programación Web', 'Estadística',
    'Excel', 'Python', 'Machine Learning', 'Redes', 'Packet Tracer'];
  for (const k of knowledge) {
    await conn.query('INSERT IGNORE INTO knowledge (name, category) VALUES (?, ?)', [k, 'General']);
  }

  for (const d of DEMO) {
    await conn.query(
      `INSERT INTO users (first_name, last_name, institutional_email, password_hash, university_name, is_verified)
       VALUES (?, ?, ?, ?, ?, 1)
       ON DUPLICATE KEY UPDATE first_name = VALUES(first_name), last_name = VALUES(last_name),
         password_hash = VALUES(password_hash), university_name = VALUES(university_name), is_verified = 1`,
      [d.first, d.last, d.email, hash, d.uni]);
    const [uRows] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM users WHERE institutional_email = ? LIMIT 1', [d.email]);
    const uid = uRows[0].id as number;
    await conn.query(
      `INSERT INTO profiles (user_id, career, semester, bio) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE career = VALUES(career), semester = VALUES(semester), bio = VALUES(bio)`,
      [uid, d.career, d.semester, d.bio]);

    const kid = async (name: string): Promise<number> => {
      const [r] = await conn.query<mysql.RowDataPacket[]>('SELECT id FROM knowledge WHERE name = ? LIMIT 1', [name]);
      return r[0].id as number;
    };
    await conn.query('DELETE FROM user_teach_knowledge WHERE user_id = ?', [uid]);
    await conn.query('DELETE FROM user_learn_knowledge WHERE user_id = ?', [uid]);
    for (const t of d.teach) {
      await conn.query('INSERT IGNORE INTO user_teach_knowledge (user_id, knowledge_id) VALUES (?, ?)', [uid, await kid(t)]);
    }
    for (const l of d.learn) {
      await conn.query('INSERT IGNORE INTO user_learn_knowledge (user_id, knowledge_id) VALUES (?, ?)', [uid, await kid(l)]);
    }
  }

  // Conversación ejemplo Leonardo <-> Carlos
  const [ids] = await conn.query<mysql.RowDataPacket[]>(
    `SELECT id, institutional_email FROM users WHERE institutional_email IN (?, ?)`,
    ['leonardo.ramos@utp.edu.pe', 'carlos.mendoza@unmsm.edu.pe']);
  if (ids.length === 2) {
    const [a, b] = [ids[0].id as number, ids[1].id as number].sort((x, y) => x - y);
    await conn.query('INSERT IGNORE INTO conversations (user_one_id, user_two_id) VALUES (?, ?)', [a, b]);
    const [c] = await conn.query<mysql.RowDataPacket[]>(
      'SELECT id FROM conversations WHERE user_one_id = ? AND user_two_id = ? LIMIT 1', [a, b]);
    const cid = c[0].id as number;
    const [n] = await conn.query<mysql.RowDataPacket[]>('SELECT COUNT(*) AS n FROM messages WHERE conversation_id = ?', [cid]);
    if ((n[0].n as number) === 0) {
      const leo = ids.find((r) => r.institutional_email === 'leonardo.ramos@utp.edu.pe')!.id as number;
      const car = ids.find((r) => r.institutional_email === 'carlos.mendoza@unmsm.edu.pe')!.id as number;
      await conn.query('INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)', [cid, car, 'Hola, vi que sabes Java.']);
      await conn.query('INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)', [cid, leo, 'Sí, puedo ayudarte con Java.']);
      await conn.query('INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)', [cid, car, 'Genial, yo puedo ayudarte con Estadística.']);
    }
  }

  await conn.end();
  console.log('[seed] Usuarios demo listos (clave: Password123).');
}

main().catch((e) => { console.error(e); process.exit(1); });
