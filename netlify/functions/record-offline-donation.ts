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

  try {
    const body = JSON.parse(event.body || '{}');
    const { name, phone, email, address, amount, pan, pincode, date, paymentMethod, referenceId, claim80G, branchId, locationName } = body;
    
    if (!name || !amount) {
      return { statusCode: 400, headers, body: JSON.stringify({ success: false, message: 'Name and amount are required.' }) };
    }

    const orderId = `offline_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const amountFloat = Number(amount);

    const transactionData = {
      formType: 'Offline',
      name,
      email: email || '',
      phone: phone || '',
      amount: amountFloat,
      date: date || new Date().toISOString().split('T')[0],
      paymentId: referenceId || `off_${Date.now()}`,
      orderId: orderId,
      festival: 'Offline Donation',
      slot: '',
      people: '',
      pan: pan || '',
      address: address || '',
      pincode: pincode || '',
      claim80G: claim80G ? true : false,
      timestamp: new Date().toISOString(),
      branchId: branchId || 'nellore',
      location: locationName || 'ISKCON Nellore',
      paymentMethod: paymentMethod || 'Cash'
    };

    // Save to Firestore
    const docRef = await addDoc(collection(firestoreDb, "transactions"), transactionData);
    console.log("Offline Transaction written to Firebase with ID: ", docRef.id);

    // Sync to Google Sheets if environment config is present
    if (process.env.GOOGLE_APPS_SCRIPT_URL) {
      try {
        await fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formType: 'Offline',
            name: transactionData.name,
            email: transactionData.email,
            phone: transactionData.phone,
            amount: transactionData.amount,
            date: transactionData.date,
            paymentId: transactionData.paymentId,
            orderId: transactionData.orderId,
            festival: transactionData.festival,
            slot: '',
            people: '',
            pan: transactionData.pan,
            address: transactionData.address,
            pincode: transactionData.pincode,
            claim80G: transactionData.claim80G
          })
        });
      } catch (err) {
        console.error("Error sending to Apps Script for offline donation:", err);
      }
    }

    // Send SMS via MSG91
    if (phone) {
      await sendMsg91SMS('6a44c3ef034572e8e305b062', phone, {
        alphanumeric: name,
        name: name,
        numeric: amountFloat.toString(),
        amount: amountFloat.toString(),
        url: `https://iskconnellore.com/receipt/${orderId}`
      });
    }

    return { 
      statusCode: 200, 
      headers, 
      body: JSON.stringify({ 
        success: true, 
        message: 'Offline donation recorded successfully.', 
        transactionId: docRef.id,
        orderId 
      }) 
    };
  } catch (err: any) {
    console.error('Error recording offline donation:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false, message: 'Internal Server Error' }) };
  }
};
