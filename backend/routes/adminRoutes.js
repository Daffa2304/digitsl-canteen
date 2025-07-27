const express = require("express");
const router = express.Router();
const db = require("../db");
const menuController = require("../menu/menuController");
const upload = require("../middleware/upload");

// Tampilkan halaman daftar pesanan admin
router.get("/orders", async (req, res) => {
  try {
    const [orders] = await db.query(`
      SELECT users.username , o.status, o.created_at, o.id as order_id, o.created_at, o.qr_code, 
             m.name AS menu_name, m.price, oi.quantity,
             (m.price * oi.quantity) AS subtotal
      FROM orders o
      JOIN order_items oi ON o.id = oi.order_id
      JOIN menus m ON oi.menu_id = m.id
      JOIN users ON users.id = o.user_id
      ORDER BY o.created_at DESC
    `);
    const groupedOrders = [];

    // Group by order_id
    orders.forEach(row => {
      const existingOrder = groupedOrders.find(order => order.order_id === row.order_id);
      if (!existingOrder) {
        groupedOrders.push({
          username: row.username,
          created_at:row.created_at, 
          status:row.status, 
          order_id: row.order_id,
          order_time: row.created_at,
          qr_code: row.qr_code,
          items: [],
          total: 0
        });
      }

      const order = groupedOrders.find(order => order.order_id === row.order_id);
      order.items.push({
        menu_name: row.menu_name,
        price: row.price,
        quantity: row.quantity,
        subtotal: row.subtotal
      });

      order.total += parseInt(row.subtotal);
    });
  
    res.json(groupedOrders)
  } catch (err) {
    res.status(500).send("Gagal mengambil data pesanan");
  }
});

// Ubah status pesanan via form (POST)
router.post("/orders/update/:id", async (req, res) => {
  const orderId = req.params.id;
  const newStatus = req.body.status;

  try {
    await db.query("UPDATE orders SET status = ? WHERE id = ?", [newStatus, orderId]);
    res.redirect("/admin/orders");
  } catch (err) {
    res.status(500).send("Gagal memperbarui status pesanan");
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const [menus] = await db.query ('SELECT count(*) as total_menu FROM menus')
    const [orders] = await db.query ('SELECT count(*) as total_orders FROM orders')
    const [items_orders] = await db.query ('SELECT count (*) as total_selesai From orders WHERE status = "selesai"')

    const result = {
      menus: menus[0]['total_menu'],
      orders:orders[0]['total_orders'],
      items_orders: items_orders[0]['total_selesai']
    }

   res.status(200).json(result);

} catch (err) {
  console.error(err);
  res.status(500).json({ message: 'Gagal ambil pesanan data' });
}
});

router.get('/menus', menuController.getMenus)
router.post('/create-menu', upload.single('image'), menuController.addMenu);
router.get('/menu/:id', menuController.getMenuById)
router.put('/edit-menu/:id', upload.single('image'), menuController.editMenu)
router.delete('/delete-menu/:id', menuController.deleteMenu)
router.post('/change-status-order', async (req, res) => {
const { order_id, status } = req.body;
try {
await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, order_id]);
res.status(200).json({ message: 'Status pesanan berhasil diperbarui' });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Gagal memperbarui status pesanan' });
}
});

module.exports = router;
