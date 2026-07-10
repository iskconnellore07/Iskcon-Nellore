#!/usr/bin/env node
// Script to fetch birthday records from Supabase and send SMS via Twilio.
// Run with Node 18+ (GitHub Actions runner has Node 18)

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Supabase removed — we use Firebase (Firestore) or SAMPLE mode.
// Twilio credentials. Support the new GitHub secret names as fallbacks
// - TWILIO_ORGANIZATION_SID (mapped to TWILIO_SID)
// - TWILIO_2FA (mapped to TWILIO_AUTH_TOKEN)
const TWILIO_SID = process.env.TWILIO_SID || process.env.TWILIO_ORGANIZATION_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN || process.env.TWILIO_2FA;
const TWILIO_FROM = process.env.TWILIO_FROM || process.env.TWILIO_FROM_NUMBER || process.env.TWILIO_FROM_PHONE;

// Firebase: support server-side access via service account JSON (set as secret FIREBASE_SERVICE_ACCOUNT)
// The env can be either the raw JSON string or a base64-encoded JSON string.
const FIREBASE_SERVICE_ACCOUNT = process.env.FIREBASE_SERVICE_ACCOUNT || null;


// Detect sample mode via env or CLI arg
const args = process.argv.slice(2);
const SAMPLE_MODE = process.env.SAMPLE === 'true' || args.includes('--sample');
const USE_LOCAL_DATA = process.env.USE_LOCAL_DATA === 'true' || args.includes('--local-data');

// New: support immediate send to a specific id and custom message
const idArg = args.find((a) => a.startsWith('--send-id='));
const SEND_ID = idArg ? idArg.split('=')[1] : process.env.SEND_ID || null;
const msgArg = args.find((a) => a.startsWith('--message='));
const CUSTOM_MESSAGE = msgArg ? decodeURIComponent(msgArg.split('=')[1]) : process.env.CUSTOM_MESSAGE || null;

// Health-check: `--health` or `--check` or env `HEALTH_CHECK=true`
const HEALTH_CHECK = process.env.HEALTH_CHECK === 'true' || args.includes('--health') || args.includes('--check');

if (HEALTH_CHECK) {
  console.log('Health check — environment presence:');
  const checks = [
    ['SAMPLE_MODE', SAMPLE_MODE],
    ['FIREBASE_SERVICE_ACCOUNT', !!FIREBASE_SERVICE_ACCOUNT],
    ['TWILIO_SID', !!TWILIO_SID],
    ['TWILIO_AUTH_TOKEN', !!TWILIO_AUTH_TOKEN],
    ['TWILIO_FROM', !!TWILIO_FROM],
  ];
  for (const [k, v] of checks) {
    console.log(`- ${k}: ${v ? 'present' : 'missing'}`);
  }
  process.exit(0);
}

if (!SAMPLE_MODE) {
  // In production (non-SAMPLE) mode, Firebase and Twilio credentials are required
  if (!FIREBASE_SERVICE_ACCOUNT && !USE_LOCAL_DATA) {
    console.warn('Warning: FIREBASE_SERVICE_ACCOUNT not set; will fail to fetch birthdays.');
  }
  if (!TWILIO_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM) {
    console.error('Missing Twilio credentials (TWILIO_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM)');
    process.exit(1);
  }
} else {
  console.log('Running in SAMPLE mode — no real network requests will be made.');
}

async function fetchBirthdays() {
  if (SAMPLE_MODE || USE_LOCAL_DATA) {
    const p = path.resolve(__dirname, 'sample_birthdays.json');
    const txt = await fs.readFile(p, 'utf-8');
    return JSON.parse(txt);
  }
  // Firebase path (preferred if FIREBASE_SERVICE_ACCOUNT present)
  if (FIREBASE_SERVICE_ACCOUNT) {
    // Dynamically import firebase-admin to avoid requiring it for Supabase-only users
    const admin = await import('firebase-admin');

    // Parse service account JSON (allow raw JSON or base64-encoded)
    let sa;
    try {
      sa = JSON.parse(FIREBASE_SERVICE_ACCOUNT);
    } catch (e) {
      // try base64 decode
      const decoded = Buffer.from(FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
      sa = JSON.parse(decoded);
    }

    // Initialize if not already
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(sa),
      });
    }

    const db = admin.firestore();
    const snapshot = await db.collection('birthdays').get();
    const rows = [];
    snapshot.forEach((doc) => {
      const data = doc.data() || {};
      rows.push(Object.assign({ id: doc.id }, data));
    });
    return rows;
  }
  // If we reach here and not in SAMPLE_MODE, Firebase is required.
  if (!SAMPLE_MODE) {
    throw new Error('No Firebase credentials provided. Set FIREBASE_SERVICE_ACCOUNT or run in SAMPLE mode.');
  }
  // SAMPLE_MODE handled earlier, so return empty as fallback
  return [];
}

function isBirthdayToday(dateString) {
  // Accepts ISO date strings; compare month & day only
  const d = new Date(dateString);
  const now = new Date();
  return d.getUTCDate() === now.getUTCDate() && (d.getUTCMonth() === now.getUTCMonth());
}

async function sendSms(to, body) {
  if (SAMPLE_MODE) {
    // Mock send in sample mode
    console.log(`(MOCK) Would send SMS to ${to}:\n${body}\n`);
    return Promise.resolve(`MOCK_OK:${to}`);
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`;
  const params = new URLSearchParams({
    To: to,
    From: TWILIO_FROM,
    Body: body,
  });

  const auth = Buffer.from(`${TWILIO_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Twilio error ${res.status}: ${text}`);
  }
  return text;
}

(async () => {
  try {
    const rows = await fetchBirthdays();

    // If SEND_ID provided, target that single record immediately
    let targets = [];
    if (SEND_ID) {
      const person = rows.find((r) => String(r.id) === String(SEND_ID));
      if (!person) {
        console.error(`No person found with id=${SEND_ID}`);
        process.exit(1);
      }
      targets = [person];
      console.log(`Sending immediate notification to id=${SEND_ID} (${person.name || 'unknown'})`);
    } else {
      const todays = rows.filter((r) => r.birthday && isBirthdayToday(r.birthday));
      targets = todays;
      console.log(`Found ${targets.length} birthday(s) today.`);
    }

    for (const person of targets) {
      const name = person.name || 'Friend';
      const age = person.age ? String(person.age) : '';
      const phone = person.phone_number || person.phone || person.mobile;
      const email = person.email || '';

      if (!phone) {
        console.warn(`Skipping ${name}: no phone number`);
        continue;
      }

      // Use custom message if provided (SEND_ID immediate uses CUSTOM_MESSAGE if given)
      const message = CUSTOM_MESSAGE || `Lord Krishna Blessed You`;

      try {
        const resp = await sendSms(phone, message);
        console.log(`Sent SMS to ${name} (${phone}): ${resp}`);
      } catch (err) {
        console.error(`Failed to send SMS to ${name} (${phone}):`, err.message || err);
      }
    }
  } catch (err) {
    console.error('Error running birthday SMS job:', err.message || err);
    process.exit(1);
  }
})();
