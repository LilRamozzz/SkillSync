import { Router, Response } from 'express';
import { ensureConversation, getMatchesForUser, getProfileFull, listCandidates } from '../config/db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/matches — matches ordenados (bidireccionales primero)
router.get('/', async (req: AuthRequest, res: Response) => {
  res.json(await getMatchesForUser(req.userId!));
});

// POST /api/matches { user_id } — crea conversación con un match (conectar)
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const otherId = Number(req.body?.user_id);
    if (!Number.isInteger(otherId) || otherId <= 0) {
      res.status(400).json({ error: 'user_id inválido' });
      return;
    }
    if (otherId === req.userId) { res.status(400).json({ error: 'No puedes conectar contigo mismo' }); return; }
    const conversationId = await ensureConversation(req.userId!, otherId);
    res.status(201).json({ conversationId });
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

// GET /api/matches/discover?university=&career=&knowledge= — Descubrir con filtros opcionales
router.get('/discover', async (req: AuthRequest, res: Response) => {
  const { university, career, knowledge, name } = req.query as Record<string, string>;
  const all = await getMatchesForUser(req.userId!);
  // Incluir también candidatos con 0% si usan filtros (para explorar), marcados como unidireccionales
  let base = all;
  if (university || career || knowledge || name) {
    const me = await getProfileFull(req.userId!);
    const cands = await listCandidates(req.userId!);
    const { computeCompatibility } = await import('../config/db');
    base = cands
      .filter((c) => {
        if (name && !`${c.user.first_name} ${c.user.last_name}`.toLowerCase().includes(name.toLowerCase())) return false;
        if (university && !c.user.university_name.toLowerCase().includes(university.toLowerCase())) return false;
        if (career && !c.career.toLowerCase().includes(career.toLowerCase())) return false;
        if (knowledge) {
          const k = knowledge.toLowerCase();
          const has = [...c.teach, ...c.learn].some((x) => x.toLowerCase().includes(k));
          if (!has) return false;
        }
        return true;
      })
      .map((c) => {
        const r = computeCompatibility(me!.teach, me!.learn, c.teach, c.learn);
        return {
          user: {
            id: c.user.id, first_name: c.user.first_name, last_name: c.user.last_name,
            university_name: c.user.university_name, career: c.career,
          },
          teach: c.teach, learn: c.learn,
          youCanTeachThem: r.youCanTeachThem, theyCanTeachYou: r.theyCanTeachYou,
          compatibility: r.compatibility,
          bidirectional: r.youCanTeachThem.length > 0 && r.theyCanTeachYou.length > 0,
        };
      })
      .sort((a, b) => Number(b.bidirectional) - Number(a.bidirectional) || b.compatibility - a.compatibility);
  }
  res.json(base);
});

export default router;