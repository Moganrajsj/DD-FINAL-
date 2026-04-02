import axios from 'axios';

const STORAGE_KEY = 'dealsdoubled_session_id';

export function getMarketplaceSessionId() {
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export async function trackMarketplaceEvent(eventType, payload = {}) {
  try {
    await axios.post('/api/analytics/track', {
      event_type: eventType,
      session_id: getMarketplaceSessionId(),
      ...payload,
    });
  } catch (error) {
    console.error(`Failed to track marketplace event: ${eventType}`, error);
  }
}
