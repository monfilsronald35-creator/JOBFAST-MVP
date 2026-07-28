/**
 * Frontend Event Bus — browser-native CustomEvent wrapper
 * Keeps components decoupled; mirrors backend event names
 */

const BUS_TARGET = window; // or a dedicated EventTarget()

export const Events = {
  // Auth
  USER_LOGGED_IN:     'jf:user:logged_in',
  USER_LOGGED_OUT:    'jf:user:logged_out',
  TOKEN_REFRESHED:    'jf:token:refreshed',
  AUTH_ERROR:         'jf:auth:error',

  // Navigation
  NAVIGATE:           'jf:navigate',
  MODAL_OPEN:         'jf:modal:open',
  MODAL_CLOSE:        'jf:modal:close',

  // Data
  JOB_CREATED:        'jf:job:created',
  BOOKING_UPDATED:    'jf:booking:updated',
  WALLET_UPDATED:     'jf:wallet:updated',

  // Notifications
  NOTIFICATION_NEW:   'jf:notification:new',
  NOTIFICATION_READ:  'jf:notification:read',

  // Offline
  OFFLINE:            'jf:offline',
  ONLINE:             'jf:online',

  // Chat
  MESSAGE_RECEIVED:   'jf:message:received',
  TYPING_START:       'jf:typing:start',
  TYPING_STOP:        'jf:typing:stop',

  // Search
  SEARCH_RESULTS:     'jf:search:results',
};

export function emit(event, detail = {}) {
  BUS_TARGET.dispatchEvent(new CustomEvent(event, { detail, bubbles: false }));
}

export function on(event, handler) {
  const wrapper = e => handler(e.detail, e);
  BUS_TARGET.addEventListener(event, wrapper);
  return () => BUS_TARGET.removeEventListener(event, wrapper);
}

export function once(event, handler) {
  const off = on(event, (...args) => { handler(...args); off(); });
  return off;
}

// React hook helper
export function useEventBus(event, handler, deps = []) {
  // Import React dynamically to avoid bundling issues
  // Usage in component: useEventBus(Events.NOTIFICATION_NEW, (data) => { ... })
  const { useEffect } = window.__REACT__ || {};
  if (useEffect) {
    useEffect(() => {
      const off = on(event, handler);
      return off;
    }, deps);
  }
}

const eventBus = { emit, on, once, Events };
export default eventBus;
