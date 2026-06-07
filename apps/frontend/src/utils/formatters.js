/**
 * 🔥 JOBFAST UTILITY ENGINE — UTILS.JS
 * Ti fonksyon pratik pou fòmate dat, lajan, telefòn ak tèks nan UI a.
 */

/**
 * Fòmate yon dat pou li parèt pi bèl (ex: 07 Jun 2026)
 * @param {string|Date} dateString 
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ""; // Si dat la pa valid
    
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(date);
  } catch (error) {
    return "";
  }
};

/**
 * Fòmate yon montan nan lajan kach (ex: RD$ 1,500.00 oswa HTG 1,500.00)
 * @param {number} amount 
 * @param {string} currency - "DOP" oswa "HTG"
 */
export const formatCurrency = (amount, currency = "DOP") => {
  if (amount === undefined || amount === null || typeof amount !== "number") return "—";
  
  const locale = currency.toUpperCase() === "HTG" ? "fr-HT" : "es-DO";
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 2
  }).format(amount);
};

/**
 * Fòmate nimewo telefòn pou zòn lokal yo (RD: +1..., HT: +509...)
 * @param {string|number} phone 
 */
export const formatPhone = (phone) => {
  if (!phone) return "";
  
  // Netwaye tout karaktè ki pa chif
  const cleaned = ('' + phone).replace(/\D/g, '');
  
  // Si se fòma US/RD (11 chif ak kòd peyi 1 oswa 10 chif san kòd)
  if (cleaned.length === 10) {
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    return `(${match[1]}) ${match[2]}-${match[3]}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    const match = cleaned.match(/^1(\d{3})(\d{3})(\d{4})$/);
    return `+1 (${match[1]}) ${match[2]}-${match[3]}`;
  }
  
  // Si se fòma Ayiti (egz: 5093xxxXXXX oswa nimewo 8 chif)
  if (cleaned.length === 8) {
    const match = cleaned.match(/^(\d{4})(\d{4})$/);
    return `${match[1]}-${match[2]}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('509')) {
    const match = cleaned.match(/^509(\d{4})(\d{4})$/);
    return `+509 ${match[1]}-${match[2]}`;
  }
  
  return phone; // Retounen l konsa si l pa antre nan okenn règ
};

/**
 * Truncate tèks (koupe yon deskripsyon ki twò long nan JobCard la)
 */
export const truncateText = (text, maxLength = 100) => {
  if (!text || typeof text !== "string") return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};
