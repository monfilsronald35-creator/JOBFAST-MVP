/**
 * AI — Assistant
 * Contextual help and guidance for JOBFAST users
 * Stub for OpenAI/Claude integration — provides rule-based responses until API key is set
 */
import { supabase } from '../config/supabaseClient.js';
import { cache, withCache } from '../core/cache.js';

// Intent detection keywords
const INTENTS = {
  find_worker:  ['find worker', 'hire', 'need someone', 'looking for', 'trouver', 'jwenn'],
  post_job:     ['post job', 'create job', 'publish job', 'poste travay'],
  wallet:       ['wallet', 'balance', 'money', 'pay', 'lajan', 'kòb'],
  help:         ['help', 'how to', 'how do i', 'aide', 'kijan'],
  status:       ['available', 'status', 'online', 'disponib'],
  booking:      ['book', 'schedule', 'appointment', 'rezève'],
  support:      ['problem', 'issue', 'error', 'bug', 'help', 'support'],
};

const RESPONSES = {
  find_worker:  'Pou jwenn yon travayè, ale nan **Marketplace** oswa itilize **Rechèch** pou filtre pa kategori, lokasyon, ak pri.',
  post_job:     'Pou pibliye yon travay, klike sou **+ Poste Travay** nan dashboard ou. Ranpli tit, deskripsyon, ak bidjè.',
  wallet:       'Portefèy ou a montre solde, tranzaksyon, ak depo. Ou ka resevwa peman dirèkteman.',
  help:         'Mwen ka ede ou! Di m sa ou bezwen: jwenn travayè, poste travay, peye, oswa lòt bagay.',
  status:       'Ou ka chanje disponibilite ou nan **Estati** paj la. Mete "Disponib" pou jwenn plis travay.',
  booking:      'Rezèvasyon yo jere nan seksyon **Rezèvasyon** ou a. Ou ka aksepte, refize, oswa repwograme.',
  support:      'Pou sipò teknik, voye yon mesaj nan **Tchèt Sipò** oswa imèl sipò@jobfast.ht.',
  default:      'Mwen pa konprann kesyon an. Eseye poze li yon lòt jan, oswa kontakte sipò@jobfast.ht.',
};

function detectIntent(message) {
  const lower = message.toLowerCase();
  for (const [intent, keywords] of Object.entries(INTENTS)) {
    if (keywords.some(kw => lower.includes(kw))) return intent;
  }
  return 'default';
}

// Get user context for personalized responses
async function getUserContext(userId) {
  if (!userId) return null;
  return withCache(cache.session, `assistant:ctx:${userId}`, async () => {
    const { data } = await supabase
      .from('profiles')
      .select('name, role, category, stats, isAvailable')
      .eq('id', userId)
      .single();
    return data;
  }, 5 * 60_000);
}

export async function chat(userId, message, history = []) {
  if (!message?.trim()) return { reply: RESPONSES.default, intent: 'default', suggestions: [] };

  const [intent, userCtx] = await Promise.all([
    detectIntent(message),
    getUserContext(userId),
  ]);

  let reply = RESPONSES[intent] || RESPONSES.default;

  // Personalize for known user
  if (userCtx) {
    const name = userCtx.name?.split(' ')[0] || 'ou';
    reply = reply.replace(/^(Mwen|Pou)/, `${name}, $1`.toLowerCase());
  }

  const suggestions = {
    find_worker: ['Ale nan Marketplace', 'Rechèch avanse'],
    post_job:    ['Poste yon travay', 'Wè tarif yo'],
    wallet:      ['Wè balans', 'Ajoute lajan'],
    help:        ['Jwenn travayè', 'Poste travay', 'Wè rezèvasyon'],
    default:     ['Kontakte sipò', 'Ale nan Marketplace'],
  };

  // TODO: replace with OpenAI / Claude API call when AI_API_KEY is set
  // if (process.env.AI_API_KEY) {
  //   const ai = await callOpenAI(message, history, userCtx);
  //   return { reply: ai.content, intent, suggestions: ai.suggestions };
  // }

  return {
    reply,
    intent,
    suggestions: suggestions[intent] || suggestions.default,
    context:     userCtx ? { name: userCtx.name, role: userCtx.role } : null,
  };
}

export default { chat, detectIntent };
