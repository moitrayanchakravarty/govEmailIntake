import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app.jsx';
import './styles/tokens.css';
import './styles/base.css';

// Applied before first paint so a returning user's saved text-size
// preference doesn't flash at the default size for a frame. See
// AppHeader for where this gets written.
const savedTextSize = localStorage.getItem('textSize');
if (savedTextSize) {
  document.documentElement.dataset.textSize = savedTextSize;
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);