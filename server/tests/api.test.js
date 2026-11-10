// Integration tests: run the real Express app against a real (empty) test database.
//   MONGODB_URI_TEST=mongodb://localhost:27017/toyverse_test npm test
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
process.env.LOW_STOCK_LIMIT = '5';

const mongoose = (await import('mongoose')).default;
const { app } = await import('../server.js');
const User = (await import('../models/User.js')).default;
const Product = (await import('../models/Product.js')).default;

let server, base, adminToken, custToken, cust2Token;

// tiny fetch helper: returns { status, body }
const call = async (method, path, { token, body } = {}) => {
  const res = await fetch(base + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token && { Authorization: `Bearer ${token}` }) },
    body: body && JSON.stringify(body)
  });
  return { status: res.status, body: await res.json().catch(() => ({})) };
};

const newProduct = (extra = {}) => ({
  code: `T-${Math.random().toString(36).slice(2, 8)}`,
  name: 'Test Toy', category: 'Games', price: 500, stock: 10, description: 'x', ...extra
});
const addProduct = async (extra) => (await call('POST', '/api/products', { token: adminToken, body: newProduct(extra) })).body.data;
const stockOf = async (id) => (await Product.findById(id)).stock;
const movements = async (id) => (await call('GET', `/api/stock/movements?product=${id}`, { token: adminToken })).body.data;
const order = (items, extra = {}) => call('POST', '/api/orders', {
  token: custToken, body: { items, phone: '9999999999', address: '1 Test Street, Chennai', ...extra }
});

before(async () => {
  await mongoose.connect(process.env.MONGODB_URI_TEST || 'mongodb://localhost:27017/toyverse_test');
  await mongoose.connection.dropDatabase();
  await Promise.all(mongoose.modelNames().map((n) => mongoose.model(n).init()));
  server = app.listen(0);
  base = `http://localhost:${server.address().port}`;
  await User.create({ name: 'Admin', email: 'admin@test.com', phone: '1', password: 'adminpass', role: 'ADMIN' });
});

after(async () => {
  server.close();
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
});

// ---------------- authentication ----------------
test('register: validation, duplicate email, role cannot be chosen', async () => {
  let r = await call('POST', '/api/auth/register', { body: { name: 'A', email: 'a@test.com', phone: '1' } });
  assert.equal(r.status, 400);
  r = await call('POST', '/api/auth/register', { body: { name: 'A', email: 'a@test.com', phone: '1', password: '123' } });
  assert.equal(r.status, 400);
  r = await call('POST', '/api/auth/register', { body: { name: 'A', email: 'bad-email', phone: '1', password: 'secret1' } });
  assert.equal(r.status, 400);

  r = await call('POST', '/api/auth/register', {
    body: { name: 'Cust', email: 'Cust@Test.com', phone: '111', password: 'secret1', role: 'ADMIN' }
  });
  assert.equal(r.status, 201);
  assert.equal(r.body.data.user.role, 'CUSTOMER'); // sneaky role ignored
  assert.equal(r.body.data.user.email, 'cust@test.com');
  assert.ok(!('password' in r.body.data.user));
  custToken = r.body.data.token;

  r = await call('POST', '/api/auth/register', { body: { name: 'C2', email: 'cust@test.com', phone: '1', password: 'secret1' } });
  assert.equal(r.status, 400); // duplicate (case-insensitive)

  r = await call('POST', '/api/auth/register', { body: { name: 'Two', email: 'two@test.com', phone: '2', password: 'secret1' } });
  cust2Token = r.body.data.token;
});

test('password is stored hashed', async () => {
  const u = await User.findOne({ email: 'cust@test.com' }).select('+password');
  assert.notEqual(u.password, 'secret1');
  assert.match(u.password, /^\$2[aby]\$/);
});

