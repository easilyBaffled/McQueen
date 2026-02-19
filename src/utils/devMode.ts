export function isDevMode(): boolean {
  if (typeof window !== 'undefined') {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('dev') === 'true') {
      return true;
    }
  }

  if (typeof localStorage !== 'undefined') {
    if (localStorage.getItem('mcqueen-dev-mode') === 'true') {
      return true;
    }
  }

  return false;
}

export function enableDevMode(): void {
  localStorage.setItem('mcqueen-dev-mode', 'true');
  window.location.reload();
}

export function disableDevMode(): void {
  localStorage.removeItem('mcqueen-dev-mode');
  window.location.reload();
}
