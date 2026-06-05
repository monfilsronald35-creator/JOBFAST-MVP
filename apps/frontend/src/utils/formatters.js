/**
 * Fòmate yon dat pou li parèt pi bèl (ex: 05 Jun 2026)
 */
export const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date);
};

/**
 * Fòmate yon montan nan lajan (ex: 1,500.00 HTG oswa DOP)
 * @param {number} amount 
 * @param {string} currency - "DOP" oswa "HTG"
 */
export const formatCurrency = (amount, currency = "DOP") => {
  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: currency,
  }).format(amount);
};

/**
 * Fòmate nimewo telefòn pou li lizib (ex: +1 809-555-0199)
 */
export const formatPhone = (phone) => {
  if (!phone) return "";
  const cleaned = ('' + phone).replace(/\D/g, '');
  const match = cleaned.match(/^(\d{1})(\d{3})(\d{3})(\d{4})$/);
  if (match) {
    return `+${match[1]} (${match[2]}) ${match[3]}-${match[4]}`;
  }
  return phone;
};

/**
 * Troncate tèks (koupe yon deskripsyon ki twò long)
 */
export const truncateText = (text, maxLength = 100) => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};
