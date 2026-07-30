/**
 * AttributeEngine — Dynamic attribute system.
 * No fixed fields. Every listing type defines its own attribute schema.
 * Categories ship with templates; vendors can extend them.
 */

import type {
  AttributeDefinition, AttributeValue, AttributeType,
  AttributeOption, AttributeValidation, ListingType,
} from '../types';

// ─── Built-in attribute templates per listing type ────────────────────────────

const TEMPLATES: Record<ListingType, AttributeDefinition[]> = {
  physical_product: [
    { key: 'brand', label: 'Mak', type: 'string', required: false, searchable: true, filterable: true, comparable: true, sortOrder: 0, isVariant: false },
    { key: 'color', label: 'Koulè', type: 'color', required: false, searchable: true, filterable: true, comparable: true, sortOrder: 1, isVariant: true },
    { key: 'size',  label: 'Tay',   type: 'select', required: false, searchable: true, filterable: true, comparable: true, sortOrder: 2, isVariant: true,
      options: [
        { value: 'xs', label: 'XS' }, { value: 's', label: 'S' },
        { value: 'm',  label: 'M'  }, { value: 'l', label: 'L' },
        { value: 'xl', label: 'XL' }, { value: 'xxl', label: 'XXL' },
      ],
    },
    { key: 'material', label: 'Materyèl', type: 'string', required: false, searchable: false, filterable: true, comparable: false, sortOrder: 3, isVariant: false },
    { key: 'weight',   label: 'Pwa (kg)',  type: 'number', required: false, searchable: false, filterable: true, comparable: true, unit: 'kg', sortOrder: 4, isVariant: false },
  ],
  digital_product: [
    { key: 'format',       label: 'Fòma',         type: 'select', required: true,  searchable: false, filterable: true,  comparable: false, sortOrder: 0, isVariant: false, options: [{ value: 'pdf', label: 'PDF' }, { value: 'mp3', label: 'MP3' }, { value: 'mp4', label: 'MP4' }, { value: 'zip', label: 'ZIP' }] },
    { key: 'file_size_mb', label: 'Gwosè fichye', type: 'number', required: false, searchable: false, filterable: false, comparable: false, unit: 'MB', sortOrder: 1, isVariant: false },
    { key: 'license',      label: 'Lisans',        type: 'select', required: true,  searchable: false, filterable: true,  comparable: true,  sortOrder: 2, isVariant: false, options: [{ value: 'personal', label: 'Pèsonèl' }, { value: 'commercial', label: 'Komèsyal' }, { value: 'extended', label: 'Étendu' }] },
  ],
  service: [
    { key: 'duration_min', label: 'Dire (minit)', type: 'number', required: true,  searchable: false, filterable: true,  comparable: true,  unit: 'min', sortOrder: 0, isVariant: false },
    { key: 'location',     label: 'Kote',          type: 'select', required: true,  searchable: false, filterable: true,  comparable: false, sortOrder: 1, isVariant: false, options: [{ value: 'remote', label: 'Adistans' }, { value: 'onsite', label: 'Kote ou' }, { value: 'client', label: 'Kay kliyan' }] },
    { key: 'experience_yr', label: 'Eksperyans (an)', type: 'number', required: false, searchable: false, filterable: true, comparable: true, unit: 'an', sortOrder: 2, isVariant: false },
  ],
  subscription: [
    { key: 'billing_cycle',  label: 'Sikl faktirasyon', type: 'select', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 0, isVariant: true, options: [{ value: 'monthly', label: 'Chak mwa' }, { value: 'quarterly', label: 'Trimestriyèl' }, { value: 'yearly', label: 'Chak ane' }] },
    { key: 'max_users',      label: 'Max itilizatè',     type: 'number', required: false, searchable: false, filterable: true, comparable: true, sortOrder: 1, isVariant: true },
    { key: 'storage_gb',     label: 'Estokaj (GB)',       type: 'number', required: false, searchable: false, filterable: true, comparable: true, unit: 'GB', sortOrder: 2, isVariant: true },
  ],
  membership: [
    { key: 'access_level', label: 'Nivo aksè',     type: 'select', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 0, isVariant: true, options: [{ value: 'basic', label: 'Baz' }, { value: 'premium', label: 'Premyèm' }, { value: 'vip', label: 'VIP' }] },
    { key: 'validity_days', label: 'Validite (jou)', type: 'number', required: true, searchable: false, filterable: true, comparable: true, unit: 'jou', sortOrder: 1, isVariant: false },
  ],
  event_ticket: [
    { key: 'event_date',  label: 'Dat evènman', type: 'date',   required: true,  searchable: false, filterable: true, comparable: false, sortOrder: 0, isVariant: false },
    { key: 'venue',       label: 'Kote',         type: 'string', required: true,  searchable: true,  filterable: true, comparable: false, sortOrder: 1, isVariant: false },
    { key: 'seat_type',   label: 'Kalite plas',  type: 'select', required: false, searchable: false, filterable: true, comparable: true, sortOrder: 2, isVariant: true, options: [{ value: 'general', label: 'Jeneral' }, { value: 'vip', label: 'VIP' }, { value: 'premium', label: 'Premyèm' }] },
    { key: 'max_tickets', label: 'Maks tikè pa moun', type: 'number', required: false, searchable: false, filterable: false, comparable: false, sortOrder: 3, isVariant: false },
  ],
  hotel_room: [
    { key: 'beds',        label: 'Kabann',    type: 'number', required: true,  searchable: false, filterable: true, comparable: true, sortOrder: 0, isVariant: true },
    { key: 'room_type',   label: 'Kalite chanm', type: 'select', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 1, isVariant: true, options: [{ value: 'single', label: 'Chanm senp' }, { value: 'double', label: 'Chanm doub' }, { value: 'suite', label: 'Swit' }, { value: 'villa', label: 'Vila' }] },
    { key: 'breakfast',   label: 'Dejene',    type: 'boolean', required: false, searchable: false, filterable: true, comparable: true, sortOrder: 2, isVariant: false },
    { key: 'pool',        label: 'Pisin',     type: 'boolean', required: false, searchable: false, filterable: true, comparable: true, sortOrder: 3, isVariant: false },
    { key: 'wifi',        label: 'WiFi',      type: 'boolean', required: false, searchable: false, filterable: true, comparable: true, sortOrder: 4, isVariant: false },
    { key: 'max_guests',  label: 'Maks vizitè', type: 'number', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 5, isVariant: false },
  ],
  flight: [
    { key: 'origin',      label: 'Depa',     type: 'string', required: true, searchable: true, filterable: true, comparable: false, sortOrder: 0, isVariant: false },
    { key: 'destination', label: 'Destinasyon', type: 'string', required: true, searchable: true, filterable: true, comparable: false, sortOrder: 1, isVariant: false },
    { key: 'cabin_class', label: 'Klas',     type: 'select', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 2, isVariant: true, options: [{ value: 'economy', label: 'Ekonomi' }, { value: 'business', label: 'Biznis' }, { value: 'first', label: 'Premyè' }] },
    { key: 'baggage_kg',  label: 'Bagaj (kg)', type: 'number', required: false, searchable: false, filterable: true, comparable: true, unit: 'kg', sortOrder: 3, isVariant: false },
    { key: 'stops',       label: 'Escale',   type: 'number', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 4, isVariant: false },
  ],
  vehicle: [
    { key: 'make',      label: 'Mak',     type: 'string', required: true, searchable: true, filterable: true, comparable: true, sortOrder: 0, isVariant: false },
    { key: 'model',     label: 'Modèl',   type: 'string', required: true, searchable: true, filterable: true, comparable: true, sortOrder: 1, isVariant: false },
    { key: 'year',      label: 'Ane',     type: 'number', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 2, isVariant: false },
    { key: 'fuel',      label: 'Gaz',     type: 'select', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 3, isVariant: false, options: [{ value: 'gasoline', label: 'Gazolin' }, { value: 'diesel', label: 'Dyèzèl' }, { value: 'electric', label: 'Elektrik' }, { value: 'hybrid', label: 'Ibrid' }] },
    { key: 'doors',     label: 'Pòt',     type: 'number', required: false, searchable: false, filterable: true, comparable: true, sortOrder: 4, isVariant: false },
    { key: 'seats',     label: 'Plas',    type: 'number', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 5, isVariant: false },
    { key: 'mileage_km', label: 'Kilomètraj', type: 'number', required: false, searchable: false, filterable: true, comparable: true, unit: 'km', sortOrder: 6, isVariant: false },
  ],
  appointment: [
    { key: 'specialty',   label: 'Espesyalite', type: 'string', required: true, searchable: true, filterable: true, comparable: false, sortOrder: 0, isVariant: false },
    { key: 'duration_min', label: 'Dire',       type: 'number', required: true, searchable: false, filterable: true, comparable: true, unit: 'min', sortOrder: 1, isVariant: false },
    { key: 'location',    label: 'Kote',         type: 'select', required: true, searchable: false, filterable: true, comparable: false, sortOrder: 2, isVariant: false, options: [{ value: 'clinic', label: 'Klinik' }, { value: 'home', label: 'Kay' }, { value: 'virtual', label: 'Vityèl' }] },
  ],
  medical_service: [
    { key: 'doctor',    label: 'Doktè',      type: 'string', required: true, searchable: true, filterable: true, comparable: false, sortOrder: 0, isVariant: false },
    { key: 'specialty', label: 'Espesyalite', type: 'string', required: true, searchable: true, filterable: true, comparable: true, sortOrder: 1, isVariant: false },
    { key: 'procedure', label: 'Pwosedi',     type: 'string', required: false, searchable: true, filterable: true, comparable: false, sortOrder: 2, isVariant: false },
    { key: 'requires_prescription', label: 'Òdonans', type: 'boolean', required: false, searchable: false, filterable: true, comparable: false, sortOrder: 3, isVariant: false },
  ],
  insurance: [
    { key: 'coverage_type', label: 'Kalite kouvèti', type: 'select', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 0, isVariant: true, options: [{ value: 'health', label: 'Sante' }, { value: 'auto', label: 'Otomobil' }, { value: 'life', label: 'Lavi' }, { value: 'property', label: 'Pwopriyete' }] },
    { key: 'coverage_amount', label: 'Montan kouvèti', type: 'number', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 1, isVariant: true },
    { key: 'deductible',      label: 'Frachiz',        type: 'number', required: false, searchable: false, filterable: true, comparable: true, sortOrder: 2, isVariant: false },
    { key: 'term_months',     label: 'Tèm (mwa)',       type: 'number', required: true, searchable: false, filterable: true, comparable: true, unit: 'mwa', sortOrder: 3, isVariant: true },
  ],
  mobile_topup: [
    { key: 'carrier',      label: 'Operatè', type: 'select', required: true, searchable: false, filterable: true, comparable: false, sortOrder: 0, isVariant: false },
    { key: 'data_gb',      label: 'Done (GB)', type: 'number', required: false, searchable: false, filterable: true, comparable: true, unit: 'GB', sortOrder: 1, isVariant: true },
    { key: 'minutes',      label: 'Minit',     type: 'number', required: false, searchable: false, filterable: true, comparable: true, sortOrder: 2, isVariant: true },
    { key: 'sms',          label: 'SMS',       type: 'number', required: false, searchable: false, filterable: true, comparable: true, sortOrder: 3, isVariant: true },
    { key: 'validity_days', label: 'Validite (jou)', type: 'number', required: true, searchable: false, filterable: true, comparable: true, unit: 'jou', sortOrder: 4, isVariant: true },
    { key: 'region',       label: 'Rejyon',    type: 'select', required: false, searchable: false, filterable: true, comparable: false, sortOrder: 5, isVariant: true },
  ],
  internet_package: [
    { key: 'speed_mbps',  label: 'Vitès (Mbps)', type: 'number', required: true, searchable: false, filterable: true, comparable: true, unit: 'Mbps', sortOrder: 0, isVariant: true },
    { key: 'data_limit',  label: 'Limit done',   type: 'select', required: true, searchable: false, filterable: true, comparable: true, sortOrder: 1, isVariant: true, options: [{ value: 'unlimited', label: 'Ilimite' }, { value: '10', label: '10 GB' }, { value: '50', label: '50 GB' }, { value: '100', label: '100 GB' }] },
    { key: 'type',        label: 'Tip koneksyon', type: 'select', required: true, searchable: false, filterable: true, comparable: false, sortOrder: 2, isVariant: false, options: [{ value: 'fiber', label: 'Fibè' }, { value: '4g', label: '4G' }, { value: '5g', label: '5G' }, { value: 'cable', label: 'Kab' }] },
    { key: 'validity_days', label: 'Validite',   type: 'number', required: true, searchable: false, filterable: true, comparable: true, unit: 'jou', sortOrder: 3, isVariant: true },
  ],
  utility_bill: [
    { key: 'utility_type', label: 'Sèvis', type: 'select', required: true, searchable: false, filterable: true, comparable: false, sortOrder: 0, isVariant: false, options: [{ value: 'electricity', label: 'Elektrisite' }, { value: 'water', label: 'Dlo' }, { value: 'gas', label: 'Gaz' }, { value: 'internet', label: 'Entènèt' }] },
    { key: 'account_type', label: 'Kalite kont', type: 'string', required: false, searchable: false, filterable: true, comparable: false, sortOrder: 1, isVariant: false },
  ],
  digital_voucher: [
    { key: 'redeemable_at', label: 'Peye nan', type: 'string', required: true, searchable: true, filterable: true, comparable: false, sortOrder: 0, isVariant: false },
    { key: 'validity_days', label: 'Validite',  type: 'number', required: true, searchable: false, filterable: true, comparable: true, unit: 'jou', sortOrder: 1, isVariant: false },
    { key: 'min_purchase',  label: 'Min acha',  type: 'number', required: false, searchable: false, filterable: true, comparable: true, sortOrder: 2, isVariant: false },
  ],
  gift_card: [
    { key: 'redeemable_at', label: 'Peye nan', type: 'string', required: false, searchable: false, filterable: true, comparable: false, sortOrder: 0, isVariant: false },
    { key: 'validity_days', label: 'Validite',  type: 'number', required: true,  searchable: false, filterable: true, comparable: true,  unit: 'jou', sortOrder: 1, isVariant: false },
    { key: 'is_customizable', label: 'Montant pèsonalize', type: 'boolean', required: false, searchable: false, filterable: false, comparable: false, sortOrder: 2, isVariant: false },
  ],
};

