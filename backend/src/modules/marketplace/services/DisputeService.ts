import { MarketRepository }    from '../repositories/MarketRepository.js';
import { AppError }            from '../../../core/errors/AppError.js';
import { DisputeStatus, type Dispute, type ResolutionType } from '../types/commerce.types.js';

export const DisputeService = {
  async open(buyerId: string, data: Pick<Dispute, 'orderId' | 'type' | 'buyerClaim'> & { sellerId: string }): Promise<Dispute> {
    return MarketRepository.createDispute({ ...data, buyerId });
  },

  async respond(disputeId: string, sellerId: string, response: string): Promise<Dispute> {
    const dispute = await MarketRepository.findDispute(disputeId);
    if (!dispute) throw new AppError('Dispute not found', 404, 'NOT_FOUND');
    if (dispute.sellerId !== sellerId) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    return MarketRepository.updateDispute(disputeId, {
      seller_response: response, status: DisputeStatus.Investigating,
    });
  },

  async addEvidence(disputeId: string, role: 'buyer' | 'seller', userId: string, urls: string[]): Promise<Dispute> {
    const dispute = await MarketRepository.findDispute(disputeId);
    if (!dispute) throw new AppError('Dispute not found', 404, 'NOT_FOUND');
    const isParty = role === 'buyer' ? dispute.buyerId === userId : dispute.sellerId === userId;
    if (!isParty) throw new AppError('Forbidden', 403, 'FORBIDDEN');
    const field  = role === 'buyer' ? 'evidence_buyer' : 'evidence_seller';
    const current = role === 'buyer' ? dispute.evidenceBuyer : dispute.evidenceSeller;
    return MarketRepository.updateDispute(disputeId, { [field]: [...current, ...urls] });
  },

  async resolve(disputeId: string, mediatorId: string, resolution: string, resolutionType: ResolutionType): Promise<Dispute> {
    return MarketRepository.updateDispute(disputeId, {
      mediator_id: mediatorId, resolution, resolution_type: resolutionType,
      status: DisputeStatus.Resolved, resolved_at: new Date().toISOString(),
    });
  },

  async aiAssess(disputeId: string): Promise<Dispute> {
    const dispute = await MarketRepository.findDispute(disputeId);
    if (!dispute) throw new AppError('Dispute not found', 404, 'NOT_FOUND');
    const buyerWords  = dispute.buyerClaim.split(' ').length;
    const sellerWords = (dispute.sellerResponse ?? '').split(' ').length;
    const buyerEvidence  = dispute.evidenceBuyer.length;
    const sellerEvidence = dispute.evidenceSeller.length;
    const assessment: Record<string, unknown> = {
      buyerScore:  Math.min(100, buyerWords * 2  + buyerEvidence  * 20),
      sellerScore: Math.min(100, sellerWords * 2 + sellerEvidence * 20),
      recommendation: buyerEvidence > sellerEvidence ? 'buyer_wins' : 'needs_review',
      assessedAt: new Date().toISOString(),
    };
    return MarketRepository.updateDispute(disputeId, { ai_assessment: assessment });
  },

  async listOpen(): Promise<Dispute[]> {
    return MarketRepository.listOpenDisputes();
  },
};
