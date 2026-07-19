import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' };
  if (event.httpMethod !== 'GET') return { statusCode: 405, headers, body: 'Method Not Allowed' };

  const scriptUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
  if (!scriptUrl) {
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'Google Apps Script URL not configured.' }) };
  }

  try {
    const response = await fetch(scriptUrl);
    if (!response.ok) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: `Failed to fetch from sheets: ${response.statusText}` }) };
    }
    const textData = await response.text();
    
    if (textData.trim().startsWith('<')) {
      return { statusCode: 502, headers, body: JSON.stringify({ error: 'Google Apps Script returned HTML. Verify doGet is deployed correctly.' }) };
    }

    return { statusCode: 200, headers, body: textData }; // textData is already JSON string
  } catch (err: any) {
    console.error('Error fetching dashboard stats:', err);
    return { statusCode: 500, headers, body: JSON.stringify({ error: err.message }) };
  }
};