test('login: success, wrong password, injection attempt, /me', async () => {
  let r = await call('POST', '/api/auth/login', { body: { email: 'admin@test.com', password: 'adminpass' } });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.user.role, 'ADMIN');
  adminToken = r.body.data.token;

  r = await call('POST', '/api/auth/login', { body: { email: 'admin@test.com', password: 'wrong' } });
  assert.equal(r.status, 401);
  r = await call('POST', '/api/auth/login', { body: { email: { $ne: '' }, password: { $ne: '' } } });
  assert.equal(r.status, 400);

  r = await call('GET', '/api/auth/me', { token: adminToken });
  assert.equal(r.body.data.user.email, 'admin@test.com');
  r = await call('GET', '/api/auth/me');
  assert.equal(r.status, 401);
  r = await call('GET', '/api/auth/me', { token: 'garbage' });
  assert.equal(r.status, 401);
});

// ---------------- role-based access ----------------
test('customers and guests cannot reach admin APIs', async () => {
  const adminOnly = [
    ['POST', '/api/products', newProduct()],
    ['GET', '/api/orders'],
    ['GET', '/api/users'],
    ['GET', '/api/stock/movements'],
    ['GET', '/api/stock/low'],
    ['POST', '/api/stock/adjust', {}],
    ['GET', '/api/dashboard'],
    ['POST', '/api/upload', {}]
  ];
  for (const [method, path, body] of adminOnly) {
    assert.equal((await call(method, path, { token: custToken, body })).status, 403, `customer ${method} ${path}`);
    assert.equal((await call(method, path, { body })).status, 401, `guest ${method} ${path}`);
  }
  const p = await addProduct();
  assert.equal((await call('PUT', `/api/products/${p.id}`, { token: custToken, body: { name: 'hack' } })).status, 403);
  assert.equal((await call('DELETE', `/api/products/${p.id}`, { token: custToken })).status, 403);
  assert.equal((await call('PUT', `/api/orders/${p.id}/status`, { token: custToken, body: { status: 'Delivered' } })).status, 403);
});

// ---------------- products ----------------
test('product CRUD, labels, discount maths, stock history', async () => {
  let r = await call('POST', '/api/products', {
    token: adminToken,
    body: newProduct({ code: 'CRUD-1', price: 2000, oldPrice: 2000, discount: 25, stock: 12, section: 'handmade', images: ['http://x/a.jpg', 'http://x/b.jpg'] })
  });
  assert.equal(r.status, 201);
  const p = r.body.data;
  assert.equal(p.price, 1500);          // 2000 - 25%
  assert.equal(p.oldPrice, 2000);
  assert.equal(p.badge, 'HANDMADE');
  assert.equal(p.image, 'http://x/a.jpg');
  assert.ok(p.id && !p._id);

  // initial stock is in the history
  let m = await movements(p.id);
  assert.equal(m.length, 1);
  assert.deepEqual([m[0].type, m[0].previousQty, m[0].changedQty, m[0].newQty], ['IN', 0, 12, 12]);
  assert.equal(m[0].performedByName, 'Admin');

  // duplicate code, bad data
  assert.equal((await call('POST', '/api/products', { token: adminToken, body: newProduct({ code: 'CRUD-1' }) })).status, 409);
  assert.equal((await call('POST', '/api/products', { token: adminToken, body: newProduct({ stock: -3 }) })).status, 400);
  assert.equal((await call('POST', '/api/products', { token: adminToken, body: newProduct({ section: 'nonsense' }) })).status, 400);
  assert.equal((await call('POST', '/api/products', { token: adminToken, body: newProduct({ price: 0 }) })).status, 400);

  // customers (and guests) can read
  assert.equal((await call('GET', '/api/products')).body.data.some((x) => x.id === p.id), true);
  assert.equal((await call('GET', `/api/products/${p.id}`)).body.data.name, 'Test Toy');
  assert.equal((await call('GET', '/api/products/not-an-id')).status, 400);

  // update: label, discount removed, stock down by 2 -> an OUT movement
  r = await call('PUT', `/api/products/${p.id}`, {
    token: adminToken, body: { name: 'Renamed', section: 'bestseller', discount: 0, price: 1800, stock: 10, code: 'HACK', role: 'x' }
  });
  assert.equal(r.status, 200);
  assert.equal(r.body.data.name, 'Renamed');
  assert.equal(r.body.data.badge, 'BEST SELLER');
  assert.equal(r.body.data.price, 1800);
  assert.equal(r.body.data.oldPrice, null);
  assert.equal(r.body.data.code, 'CRUD-1'); // cannot change
  m = await movements(p.id);
  assert.deepEqual([m[0].type, m[0].previousQty, m[0].changedQty, m[0].newQty], ['OUT', 12, 2, 10]);

  assert.equal((await call('PUT', `/api/products/${p.id}`, { token: adminToken, body: { stock: -1 } })).status, 400);
  assert.equal(await stockOf(p.id), 10);

  r = await call('DELETE', `/api/products/${p.id}`, { token: adminToken });
  assert.equal(r.status, 200);
  assert.equal((await call('GET', `/api/products/${p.id}`)).status, 404);
});

