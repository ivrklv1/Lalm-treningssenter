async function postJSON(url, data) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    throw new Error(e.error || 'Ukjent feil');
  }
  return res.json();
}

document.getElementById('year').textContent = new Date().getFullYear();

const form = document.getElementById('signupForm');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('msg');
    msg.textContent = 'Oppretter betaling…';
    const formData = new FormData(form);
    const payload = Object.fromEntries(formData.entries());
    payload.consent = formData.get('consent') === 'on';
    try {
      const resp = await postJSON('/create-checkout-session', payload);
      window.location.href = resp.url;
    } catch (err) {
      msg.textContent = err.message;
    }
  });
}