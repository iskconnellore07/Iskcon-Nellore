const crypto = require('crypto');

async function testFullFlow() {
  console.log("1. Creating order...");
  const res1 = await fetch('http://localhost:4000/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      amount: 1, 
      name: 'Agent Test', 
      phone: '9999999999', 
      festival: 'Janmashtami' 
    })
  });
  const orderData = await res1.json();
  console.log('Order created:', orderData);
  
  if (!orderData.orderId) {
     console.log('Failed to create order. Is Razorpay configured?'); 
     return;
  }

  console.log("\n2. Generating fake signature (simulating successful Razorpay payment)...");
  const secret = 'oH3HPi581M9tJtgNQoJWF53s';
  const fakePaymentId = 'pay_test_' + Date.now();
  const signature = crypto.createHmac('sha256', secret)
                          .update(orderData.orderId + '|' + fakePaymentId)
                          .digest('hex');

  console.log("\n3. Verifying payment and triggering Google Apps Script...");
  const res2 = await fetch('http://localhost:4000/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      orderId: orderData.orderId, 
      paymentId: fakePaymentId, 
      signature 
    })
  });
  
  const verifyData = await res2.json();
  console.log('Verification Response:', verifyData);
  console.log("\n✅ If the response says success: true, it means the server successfully verified the payment and forwarded the data to Google Sheets!");
}

testFullFlow();
