import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3001),
  jwtSecret: process.env.JWT_SECRET || 'dev-secret-change-me',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'skillsync',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
  },
};

// ---------- Tipos ----------
export interface UserRow {
  id: number;
  first_name: string;
  last_name: string;
  institutional_email: string;
  password_hash: string;
  university_name: string;
  university_id: number | null;
  is_verified: number; // 0/1 (MySQL TINYINT)
  verification_code: string | null;
  created_at?: string;
}

export interface KnowledgeRow {
  id: number;
  name: string;
  category: string;
}

export interface ProfileFull {
  user: Omit<UserRow, 'password_hash' | 'verification_code'>;
  career: string;
  semester: string;
  bio: string;
  teach: string[];
  learn: string[];
}

// ---------- Pool MySQL (opcional) ----------
export let pool: mysql.Pool | null = null;
export let useMySQL = false;

export async function initDb(): Promise<void> {
  try {
    pool = mysql.createPool({
      host: config.db.host,
      port: config.db.port,
      database: config.db.database,
      user: config.db.user,
      password: config.db.password,
      waitForConnections: true,
      connectionLimit: 5,
      connectTimeout: 3000,
    });
    const conn = await pool.getConnection();
    await conn.ping();
    conn.release();
    useMySQL = true;
    console.log('[db] Conectado a MySQL');
  } catch (err) {
    console.warn('[db] MySQL no disponible, usando almacenamiento en memoria para el prototipo.');
    console.warn('[db] Detalle:', (err as Error).message);
    console.warn('[db] Para usar MySQL: crea la BD con database/schema.sql y configura backend/.env');
    pool = null;
    useMySQL = false;
    seedMemory();
  }
}

// ============================================================
// Almacenamiento en memoria (fallback del prototipo)
// Misma forma que las tablas MySQL para paridad total.
// ============================================================
interface MemMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  body: string;
  created_at: string;
}
interface MemConversation {
  id: number;
  user_one_id: number;
  user_two_id: number;
  created_at: string;
}

const mem = {
  seq: { user: 1, knowledge: 1, conv: 1, msg: 1 },
  users: [] as UserRow[],
  profiles: new Map<number, { career: string; semester: string; bio: string }>(),
  knowledge: [] as KnowledgeRow[],
  teach: new Map<number, Set<number>>(), // userId -> knowledgeIds
  learn: new Map<number, Set<number>>(),
  conversations: [] as MemConversation[],
  messages: [] as MemMessage[],
};

function memKnowledgeByName(name: string): KnowledgeRow | undefined {
  return mem.knowledge.find((k) => k.name.toLowerCase() === name.toLowerCase());
}

export function memEnsureKnowledge(name: string): KnowledgeRow {
  const clean = name.trim();
  const found = memKnowledgeByName(clean);
  if (found) return found;
  const row: KnowledgeRow = { id: mem.seq.knowledge++, name: clean, category: 'General' };
  mem.knowledge.push(row);
  return row;
}

