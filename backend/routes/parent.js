const express = require('express');
const db = require('../db/database');
const { authenticateToken, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken, requireRole('parent'));

// List children linked to this parent
router.get('/children', async (req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, email, class, learning_style, created_at
       FROM users WHERE parent_id = $1 AND role = 'student'`,
      [req.user.id]
    );
    res.json({ children: result.rows });
  } catch (err) {
    console.error('Children fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

// Full progress detail for one child (must belong to this parent)
router.get('/children/:childId/progress', async (req, res) => {
  try {
    const childResult = await db.query(
      `SELECT id, name, class FROM users WHERE id = $1 AND parent_id = $2 AND role = 'student'`,
      [req.params.childId, req.user.id]
    );
    const child = childResult.rows[0];

    if (!child) {
      return res.status(404).json({ error: 'Child not found or not linked to this parent' });
    }

    const progressResult = await db.query('SELECT * FROM progress WHERE student_id = $1', [child.id]);
    const placementResult = await db.query(
      'SELECT * FROM placement_quiz_results WHERE student_id = $1 ORDER BY taken_at DESC',
      [child.id]
    );

    res.json({ child, progress: progressResult.rows, placementResults: placementResult.rows });
  } catch (err) {
    console.error('Child progress fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch child progress' });
  }
});

module.exports = router;
