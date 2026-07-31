const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Upsert progress after a quiz/practice/level attempt
router.post('/update', (req, res) => {
  try {
    const studentId = req.user.id;
    const { subject, chapter, topicKey, level, xp, score } = req.body;

    if (!subject || !chapter) {
      return res.status(400).json({ error: 'subject and chapter are required' });
    }

    const existing = db.prepare(`
      SELECT * FROM progress WHERE student_id = ? AND subject = ? AND chapter = ? AND topic_key IS ?
    `).get(studentId, subject, chapter, topicKey || null);

    if (existing) {
      db.prepare(`
        UPDATE progress
        SET level = ?, xp = xp + ?, best_score = MAX(best_score, ?),
            attempts = attempts + 1, last_attempt_at = datetime('now')
        WHERE id = ?
      `).run(level ?? existing.level, xp || 0, score || 0, existing.id);
    } else {
      db.prepare(`
        INSERT INTO progress (student_id, subject, chapter, topic_key, level, xp, best_score, attempts)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1)
      `).run(studentId, subject, chapter, topicKey || null, level || 1, xp || 0, score || 0);
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get all progress for the logged-in student
router.get('/me', (req, res) => {
  const rows = db.prepare('SELECT * FROM progress WHERE student_id = ?').all(req.user.id);
  res.json({ progress: rows });
});

// Save a placement quiz result
router.post('/placement-quiz', (req, res) => {
  try {
    const { subject, recommendedLevel, rawScore } = req.body;
    db.prepare(`
      INSERT INTO placement_quiz_results (student_id, subject, recommended_level, raw_score)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, subject, recommendedLevel, rawScore || 0);
    res.json({ success: true });
  } catch (err) {
    console.error('Placement quiz save error:', err);
    res.status(500).json({ error: 'Failed to save placement quiz result' });
  }
});

module.exports = router;
