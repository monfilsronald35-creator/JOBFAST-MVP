import API from './api';

/**
 * 💼 JOBFAST POSTS & JOBS SERVICE
 * Jere tout operasyon CRUD pou opòtinite ak pòs travay sou backend lan.
 */

/**
 * Jwenn tout travay ak pòs ki disponib yo (ak filtè opsyonèl)
 * @param {Object} params - Filtè koutim (egzanp: { category: 'construction', nearby: true })
 */
export const getAllJobs = async (params = {}) => {
  try {
    // Inifye anba '/posts' si se la tout done yo santralize sou backend lan
    const { data } = await API.get('/posts', { params });
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Nou pa ka chaje lis opòtinite yo nan moman sa a.";
    throw new Error(message);
  }
};

/**
 * Kreye yon nouvo pòs oswa travay
 * @param {Object} jobData - Done fòm kreyasyon an
 */
export const createJob = async (jobData) => {
  try {
    const { data } = await API.post('/posts/create', jobData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Erè pandan kreyasyon pòs la. Tanpri verifye done yo.";
    throw new Error(message);
  }
};

/**
 * Jwenn detay konplè yon travay an patikilye selon ID li
 * @param {string} id - ID inik pòs la
 */
export const getJobById = async (id) => {
  try {
    const { data } = await API.get(`/posts/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Nou pa jwenn detay pou pòs sa a.";
    throw new Error(message);
  }
};

/**
 * Mete ajou done yon travay (Si itilizatè a konekte a se pwopriyetè a)
 * @param {string} id - ID inik pòs la
 * @param {Object} jobData - Done pou modifye yo
 */
export const updateJob = async (id, jobData) => {
  try {
    const { data } = await API.put(`/posts/${id}`, jobData);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Ou pa gen dwa pou modifye pòs sa a.";
    throw new Error(message);
  }
};

/**
 * Efase yon pòs nèt nan sistèm lan
 * @param {string} id - ID inik pòs la
 */
export const deleteJob = async (id) => {
  try {
    const { data } = await API.delete(`/posts/${id}`);
    return data;
  } catch (error) {
    const message = error.response?.data?.message || "Nou pa ka efase pòs sa a. Rezo w la ka gen pwoblèm.";
    throw new Error(message);
  }
};
