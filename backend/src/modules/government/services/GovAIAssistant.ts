// AI Government Assistant — guides citizens to correct services, pre-validates forms,
// tracks application status. Delegates to human agent when query exceeds AI scope.

interface GovAIResponse {
  answer:      string;
  service?:    string | undefined;
  agencyType?: string | undefined;
  actionUrl?:  string | undefined;
  escalate:    boolean;
  escalateTo?: string | undefined;
}

// Keyword → service routing map
const SERVICE_KEYWORDS: Array<{ keywords: string[]; service: string; agencyType: string; actionUrl: string; answer: string }> = [
  { keywords: ['pèmi', 'permit', 'konstriksyon', 'travay'],
    service: 'permits', agencyType: 'licensing',
    actionUrl: '/gov/permits/apply',
    answer: 'Pou mande yon pèmi, ale nan seksyon "Pèmi" epi chwazi kalite pèmi ou bezwen an. Ou pral bezwen dokiman idantifikasyon ak plan pwopriyete ou.' },
  { keywords: ['lisans', 'license', 'biznis', 'restoran', 'otèl', 'tètay', 'taksi'],
    service: 'licenses', agencyType: 'licensing',
    actionUrl: '/gov/licenses/apply',
    answer: 'Pou jwenn yon lisans biznis, ou dwe soumèt dokiman anrejistreman konpayi ou ak prèv adrès. Ale nan seksyon "Lisans" pou kòmanse pwosesis la.' },
  { keywords: ['taks', 'tax', 'fiskal', 'deklarasyon', 'revni', 'iva', 'tca'],
    service: 'taxes', agencyType: 'tax',
    actionUrl: '/gov/taxes',
    answer: 'Pou deklarasyon fiskal ou, ale nan seksyon "Taks". Ou ka kalkile, deklare epi peye taks ou sou platfòm lan dirèkteman.' },
  { keywords: ['akté', 'nesans', 'sètifika', 'certificate', 'batèm', 'maryaj', 'mò', 'rezidans'],
    service: 'certificates', agencyType: 'civil_registry',
    actionUrl: '/gov/certificates/request',
    answer: 'Pou jwenn yon sètifika sivil (nesans, maryaj, rezidans...), ale nan seksyon "Sètifika". Frè administratif ka varye selon kalite dokiman an.' },
  { keywords: ['randevou', 'appointment', 'biwo', 'vizit', 'prezans'],
    service: 'appointments', agencyType: 'municipality',
    actionUrl: '/gov/appointments/book',
    answer: 'Pou pran yon randevou nan yon biwo gouvènman, chwazi sèvis la, biwo ki pi pre ou, epi yon lè ki disponib. Ou pral resevwa yon kòd konfirmasyon.' },
  { keywords: ['idantite', 'identity', 'idantifikasyon', 'oni', 'nasyonal id', 'paspò', 'passport'],
    service: 'identity', agencyType: 'civil_registry',
    actionUrl: '/gov/identity/verify',
    answer: 'Pou verifye idantite ou, prepare yon dokiman valid (Kat Nasyonal ONI oswa Paspò). Ale nan seksyon "Idantite" epi swiv etap yo.' },
  { keywords: ['imigrasyon', 'immigration', 'visa', 'rezidans pèmi', 'residence permit'],
    service: 'permits', agencyType: 'immigration',
    actionUrl: '/gov/permits/apply',
    answer: 'Pou demann imigrasyon (visa, pèmi rezidans), ou bezwen kontakte Direksyon Jeneral Imigrasyon. Nou ka ede ou prepare dokiman yo epi swiv demann ou sou platfòm lan.' },
];

const ESCALATION_KEYWORDS = ['apèl', 'appeal', 'rejte', 'rejected', 'plen', 'plainte', 'ijan', 'urgence', 'legal', 'jistis', 'tribinal'];

export const GovAIAssistant = {
  query(question: string): GovAIResponse {
    const q = question.toLowerCase();

    // Check if escalation needed
    if (ESCALATION_KEYWORDS.some(k => q.includes(k))) {
      return {
        answer:    'Demann ou an depase sa AI a ka jere. Tanpri kontakte yon ajan gouvènman dirèkteman oswa rele nimewo asistans sitwayen an.',
        escalate:  true,
        escalateTo: 'human_agent',
      };
    }

    // Match service keywords
    for (const entry of SERVICE_KEYWORDS) {
      if (entry.keywords.some(k => q.includes(k))) {
        return {
          answer:     entry.answer,
          service:    entry.service,
          agencyType: entry.agencyType,
          actionUrl:  entry.actionUrl,
          escalate:   false,
        };
      }
    }

    // Generic guidance
    return {
      answer:   'Mwen ka ede ou avèk pèmi, lisans, taks, sètifika sivil, randevou ak verifikasyon idantite. Ka ou dekri sa ou bezwen an ak plis detay?',
      escalate: false,
    };
  },

  validatePermitForm(fields: Record<string, unknown>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!fields['type'])        errors.push('Kalite pèmi obligatwa.');
    if (!fields['title'])       errors.push('Tit pèmi a obligatwa.');
    if (!fields['citizenId'])   errors.push('Idantite sitwayen obligatwa.');
    if (!fields['agencyId'])    errors.push('Ajans gouvènman obligatwa.');
    return { valid: errors.length === 0, errors };
  },

  validateTaxDeclaration(fields: Record<string, unknown>): { valid: boolean; errors: string[]; estimatedTax?: number } {
    const errors: string[] = [];
    if (!fields['type'])        errors.push('Kalite taks obligatwa.');
    if (!fields['period'])      errors.push('Peryòd fiskal obligatwa.');
    if (!fields['baseAmount'] || Number(fields['baseAmount']) <= 0) errors.push('Montan debaz dwe pozitif.');

    const estimatedTax = errors.length === 0
      ? Math.round(Number(fields['baseAmount']) * 0.15)
      : undefined;

    return { valid: errors.length === 0, errors, ...(estimatedTax !== undefined && { estimatedTax }) };
  },

  trackStatus(entityType: string, referenceNo: string): { message: string; nextStep: string } {
    // In production: query actual status
    void entityType; void referenceNo;
    return {
      message:  `Demann ou avèk referans ${referenceNo} ap trete. Ou pral resevwa yon notifikasyon lè li prèt.`,
      nextStep: 'Tcheke notifikasyon ou oswa retounen isit la pou konnen estati a.',
    };
  },
};