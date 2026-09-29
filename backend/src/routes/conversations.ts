import { Router, Response } from 'express';
import { isParticipant, listConversations, listMessages, postMessage } from '../config/db';
import { AuthRequest, requireAuth } from '../middleware/auth';

const router = Router();
router.use(requireAuth);

// GET /api/conversations
router.get('/', async (req: AuthRequest, res: Response) => {
  res.json(await listConversations(req.userId!));
});

// GET /api/conversations/:id/messages
router.get('/:id/messages', async (req: AuthRequest, res: Response) => {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: 'ID inválido' }); return; }
  if (!(await isParticipant(id, req.userId!))) {
    res.status(403).json({ error: 'No participas en esta conversación' });
    return;
  }
  res.json(await listMessages(id));
});

// POST /api/conversations/:id/messages { body }
router.post('/:id/messages', async (req: AuthRequest, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) { res.status(400).json({ error: 'ID inválido' }); return; }
    if (!(await isParticipant(id, req.userId!))) {
      res.status(403).json({ error: 'No participas en esta conversación' });
      return;
    }
    const msg = await postMessage(id, req.userId!, String(req.body?.body || ''));
    res.status(201).json(msg);
  } catch (err) {
    res.status(400).json({ error: (err as Error).message });
  }
});

export default router;
