import axios from "axios";

// 1. KREYASYON INSTANS API
// Piske backend JobFast-RD a ap deplwaye sou Render, nou itilize varyab anviwònman (.env)
const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "https://jobfast-backend.onrender.com/v1",
  timeout: 15000, // 15 segonn maksimòm pou yon demann anpeche aplikasyon an bloke si rezo a dous
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
  },
});

// 2. REQUEST INTERCEPTOR: ATRAKSYON TOKEN OTOMATIK
API.interceptors.request.use(
  (config) => {
    try {
      // Nou rekipere done itilizatè a ki gen token an anndan estrikti inivèsèl nou an
      const savedUser = localStorage.getItem("jobfast_user");
      
      if (savedUser) {
        const { token } = JSON.parse(savedUser);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    } catch (err) {
      console.error("[JOBFAST API]: Erè nan lekti token nan depo a:", err);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. RESPONSE INTERCEPTOR: JESYON ERÈ AK SESYON EKSPYRE (401)
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response: res, code } = error;

    // Jere ka kote sèvè Render la ap pran tan pou l leve (Cold Start) oswa rezo a koupe
    if (code === "ECONNABORTED" || !res) {
      console.warn("[JOBFAST API]: Rezo a dous oswa sèvè a ap demare...");
    }

    // Si token an envalid oswa sesyon an ekspire (401)
    if (res?.status === 401) {
      console.error("[JOBFAST API]: Sesyon an ekspire (401 Unauthorized). Clean-up an kour...");
      
      try {
        // Efase done sesyon yo pou fòse aplikasyon an redirije sou paj Login grasa useAuth
        localStorage.removeItem("jobfast_user");
        
        // Evite window.location.href toudenkou pou pa kase UX la, 
        // n ap kite sistèm ProtectedRoute nan AppRoutes la jere rediksyon an dous
        if (typeof window !== "undefined" && window.location.pathname !== "/login") {
          window.location.reload(); // Sa ap reset eta a epi jete l nan login otomatikman
        }
      } catch (err) {
        console.error("[JOBFAST API]: Erè pandan netwayaj sesyon:", err);
      }
    }

    return Promise.reject(error);
  }
);

export default API;