function seedMemory(): void {
  if (mem.users.length > 0) return;
  // hash bcryptjs de "Password123" (cost 10) — generado offline, válido para bcryptjs
  const hash = '$2a$10$7EqJtq98hPqEX7fNZaFWoO7sF9y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5Y5u';
  // NOTA: el hash de arriba es marcador; seed.ts lo regenera correctamente.
  // Para que el servidor dev funcione sin seed, generamos hashes en caliente abajo.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const bcrypt = require('bcryptjs');
  const realHash: string = bcrypt.hashSync('Password123', 10);

  const universities = [
    'Universidad Tecnológica del Perú (UTP)',
    'Universidad Nacional Mayor de San Marcos',
    'Pontificia Universidad Católica del Perú',
    'Universidad Peruana de Ciencias Aplicadas',
  ];
  void universities;
  void hash;

  const demo: Array<{
    first: string; last: string; email: string; uni: string;
    career: string; semester: string; bio: string;
    teach: string[]; learn: string[];
  }> = [
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

  const baseKnowledge = [
    'Java', 'Git', 'HTML', 'CSS', 'Programación Web',
    'Estadística', 'Excel', 'Python', 'Machine Learning',
    'Redes', 'Packet Tracer',
  ];
  baseKnowledge.forEach((n) => memEnsureKnowledge(n));

  for (const d of demo) {
    const id = mem.seq.user++;
    mem.users.push({
      id,
      first_name: d.first,
      last_name: d.last,
      institutional_email: d.email,
      password_hash: realHash,
      university_name: d.uni,
      university_id: null,
      is_verified: 1,
      verification_code: null,
    });
    mem.profiles.set(id, { career: d.career, semester: d.semester, bio: d.bio });
    mem.teach.set(id, new Set(d.teach.map((t) => memEnsureKnowledge(t).id)));
    mem.learn.set(id, new Set(d.learn.map((l) => memEnsureKnowledge(l).id)));
  }

  // Conversación ejemplo Leonardo(1) <-> Carlos(2)
  const conv: MemConversation = {
    id: mem.seq.conv++, user_one_id: 1, user_two_id: 2, created_at: new Date().toISOString(),
  };
  mem.conversations.push(conv);
  const seedMsgs: Array<[number, string]> = [
    [2, 'Hola, vi que sabes Java.'],
    [1, 'Sí, puedo ayudarte con Java.'],
    [2, 'Genial, yo puedo ayudarte con Estadística.'],
  ];
  for (const [sender, body] of seedMsgs) {
    mem.messages.push({
      id: mem.seq.msg++, conversation_id: conv.id, sender_id: sender, body,
      created_at: new Date().toISOString(),
    });
  }
  console.log('[db] Seed en memoria cargado (4 usuarios demo, clave: Password123)');
}

// ---------- Helpers públicos (dual MySQL / memoria) ----------

export function isValidInstitutionalEmail(email: string): boolean {
  // Prototipo: formato email válido + debe parecer institucional (.edu...).
  // NO se limita a un dominio único (multi-universidad).
  // Acepta .edu, .edu.pe, .ac.*, .edu.*, o cualquier dominio con punto.
  // La verificación real se simula con código (servicio reemplazable).
  const basic = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!basic.test(email)) return false;
  return true;
}

export function isEduLike(email: string): boolean {
  const domain = (email.split('@')[1] || '').toLowerCase();
  return (
    domain.includes('.edu') ||
    domain.includes('.ac.') ||
    domain.endsWith('.ac') ||
    domain.includes('universidad') ||
    domain.includes('uni')
  );
}

export async function findUserByEmail(email: string): Promise<UserRow | null> {
  const normalized = email.trim().toLowerCase();
  if (useMySQL && pool) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM users WHERE institutional_email = ? LIMIT 1', [normalized]);
    return (rows[0] as unknown as UserRow) || null;
  }
  return mem.users.find((u) => u.institutional_email.toLowerCase() === normalized) || null;
}

export async function findUserById(id: number): Promise<UserRow | null> {
  if (useMySQL && pool) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [id]);
    return (rows[0] as unknown as UserRow) || null;
  }
  return mem.users.find((u) => u.id === id) || null;
}

export async function createUser(data: {
  first_name: string; last_name: string; institutional_email: string;
  password_hash: string; university_name: string; verification_code: string;
}): Promise<UserRow> {
  if (useMySQL && pool) {
    const [result] = await pool.query<mysql.ResultSetHeader>(
      `INSERT INTO users (first_name, last_name, institutional_email, password_hash, university_name, is_verified, verification_code)
       VALUES (?, ?, ?, ?, ?, 0, ?)`,
      [data.first_name, data.last_name, data.institutional_email, data.password_hash, data.university_name, data.verification_code]);
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM users WHERE id = ? LIMIT 1', [result.insertId]);
    await pool.query('INSERT IGNORE INTO profiles (user_id, career, semester, bio) VALUES (?, ?, ?, ?)',
      [result.insertId, '', '', '']);
    return rows[0] as unknown as UserRow;
  }
  const id = mem.seq.user++;
  const row: UserRow = {
    id,
    first_name: data.first_name,
    last_name: data.last_name,
    institutional_email: data.institutional_email,
    password_hash: data.password_hash,
    university_name: data.university_name,
    university_id: null,
    is_verified: 0,
    verification_code: data.verification_code,
  };
  mem.users.push(row);
  mem.profiles.set(id, { career: '', semester: '', bio: '' });
  mem.teach.set(id, new Set());
  mem.learn.set(id, new Set());
  return row;
}

export async function markVerified(userId: number): Promise<void> {
  if (useMySQL && pool) {
    await pool.query('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?', [userId]);
    return;
  }
  const u = mem.users.find((x) => x.id === userId);
  if (u) { u.is_verified = 1; u.verification_code = null; }
}

