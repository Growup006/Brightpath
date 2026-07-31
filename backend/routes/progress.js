const express = require('express');
const db = require('../db/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();
router.use(authenticateToken);

// Upsert progress after a quiz/practice/level attempt
router.post('/update', async (req, res) => {
  try {
    const studentId = req.user.id;
    const { subject, chapter, topicKey, level, xp, score } = req.body;

    if (!subject || !chapter) {
      return res.status(400).json({ error: 'subject and chapter are required' });
    }

    const existingResult = await db.query(
      `SELECT * FROM progress WHERE student_id = $1 AND subject = $2 AND chapter = $3 AND topic_key IS NOT DISTINCT FROM $4`,
      [studentId, subject, chapter, topicKey || null]
    );
    const existing = existingResult.rows[0];

    if (existing) {
      await db.query(
        `UPDATE progress
         SET level = $1, xp = xp + $2, best_score = GREATEST(best_score, $3),
             attempts = attempts + 1, last_attempt_at = NOW()
         WHERE id = $4`,
        [level ?? existing.level, xp || 0, score || 0, existing.id]
      );
    } else {
      await db.query(
        `INSERT INTO progress (student_id, subject, chapter, topic_key, level, xp, best_score, attempts)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 1)`,
        [studentId, subject, chapter, topicKey || null, level || 1, xp || 0, score || 0]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Progress update error:', err);
    res.status(500).json({ error: 'Failed to update progress' });
  }
});

// Get all progress for the logged-in student
router.get('/me', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM progress WHERE student_id = $1', [req.user.id]);
    res.json({ progress: result.rows });
  } catch (err) {
    console.error('Progress fetch error:', err);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// Save a placement quiz result
router.post('/placement-quiz', async (req, res) => {
  try {
    const { subject, recommendedLevel, rawScore } = req.body;
    await db.query(
      `INSERT INTO placement_quiz_results (student_id, subject, recommended_level, raw_score)
       VALUES ($1, $2, $3, $4)`,
      [req.user.id, subject, recommendedLevel, rawScore || 0]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('Placement quiz save error:', err);
    res.status(500).json({ error: 'Failed to save placement quiz result' });
  }
});

module.exports = router;
