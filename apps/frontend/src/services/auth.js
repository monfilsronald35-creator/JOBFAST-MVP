import API from './api';

/**
 * 🔐 JOBFAST AUTHENTICATION SERVICE
 * Jere tout kominikasyon ak wout otantifikasyon sou backend lan.
 */

export const login = async (credentials) => {
  try {
    const { data } = await API.post('/auth/login', credentials);
    // Nou sèlman retounen done yo bay AuthContext la, 
    // se li menm k ap pran desizyon pou l ekri nan localStorage la san danje.
    return data;
  } catch (error) {
    // Ekstrè mesaj erè backend la bay la, si l pa genyen, bay yon mesaj jenerik
    const message = error.response?.data?.message || "Erè pandan koneksyon an. Rezo w la ka gen pwoblèm.";
    throw new Error(message);
  }
};

export const register = async (userData) => {
  try {
    const { data } = await API.post('/auth/register', userData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Erè pandan enskripsyon an. Tanpri verifye enfòmasyon yo.";
    throw new Error(message);
  }
};

export const getCurrentUser = async () => {
  try {
    const { data } = await API.get('/auth/me');
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Nou pa ka rekipere enfòmasyon pwofil ou.";
    throw new Error(message);
  }
};

// Nòt: logout() pa bezwen la ankò piske se AuthContext ki efase 'jobfast_user' nèt.