export function publicUser(u: UserRow) {
  return {
    id: u.id,
    first_name: u.first_name,
    last_name: u.last_name,
    institutional_email: u.institutional_email,
    university_name: u.university_name,
    is_verified: u.is_verified === 1,
  };
}

async function teachNames(userId: number): Promise<string[]> {
  if (useMySQL && pool) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT k.name FROM user_teach_knowledge ut JOIN knowledge k ON k.id = ut.knowledge_id
       WHERE ut.user_id = ? ORDER BY k.name`, [userId]);
    return rows.map((r) => r.name as string);
  }
  const ids = mem.teach.get(userId) || new Set<number>();
  return mem.knowledge.filter((k) => ids.has(k.id)).map((k) => k.name).sort();
}

async function learnNames(userId: number): Promise<string[]> {
  if (useMySQL && pool) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT k.name FROM user_learn_knowledge ul JOIN knowledge k ON k.id = ul.knowledge_id
       WHERE ul.user_id = ? ORDER BY k.name`, [userId]);
    return rows.map((r) => r.name as string);
  }
  const ids = mem.learn.get(userId) || new Set<number>();
  return mem.knowledge.filter((k) => ids.has(k.id)).map((k) => k.name).sort();
}

export async function getProfileFull(userId: number): Promise<ProfileFull | null> {
  const u = await findUserById(userId);
  if (!u) return null;
  let career = '', semester = '', bio = '';
  if (useMySQL && pool) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT * FROM profiles WHERE user_id = ? LIMIT 1', [userId]);
    if (rows[0]) { career = rows[0].career || ''; semester = rows[0].semester || ''; bio = rows[0].bio || ''; }
  } else {
    const p = mem.profiles.get(userId);
    if (p) { career = p.career; semester = p.semester; bio = p.bio; }
  }
  const teach = await teachNames(userId);
  const learn = await learnNames(userId);
  const { password_hash: _ph, verification_code: _vc, ...rest } = u;
  return {
    user: { ...rest, is_verified: u.is_verified },
    career, semester, bio, teach, learn,
  };
}

export async function updateProfile(
  userId: number, data: { career: string; semester: string; bio: string; university_name?: string }
): Promise<void> {
  if (useMySQL && pool) {
    await pool.query(
      `INSERT INTO profiles (user_id, career, semester, bio) VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE career = VALUES(career), semester = VALUES(semester), bio = VALUES(bio)`,
      [userId, data.career || '', data.semester || '', data.bio || '']);
    if (data.university_name !== undefined) {
      await pool.query('UPDATE users SET university_name = ? WHERE id = ?', [data.university_name, userId]);
    }
    return;
  }
  mem.profiles.set(userId, {
    career: data.career || '', semester: data.semester || '', bio: data.bio || '',
  });
  if (data.university_name !== undefined) {
    const u = mem.users.find((x) => x.id === userId);
    if (u) u.university_name = data.university_name;
  }
}

export async function listKnowledge(): Promise<KnowledgeRow[]> {
  if (useMySQL && pool) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT id, name, category FROM knowledge ORDER BY name');
    return rows as unknown as KnowledgeRow[];
  }
  return [...mem.knowledge].sort((a, b) => a.name.localeCompare(b.name));
}

export async function ensureKnowledge(name: string): Promise<KnowledgeRow> {
  const clean = name.trim();
  if (!clean) throw new Error('Nombre de conocimiento vacío');
  if (useMySQL && pool) {
    await pool.query('INSERT IGNORE INTO knowledge (name, category) VALUES (?, ?)', [clean, 'General']);
    const [rows] = await pool.query<mysql.RowDataPacket[]>('SELECT id, name, category FROM knowledge WHERE name = ? LIMIT 1', [clean]);
    return rows[0] as unknown as KnowledgeRow;
  }
  return memEnsureKnowledge(clean);
}

