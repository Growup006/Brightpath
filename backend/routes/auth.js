const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db/database');
const { JWT_SECRET } = require('../middleware/auth');

const router = express.Router();

// ---- SIGNUP ----
// role: 'student' -> requires class, learning_style, optional parentEmail to link
// role: 'parent'  -> creates a parent account only
router.post('/signup', async (req, res) => {
  try {
    const { name, email, password, role, class: studentClass, learningStyle, parentEmail } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ error: 'name, email, password, role are required' });
    }
    if (!['student', 'parent'].includes(role)) {
      return res.status(400).json({ error: "role must be 'student' or 'parent'" });
    }
    if (role === 'student' && ![6, 7, 8].includes(Number(studentClass))) {
      return res.status(400).json({ error: 'class must be 6, 7, or 8 for students' });
    }

    const existingResult = await db.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingResult.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    let parentId = null;
    if (role === 'student' && parentEmail) {
      const parentResult = await db.query(
        "SELECT id FROM users WHERE email = $1 AND role = 'parent'",
        [parentEmail]
      );
      if (parentResult.rows.length > 0) parentId = parentResult.rows[0].id;
    }

    const passwordHash = bcrypt.hashSync(password, 10);

    const insertResult = await db.query(
      `INSERT INTO users (name, email, password_hash, role, class, learning_style, parent_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        name,
        email,
        passwordHash,
        role,
        role === 'student' ? Number(studentClass) : null,
        role === 'student' ? (learningStyle || 'standard') : null,
        parentId,
      ]
    );

    const user = {
      id: insertResult.rows[0].id,
      name,
      email,
      role,
      class: role === 'student' ? Number(studentClass) : null,
      learningStyle: role === 'student' ? (learningStyle || 'standard') : null,
    };

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// ---- LOGIN ----
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user || !bcrypt.compareSync(password, user.password_hash)) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, name: user.name },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        class: user.class,
        learningStyle: user.learning_style,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
