import Razorpay from 'razorpay';
import type { Handler } from '@netlify/functions';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
const razorpay = razorpayKeyId && razorpayKeySecret ? new Razorpay({
  key_id: razorpayKeyId,
  key_secret: razorpayKeySecret,
}) : null;

export const handler: Handler = async (event, context) => {
  // CORS Headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers, body: 'Method Not Allowed' };
  }

  if (!razorpay) {
    return { 
      statusCode: 500, 
      headers, 
      body: JSON.stringify({ error: 'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' }) 
    };
  }

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, phone, mobile, email, festival, date, slot, people, amount, claim80G, pan, address, templeLocation } = body;
    const phoneNumber = phone || mobile;
    const amountNumber = Number(amount);

    if (!amountNumber || amountNumber <= 0) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'Valid amount required.' }) };
    }

    const amountPaise = Math.round(amountNumber * 100);

    const orderOptions: any = {
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
        people: people?.toString() || '',
        templeLocation: templeLocation || 'ISKCON Nellore',
      },
    };

    // Razorpay Route
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
    } catch (err: any) {
      if (err.statusCode === 400 && err.error?.description === 'This transfer is not supported') {
        console.warn("Razorpay Route is not yet enabled on this account. Retrying without transfers.");
        delete orderOptions.transfers;
        order = await razorpay.orders.create(orderOptions);
      } else {
        throw err;
      }
    }

    // We no longer need an in-memory `orders` store, we just send everything back to the frontend
    // The frontend will send the complete data to `verify-payment`
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId: razorpayKeyId,
        amountInRupees: amountNumber,
        // Pass original details so verify-payment can process them
        originalData: {
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
          templeLocation: templeLocation || 'ISKCON Nellore'
        }
      }),
    };
  } catch (err: any) {
    console.error('Error creating Razorpay order', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Unable to create payment order.' }) };
  }
};
