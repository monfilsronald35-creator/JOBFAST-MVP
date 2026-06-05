import API from './api';

/**
 * Jwenn pwofil itilizatè ki konekte a
 */
export const getMyProfile = async () => {
  const { data } = await API.get('/users/profile');
  return data;
};

/**
 * Mete ajou estati disponibilite itilizatè a (Disponib, Okipe, elatriye)
 * @param {string} status - Nouvo estati a
 */
export const updateUserStatus = async (status) => {
  const { data } = await API.patch('/users/status', { status });
  return data;
};

/**
 * Mete ajou lòt enfòmasyon pwofil (Non, Telefòn, elatriye)
 */
export const updateProfile = async (userData) => {
  const { data } = await API.put('/users/profile', userData);
  return data;
};
