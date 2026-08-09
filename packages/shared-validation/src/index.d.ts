import { z } from 'zod';
export declare const zUUID: z.ZodString;
export declare const zEmail: z.ZodString;
export declare const zPhone: z.ZodString;
export declare const zUrl: z.ZodString;
export declare const zLocale: z.ZodEnum<["ht", "fr", "en", "es", "pt", "ar"]>;
export declare const zPassword: z.ZodString;
export declare const zName: z.ZodString;
export declare const zMoneyAmount: z.ZodNumber;
export declare const zCurrency: z.ZodEnum<["HTG", "USD", "EUR", "GBP", "BRL", "CAD"]>;
export declare const zCursorPagination: z.ZodObject<{
    cursor: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    cursor?: string | undefined;
}, {
    cursor?: string | undefined;
    limit?: number | undefined;
}>;
export declare const zGeoPoint: z.ZodObject<{
    lat: z.ZodNumber;
    lng: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    lat: number;
    lng: number;
}, {
    lat: number;
    lng: number;
}>;
export declare function strictSchema<T extends z.ZodRawShape>(shape: T): z.ZodObject<T, "strict", z.ZodTypeAny, z.objectUtil.addQuestionMarks<z.baseObjectOutputType<T>, any> extends infer T_1 ? { [k in keyof T_1]: T_1[k]; } : never, z.baseObjectInputType<T> extends infer T_2 ? { [k_1 in keyof T_2]: T_2[k_1]; } : never>;
export { z };
//# sourceMappingURL=index.d.ts.map