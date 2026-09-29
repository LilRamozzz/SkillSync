import { Router, Response } from 'express';
import { listCandidates } from '../config/db';
import { advisoryStats } from '../services/advisories';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/ranking — { top: TOP 10, me: posición del usuario (o null si no enseña nada), total }
router.get('/', async (req: AuthRequest, res: Response) => {
  const all = await listCandidates(0);
  const ranked = all
    .filter((c) => c.teach.length > 0)
    .map((c) => {
      const mine = c.teach.map((t) => t.toLowerCase());
      const interested = all.filter(
        (o) => o.user.id !== c.user.id && o.learn.some((l) => mine.includes(l.toLowerCase()))
      ).length;
      const s = advisoryStats(c.user.institutional_email);
      return {
        id: c.user.id,
        name: `${c.user.first_name} ${c.user.last_name}`,
        university: c.user.university_name,
        career: c.career,
        teach: c.teach,
        interested,
        given: s.given,
        rating: s.rating,
      };
    })
    .sort((a, b) => b.given - a.given || b.rating - a.rating || b.interested - a.interested || a.name.localeCompare(b.name))
    .map((r, i) => ({ position: i + 1, ...r }));

  res.json({
    top: ranked.slice(0, 10),
    me: ranked.find((r) => r.id === req.userId) || null,
    total: ranked.length,
  });
});

export default router;