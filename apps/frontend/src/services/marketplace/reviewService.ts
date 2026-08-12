import { supabase } from '../../lib/supabase';
import type {
  Favorite,
  Review,
  ReviewVote,
  Question,
  Answer,
} from '../../types/reviews';

// ---- Row types (snake_case) ----

type FavoriteRow = {
  id: string;
  user_id: string;
  product_id: string | null;
  service_id: string | null;
  created_at: string;
};

type ReviewRow = {
  id: string;
  user_id: string | null;
  product_id: string | null;
  service_id: string | null;
  vendor_id: string | null;
  company_id: string | null;
  rating: number | null;
  title: string | null;
  comment: string | null;
  images: string[] | null;
  videos: string[] | null;
  verified_purchase: boolean;
  ai_sentiment: string | null;
  ai_toxicity_score: number;
  is_approved: boolean;
  helpful_votes: number;
  created_at: string;
  updated_at: string;
};

type ReviewVoteRow = {
  id: string;
  review_id: string;
  user_id: string;
  is_helpful: boolean;
  created_at: string;
};

type QuestionRow = {
  id: string;
  product_id: string | null;
  service_id: string | null;
  user_id: string;
  question: string;
  created_at: string;
};

type AnswerRow = {
  id: string;
  question_id: string | null;
  user_id: string | null;
  answer: string | null;
  is_seller_reply: boolean;
  created_at: string;
};

// ---- Mappers ----

function mapFavorite(r: FavoriteRow): Favorite {
  return {
    id: r.id,
    userId: r.user_id,
    productId: r.product_id,
    serviceId: r.service_id,
    createdAt: r.created_at,
  };
}

function mapReview(r: ReviewRow): Review {
  return {
    id: r.id,
    userId: r.user_id,
    productId: r.product_id,
    serviceId: r.service_id,
    vendorId: r.vendor_id,
    companyId: r.company_id,
    rating: r.rating,
    title: r.title,
    comment: r.comment,
    images: r.images,
    videos: r.videos,
    verifiedPurchase: r.verified_purchase,
    aiSentiment: r.ai_sentiment,
    aiToxicityScore: r.ai_toxicity_score,
    isApproved: r.is_approved,
    helpfulVotes: r.helpful_votes,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function mapReviewVote(r: ReviewVoteRow): ReviewVote {
  return {
    id: r.id,
    reviewId: r.review_id,
    userId: r.user_id,
    isHelpful: r.is_helpful,
    createdAt: r.created_at,
  };
}

function mapQuestion(r: QuestionRow): Question {
  return {
    id: r.id,
    productId: r.product_id,
    serviceId: r.service_id,
    userId: r.user_id,
    question: r.question,
    createdAt: r.created_at,
  };
}

function mapAnswer(r: AnswerRow): Answer {
  return {
    id: r.id,
    questionId: r.question_id,
    userId: r.user_id,
    answer: r.answer,
    isSellerReply: r.is_seller_reply,
    createdAt: r.created_at,
  };
}

// ================================================================
// === Favorites
// ================================================================

export async function getMyFavorites(): Promise<Favorite[]> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('favorites')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as FavoriteRow[]).map(mapFavorite);
}

export async function addFavorite(
  productId?: string,
  serviceId?: string
): Promise<Favorite> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const payload: Record<string, unknown> = { user_id: user.id };
  if (productId !== undefined) payload['product_id'] = productId;
  if (serviceId !== undefined) payload['service_id'] = serviceId;

  const { data, error } = await supabase
    .from('favorites')
    .upsert(payload, { onConflict: 'user_id,product_id,service_id' })
    .select('*')
    .single();
  if (error) throw error;
  return mapFavorite(data as FavoriteRow);
}

export async function removeFavorite(favoriteId: string): Promise<void> {
  const { error } = await supabase
    .from('favorites')
    .delete()
    .eq('id', favoriteId);
  if (error) throw error;
}

