import API from './api';

/**
 * Fonksyon pou konekte yon itilizatè
 * @param {Object} credentials - { phone, password }
 */
export const login = async (credentials) => {
  const { data } = await API.post('/auth/login', credentials);
  if (data.token) {
    localStorage.setItem('token', data.token);
  }
  return data;
};

/**
 * Fonksyon pou kreye yon nouvo kont
 * @param {Object} userData - Done itilizatè a
 */
export const register = async (userData) => {
  const { data } = await API.post('/auth/register', userData);
  return data;
};

/**
 * Fonksyon pou dekonnekte (Logout)
 */
export const logout = () => {
  localStorage.removeItem('token');
  // Si ou gen lòt bagay ou bezwen retire nan store-la, ajoute yo isit la
  window.location.href = '/login'; 
};

/**
 * Fonksyon pou jwenn enfòmasyon itilizatè konekte a
 */
export const getCurrentUser = async () => {
  const { data } = await API.get('/auth/me');
  return data;
};
