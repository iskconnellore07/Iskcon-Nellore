const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
require('dotenv').config();

const firebaseConfig = {
  apiKey: "AIzaSyAiRwVZi3NWMALFOGuW9VFunYfRWY0qQIo",
  authDomain: "iskcon-nellore.firebaseapp.com",
  projectId: "iskcon-nellore",
  storageBucket: "iskcon-nellore.firebasestorage.app",
  messagingSenderId: "866388993763",
  appId: "1:866388993763:web:635954965e4f2e2127c7d6",
  measurementId: "G-XJ5VFDB8PS"
};
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = process.env.PORT || 4000;
const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpay = razorpayKeyId && razorpayKeySecret ? new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
}) : null;

// In-memory orders store for demo/testing
const orders = {};

// Helper function to send SMS via MSG91 Flow API
async function sendMsg91SMS(templateId, mobile, variables) {
  console.log('TEST MODE: MSG91 SMS disabled to prevent real charges.');
  return;
  
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    console.log('MSG91_AUTH_KEY not configured. Skipping SMS.');
    return;
  }
  
  // Clean phone number and ensure it starts with country code (91)
  let cleanMobile = mobile.replace(/\D/g, '');
  if (cleanMobile.length === 10) cleanMobile = `91${cleanMobile}`;

  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authkey: authKey
    },
    body: JSON.stringify({
      template_id: templateId,
      short_url: '1',
      recipients: [
        {
          mobiles: cleanMobile,
          ...variables
        }
      ]
    })
  };

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow', options);
    const data = await res.json();
    console.log(`MSG91 SMS sent to ${cleanMobile}. Template: ${templateId}. Response:`, data);
  } catch (error) {
    console.error(`Error sending MSG91 SMS to ${cleanMobile}:`, error);
  }
}

app.get('/', (req, res) => {
  res.json({ ok: true, message: 'Payment test server running' });
});

// Create an order with Razorpay
app.post('/create-order', async (req, res) => {
  if (!razorpay) {
    return res.status(500).json({ error: 'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' });
  }

  const { name, phone, mobile, email, festival, date, slot, people, amount, claim80G, pan, address, templeLocation } = req.body;
  const phoneNumber = phone || mobile;
  const amountNumber = Number(amount);
  if (!amountNumber || amountNumber <= 0) {
    return res.status(400).json({ error: 'Valid amount required.' });
  }

  const amountPaise = Math.round(amountNumber * 100);

  try {
    const orderOptions = {
      amount: amountPaise,
      currency: 'INR',
      receipt: `donation_${Date.now()}`,
      notes: {
        name: name || '',
        phone: phoneNumber || '',
        email: email || '',
        festival: festival || '',
        date: date || '',
        slot: slot || '',
        people: people || '',
        templeLocation: templeLocation || 'ISKCON Nellore',
      },
    };

    // Razorpay Route: Determine which linked account to transfer funds to
    let linkedAccountId = process.env.ISKCON_ACCOUNT_ID; // Default Nellore
    if (templeLocation === "ISKCON Naidupet") linkedAccountId = process.env.ISKCON_NAIDUPET_ACCOUNT_ID || linkedAccountId;
    if (templeLocation === "ISKCON Sullurpeta") linkedAccountId = process.env.ISKCON_SULLURPETA_ACCOUNT_ID || linkedAccountId;
    if (templeLocation === "ISKCON Kavali") linkedAccountId = process.env.ISKCON_KAVALI_ACCOUNT_ID || linkedAccountId;
    if (templeLocation === "ISKCON Gudur") linkedAccountId = process.env.ISKCON_GUDUR_ACCOUNT_ID || linkedAccountId;

    if (linkedAccountId) {
      orderOptions.transfers = [
        {
          account: linkedAccountId,
          amount: amountPaise,
          currency: 'INR',
          notes: {
            name: name || 'Devotee',
            email: email || '',
          },
          linked_account_notes: ['name', 'email'],
          on_hold: 0,
        },
      ];
    }

    let order;
    try {
      order = await razorpay.orders.create(orderOptions);
    } catch (err) {
      if (err.statusCode === 400 && err.error?.description === 'This transfer is not supported') {
        console.warn("Razorpay Route is not yet enabled on this account. Retrying without transfers.");
        delete orderOptions.transfers;
        order = await razorpay.orders.create(orderOptions);
      } else {
        throw err;
      }
    }

    orders[order.id] = {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      name: name || 'Devotee',
      phone: phoneNumber,
      email,
      festival,
      date,
      slot,
      people,
      claim80G,
      pan,
      address,
      templeLocation: templeLocation || 'ISKCON Nellore',
      paid: false,
      createdAt: new Date().toISOString(),
    };

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: razorpayKeyId,
      amountInRupees: amountNumber,
    });
  } catch (err) {
    console.error('Error creating Razorpay order', err);
    res.status(500).json({ error: 'Unable to create payment order.' });
  }
});

