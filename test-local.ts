import crypto from 'crypto';

process.env.RAZORPAY_KEY_ID = 'rzp_live_TFDcPGL8Ydb11y';
process.env.RAZORPAY_KEY_SECRET = 'n25YRIP4xcDtxHQEzEL7ocxh';
process.env.MSG91_AUTH_KEY = '544713AzK9msYbnJ6a3d218eP1';
process.env.GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxZ-DlzUDiC-0TfPUPEo_GlMQCTE8ykJXY8CCt-TdrKmAb7DiwAFaJiIFLASEduh7JRdg/exec';

async function runLocalTest() {
  const { handler: createOrderHandler } = await import('./netlify/functions/create-order.js');
  const { handler: verifyPaymentHandler } = await import('./netlify/functions/verify-payment.js');

  console.log("1. Calling create-order locally...");
  
  const createEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      amount: 1,
      name: "Sumanth Kodavati (Internal Agent Test)",
      phone: "9247338763",
      email: "test@example.com",
      claim80G: false,
      festival: "General Donation"
    })
  };

  const createRes = await createOrderHandler(createEvent as any, {} as any);
  const orderData = JSON.parse(createRes.body);
  console.log("Create Order Response:", orderData);

  if (!orderData.orderId) {
    console.error("Failed to create order");
    return;
  }

  console.log("\n2. Faking successful payment signature...");
  const orderId = orderData.orderId;
  const paymentId = "pay_fakeInternalAgent99";
  
  const signature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  console.log("3. Calling verify-payment locally (This will send real SMS to 9247338763)...");
  
  const verifyEvent = {
    httpMethod: 'POST',
    body: JSON.stringify({
      orderId,
      paymentId,
      signature,
      orderData: orderData.originalData
    })
  };

  const verifyRes = await verifyPaymentHandler(verifyEvent as any, {} as any);
  console.log("Verify Payment Response:", JSON.parse(verifyRes.body));
}

runLocalTest().catch(console.error);
