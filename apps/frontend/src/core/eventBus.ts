const BUS_TARGET: EventTarget = window;

export const Events = {
  USER_LOGGED_IN:    'jf:user:logged_in',
  USER_LOGGED_OUT:   'jf:user:logged_out',
  TOKEN_REFRESHED:   'jf:token:refreshed',
  AUTH_ERROR:        'jf:auth:error',
  NAVIGATE:          'jf:navigate',
  MODAL_OPEN:        'jf:modal:open',
  MODAL_CLOSE:       'jf:modal:close',
  JOB_CREATED:       'jf:job:created',
  BOOKING_UPDATED:   'jf:booking:updated',
  WALLET_UPDATED:    'jf:wallet:updated',
  NOTIFICATION_NEW:  'jf:notification:new',
  NOTIFICATION_READ: 'jf:notification:read',
  OFFLINE:           'jf:offline',
  ONLINE:            'jf:online',
  MESSAGE_RECEIVED:  'jf:message:received',
  TYPING_START:      'jf:typing:start',
  TYPING_STOP:       'jf:typing:stop',
  SEARCH_RESULTS:    'jf:search:results',
} as const;

export type EventName = (typeof Events)[keyof typeof Events];

export type EventHandler<T = unknown> = (detail: T, event: CustomEvent<T>) => void;

type Wrapper = (e: Event) => void;

export function emit(event: string, detail: unknown = {}): void {
  BUS_TARGET.dispatchEvent(new CustomEvent(event, { detail, bubbles: false }));
}

export function on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
  const wrapper: Wrapper = (e) => handler((e as CustomEvent<T>).detail, e as CustomEvent<T>);
  BUS_TARGET.addEventListener(event, wrapper);
  return () => BUS_TARGET.removeEventListener(event, wrapper);
}

export function once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
  const off = on<T>(event, (...args) => { handler(...args); off(); });
  return off;
}

const eventBus = { emit, on, once, Events };
export default eventBus;