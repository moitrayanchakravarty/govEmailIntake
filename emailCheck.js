const emailInput = document.getElementById('email');
const statusEl = document.getElementById('status');

let debounceTimer;
let activeController;

emailInput.addEventListener('input', (e) => {
  const email = e.target.value.trim();
  clearTimeout(debounceTimer);

  const looksLikeEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!looksLikeEmail) {
    statusEl.textContent = '';
    return;
  }

  statusEl.textContent = 'Checking...';

  debounceTimer = setTimeout(() => {
    checkEmailAvailability(email);
  }, 400);
});

async function checkEmailAvailability(email) {
  if (activeController) {
    activeController.abort();
  }
  activeController = new AbortController();

  try {
    const response = await fetch(
      `/api/employees/check-email?email=${encodeURIComponent(email)}`,
      { signal: activeController.signal }
    );
    const data = await response.json();

    if (data.available) {
      statusEl.textContent = 'Available';
      statusEl.style.color = 'green';
    } else {
      statusEl.textContent = 'Already taken';
      statusEl.style.color = 'red';
    }
  } catch (err) {
    if (err.name === 'AbortError') return;
    statusEl.textContent = 'Error checking email';
    statusEl.style.color = 'gray';
  }
}