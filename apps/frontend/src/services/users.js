import API from './api';

/**
 * 👤 JOBFAST USER & PROFILE SERVICE
 * Jere tout operasyon ki gen rapò ak pwofil, kontak, ak estati travayè yo.
 */

/**
 * Jwenn pwofil konplè itilizatè ki konekte aktyèl la
 */
export const getMyProfile = async () => {
  try {
    const { data } = await API.get('/users/profile');
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Nou pa ka chaje enfòmasyon pwofil ou nan moman sa a.";
    throw new Error(message);
  }
};

/**
 * Mete ajou estati disponibilite travayè a (disponib, busy, working, offline)
 * @param {string} status - Nouvo estati a
 */
export const updateUserStatus = async (status) => {
  try {
    // Nou asire estati a pase an ti lèt (lowercase) pou liyen ak STATUS_CONFIG nou nan UI a
    const normalizedStatus = typeof status === "string" ? status.toLowerCase() : status;
    
    const { data } = await API.patch('/users/status', { status: normalizedStatus });
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Erè pandan n t ap mete ajou estati disponiblite w.";
    throw new Error(message);
  }
};

/**
 * Mete ajou enfòmasyon pwofil yo (Non, Bio, Telefòn, Kote w ye, elatriye)
 * @param {Object} userData - Done pou modifye yo
 */
export const updateProfile = async (userData) => {
  try {
    const { data } = await API.put('/users/profile', userData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Nou pa ka sove chanjman sa yo. Verifye si fòma yo bon.";
    throw new Error(message);
  }
};