// Verify payment signature and mark the order paid
app.post('/verify-payment', (req, res) => {
  console.log('--- verify-payment called ---');
  console.log('Body:', req.body);
  if (!razorpay) {
    return res.status(500).json({ success: false, message: 'Payment gateway not configured.' });
  }

  const { orderId, paymentId, signature } = req.body;
  if (!orderId || !paymentId || !signature) {
    return res.status(400).json({ success: false, message: 'Missing payment details.' });
  }

  const order = orders[orderId];
  if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found.' });
  }

  const expectedSignature = crypto
    .createHmac('sha256', razorpayKeySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  if (expectedSignature !== signature) {
    return res.status(400).json({ success: false, message: 'Invalid payment signature.' });
  }

  order.paid = true;
  order.paymentId = paymentId;
  order.signature = signature;
  order.paidAt = new Date().toISOString();

  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formType: order.festival ? 'Festivals' : 'Donation',
        name: order.name,
        email: order.email || '',
        phone: order.phone || '',
        amount: order.amount / 100,
        date: order.date || order.paidAt,
        paymentId: paymentId,
        orderId: orderId,
        festival: order.festival || '',
        slot: order.slot || '',
        people: order.people || '',
        pan: order.pan || '',
        address: order.address || '',
        claim80G: order.claim80G ? true : false
      })
    }).catch(err => console.error("Error sending to Apps Script:", err));
  }

  // --- Write to Firebase Firestore ---
  try {
    const transactionData = {
      formType: order.festival ? 'Festivals' : 'Donation',
      name: order.name,
      email: order.email || '',
      phone: order.phone || '',
      amount: order.amount / 100,
      date: order.date || order.paidAt,
      paymentId: paymentId,
      orderId: orderId,
      festival: order.festival || '',
      slot: order.slot || '',
      people: order.people || '',
      pan: order.pan || '',
      address: order.address || '',
      claim80G: order.claim80G ? true : false,
      timestamp: new Date().toISOString()
    };
    
    addDoc(collection(firestoreDb, "transactions"), transactionData)
      .then((docRef) => console.log("Transaction written to Firebase with ID: ", docRef.id))
      .catch((err) => console.error("Error adding document to Firebase: ", err));
  } catch (error) {
    console.error("Firebase write error:", error);
  }

  // --- Send MSG91 SMS Confirmation ---
  if (order.phone) {
    if (order.festival) {
      // Festival Booking Ticket
      sendMsg91SMS('6a44c3bee9bec73631098c22', order.phone, {
        alphanumeric: order.name, // The first variable in DLT
        name: order.name, // In case mapped in MSG91 as ##name##
        festival: order.festival,
        date: order.date || new Date().toLocaleDateString(),
        ticket: orderId.substring(orderId.length - 6).toUpperCase(),
        url: 'https://iskconnellore.com'
      });
    } else {
      // General Donation Receipt
      sendMsg91SMS('6a44c3ef034572e8e305b062', order.phone, {
        alphanumeric: order.name, // First var
        name: order.name,
        numeric: (order.amount / 100).toString(),
        amount: (order.amount / 100).toString(),
        url: 'https://iskconnellore.com'
      });
    }
  }

  console.log('Verify success for order:', orderId);
  res.json({ success: true, order });
});

app.post('/submit-contact', (req, res) => {
  const { name, email, phone, message } = req.body;
  if (process.env.GOOGLE_APPS_SCRIPT_URL) {
    fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        formType: 'Contact',
        name: name || '',
        email: email || '',
        phone: phone || '',
        message: message || '',
        date: new Date().toISOString()
      })
    }).catch(err => console.error("Error sending Contact to Apps Script:", err));
  }
  res.json({ success: true });
});

app.get('/orders/:id', (req, res) => {
  const id = req.params.id;
  const order = orders[id];
  if (!order) return res.status(404).json({ error: 'not found' });
  res.json(order);
});

// --- DASHBOARD STATS (From Google Sheets) ---
app.get('/dashboard-stats', async (req, res) => {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return res.status(500).json({ error: 'Google Apps Script URL not configured.' });
  }

  try {
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from sheets: ${response.statusText}`);
    }
    const textData = await response.text();
    
    // Check if the response is HTML (meaning the script is returning an error page instead of JSON)
    if (textData.trim().startsWith('<')) {
      throw new Error('Google Apps Script returned an HTML error page. Make sure the doGet function is deployed correctly.');
    }

    const data = JSON.parse(textData);
    res.json(data);
  } catch (err) {
    console.error('Error fetching dashboard stats:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Payment Server listening on http://localhost:${PORT}`);
  console.log(`💳 Razorpay Status: ${razorpay ? '✅ Configured' : '⚠️ Not Configured'}`);
  console.log(`📱 MSG91 Status: ${process.env.MSG91_AUTH_KEY ? '✅ Configured' : '⚠️ Not Configured'}`);
  console.log(`🎂 Birthday Scheduler: Starting...`);
});