// ---------------- image upload ----------------
test('image upload stores a file and serves it back', async () => {
  const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');
  const form = new FormData();
  form.append('images', new Blob([png], { type: 'image/png' }), 'toy.png');
  let res = await fetch(`${base}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: form });
  const body = await res.json();
  assert.equal(res.status, 201);
  assert.match(body.data.urls[0], /\/uploads\/[a-f0-9]+\.png$/);
  const img = await fetch(body.data.urls[0]);
  assert.equal(img.status, 200);
  assert.equal(img.headers.get('content-type'), 'image/png');
  assert.equal(Buffer.from(await img.arrayBuffer()).length, png.length);

  const bad = new FormData();
  bad.append('images', new Blob(['<script>'], { type: 'text/html' }), 'x.html');
  res = await fetch(`${base}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${adminToken}` }, body: bad });
  assert.equal(res.status, 400);

  res = await fetch(`${base}/api/upload`, { method: 'POST', headers: { Authorization: `Bearer ${custToken}` }, body: form });
  assert.equal(res.status, 403);
});

// ---------------- orders & stock ----------------
test('placing an order deducts stock once and logs it; totals come from the database', async () => {
  const p = await addProduct({ price: 300, stock: 10 });
  const r = await order([{ product: p.id, quantity: 3, price: 1 }]); // client price ignored
  assert.equal(r.status, 201);
  const o = r.body.data;
  assert.match(o.orderNumber, /^ORD-\d+$/);
  assert.equal(o.subtotal, 900);
  assert.equal(o.deliveryCharge, 49);      // under ₹999
  assert.equal(o.totalAmount, 949);
  assert.equal(o.items[0].price, 300);
  assert.equal(o.status, 'Pending');
  assert.equal(await stockOf(p.id), 7);

  const m = (await movements(p.id))[0];
  assert.deepEqual([m.type, m.previousQty, m.changedQty, m.newQty], ['OUT', 10, 3, 7]);
  assert.equal(m.performedByRole, 'CUSTOMER');
  assert.match(m.reason, /placed/);

  // free delivery above ₹999
  const big = await order([{ product: p.id, quantity: 4 }]);
  assert.equal(big.body.data.deliveryCharge, 0);
  assert.equal(await stockOf(p.id), 3);

  // delivery details are saved to the customer's profile
  assert.equal((await call('GET', '/api/auth/me', { token: custToken })).body.data.user.address, '1 Test Street, Chennai');
  const mine = await call('GET', '/api/orders/my-orders', { token: custToken });
  assert.equal(mine.body.data.length, 2);
  assert.equal((await call('GET', '/api/orders/my-orders', { token: cust2Token })).body.data.length, 0);
});

test('order validation: no negative stock, bad quantities, coming soon, missing address', async () => {
  const p = await addProduct({ stock: 2 });
  let r = await order([{ product: p.id, quantity: 3 }]);
  assert.equal(r.status, 400);
  assert.match(r.body.message, /Only 2/);
  for (const quantity of [-5, 0, 1.5, 'abc', 1000]) {
    assert.equal((await order([{ product: p.id, quantity }])).status, 400, `quantity ${quantity}`);
  }
  assert.equal(await stockOf(p.id), 2);

  assert.equal((await order([{ product: 'bad-id', quantity: 1 }])).status, 400);
  assert.equal((await order([])).status, 400);
  assert.equal((await call('POST', '/api/orders', { token: custToken, body: { items: [{ product: p.id, quantity: 1 }], phone: '1', address: '  ' } })).status, 400);
  assert.equal((await call('POST', '/api/orders', { body: { items: [] } })).status, 401);

  const soon = await addProduct({ section: 'coming-soon', stock: 5 });
  assert.equal((await order([{ product: soon.id, quantity: 1 }])).status, 400);

  // one bad line must not leave the other line's stock deducted
  const good = await addProduct({ stock: 5 });
  r = await order([{ product: good.id, quantity: 2 }, { product: p.id, quantity: 99 }]);
  assert.equal(r.status, 400);
  assert.equal(await stockOf(good.id), 5);

  // duplicate lines of one product are merged
  r = await order([{ product: good.id, quantity: 1 }, { product: good.id, quantity: 2 }]);
  assert.equal(r.body.data.items.length, 1);
  assert.equal(r.body.data.items[0].quantity, 3);
  assert.equal(await stockOf(good.id), 2);
});

// The two tests below depend on MongoDB's guarantee that findOneAndUpdate on one document is
// atomic. Emulators such as FerretDB do not give that guarantee, so set SKIP_CONCURRENCY_TESTS=1
// when running against one. Against real MongoDB leave it unset.
const concurrency = process.env.SKIP_CONCURRENCY_TESTS ? test.skip : test;

concurrency('two customers cannot both buy the last unit', async () => {
  const p = await addProduct({ stock: 1 });
  const results = await Promise.all([
    call('POST', '/api/orders', { token: custToken, body: { items: [{ product: p.id, quantity: 1 }], phone: '1', address: 'a' } }),
    call('POST', '/api/orders', { token: cust2Token, body: { items: [{ product: p.id, quantity: 1 }], phone: '2', address: 'b' } })
  ]);
  assert.deepEqual(results.map((r) => r.status).sort(), [201, 400]);
  assert.equal(await stockOf(p.id), 0);
});

test('cancelling restores stock exactly once', async () => {
  const p = await addProduct({ stock: 10 });
  const o = (await order([{ product: p.id, quantity: 4 }])).body.data;
  assert.equal(await stockOf(p.id), 6);

  // someone else's order cannot be cancelled
  assert.equal((await call('PUT', `/api/orders/${o.id}/cancel`, { token: cust2Token })).status, 404);

  assert.equal((await call('PUT', `/api/orders/${o.id}/cancel`, { token: custToken })).status, 200);
  assert.equal(await stockOf(p.id), 10);

  assert.equal((await call('PUT', `/api/orders/${o.id}/cancel`, { token: custToken })).status, 400);
  assert.equal((await call('PUT', `/api/orders/${o.id}/status`, { token: adminToken, body: { status: 'Cancelled' } })).status, 200); // same status = no-op
  assert.equal(await stockOf(p.id), 10);

  const m = await movements(p.id);
  assert.equal(m.length, 3); // initial, order, cancel
  assert.deepEqual([m[0].type, m[0].previousQty, m[0].changedQty, m[0].newQty], ['IN', 6, 4, 10]);
  assert.match(m[0].reason, /cancelled/);

  // a cancelled order cannot be revived (would need stock again)
  assert.equal((await call('PUT', `/api/orders/${o.id}/status`, { token: adminToken, body: { status: 'Pending' } })).status, 400);
});

test('admin status flow, delivered orders can be returned (restock), invalid status rejected', async () => {
  const p = await addProduct({ stock: 10 });
  const o = (await order([{ product: p.id, quantity: 2 }])).body.data;

  assert.equal((await call('PUT', `/api/orders/${o.id}/status`, { token: adminToken, body: { status: 'Bogus' } })).status, 400);
  assert.equal((await call('PUT', `/api/orders/${o.id}/status`, { token: adminToken, body: { status: 'Returned' } })).status, 400); // not delivered yet

  let r = await call('PUT', `/api/orders/${o.id}/status`, { token: adminToken, body: { status: 'Dispatched' } });
  assert.equal(r.body.data.status, 'Dispatched');
  r = await call('PUT', `/api/orders/${o.id}/status`, { token: adminToken, body: { status: 'Delivered' } });
  assert.equal(r.body.data.status, 'Delivered');
  assert.equal(await stockOf(p.id), 8);

  // customer can no longer cancel a delivered order
  assert.equal((await call('PUT', `/api/orders/${o.id}/cancel`, { token: custToken })).status, 400);

  r = await call('PUT', `/api/orders/${o.id}/status`, { token: adminToken, body: { status: 'Returned' } });
  assert.equal(r.status, 200);
  assert.equal(await stockOf(p.id), 10);
  assert.match((await movements(p.id))[0].reason, /returned/);
  assert.equal((await call('PUT', `/api/orders/${o.id}/status`, { token: adminToken, body: { status: 'Delivered' } })).status, 400);
  assert.equal(await stockOf(p.id), 10);

  // admin sees it with customer details
  const all = (await call('GET', '/api/orders', { token: adminToken })).body.data;
  const mine = all.find((x) => x.id === o.id);
  assert.equal(mine.customerName, 'Cust');
  assert.equal(mine.phone, '9999999999');
  assert.equal(mine.address, '1 Test Street, Chennai');
});

test('"Not Available" also returns the stock', async () => {
  const p = await addProduct({ stock: 5 });
  const o = (await order([{ product: p.id, quantity: 5 }])).body.data;
  assert.equal(await stockOf(p.id), 0);
  await call('PUT', `/api/orders/${o.id}/status`, { token: adminToken, body: { status: 'Not Available' } });
  assert.equal(await stockOf(p.id), 5);
});

test('manual stock in/out, reasons, never negative, low-stock alerts', async () => {
  const p = await addProduct({ stock: 8 });
  const adjust = (body) => call('POST', '/api/stock/adjust', { token: adminToken, body: { productId: p.id, ...body } });

  assert.equal((await adjust({ type: 'OUT', quantity: 3 })).status, 400);                 // reason missing
  assert.equal((await adjust({ type: 'SIDEWAYS', quantity: 3, reason: 'x' })).status, 400);
  assert.equal((await adjust({ type: 'IN', quantity: 0, reason: 'x' })).status, 400);
  assert.equal((await adjust({ type: 'OUT', quantity: 9, reason: 'damaged' })).status, 400); // more than we have
  assert.equal(await stockOf(p.id), 8);

  let r = await adjust({ type: 'OUT', quantity: 5, reason: 'Damaged in warehouse' });
  assert.equal(r.status, 201);
  assert.deepEqual([r.body.data.movement.previousQty, r.body.data.movement.changedQty, r.body.data.movement.newQty], [8, 5, 3]);
  assert.equal(r.body.data.movement.performedByName, 'Admin');

  // 3 left, limit is 5 -> low stock alert
  let low = (await call('GET', '/api/stock/low', { token: adminToken })).body.data;
  assert.equal(low.limit, 5);
  assert.ok(low.products.some((x) => x.id === p.id));

  r = await adjust({ type: 'IN', quantity: 20, reason: 'Supplier delivery' });
  assert.equal(r.body.data.product.stock, 23);
  low = (await call('GET', '/api/stock/low', { token: adminToken })).body.data;
  assert.ok(!low.products.some((x) => x.id === p.id));

  // history filters
  const outs = (await call('GET', `/api/stock/movements?product=${p.id}&type=OUT`, { token: adminToken })).body.data;
  assert.equal(outs.length, 1);
  assert.equal((await adjust({ productId: '0'.repeat(24), type: 'IN', quantity: 1, reason: 'x' })).status, 404);
});

concurrency('a double-clicked cancel restocks only once', async () => {
  const p = await addProduct({ stock: 10 });
  const o = (await order([{ product: p.id, quantity: 4 }])).body.data;
  const both = await Promise.all([
    call('PUT', `/api/orders/${o.id}/cancel`, { token: custToken }),
    call('PUT', `/api/orders/${o.id}/cancel`, { token: custToken })
  ]);
  assert.equal(both.filter((r) => r.status === 200).length, 1);
  assert.equal(await stockOf(p.id), 10); // not 14
});

// ---------------- dashboard ----------------
test('dashboard numbers match the database', async () => {
  // start from a clean slate so the expected numbers are easy to know
  await mongoose.connection.dropDatabase();
  await User.create({ name: 'Admin', email: 'admin@test.com', phone: '1', password: 'adminpass', role: 'ADMIN' });
  const login = await call('POST', '/api/auth/login', { body: { email: 'admin@test.com', password: 'adminpass' } });
  adminToken = login.body.data.token;
  const reg = await call('POST', '/api/auth/register', { body: { name: 'C', email: 'c@test.com', phone: '1', password: 'secret1' } });
  custToken = reg.body.data.token;

  let d = (await call('GET', '/api/dashboard', { token: adminToken })).body.data;
  assert.equal(d.totalProducts, 0);
  assert.equal(d.totalRevenue, 0);
  assert.equal(d.averageRating, 0);

  const a = await addProduct({ category: 'Games', price: 1000, stock: 10, rating: 4.6 });
  await addProduct({ category: 'Games', price: 200, stock: 3, rating: 3.2 });
  await addProduct({ category: 'Puzzles', price: 100, stock: 50, section: 'coming-soon', rating: 0 });

  const o1 = (await order([{ product: a.id, quantity: 2 }])).body.data;           // 2000 (free delivery)
  const o2 = (await order([{ product: a.id, quantity: 1 }])).body.data;           // 1000
  await call('PUT', `/api/orders/${o2.id}/cancel`, { token: custToken });         // cancelled: not a sale

  d = (await call('GET', '/api/dashboard', { token: adminToken })).body.data;
  assert.equal(d.totalProducts, 3);
  assert.equal(d.availableStock, 8 + 3);                  // 10-2 (o2 returned) + 3; coming-soon excluded
  assert.equal(d.totalOrders, 2);
  assert.equal(d.productsSold, 2);
  assert.equal(d.totalRevenue, o1.totalAmount);
  assert.equal(d.pendingOrders, 1);
  assert.equal(d.lowStockCount, 1);                       // the product with 3 left
  assert.equal(d.averageRating, 3.9);                     // (4.6 + 3.2) / 2, unrated product ignored
  assert.deepEqual(d.productsPerCategory, [{ label: 'Games', value: 2 }, { label: 'Puzzles', value: 1 }]);
  assert.deepEqual(d.ratingBuckets.filter((b) => b.value).map((b) => b.label), ['5 Star', '3 Star']);
  assert.equal(d.soldPerMonth.length, 6);
  assert.equal(d.soldPerMonth[5].value, 2);               // this month
  assert.equal(d.revenuePerMonth[5].value, o1.totalAmount);
  assert.equal(d.revenuePerMonth[4].value, 0);

  // it moves when data changes
  await call('PUT', `/api/orders/${o1.id}/status`, { token: adminToken, body: { status: 'Cancelled' } });
  d = (await call('GET', '/api/dashboard', { token: adminToken })).body.data;
  assert.equal(d.totalRevenue, 0);
  assert.equal(d.productsSold, 0);
  assert.equal(d.availableStock, 10 + 3);
});
