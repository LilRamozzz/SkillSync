import { Router, Response } from 'express';
import { getProfileFull, updateProfile } from '../config/db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/profile — perfil propio completo
router.get('/', async (req: AuthRequest, res: Response) => {
  const p = await getProfileFull(req.userId!);
  if (!p) { res.status(404).json({ error: 'Perfil no encontrado' }); return; }
  res.json(p);
});

// PUT /api/profile { career, semester, bio, university_name? }
router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    const { career, semester, bio, university_name } = req.body || {};
    if (bio && String(bio).length > 500) {
      res.status(400).json({ error: 'La descripción no puede superar 500 caracteres' });
      return;
    }
    await updateProfile(req.userId!, {
      career: String(career || ''),
      semester: String(semester || ''),
      bio: String(bio || ''),
      university_name: university_name !== undefined ? String(university_name) : undefined,
    });
    const p = await getProfileFull(req.userId!);
    res.json(p);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar el perfil' });
  }
});

// GET /api/profile/:id — perfil público de otro estudiante
router.get('/:id', async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: 'ID inválido' }); return; }
  const p = await getProfileFull(id);
  if (!p) { res.status(404).json({ error: 'Estudiante no encontrado' }); return; }
  res.json(p);
});

export default router;