export async function setUserKnowledge(
  userId: number, kind: 'teach' | 'learn', names: string[]
): Promise<string[]> {
  const clean = [...new Set(names.map((n) => n.trim()).filter(Boolean))].slice(0, 30);
  const ids: number[] = [];
  for (const n of clean) ids.push((await ensureKnowledge(n)).id);

  if (useMySQL && pool) {
    const table = kind === 'teach' ? 'user_teach_knowledge' : 'user_learn_knowledge';
    await pool.query(`DELETE FROM ${table} WHERE user_id = ?`, [userId]);
    for (const kid of ids) {
      await pool.query(`INSERT IGNORE INTO ${table} (user_id, knowledge_id) VALUES (?, ?)`, [userId, kid]);
    }
  } else {
    const map = kind === 'teach' ? mem.teach : mem.learn;
    map.set(userId, new Set(ids));
  }
  return kind === 'teach' ? teachNames(userId) : learnNames(userId);
}

export interface MatchView {
  user: { id: number; first_name: string; last_name: string; university_name: string; career: string };
  teach: string[];
  learn: string[];
  youCanTeachThem: string[];
  theyCanTeachYou: string[];
  compatibility: number;
  bidirectional: boolean;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Métrica técnica de coincidencia (NO evalúa a la persona).
 *  compatibility = (|Aenseña ∩ Baprende| + |Benseña ∩ Aaprende|) / (|Aprende| + |Baprende|) * 100
 */
export function computeCompatibility(
  teachA: string[], learnA: string[], teachB: string[], learnB: string[]
): { compatibility: number; youCanTeachThem: string[]; theyCanTeachYou: string[] } {
  const tA = new Set(teachA.map(norm));
  const lA = new Set(learnA.map(norm));
  const tB = new Set(teachB.map(norm));
  const lB = new Set(learnB.map(norm));
  const youCanTeachThem = teachA.filter((x) => lB.has(norm(x)));
  const theyCanTeachYou = teachB.filter((x) => lA.has(norm(x)));
  const denom = learnA.length + learnB.length;
  const compatibility = denom === 0 ? 0
    : Math.min(100, Math.round(((youCanTeachThem.length + theyCanTeachYou.length) / denom) * 100));
  return { compatibility, youCanTeachThem, theyCanTeachYou };
}

export async function listCandidates(excludeUserId: number): Promise<ProfileFull[]> {
  let ids: number[];
  if (useMySQL && pool) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT id FROM users WHERE id <> ? AND is_verified = 1 ORDER BY id', [excludeUserId]);
    ids = rows.map((r) => r.id as number);
  } else {
    ids = mem.users.filter((u) => u.id !== excludeUserId && u.is_verified === 1).map((u) => u.id);
  }
  const out: ProfileFull[] = [];
  for (const id of ids) {
    const p = await getProfileFull(id);
    if (p) out.push(p);
  }
  return out;
}

export async function getMatchesForUser(userId: number): Promise<MatchView[]> {
  const me = await getProfileFull(userId);
  if (!me) return [];
  const candidates = await listCandidates(userId);
  const matches: MatchView[] = [];
  for (const c of candidates) {
    const { compatibility, youCanTeachThem, theyCanTeachYou } = computeCompatibility(
      me.teach, me.learn, c.teach, c.learn);
    if (compatibility <= 0) continue;
    matches.push({
      user: {
        id: c.user.id, first_name: c.user.first_name, last_name: c.user.last_name,
        university_name: c.user.university_name, career: c.career,
      },
      teach: c.teach,
      learn: c.learn,
      youCanTeachThem,
      theyCanTeachYou,
      compatibility,
      bidirectional: youCanTeachThem.length > 0 && theyCanTeachYou.length > 0,
    });
  }
  // Bidireccionales primero, luego por compatibilidad
  matches.sort((a, b) =>
    Number(b.bidirectional) - Number(a.bidirectional) || b.compatibility - a.compatibility);
  return matches;
}

// ---------- Conversaciones / mensajes ----------
export interface ConversationView {
  id: number;
  other: { id: number; first_name: string; last_name: string; university_name: string; career: string };
  lastMessage: string | null;
}

function orderedPair(a: number, b: number): [number, number] {
  return a < b ? [a, b] : [b, a];
}

export async function ensureConversation(meId: number, otherId: number): Promise<number> {
  if (meId === otherId) throw new Error('No puedes conversar contigo mismo');
  const other = await findUserById(otherId);
  if (!other) throw new Error('Estudiante no encontrado');
  const [one, two] = orderedPair(meId, otherId);
  if (useMySQL && pool) {
    await pool.query('INSERT IGNORE INTO conversations (user_one_id, user_two_id) VALUES (?, ?)', [one, two]);
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT id FROM conversations WHERE user_one_id = ? AND user_two_id = ? LIMIT 1', [one, two]);
    return rows[0].id as number;
  }
  let conv = mem.conversations.find((c) => c.user_one_id === one && c.user_two_id === two);
  if (!conv) {
    conv = { id: mem.seq.conv++, user_one_id: one, user_two_id: two, created_at: new Date().toISOString() };
    mem.conversations.push(conv);
  }
  return conv.id;
}

