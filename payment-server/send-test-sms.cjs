const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../payment-server/.env') });

async function sendTestSMS() {
  const authKey = process.env.MSG91_AUTH_KEY;
  const mobile = '919247338763';
  const orderId = 'order_TFEVQHFp6gZPw7';
  
  const options = {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      authkey: authKey
    },
    body: JSON.stringify({
      template_id: '6a44c3ef034572e8e305b062',
      short_url: '1',
      recipients: [
        {
          mobiles: mobile,
          alphanumeric: 'KODAVATI SUMANTH',
          name: 'KODAVATI SUMANTH',
          numeric: '1',
          amount: '1',
          url: `https://iskconnellore.com/receipt/${orderId}`
        }
      ]
    })
  };

  try {
    const res = await fetch('https://control.msg91.com/api/v5/flow', options);
    const data = await res.json();
    console.log('MSG91 Test SMS Result:', data);
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}

sendTestSMS();
