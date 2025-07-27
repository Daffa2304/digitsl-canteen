const express = require('express');
const router = express.Router();
const db = require('../db');
const QRCode = require('qrcode');
const path = require('path');
const userController = require('../controllers/userController');

// Get menu list
router.get('/menu', async (req, res) => {
  const [rows] = await db.execute('SELECT * FROM menus');
  res.json(rows);
});

// Search menu by keyword (name/category)
router.get('/menu/search', async (req, res) => {
  const keyword = `%${req.query.q || ''}%`;
  const [rows] = await db.execute(
    'SELECT * FROM menu WHERE name LIKE ? OR category LIKE ?',
    [keyword, keyword]
  );
  res.json(rows);
});

// AI Recommendation based on time
router.get('/recommendation', async (req, res) => {
  const hour = new Date().getHours();
  let category = '';

  if (hour < 11) category = 'Minuman';
  else if (hour < 16) category = 'Makanan';
  else category = 'Cemilan';

  const [rows] = await db.execute(
    'SELECT * FROM menus WHERE category = ? ORDER BY RAND() LIMIT 1',
    [category]
  );
  res.json(rows[0] || {});
});

// Place an order (with QR)
router.post('/orders', async (req, res) => {
  const { user_id, menu_id } = req.body;
  const timestamp = new Date();
  const status = 'Pesanan sedang diproses';

  const [result] = await db.execute(
    'INSERT INTO orders (user_id, menu_id, status, created_at) VALUES (?, ?, ?, ?)',
    [user_id, menu_id, status, timestamp]
  );

  const orderId = result.insertId;
  const qrText = `order_id:${orderId}|user_id:${user_id}`;
  const qrCode = await QRCode.toDataURL(qrText);

  await db.execute('UPDATE orders SET qr_code = ? WHERE id = ?', [qrCode, orderId]);

  res.json({ message: 'Pesanan berhasil dibuat', orderId, qrCode });
});

router.get("/orders.html", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/user/orders.html"));
});

router.get("/user/history", (req, res) => {
  res.sendFile(path.join(__dirname, "../../frontend/user/history.html"));
});

// Get current orders (not finished)
router.get('/orders/:user_id', async (req, res) => {
  const user_id = req.params.user_id;
  const [rows] = await db.execute(
  );
  res.json(rows);
});

// Get order history (finished)
router.get("/history/:userId", async (req, res) => {
  const { userId } = req.params;
  console.log("Ambil pesanan user ID:", userId);
  const orders = await db.query[userId];
  res.json(orders[0]);
});

// TIDAK PERLU CEK LOGIN
router.get('/', (req, res) => {
  res.render('user/home');
});

router.get('/menu', async (req, res) => {
  const [menu] = await db.query('SELECT * FROM menu');
  res.render('user/menu', { menu });
});

module.exports = router;