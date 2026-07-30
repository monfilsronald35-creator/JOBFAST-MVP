import type { Request, Response, NextFunction } from 'express';
import { ContractService } from '../services/ContractService.js';
import { ContractType } from '../types/contract.types.js';

export const ContractController = {
  create: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as {
        jobId: string; workerId: string; type?: ContractType;
        salaryAmount: number; currency?: string; startDate: string;
        title?: string; terms?: string; endDate?: string;
      };
      const contract = await ContractService.create({
        jobId:        body.jobId,
        employerId:   req.user!.sub,
        workerId:     body.workerId,
        type:         body.type ?? ContractType.Employment,
        salaryAmount: body.salaryAmount,
        currency:     body.currency ?? 'HTG',
        startDate:    body.startDate,
        ...(body.title   ? { title:   body.title   } : {}),
        ...(body.terms   ? { terms:   body.terms   } : {}),
        ...(body.endDate ? { endDate: body.endDate } : {}),
      });
      res.status(201).json({ success: true, data: contract });
    } catch (err) { next(err); }
  },

  getById: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contract = await ContractService.getById(req.params['id']!);
      res.json({ success: true, data: contract });
    } catch (err) { next(err); }
  },

  sign: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const contract = await ContractService.sign(req.params['id']!, req.user!.sub);
      res.json({ success: true, data: contract });
    } catch (err) { next(err); }
  },

  terminate: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { reason } = req.body as { reason: string };
      const contract = await ContractService.terminate(req.params['id']!, req.user!.sub, reason ?? '');
      res.json({ success: true, data: contract });
    } catch (err) { next(err); }
  },

  myContracts: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const [asWorker, asEmployer] = await Promise.all([
        ContractService.listByWorker(req.user!.sub),
        ContractService.listByEmployer(req.user!.sub),
      ]);
      res.json({ success: true, data: { asWorker, asEmployer } });
    } catch (err) { next(err); }
  },

  // ——— Schedules ————————————————————————————————————————————————————————
  addShift: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as { workerId: string; shiftDate: string; startTime: string; endTime: string; breakMins?: number; notes?: string };
      const shift = await ContractService.addShift(id, req.user!.sub, {
        workerId:  body.workerId,
        shiftDate: body.shiftDate,
        startTime: body.startTime,
        endTime:   body.endTime,
        breakMins: body.breakMins ?? 0,
        ...(body.notes ? { notes: body.notes } : {}),
      });
      res.status(201).json({ success: true, data: shift });
    } catch (err) { next(err); }
  },

  listShifts: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const shifts = await ContractService.listShifts(req.params['id']!);
      res.json({ success: true, data: shifts });
    } catch (err) { next(err); }
  },

  clockIn: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params as { id: string };
      const body = req.body as { scheduleId?: string; lat?: number; lng?: number };
      const opts: Parameters<typeof ContractService.clockIn>[2] = {};
      if (body.scheduleId) opts.scheduleId = body.scheduleId;
      if (body.lat !== undefined) opts.lat = body.lat;
      if (body.lng !== undefined) opts.lng = body.lng;
      const record = await ContractService.clockIn(id, req.user!.sub, opts);
      res.status(201).json({ success: true, data: record });
    } catch (err) { next(err); }
  },

  clockOut: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { attendanceId } = req.params as { attendanceId: string };
      const body = req.body as { lat?: number; lng?: number };
      const record = await ContractService.clockOut(attendanceId, req.user!.sub, body.lat, body.lng);
      res.json({ success: true, data: record });
    } catch (err) { next(err); }
  },

  // ——— Payroll ——————————————————————————————————————————————————————————
  createPayroll: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const body = req.body as { contractId: string; workerId: string; periodStart: string; periodEnd: string; grossAmount: number; taxAmount?: number; bonusAmount?: number; netAmount: number; currency?: string };
      const payroll = await ContractService.createPayroll(req.user!.sub, {
        contractId:  body.contractId,
        employerId:  req.user!.sub,
        workerId:    body.workerId,
        periodStart: body.periodStart,
        periodEnd:   body.periodEnd,
        grossAmount: body.grossAmount,
        taxAmount:   body.taxAmount ?? 0,
        bonusAmount: body.bonusAmount ?? 0,
        netAmount:   body.netAmount,
        currency:    body.currency ?? 'HTG',
      });
      res.status(201).json({ success: true, data: payroll });
    } catch (err) { next(err); }
  },

  myPayslips: async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const payslips = await ContractService.getPayslips(req.user!.sub);
      res.json({ success: true, data: payslips });
    } catch (err) { next(err); }
  },
};
