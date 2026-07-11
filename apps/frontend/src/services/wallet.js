import API from '../api/axios';

export const walletAPI = {
  getBalance:      ()           => API.get('/wallet/balance'),
  getTransactions: (params = {})=> API.get('/wallet/transactions', { params }),
  getCards:        ()           => API.get('/wallet/cards'),
  addCard:         (data)       => API.post('/wallet/cards', data),
  removeCard:      (id)         => API.delete(`/wallet/cards/${id}`),
  getBankAccounts: ()           => API.get('/wallet/bank-accounts'),
  addBankAccount:  (data)       => API.post('/wallet/bank-accounts', data),
  sendMoney:       (data)       => API.post('/wallet/send', data),
  deposit:         (data)       => API.post('/wallet/deposit', data),
  withdraw:        (data)       => API.post('/wallet/withdraw', data),
  getExchangeRates:()           => API.get('/wallet/exchange-rates'),
};
