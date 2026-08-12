export interface Favorite {
  id: string;
  userId: string;
  productId: string | null;
  serviceId: string | null;
  createdAt: string;
}

export interface Review {
  id: string;
  userId: string | null;
  productId: string | null;
  serviceId: string | null;
  vendorId: string | null;
  companyId: string | null;
  rating: number | null;
  title: string | null;
  comment: string | null;
  images: string[] | null;
  videos: string[] | null;
  verifiedPurchase: boolean;
  aiSentiment: string | null;
  aiToxicityScore: number;
  isApproved: boolean;
  helpfulVotes: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewVote {
  id: string;
  reviewId: string;
  userId: string;
  isHelpful: boolean;
  createdAt: string;
}

export interface Question {
  id: string;
  productId: string | null;
  serviceId: string | null;
  userId: string;
  question: string;
  createdAt: string;
}

export interface Answer {
  id: string;
  questionId: string | null;
  userId: string | null;
  answer: string | null;
  isSellerReply: boolean;
  createdAt: string;
}
