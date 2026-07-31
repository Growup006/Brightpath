const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireRole('parent'));

// List children linked to this parent
router.get('/children', (req, res) => {
  const children = db.prepare(`
    SELECT id, name, email, class, learning_style, created_at
    FROM users WHERE parent_id = ? AND role = 'student'
  `).all(req.user.id);
  res.json({ children });
});

// Full progress detail for one child (must belong to this parent)
router.get('/children/:childId/progress', (req, res) => {
  const child = db.prepare(`
    SELECT id, name, class FROM users WHERE id = ? AND parent_id = ? AND role = 'student'
  `).get(req.params.childId, req.user.id);

  if (!child) {
    return res.status(404).json({ error: 'Child not found or not linked to this parent' });
  }

  const progress = db.prepare('SELECT * FROM progress WHERE student_id = ?').all(child.id);
  const placementResults = db.prepare(
    'SELECT * FROM placement_quiz_results WHERE student_id = ? ORDER BY taken_at DESC'
  ).all(child.id);

  res.json({ child, progress, placementResults });
});

module.exports = router;
