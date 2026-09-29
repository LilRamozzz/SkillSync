import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import {
  createUser, findUserByEmail, findUserById, isValidInstitutionalEmail,
  markVerified, publicUser,
} from '../config/db';
import { signToken } from '../middleware/auth';

const router = Router();

function makeCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { first_name, last_name, institutional_email, password, confirm_password, university_name } = req.body || {};
    if (!first_name?.trim() || !last_name?.trim()) {
      res.status(400).json({ error: 'Nombre y apellido son obligatorios' });
      return;
    }
    const email = String(institutional_email || '').trim().toLowerCase();
    if (!email) { res.status(400).json({ error: 'El correo institucional es obligatorio' }); return; }
    if (!isValidInstitutionalEmail(email)) {
      res.status(400).json({ error: 'Formato de correo inválido. Ejemplo: nombre.apellido@universidad.edu.pe' });
      return;
    }
    if (!university_name?.trim()) { res.status(400).json({ error: 'La universidad es obligatoria' }); return; }
    if (!password || String(password).length < 8) {
      res.status(400).json({ error: 'La contraseña debe tener al menos 8 caracteres' });
      return;
    }
    if (password !== confirm_password) {
      res.status(400).json({ error: 'La confirmación de contraseña no coincide' });
      return;
    }
    const existing = await findUserByEmail(email);
    if (existing) { res.status(409).json({ error: 'Este correo institucional ya está registrado' }); return; }

    const password_hash = await bcrypt.hash(String(password), 10);
    const verification_code = makeCode();
    const user = await createUser({
      first_name: String(first_name).trim(),
      last_name: String(last_name).trim(),
      institutional_email: email,
      password_hash,
      university_name: String(university_name).trim(),
      verification_code,
    });

    // PROTOTIPO: devolvemos el código en la respuesta para simular el envío
    // al correo institucional. En producción este endpoint delegaría a un
    // servicio real de verificación (SendGrid/SES) — ver services/verification.
    res.status(201).json({
      user: publicUser(user),
      // Solo prototipo:
      verification_code,
      message: 'Registro exitoso. Verifica tu correo institucional.',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al registrar' });
  }
});

// POST /api/auth/verify { email, code }
router.post('/verify', async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const code = String(req.body?.code || '').trim();
    if (!email || !code) { res.status(400).json({ error: 'Correo y código son obligatorios' }); return; }
    const user = await findUserByEmail(email);
    if (!user) { res.status(404).json({ error: 'Cuenta no encontrada' }); return; }
    if (user.is_verified === 1) {
      res.json({ user: publicUser({ ...user, is_verified: 1 }), token: signToken(user.id) });
      return;
    }
    if (user.verification_code !== code) {
      res.status(400).json({ error: 'Código incorrecto. Revisa tu correo institucional (o usa el código mostrado en el prototipo).' });
      return;
    }
    await markVerified(user.id);
    const fresh = await findUserById(user.id);
    res.json({
      user: publicUser(fresh!),
      token: signToken(user.id),
      message: 'Correo institucional verificado',
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al verificar' });
  }
});

// POST /api/auth/login { email, password }
router.post('/login', async (req: Request, res: Response) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const password = String(req.body?.password || '');
    if (!email || !password) { res.status(400).json({ error: 'Correo y contraseña son obligatorios' }); return; }
    const user = await findUserByEmail(email);
    if (!user) { res.status(401).json({ error: 'Credenciales inválidas' }); return; }
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) { res.status(401).json({ error: 'Credenciales inválidas' }); return; }
    res.json({ user: publicUser(user), token: signToken(user.id) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

export default router;
