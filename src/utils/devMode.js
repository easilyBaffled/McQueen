// Check if developer mode is enabled
// Dev mode can be enabled by:
// 1. Adding ?dev=true to the URL
// 2. Setting localStorage.setItem('mcqueen-dev-mode', 'true')
// Note: Running in development environment no longer auto-enables dev mode
// to provide a cleaner experience for UX testing

export function isDevMode() {
  // Check URL parameter
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dev') === 'true') {
      return true;
    }
  }

  // Check localStorage
  if (typeof localStorage !== 'undefined') {
    if (localStorage.getItem('mcqueen-dev-mode') === 'true') {
      return true;
    }
  }

  // Note: We no longer auto-enable for import.meta.env?.DEV
  // Developers should use ?dev=true or localStorage when needed

  return false;
}

// Enable dev mode (persists in localStorage)
export function enableDevMode() {
  localStorage.setItem('mcqueen-dev-mode', 'true');
  window.location.reload();
}

// Disable dev mode
export function disableDevMode() {
  localStorage.removeItem('mcqueen-dev-mode');
  window.location.reload();
}

