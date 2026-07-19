import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  try {
    const { name, email, phone, message } = JSON.parse(event.body || '{}');

    if (process.env.GOOGLE_APPS_SCRIPT_URL) {
      await fetch(process.env.GOOGLE_APPS_SCRIPT_URL, {
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
      });
    }

    return { statusCode: 200, headers, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error("Error submitting contact:", err);
    return { statusCode: 500, headers, body: JSON.stringify({ success: false }) };
  }
};
