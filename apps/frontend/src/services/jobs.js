import API from './api';

/**
 * Jwenn tout travay ki disponib yo
 * @param {Object} params - Filtè (egzanp: { city: 'Santo Domingo', type: 'construction' })
 */
export const getAllJobs = async (params = {}) => {
  const { data } = await API.get('/jobs', { params });
  return data;
};

/**
 * Kreye yon nouvo travay (Post)
 * @param {Object} jobData - Done travay la
 */
export const createJob = async (jobData) => {
  const { data } = await API.post('/posts/create', jobData);
  return data;
};

/**
 * Jwenn detay yon travay an patikilye
 * @param {string} id - ID travay la
 */
export const getJobById = async (id) => {
  const { data } = await API.get(`/posts/${id}`);
  return data;
};

/**
 * Mete ajou yon travay (Si itilizatè a se pwopriyetè a)
 */
export const updateJob = async (id, jobData) => {
  const { data } = await API.put(`/posts/${id}`, jobData);
  return data;
};

/**
 * Efase yon travay
 */
export const deleteJob = async (id) => {
  const { data } = await API.delete(`/posts/${id}`);
  return data;
};