export async function listConversations(meId: number): Promise<ConversationView[]> {
  if (useMySQL && pool) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT * FROM conversations WHERE user_one_id = ? OR user_two_id = ? ORDER BY id DESC', [meId, meId]);
    const out: ConversationView[] = [];
    for (const r of rows) {
      const otherId = r.user_one_id === meId ? r.user_two_id : r.user_one_id;
      const p = await getProfileFull(otherId);
      const [msg] = await pool.query<mysql.RowDataPacket[]>(
        'SELECT body FROM messages WHERE conversation_id = ? ORDER BY id DESC LIMIT 1', [r.id]);
      out.push({
        id: r.id as number,
        other: {
          id: otherId,
          first_name: p?.user.first_name || '?',
          last_name: p?.user.last_name || '',
          university_name: p?.user.university_name || '',
          career: p?.career || '',
        },
        lastMessage: (msg[0]?.body as string) || null,
      });
    }
    return out;
  }
  const convs = mem.conversations
    .filter((c) => c.user_one_id === meId || c.user_two_id === meId)
    .sort((a, b) => b.id - a.id);
  const out: ConversationView[] = [];
  for (const c of convs) {
    const otherId = c.user_one_id === meId ? c.user_two_id : c.user_one_id;
    const p = await getProfileFull(otherId);
    const last = [...mem.messages].filter((m) => m.conversation_id === c.id).pop();
    out.push({
      id: c.id,
      other: {
        id: otherId,
        first_name: p?.user.first_name || '?',
        last_name: p?.user.last_name || '',
        university_name: p?.user.university_name || '',
        career: p?.career || '',
      },
      lastMessage: last?.body || null,
    });
  }
  return out;
}

export async function isParticipant(conversationId: number, userId: number): Promise<boolean> {
  if (useMySQL && pool) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      'SELECT user_one_id, user_two_id FROM conversations WHERE id = ? LIMIT 1', [conversationId]);
    if (!rows[0]) return false;
    return rows[0].user_one_id === userId || rows[0].user_two_id === userId;
  }
  const c = mem.conversations.find((x) => x.id === conversationId);
  return !!c && (c.user_one_id === userId || c.user_two_id === userId);
}

export async function listMessages(conversationId: number) {
  if (useMySQL && pool) {
    const [rows] = await pool.query<mysql.RowDataPacket[]>(
      `SELECT m.id, m.sender_id, m.body, m.created_at, u.first_name, u.last_name
       FROM messages m JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = ? ORDER BY m.id ASC`, [conversationId]);
    return rows.map((r) => ({
      id: r.id as number,
      sender_id: r.sender_id as number,
      sender_name: `${r.first_name} ${r.last_name}`,
      body: r.body as string,
      created_at: r.created_at,
    }));
  }
  return mem.messages
    .filter((m) => m.conversation_id === conversationId)
    .sort((a, b) => a.id - b.id)
    .map((m) => {
      const s = mem.users.find((u) => u.id === m.sender_id);
      return {
        id: m.id, sender_id: m.sender_id,
        sender_name: s ? `${s.first_name} ${s.last_name}` : '?',
        body: m.body, created_at: m.created_at,
      };
    });
}

export async function postMessage(conversationId: number, senderId: number, body: string) {
  const clean = body.trim();
  if (!clean) throw new Error('Mensaje vacío');
  if (clean.length > 2000) throw new Error('Mensaje demasiado largo');
  if (useMySQL && pool) {
    const [result] = await pool.query<mysql.ResultSetHeader>(
      'INSERT INTO messages (conversation_id, sender_id, body) VALUES (?, ?, ?)',
      [conversationId, senderId, clean]);
    return { id: result.insertId, sender_id: senderId, body: clean };
  }
  const msg: MemMessage = {
    id: mem.seq.msg++, conversation_id: conversationId, sender_id: senderId,
    body: clean, created_at: new Date().toISOString(),
  };
  mem.messages.push(msg);
  return { id: msg.id, sender_id: senderId, body: clean };
}
