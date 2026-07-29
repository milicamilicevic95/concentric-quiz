// netlify/functions/submit-quiz.js

const AIRTABLE_BASE_ID = process.env.AIRTABLE_BASE_ID;
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const APPLICANTS_TABLE_ID = 'tbloJQ9g2Nblt2DlN';

const COUNCIL_RECORD_IDS = {
  'Transition': 'recZHAIGFcqxuj3kN',
  'Visibility & Momentum': 'rec6K7f1vDn0CwQrb',
  'Recalibration': 'recjeYz5V5Gsitwv4',
};

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch (err) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { firstName, email, council, answers } = payload;

  if (!email || !firstName) {
    return { statusCode: 400, body: 'Missing firstName or email' };
  }

  const preferredCouncilId = COUNCIL_RECORD_IDS[council];

  const fields = {
    'Name': firstName,
    'Email': email,
    'Applicant Status': 'New',
    'Source': 'Council quiz',
  };

  if (preferredCouncilId) {
    fields['Preferred Council'] = [preferredCouncilId];
  }

  if (answers) {
    fields['Notes'] = `Council quiz result: ${council || 'unmatched'}\nAnswers: ${JSON.stringify(answers)}`;
  }

  const res = await fetch(
    `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${APPLICANTS_TABLE_ID}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records: [{ fields }] }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error('Airtable error:', errText);
    return { statusCode: 502, body: 'Failed to save to Airtable' };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ok: true }),
  };
};
