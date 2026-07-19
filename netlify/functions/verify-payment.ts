import crypto from 'crypto';
import type { Handler } from '@netlify/functions';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAiRwVZi3NWMALFOGuW9VFunYfRWY0qQIo",
  authDomain: "iskcon-nellore.firebaseapp.com",
  projectId: "iskcon-nellore",
  storageBucket: "iskcon-nellore.firebasestorage.app",
  messagingSenderId: "866388993763",
  appId: "1:866388993763:web:635954965e4f2e2127c7d6",
};
const firebaseApp = initializeApp(firebaseConfig);
const firestoreDb = getFirestore(firebaseApp);

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

async function sendMsg91SMS(templateId: string, mobile: string, variables: any) {
  const authKey = process.env.MSG91_AUTH_KEY;
  if (!authKey) {
    console.log('MSG91_AUTH_KEY not configured. Skipping SMS.');
    return;
  }
  
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
      recipients: [{ mobiles: cleanMobile, ...variables }]
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

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  if (!razorpayKeySecret) {
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Payment gateway not configured.' }) };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { orderId, paymentId, signature, orderData } = body;
    
    if (!orderId || !paymentId || !signature) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Missing payment details.' }) };
    }

    const expectedSignature = crypto
      .createHmac('sha256', razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    if (expectedSignature !== signature) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Invalid payment signature.' }) };
    }

    const order = { ...orderData, paid: true, paymentId, signature, paidAt: new Date().toISOString() };
    const amountFloat = Number(order.amount);

    if (process.env.GOOGLE_APPS_SCRIPT_URL) {
      fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          formType: order.festival ? 'Festivals' : 'Donation',
          name: order.name,
          email: order.email || '',
          phone: order.phone || '',
          amount: amountFloat,
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

    try {
      const transactionData = {
        formType: order.festival ? 'Festivals' : 'Donation',
        name: order.name,
        email: order.email || '',
        phone: order.phone || '',
        amount: amountFloat,
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
      
      const docRef = await addDoc(collection(firestoreDb, "transactions"), transactionData);
      console.log("Transaction written to Firebase with ID: ", docRef.id);
    } catch (error) {
      console.error("Firebase write error:", error);
    }

    if (order.phone) {
      if (order.festival) {
        sendMsg91SMS('6a44c3bee9bec73631098c22', order.phone, {
          alphanumeric: order.name,
          name: order.name,
          festival: order.festival,
          date: order.date || new Date().toLocaleDateString(),
          ticket: orderId.substring(orderId.length - 6).toUpperCase(),
          url: `https://iskconnellore.com/receipt/${orderId}`
        });
      } else {
        sendMsg91SMS('6a44c3ef034572e8e305b062', order.phone, {
          alphanumeric: order.name,
          name: order.name,
          numeric: amountFloat.toString(),
          amount: amountFloat.toString(),
          url: `https://iskconnellore.com/receipt/${orderId}`
        });
      }
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true, order }) };
  } catch (err) {
    console.error('Error verifying payment:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal Server Error' }) };
  }
};
