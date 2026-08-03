export declare const generateId: () => string;
export interface CursorPayload {
    id: string;
    createdAt: number;
}
export declare function encodeCursor(payload: CursorPayload): string;
export declare function decodeCursor(cursor: string): CursorPayload | null;
export declare const nowMs: () => number;
export declare function msToISO(ms: number): string;
export declare function slugify(text: string): string;
export declare function maskEmail(email: string): string;
export declare function omit<T extends object, K extends keyof T>(obj: T, keys: K[]): Omit<T, K>;
export declare function pick<T extends object, K extends keyof T>(obj: T, keys: K[]): Pick<T, K>;
/** Convert integer minor units to display string — e.g. 1050 → "10.50" */
export declare function formatMinorUnits(amount: number, currency?: string): string;
export declare function withRetry<T>(fn: () => Promise<T>, maxAttempts?: number, baseDelayMs?: number): Promise<T>;
//# sourceMappingURL=index.d.ts.map