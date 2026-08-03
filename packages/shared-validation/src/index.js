"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.z = exports.zGeoPoint = exports.zCursorPagination = exports.zCurrency = exports.zMoneyAmount = exports.zName = exports.zPassword = exports.zLocale = exports.zUrl = exports.zPhone = exports.zEmail = exports.zUUID = void 0;
exports.strictSchema = strictSchema;
const zod_1 = require("zod");
Object.defineProperty(exports, "z", { enumerable: true, get: function () { return zod_1.z; } });
// ——— Reusable Zod schemas ——————————————————————————————————————————————————
exports.zUUID = zod_1.z.string().uuid('UUID envalid');
exports.zEmail = zod_1.z.string().email('Email envalid').toLowerCase().trim();
exports.zPhone = zod_1.z.string().regex(/^\+?[1-9]\d{6,14}$/, 'Nimewo telefòn envalid');
exports.zUrl = zod_1.z.string().url('URL envalid');
exports.zLocale = zod_1.z.enum(['ht', 'fr', 'en', 'es', 'pt', 'ar']);
exports.zPassword = zod_1.z.string()
    .min(8, 'Modpas dwe gen omwen 8 karaktè')
    .max(128, 'Modpas twò long');
exports.zName = zod_1.z.string()
    .min(2, 'Non dwe gen omwen 2 karaktè')
    .max(100, 'Non twò long')
    .trim();
exports.zMoneyAmount = zod_1.z.number()
    .int('Montan dwe yon antye')
    .nonnegative('Montan pa ka negatif')
    .max(999_999_999, 'Montan twò gwo');
exports.zCurrency = zod_1.z.enum(['HTG', 'USD', 'EUR', 'GBP', 'BRL', 'CAD']);
exports.zCursorPagination = zod_1.z.object({
    cursor: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().int().min(1).max(100).default(20),
});
exports.zGeoPoint = zod_1.z.object({
    lat: zod_1.z.number().min(-90).max(90),
    lng: zod_1.z.number().min(-180).max(180),
});
// Helper to create a schema that strips unknown keys
function strictSchema(shape) {
    return zod_1.z.object(shape).strict();
}
//# sourceMappingURL=index.js.map