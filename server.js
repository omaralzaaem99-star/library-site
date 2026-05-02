const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

const db = new sqlite3.Database("./library.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE,
      password TEXT,
      role TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS books (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      author TEXT,
      image TEXT,
      reserved INTEGER DEFAULT 0,
      reservedBy TEXT,
      reservedDate TEXT
    )
  `);

  db.get("SELECT * FROM users WHERE username = 'admin'", (err, user) => {
    if (!user) {
      db.run(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        ["admin", "1234", "admin"]
      );
    }
  });
});

/* تسجيل */
app.post("/register", (req, res) => {
  const { username, password } = req.body;

  db.run(
    "INSERT INTO users (username, password, role) VALUES (?, ?, 'user')",
    [username, password],
    (err) => {
      if (err) return res.json({ success: false });
      res.json({ success: true });
    }
  );
});

/* دخول */
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  db.get(
    "SELECT * FROM users WHERE username=? AND password=?",
    [username, password],
    (err, user) => {
      if (!user) return res.json({ success: false });
      res.json({ success: true, username: user.username, role: user.role });
    }
  );
});

/* جلب الكتب */
app.get("/books", (req, res) => {
  db.all("SELECT * FROM books", [], (err, rows) => {
    res.json(rows || []);
  });
});

/* إضافة كتاب */
app.post("/books", (req, res) => {
  const { title, author, image } = req.body;

  db.run(
    "INSERT INTO books (title, author, image) VALUES (?, ?, ?)",
    [title, author, image],
    function () {
      res.json({ success: true });
    }
  );
});

/* تعديل كتاب */
app.put("/books/:id", (req, res) => {
  const { title, author, image } = req.body;

  db.run(
    "UPDATE books SET title=?, author=?, image=? WHERE id=?",
    [title, author, image, req.params.id],
    () => {
      res.json({ success: true });
    }
  );
});

/* حذف كتاب */
app.delete("/books/:id", (req, res) => {
  db.run("DELETE FROM books WHERE id=?", [req.params.id], () => {
    res.json({ success: true });
  });
});

/* حجز كتاب */
app.put("/books/:id/reserve", (req, res) => {
  const { name } = req.body;

  db.run(
    "UPDATE books SET reserved=1, reservedBy=?, reservedDate=date('now') WHERE id=?",
    [name, req.params.id],
    () => res.json({ success: true })
  );
});

/* إرجاع كتاب */
app.put("/books/:id/return", (req, res) => {
  db.run(
    "UPDATE books SET reserved=0, reservedBy='', reservedDate='' WHERE id=?",
    [req.params.id],
    () => res.json({ success: true })
  );
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});