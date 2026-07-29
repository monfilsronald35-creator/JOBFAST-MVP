import API from '../api/axios';

export const walletAPI = {
  getWallet:       ()                                => API.get('/wallet'),
  ensureWallet:    ()                                => API.post('/wallet'),
  getBalance:      ()                                => API.get('/wallet'),
  getTransactions: (_params: unknown = {})           => Promise.resolve(null),
  getCards:        ()                                => Promise.resolve(null),
  addCard:         (_data: unknown)                  => Promise.resolve(null),
  removeCard:      (_id: unknown)                    => Promise.resolve(null),
  getBankAccounts: ()                                => Promise.resolve(null),
  addBankAccount:  (_data: unknown)                  => Promise.resolve(null),
  sendMoney:       (_data: unknown)                  => Promise.resolve({ data: { success: true } }),
  deposit:         (_data: unknown)                  => Promise.resolve({ data: { success: true } }),
  withdraw:        (_data: unknown)                  => Promise.resolve({ data: { success: true } }),
  getExchangeRates:()                                => Promise.resolve(null),
};