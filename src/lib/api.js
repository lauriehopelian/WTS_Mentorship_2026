const BASE_URL = 'https://api.airtable.com/v0';

function getCredentials() {
  const token = localStorage.getItem('wts_airtable_token');
  const baseId = localStorage.getItem('wts_airtable_base');
  if (!token || !baseId) {
    throw new Error('Missing Airtable credentials. Please complete setup.');
  }
  return { token, baseId };
}

function headers(token) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

export async function getRecords(table, filterFormula = null, fields = null) {
  const { token, baseId } = getCredentials();
  const params = new URLSearchParams();
  if (filterFormula) params.set('filterByFormula', filterFormula);
  if (fields) fields.forEach(f => params.append('fields[]', f));
  params.set('pageSize', '100');

  let allRecords = [];
  let offset = null;

  do {
    if (offset) params.set('offset', offset);
    const url = `${BASE_URL}/${baseId}/${encodeURIComponent(table)}?${params.toString()}`;
    let res;
    try {
      res = await fetch(url, { headers: headers(token) });
    } catch {
      throw new Error('Connection failed. Please check your internet connection.');
    }
    if (res.status === 401) throw new Error('Invalid Airtable token. Please check your credentials in Settings.');
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Airtable error: ${err.error?.message || res.statusText}`);
    }
    const data = await res.json();
    allRecords = allRecords.concat(data.records || []);
    offset = data.offset || null;
  } while (offset);

  return allRecords;
}

export async function createRecord(table, fields) {
  const { token, baseId } = getCredentials();
  const url = `${BASE_URL}/${baseId}/${encodeURIComponent(table)}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'POST',
      headers: headers(token),
      body: JSON.stringify({ fields }),
    });
  } catch {
    throw new Error('Connection failed. Please check your internet connection.');
  }
  if (res.status === 401) throw new Error('Invalid Airtable token. Please check your credentials in Settings.');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Airtable error: ${err.error?.message || res.statusText}`);
  }
  return res.json();
}

export async function updateRecord(table, id, fields) {
  const { token, baseId } = getCredentials();
  const url = `${BASE_URL}/${baseId}/${encodeURIComponent(table)}/${id}`;
  let res;
  try {
    res = await fetch(url, {
      method: 'PATCH',
      headers: headers(token),
      body: JSON.stringify({ fields }),
    });
  } catch {
    throw new Error('Connection failed. Please check your internet connection.');
  }
  if (res.status === 401) throw new Error('Invalid Airtable token. Please check your credentials in Settings.');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Airtable error: ${err.error?.message || res.statusText}`);
  }
  return res.json();
}

export async function deleteRecord(table, id) {
  const { token, baseId } = getCredentials();
  const url = `${BASE_URL}/${baseId}/${encodeURIComponent(table)}/${id}`;
  let res;
  try {
    res = await fetch(url, { method: 'DELETE', headers: headers(token) });
  } catch {
    throw new Error('Connection failed. Please check your internet connection.');
  }
  if (res.status === 401) throw new Error('Invalid Airtable token. Please check your credentials in Settings.');
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Airtable error: ${err.error?.message || res.statusText}`);
  }
  return res.json();
}
