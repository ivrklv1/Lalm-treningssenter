require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const helmet = require('helmet');
const path = require('path');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('./db');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// Stripe webhook requires raw body:
app.post('/webhook', bodyParser.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = require('stripe').webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const memberId = session.metadata?.member_id;
    const customerId = session.customer;
    try {
      const update = db.prepare(`UPDATE members SET status=?, stripe_customer_id=? WHERE id=?`);
      update.run('active', customerId, memberId);
      console.log('Member activated:', memberId);
    } catch (e) {
      console.error('DB update error:', e);
    }
  } else if (event.type === 'checkout.session.expired') {
    const session = event.data.object;
    const memberId = session.metadata?.member_id;
    try {
      const update = db.prepare(`UPDATE members SET status=? WHERE id=?`);
      update.run('failed', memberId);
    } catch (e) {
      console.error('DB update error:', e);
    }
  }

  res.json({ received: true });
});

app.use(bodyParser.json());

// Create Checkout session
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { name, email, phone, address, plan, consent } = req.body;
    if (!name || !email || !plan) return res.status(400).json({ error: 'Mangler navn, e-post eller plan.' });
    if (!consent) return res.status(400).json({ error: 'Du må godta kontrakten/brukarvilkår.' });

    const id = uuidv4();
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const insert = db.prepare(`
      INSERT INTO members (id, name, email, phone, address, plan, status, consent, consent_at, ip)
      VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, datetime('now'), ?)
    `);
    insert.run(id, name, email, phone || null, address || null, plan, consent ? 1 : 0, ip);

    const baseUrl = process.env.PUBLIC_BASE_URL || 'http://localhost:3000';
    let lineItems;
    if (process.env.MONTHLY_PRICE_ID || process.env.YEARLY_PRICE_ID) {
      lineItems = [{
        price: plan === 'yearly' ? process.env.YEARLY_PRICE_ID : process.env.MONTHLY_PRICE_ID,
        quantity: 1,
      }];
    } else {
      const amountMonthly = 24900; // 249,00 NOK
      const amountYearly = 199900; // 1 999,00 NOK
      const amount = plan === 'yearly' ? amountYearly : amountMonthly;
      lineItems = [{
        price_data: {
          currency: 'nok',
          product_data: { name: plan === 'yearly' ? 'Årsmedlemskap' : 'Månedsmedlemskap' },
          unit_amount: amount,
          recurring: { interval: plan === 'yearly' ? 'year' : 'month' }
        },
        quantity: 1
      }];
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      success_url: `${baseUrl}/success.html?m=${id}`,
      cancel_url: `${baseUrl}/cancel.html?m=${id}`,
      customer_email: email,
      metadata: { member_id: id, name, phone: phone || '', address: address || '', plan },
      consent_collection: { terms_of_service: 'required' },
    });

    const update = db.prepare(`UPDATE members SET stripe_session_id=? WHERE id=?`);
    update.run(session.id, id);

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Kunne ikke opprette betaling.' });
  }
});

// Admin/verify endpoint
app.get('/api/member/:id', (req, res) => {
  try {
    const row = db.prepare(`SELECT id, name, email, plan, status, consent, consent_at, created_at, updated_at FROM members WHERE id=?`).get(req.params.id);
    if (!row) return res.status(404).json({ error: 'Ikke funnet' });
    res.json(row);
  } catch (e) {
    res.status(500).json({ error: 'Feil mot database' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server kjører på http://localhost:${port}`);
});