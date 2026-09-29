import { Router, Response } from 'express';
import { getProfileFull, listKnowledge, setUserKnowledge } from '../config/db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/knowledge — catálogo
router.get('/', async (_req: AuthRequest, res: Response) => {
  res.json(await listKnowledge());
});

// GET /api/knowledge/mine — mis conocimientos
router.get('/mine', async (req: AuthRequest, res: Response) => {
  const p = await getProfileFull(req.userId!);
  res.json({ teach: p?.teach || [], learn: p?.learn || [] });
});

// POST /api/knowledge { teach?: string[], learn?: string[] }
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { teach, learn } = req.body || {};
    let teachOut: string[] | undefined;
    let learnOut: string[] | undefined;
    if (teach !== undefined) {
      if (!Array.isArray(teach)) { res.status(400).json({ error: 'teach debe ser un arreglo' }); return; }
      teachOut = await setUserKnowledge(req.userId!, 'teach', teach.map(String));
    }
    if (learn !== undefined) {
      if (!Array.isArray(learn)) { res.status(400).json({ error: 'learn debe ser un arreglo' }); return; }
      learnOut = await setUserKnowledge(req.userId!, 'learn', learn.map(String));
    }
    const p = await getProfileFull(req.userId!);
    res.json({ teach: teachOut ?? p?.teach ?? [], learn: learnOut ?? p?.learn ?? [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar conocimientos' });
  }
});

export default router;
