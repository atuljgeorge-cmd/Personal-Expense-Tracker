import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 5000;
const MINIMOTH_API_KEY = process.env.MINIMOTH_API_KEY;

// SQLite Database Setup (3 Entities: users, expenses)
const db = new sqlite3.Database('./database.sqlite', (err) => {
  if (err) console.error('DB Error:', err.message);
  else console.log('Connected to SQLite database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT UNIQUE,
    name TEXT
  )`);
  db.run(`CREATE TABLE IF NOT EXISTS expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    phone TEXT,
    title TEXT,
    amount REAL,
    category TEXT
  )`);
});

// 1. Send OTP via Minimoth API
app.post('/api/auth/send-otp', async (req, res) => {
  let { phone } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone number is required' });

  if (!phone.startsWith('+')) {
    phone = '+91' + phone.trim();
  }

  try {
    const response = await fetch('https://api.minimoth.dev/v1/otp/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': MINIMOTH_API_KEY
      },
      body: JSON.stringify({ phone })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to send OTP');
    res.json({ success: true, message: 'OTP sent successfully', phone });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Verify OTP & Register/Login User
app.post('/api/auth/verify-otp', async (req, res) => {
  let { phone, otp, name } = req.body;
  if (!phone || !otp) return res.status(400).json({ error: 'Phone and OTP are required' });

  if (!phone.startsWith('+')) {
    phone = '+91' + phone.trim();
  }

  try {
    const response = await fetch('https://api.minimoth.dev/v1/otp/verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': MINIMOTH_API_KEY
      },
      body: JSON.stringify({ phone, code: otp, otp })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Invalid OTP');

    db.run(`INSERT OR IGNORE INTO users (phone, name) VALUES (?, ?)`, [phone, name || 'User'], () => {
      res.json({ success: true, phone, name: name || 'User' });
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 3. Get Expenses
app.get('/api/expenses', (req, res) => {
  const { phone } = req.query;
  db.all(`SELECT * FROM expenses WHERE phone = ?`, [phone], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// 4. Add Expense
app.post('/api/expenses', (req, res) => {
  const { phone, title, amount, category } = req.body;
  if (!phone || !title || !amount) return res.status(400).json({ error: 'Missing fields' });

  db.run(`INSERT INTO expenses (phone, title, amount, category) VALUES (?, ?, ?, ?)`,
    [phone, title, amount, category || 'General'],
    function (err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ id: this.lastID, phone, title, amount, category });
    }
  );
});

// 5. Delete Expense
app.delete('/api/expenses/:id', (req, res) => {
  db.run(`DELETE FROM expenses WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true });
  });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));