// ─── AttributeEngine ─────────────────────────────────────────────────────────

export class AttributeEngine {
  private customTemplates: Map<string, AttributeDefinition[]> = new Map();

  getTemplate(listingType: ListingType): AttributeDefinition[] {
    return [...(TEMPLATES[listingType] ?? [])];
  }

  getCategoryTemplate(categoryId: string): AttributeDefinition[] {
    return [...(this.customTemplates.get(categoryId) ?? [])];
  }

  registerCategoryTemplate(categoryId: string, attrs: AttributeDefinition[]): void {
    this.customTemplates.set(categoryId, attrs);
  }

  mergeTemplates(
    listingType: ListingType,
    categoryId?: string,
    overrides: AttributeDefinition[] = [],
  ): AttributeDefinition[] {
    const base     = this.getTemplate(listingType);
    const catAttrs = categoryId ? this.getCategoryTemplate(categoryId) : [];

    const merged = new Map<string, AttributeDefinition>();
    [...base, ...catAttrs, ...overrides].forEach(a => merged.set(a.key, a));

    return Array.from(merged.values()).sort((a, b) => a.sortOrder - b.sortOrder);
  }

  validate(
    values:   AttributeValue[],
    schema:   AttributeDefinition[],
  ): { valid: boolean; errors: Record<string, string> } {
    const errors: Record<string, string> = {};

    for (const def of schema) {
      const val = values.find(v => v.key === def.key);

      if (def.required && (val === undefined || val.value === '' || val.value === null)) {
        errors[def.key] = `${def.label} obligatwa`;
        continue;
      }
      if (!val) continue;

      const v = def.validation;
      if (v) {
        if (typeof val.value === 'number') {
          if (v.min !== undefined && val.value < v.min) errors[def.key] = `Min: ${v.min}`;
          if (v.max !== undefined && val.value > v.max) errors[def.key] = `Max: ${v.max}`;
        }
        if (typeof val.value === 'string') {
          if (v.minLength !== undefined && val.value.length < v.minLength) errors[def.key] = `Min ${v.minLength} karaktè`;
          if (v.maxLength !== undefined && val.value.length > v.maxLength) errors[def.key] = `Max ${v.maxLength} karaktè`;
          if (v.pattern && !new RegExp(v.pattern).test(val.value)) errors[def.key] = `Fòma envalid`;
        }
      }
    }

    return { valid: Object.keys(errors).length === 0, errors };
  }

  getVariantAttributes(schema: AttributeDefinition[]): AttributeDefinition[] {
    return schema.filter(a => a.isVariant);
  }

  getFilterableAttributes(schema: AttributeDefinition[]): AttributeDefinition[] {
    return schema.filter(a => a.filterable);
  }

  formatValue(def: AttributeDefinition, value: AttributeValue['value']): string {
    if (value === null || value === undefined) return '';
    if (def.type === 'boolean') return value ? 'Wi' : 'Non';
    if (def.type === 'select' && def.options) {
      const opt = def.options.find(o => o.value === value);
      return opt?.label ?? String(value);
    }
    if (def.type === 'multiselect' && Array.isArray(value)) {
      return value.map(v => {
        const opt = def.options?.find(o => o.value === v);
        return opt?.label ?? v;
      }).join(', ');
    }
    return `${value}${def.unit ? ' ' + def.unit : ''}`;
  }
}

export const attributeEngine = new AttributeEngine();