export async function isProductFavorited(productId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('product_id', productId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

export async function isServiceFavorited(serviceId: string): Promise<boolean> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase
    .from('favorites')
    .select('id')
    .eq('user_id', user.id)
    .eq('service_id', serviceId)
    .maybeSingle();
  if (error) throw error;
  return data !== null;
}

// ================================================================
// === Reviews
// ================================================================

export async function getProductReviews(
  productId: string,
  limit = 20
): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('product_id', productId)
    .eq('is_approved', true)
    .order('helpful_votes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ReviewRow[]).map(mapReview);
}

export async function getServiceReviews(
  serviceId: string,
  limit = 20
): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('service_id', serviceId)
    .eq('is_approved', true)
    .order('helpful_votes', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ReviewRow[]).map(mapReview);
}

export async function getVendorReviews(
  vendorId: string,
  limit = 20
): Promise<Review[]> {
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('is_approved', true)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data as ReviewRow[]).map(mapReview);
}

export async function createReview(input: {
  productId?: string;
  serviceId?: string;
  vendorId?: string;
  companyId?: string;
  rating: number;
  title?: string;
  comment?: string;
  images?: string[];
  videos?: string[];
}): Promise<Review> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const payload: Record<string, unknown> = {
    user_id: user.id,
    rating: input.rating,
  };
  if (input.productId !== undefined) payload['product_id'] = input.productId;
  if (input.serviceId !== undefined) payload['service_id'] = input.serviceId;
  if (input.vendorId !== undefined) payload['vendor_id'] = input.vendorId;
  if (input.companyId !== undefined) payload['company_id'] = input.companyId;
  if (input.title !== undefined) payload['title'] = input.title;
  if (input.comment !== undefined) payload['comment'] = input.comment;
  if (input.images !== undefined) payload['images'] = input.images;
  if (input.videos !== undefined) payload['videos'] = input.videos;

  const { data, error } = await supabase
    .from('reviews')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return mapReview(data as ReviewRow);
}

export async function voteReview(
  reviewId: string,
  isHelpful: boolean
): Promise<ReviewVote> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('review_votes')
    .upsert(
      { review_id: reviewId, user_id: user.id, is_helpful: isHelpful },
      { onConflict: 'review_id,user_id' }
    )
    .select('*')
    .single();
  if (error) throw error;
  return mapReviewVote(data as ReviewVoteRow);
}

// ================================================================
// === Questions
// ================================================================

export async function getProductQuestions(
  productId: string
): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('product_id', productId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as QuestionRow[]).map(mapQuestion);
}

export async function getServiceQuestions(
  serviceId: string
): Promise<Question[]> {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .eq('service_id', serviceId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as QuestionRow[]).map(mapQuestion);
}

export async function askQuestion(
  question: string,
  productId?: string,
  serviceId?: string
): Promise<Question> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const payload: Record<string, unknown> = {
    user_id: user.id,
    question,
  };
  if (productId !== undefined) payload['product_id'] = productId;
  if (serviceId !== undefined) payload['service_id'] = serviceId;

  const { data, error } = await supabase
    .from('questions')
    .insert(payload)
    .select('*')
    .single();
  if (error) throw error;
  return mapQuestion(data as QuestionRow);
}

// ================================================================
// === Answers
// ================================================================

export async function getAnswers(questionId: string): Promise<Answer[]> {
  const { data, error } = await supabase
    .from('answers')
    .select('*')
    .eq('question_id', questionId)
    .order('is_seller_reply', { ascending: false })
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data as AnswerRow[]).map(mapAnswer);
}

export async function answerQuestion(
  questionId: string,
  answer: string,
  isSellerReply = false
): Promise<Answer> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data, error } = await supabase
    .from('answers')
    .insert({
      question_id: questionId,
      user_id: user.id,
      answer,
      is_seller_reply: isSellerReply,
    })
    .select('*')
    .single();
  if (error) throw error;
  return mapAnswer(data as AnswerRow);
}
