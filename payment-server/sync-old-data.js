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

async function syncData() {
  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    console.error('Google Apps Script URL not configured.');
    return;
  }

  console.log("Fetching old data from Google Sheets...");
  try {
    const response = await fetch(scriptUrl);
    if (!response.ok) throw new Error(`Failed to fetch from sheets: ${response.statusText}`);
    
    const textData = await response.text();
    if (textData.trim().startsWith('<')) throw new Error('Google Apps Script returned an HTML error page.');
    
    const data = JSON.parse(textData);
    console.log(`Found ${data.length} records in Google Sheets.`);

    let count = 0;
    for (const row of data) {
      let amount = row.amount || 0;
      if (typeof amount === 'string') amount = parseFloat(amount.replace(/[^0-9.-]+/g,""));
      
      const transactionData = {
        formType: row.formType || 'Donation',
        name: row.name || '',
        email: row.email || '',
        phone: row.phone || row['Phone Number'] || '',
        amount: amount,
        date: row.date || new Date().toISOString(),
        paymentId: row.paymentId || row['Payment ID'] || '',
        orderId: row.orderId || row['Order ID'] || '',
        festival: row.festival || '',
        slot: row.slot || '',
        people: row.people || '',
        pan: row.pan || row['PAN'] || row['PAN '] || '',
        address: row.address || '',
        claim80G: row.claim80G || row['80G'] || false,
        timestamp: row.timestamp || row.date || new Date().toISOString()
      };

      try {
        await addDoc(collection(firestoreDb, "transactions"), transactionData);
        count++;
        process.stdout.write(`\rImported ${count} of ${data.length} records...`);
      } catch (err) {
        console.error("Error adding document: ", err.message);
      }
    }
    
    console.log(`\n\n✅ Successfully synced ${count} records to Firebase!`);
    process.exit(0);
  } catch (err) {
    console.error('Error syncing stats:', err);
    process.exit(1);
  }
}

syncData();
