import { TelecomRepository }  from '../repositories/TelecomRepository.js';
import type { TelecomOperator, OperatorConfig, OperatorAPIType } from '../types/telecom.types.js';

export const OperatorService = {
  async register(ownerId: string, input: {
    name: string; code: string; country: string; currency: string;
    apiType?: OperatorAPIType; logoUrl?: string; website?: string;
  }): Promise<TelecomOperator> {
    const op = await TelecomRepository.createOperator({
      name:     input.name,
      code:     input.code.toUpperCase(),
      country:  input.country,
      currency: input.currency,
      apiType:  input.apiType ?? 'mock',
      logoUrl:  input.logoUrl,
      website:  input.website,
      isActive: true,
      ownerId,
    });

    await TelecomRepository.upsertConfig({
      operatorId:    op.id,
      apiBaseUrl:    '',
      timeout:       30000,
      retryAttempts: 3,
      rateLimitRpm:  60,
      sandboxMode:   true,
      updatedAt:     new Date().toISOString(),
    });

    return op;
  },

  async get(id: string): Promise<TelecomOperator | null> {
    return TelecomRepository.getOperator(id);
  },

  async listMine(ownerId: string): Promise<TelecomOperator[]> {
    return TelecomRepository.listOperators(ownerId);
  },

  async listAll(): Promise<TelecomOperator[]> {
    return TelecomRepository.listOperators();
  },

  async getConfig(operatorId: string): Promise<OperatorConfig | null> {
    return TelecomRepository.getConfig(operatorId);
  },

  async updateConfig(operatorId: string, patch: Partial<OperatorConfig>): Promise<void> {
    const current = await TelecomRepository.getConfig(operatorId);
    const merged: OperatorConfig = {
      operatorId,
      apiBaseUrl:    patch.apiBaseUrl    ?? current?.apiBaseUrl    ?? '',
      apiKey:        patch.apiKey        ?? current?.apiKey,
      apiSecret:     patch.apiSecret     ?? current?.apiSecret,
      webhookUrl:    patch.webhookUrl    ?? current?.webhookUrl,
      timeout:       patch.timeout       ?? current?.timeout       ?? 30000,
      retryAttempts: patch.retryAttempts ?? current?.retryAttempts ?? 3,
      rateLimitRpm:  patch.rateLimitRpm  ?? current?.rateLimitRpm  ?? 60,
      sandboxMode:   patch.sandboxMode   ?? current?.sandboxMode   ?? true,
      updatedAt:     new Date().toISOString(),
    };
    await TelecomRepository.upsertConfig(merged);
  },
};