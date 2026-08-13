import fetch from 'node-fetch';
import crypto from 'crypto';

const RAZORPAY_KEY_SECRET = 'n25YRIP4xcDtxHQEzEL7ocxh';
const API_URL = 'https://iskconnellore.com/.netlify/functions';

async function runTest() {
  console.log("1. Calling create-order...");
  const orderRes = await fetch(`${API_URL}/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: 1,
      name: "Sumanth Kodavati",
      phone: "9247338763",
      email: "test@example.com",
      claim80G: false,
      festival: "General Donation"
    })
  });
  
  const orderData = await orderRes.json();
  console.log("Create Order Response:", orderData);

  if (!orderData.orderId) {
    console.error("Failed to create order. Is Netlify Dev running with keys?");
    return;
  }

  console.log("\n2. Faking successful payment signature...");
  const orderId = orderData.orderId;
  const paymentId = "pay_fake123456789";
  
  const signature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  console.log("3. Calling verify-payment...");
  const verifyRes = await fetch(`${API_URL}/verify-payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      orderId,
      paymentId,
      signature,
      orderData: orderData.originalData
    })
  });

  const verifyData = await verifyRes.json();
  console.log("Verify Payment Response:", verifyData);
}

runTest().catch(console.error);
