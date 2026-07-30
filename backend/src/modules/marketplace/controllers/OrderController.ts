import type { Request, Response, NextFunction } from 'express';
import { OrderService } from '../services/OrderService.js';
import { OrderStatus, ReturnStatus, OrderType } from '../types/order.types.js';
import { AppError }     from '../../../core/errors/AppError.js';

export const OrderController = {
  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as Record<string, unknown>;
      const result = await OrderService.create(req.user!.sub, {
        sellerId:        body['sellerId']  as string,
        type:            (body['type']     as OrderType) ?? OrderType.Purchase,
        currency:        (body['currency'] as string)   ?? 'HTG',
        items:           (body['items']    as never[])  ?? [],
        couponCode:      body['couponCode']  as string | undefined,
        shippingAmount:  body['shippingAmount'] as number | undefined,
        taxAmount:       body['taxAmount']      as number | undefined,
        shippingAddress: body['shippingAddress']as Record<string, unknown> | undefined,
        billingAddress:  body['billingAddress'] as Record<string, unknown> | undefined,
        notes:           body['notes']          as string | undefined,
      });
      res.status(201).json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await OrderService.getById(req.params['id']!);
      res.json({ success: true, data: result });
    } catch (err) { next(err); }
  },

  myOrders: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const orders = await OrderService.listByBuyer(req.user!.sub);
      res.json({ success: true, data: orders, count: orders.length });
    } catch (err) { next(err); }
  },

  sellerOrders: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { status } = req.query as { status?: string };
      const orders = await OrderService.listBySeller(req.user!.sub, status as OrderStatus | undefined);
      res.json({ success: true, data: orders, count: orders.length });
    } catch (err) { next(err); }
  },

  confirm: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await OrderService.confirm(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  },

  ship: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { carrier: string; trackingNumber: string; estimatedDelivery?: string };
      if (!body.carrier || !body.trackingNumber) throw new AppError('carrier and trackingNumber required', 400, 'MISSING_FIELD');
      const order = await OrderService.ship(req.params['id']!, req.user!.sub, body);
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  },

  deliver: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await OrderService.deliver(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  },

  complete: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await OrderService.complete(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  },

  cancel: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const order = await OrderService.cancel(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: order });
    } catch (err) { next(err); }
  },

  requestReturn: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { reason: string; orderItemId?: string; description?: string };
      if (!body.reason) throw new AppError('reason required', 400, 'MISSING_FIELD');
      const ret = await OrderService.requestReturn(req.user!.sub, { orderId: req.params['id']!, ...body });
      res.status(201).json({ success: true, data: ret });
    } catch (err) { next(err); }
  },

  resolveReturn: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { status: ReturnStatus; notes?: string; refundAmount?: number };
      const ret = await OrderService.resolveReturn(req.params['returnId']!, req.user!.sub, body.status, body.notes, body.refundAmount);
      res.json({ success: true, data: ret });
    } catch (err) { next(err); }
  },
};
