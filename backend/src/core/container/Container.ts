type Factory<T> = () => T;

class DIContainer {
  private readonly _singletons  = new Map<string, unknown>();
  private readonly _factories   = new Map<string, Factory<unknown>>();
  private readonly _transients  = new Map<string, Factory<unknown>>();

  // Register a singleton (instantiated once, reused on every resolve)
  singleton<T>(token: string, factory: Factory<T>): void {
    this._factories.set(token, factory as Factory<unknown>);
  }

  // Register a transient (new instance on every resolve)
  transient<T>(token: string, factory: Factory<T>): void {
    this._transients.set(token, factory as Factory<unknown>);
  }

  // Register an already-constructed value
  value<T>(token: string, instance: T): void {
    this._singletons.set(token, instance);
  }

  resolve<T>(token: string): T {
    // Already-constructed singleton
    if (this._singletons.has(token)) {
      return this._singletons.get(token) as T;
    }

    // Lazy singleton factory
    if (this._factories.has(token)) {
      const factory  = this._factories.get(token)!;
      const instance = factory();
      this._singletons.set(token, instance);
      return instance as T;
    }

    // Transient
    if (this._transients.has(token)) {
      return (this._transients.get(token)!() as T);
    }

    throw new Error(`[Container] Token "${token}" not registered`);
  }

  has(token: string): boolean {
    return this._singletons.has(token) || this._factories.has(token) || this._transients.has(token);
  }
}

// Process-wide DI container
export const container = new DIContainer();

// Tokens — prevents magic string typos
export const TOKENS = {
  // Core
  EventBus:       'EventBus',
  Database:       'Database',
  Cache:          'Cache',
  Logger:         'Logger',

  // Auth
  AuthRepo:       'AuthRepo',
  AuthService:    'AuthService',

  // Users
  UserRepo:       'UserRepo',
  UserService:    'UserService',

  // Jobs
  JobRepo:        'JobRepo',
  JobService:     'JobService',

  // Notifications
  NotifRepo:      'NotifRepo',
  NotifService:   'NotifService',

  // Marketplace
  MarketplaceRepo:     'MarketplaceRepo',
  MarketplaceService:  'MarketplaceService',

  // Wallet
  WalletRepo:     'WalletRepo',
  WalletService:  'WalletService',

  // Payments
  PaymentRepo:    'PaymentRepo',
  PaymentService: 'PaymentService',

  // Media
  MediaRepo:      'MediaRepo',
  MediaService:   'MediaService',

  // Search
  SearchService:  'SearchService',

  // AI
  AIService:      'AIService',

  // Chat
  ChatRepo:       'ChatRepo',
  ChatService:    'ChatService',

  // Analytics
  AnalyticsService: 'AnalyticsService',
} as const;

export type Token = typeof TOKENS[keyof typeof TOKENS];
