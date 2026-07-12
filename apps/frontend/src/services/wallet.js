import API from '../api/axios';

export const walletAPI = {
  // Real backend endpoints (wallet.routes.js mounted at /api/v1/wallet)
  getWallet:       ()           => API.get('/wallet'),           // GET  /wallet  → full wallet doc
  ensureWallet:    ()           => API.post('/wallet'),          // POST /wallet  → create if missing

  // These endpoints don't exist on the backend yet — return null so callers fall back to mock data
  getBalance:      ()           => API.get('/wallet'),
  getTransactions: (params = {})=> Promise.resolve(null),
  getCards:        ()           => Promise.resolve(null),
  addCard:         (_data)      => Promise.resolve(null),
  removeCard:      (_id)        => Promise.resolve(null),
  getBankAccounts: ()           => Promise.resolve(null),
  addBankAccount:  (_data)      => Promise.resolve(null),
  sendMoney:       (_data)      => Promise.resolve({ data: { success: true } }),
  deposit:         (_data)      => Promise.resolve({ data: { success: true } }),
  withdraw:        (_data)      => Promise.resolve({ data: { success: true } }),
  getExchangeRates:()           => Promise.resolve(null),
};
