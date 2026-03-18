window.MINKA_SYNC = window.MINKA_SYNC || {
  provider: 'gist',
  gistId: '',
  gistToken: ''
};

// Optional legacy fallbacks.
window.MINKA_GIST_ID = window.MINKA_GIST_ID || window.MINKA_SYNC.gistId || '';
window.MINKA_GIST_TOKEN = window.MINKA_GIST_TOKEN || window.MINKA_SYNC.gistToken || '';

// Notes:
// - Leave these empty for local-only emoji saving in this browser/PWA.
// - Levels are computed from schedule data automatically; there is no separate level setting to save.
// - If you put a GitHub token in a static site, it is exposed to anyone who can view the site source.
