import { db } from '../../../core/database/SupabaseClient.js';
import { AppError } from '../../../core/errors/AppError.js';
import type { ProfileExtended, AvailabilityRecord, PrivacySettings, AvailabilityStatus } from '../types/profile.types.js';

function toProfile(row: Record<string, unknown>): ProfileExtended {
  return {
    userId:             row['user_id'] as string,
    profileType:        row['profile_type'] as string,
    username:           row['username'] as string | undefined,
    displayName:        row['display_name'] as string | undefined,
    businessName:       row['business_name'] as string | undefined,
    legalName:          row['legal_name'] as string | undefined,
    publicId:           row['public_id'] as string | undefined,
    headline:           row['headline'] as string | undefined,
    bio:                row['bio'] as string | undefined,
    birthDate:          row['birth_date'] as string | undefined,
    gender:             row['gender'] as string | undefined,
    nationality:        row['nationality'] as string | undefined,
    timezone:           row['timezone'] as string | undefined,
    currency:           row['currency'] as string | undefined,
    languages:          (row['languages'] as string[] | undefined) ?? [],
    whatsapp:           row['whatsapp'] as string | undefined,
    website:            row['website'] as string | undefined,
    emergencyContact:   row['emergency_contact'] as ProfileExtended['emergencyContact'],
    socialLinks:        (row['social_links'] as ProfileExtended['socialLinks']) ?? {},
    jobTitle:           row['job_title'] as string | undefined,
    profession:         row['profession'] as string | undefined,
    skills:             (row['skills'] as string[] | undefined) ?? [],
    experience:         (row['experience'] as ProfileExtended['experience']) ?? [],
    education:          (row['education'] as ProfileExtended['education']) ?? [],
    certifications:     (row['certifications'] as ProfileExtended['certifications']) ?? [],
    licenses:           (row['licenses'] as ProfileExtended['licenses']) ?? [],
    awards:             (row['awards'] as ProfileExtended['awards']) ?? [],
    registrationNumber: row['registration_number'] as string | undefined,
    taxNumber:          row['tax_number'] as string | undefined,
    industry:           row['industry'] as string | undefined,
    employeeCount:      row['employee_count'] as number | undefined,
    businessHours:      row['business_hours'] as ProfileExtended['businessHours'],
    branches:           (row['branches'] as Record<string, unknown>[]) ?? [],
    services:           (row['services'] as string[] | undefined) ?? [],
    products:           (row['products'] as string[] | undefined) ?? [],
    isPublic:           row['is_public'] as boolean,
    createdAt:          row['created_at'] as string,
    updatedAt:          row['updated_at'] as string,
  };
}

export const ProfileRepository = {
  async findByUserId(userId: string): Promise<ProfileExtended | null> {
    const { data, error } = await db.client()
      .from('user_profile_extended')
      .select('*')
      .eq('user_id', userId)
      .single<Record<string, unknown>>();
    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError('Failed to load profile', 500, 'DB_ERROR');
    return data ? toProfile(data) : null;
  },

  async findByUsername(username: string): Promise<ProfileExtended | null> {
    const { data, error } = await db.client()
      .from('user_profile_extended')
      .select('*')
      .eq('username', username.toLowerCase())
      .single<Record<string, unknown>>();
    if (error?.code === 'PGRST116') return null;
    if (error) throw new AppError('Failed to load profile', 500, 'DB_ERROR');
    return data ? toProfile(data) : null;
  },

  async upsert(userId: string, data: Partial<ProfileExtended>): Promise<ProfileExtended> {
    const row: Record<string, unknown> = {
      user_id:             userId,
      updated_at:          new Date().toISOString(),
    };
    if (data.profileType  !== undefined) row['profile_type']        = data.profileType;
    if (data.username     !== undefined) row['username']            = data.username?.toLowerCase();
    if (data.displayName  !== undefined) row['display_name']        = data.displayName;
    if (data.businessName !== undefined) row['business_name']       = data.businessName;
    if (data.legalName    !== undefined) row['legal_name']          = data.legalName;
    if (data.headline     !== undefined) row['headline']            = data.headline;
    if (data.bio          !== undefined) row['bio']                 = data.bio;
    if (data.birthDate    !== undefined) row['birth_date']          = data.birthDate;
    if (data.gender       !== undefined) row['gender']              = data.gender;
    if (data.nationality  !== undefined) row['nationality']         = data.nationality;
    if (data.timezone     !== undefined) row['timezone']            = data.timezone;
    if (data.currency     !== undefined) row['currency']            = data.currency;
    if (data.languages    !== undefined) row['languages']           = data.languages;
    if (data.whatsapp     !== undefined) row['whatsapp']            = data.whatsapp;
    if (data.website      !== undefined) row['website']             = data.website;
    if (data.emergencyContact !== undefined) row['emergency_contact'] = data.emergencyContact;
    if (data.socialLinks  !== undefined) row['social_links']        = data.socialLinks;
    if (data.jobTitle     !== undefined) row['job_title']           = data.jobTitle;
    if (data.profession   !== undefined) row['profession']          = data.profession;
    if (data.skills       !== undefined) row['skills']              = data.skills;
    if (data.experience   !== undefined) row['experience']          = data.experience;
    if (data.education    !== undefined) row['education']           = data.education;
    if (data.certifications !== undefined) row['certifications']    = data.certifications;
    if (data.licenses     !== undefined) row['licenses']            = data.licenses;
    if (data.awards       !== undefined) row['awards']              = data.awards;
    if (data.registrationNumber !== undefined) row['registration_number'] = data.registrationNumber;
    if (data.taxNumber    !== undefined) row['tax_number']          = data.taxNumber;
    if (data.industry     !== undefined) row['industry']            = data.industry;
    if (data.employeeCount !== undefined) row['employee_count']     = data.employeeCount;
    if (data.businessHours !== undefined) row['business_hours']     = data.businessHours;
    if (data.branches     !== undefined) row['branches']            = data.branches;
    if (data.services     !== undefined) row['services']            = data.services;
    if (data.products     !== undefined) row['products']            = data.products;
    if (data.isPublic     !== undefined) row['is_public']           = data.isPublic;

    const { data: saved, error } = await db.client()
      .from('user_profile_extended')
      .upsert(row, { onConflict: 'user_id' })
      .select('*')
      .single<Record<string, unknown>>();

    if (error ?? !saved) throw new AppError('Failed to save profile', 500, 'DB_ERROR');
    return toProfile(saved);
  },

  async search(query: { skills?: string[]; industry?: string; profileType?: string; country?: string; limit?: number; cursor?: string }): Promise<ProfileExtended[]> {
    let req = db.client().from('user_profile_extended').select('*').eq('is_public', true);
    if (query.profileType) req = req.eq('profile_type', query.profileType);
    if (query.industry)    req = req.eq('industry', query.industry);
    if (query.skills?.length) req = req.overlaps('skills', query.skills);
    req = req.order('updated_at', { ascending: false }).limit(query.limit ?? 20);

    const { data, error } = await req.returns<Record<string, unknown>[]>();
    if (error) throw new AppError('Search failed', 500, 'DB_ERROR');
    return (data ?? []).map(toProfile);
  },

  // ——— Availability ——————————————————————————————————————————————————————
  async getAvailability(userId: string): Promise<AvailabilityRecord | null> {
    const { data } = await db.client()
      .from('user_availability')
      .select('*')
      .eq('user_id', userId)
      .single<Record<string, unknown>>();
    if (!data) return null;
    return {
      userId:    data['user_id'] as string,
      status:    data['status'] as AvailabilityStatus,
      message:   data['message'] as string | undefined,
      until:     data['until'] as string | undefined,
      timezone:  data['timezone'] as string | undefined,
      schedule:  data['schedule'] as Record<string, unknown>,
      updatedAt: data['updated_at'] as string,
    };
  },

  async setAvailability(userId: string, status: AvailabilityStatus, opts: { message?: string; until?: Date; timezone?: string } = {}): Promise<void> {
    await db.client().from('user_availability').upsert({
      user_id:    userId,
      status,
      message:    opts.message ?? null,
      until:      opts.until?.toISOString() ?? null,
      timezone:   opts.timezone ?? null,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' }).select();
  },

  // ——— Privacy ————————————————————————————————————————————————————————————
  async getPrivacy(userId: string): Promise<PrivacySettings> {
    const { data } = await db.client()
      .from('user_privacy_settings')
      .select('*')
      .eq('user_id', userId)
      .single<Record<string, unknown>>();

    if (!data) {
      return {
        userId,
        profileVisibility:  'public',
        contactVisibility:  'public',
        documentVisibility: 'private',
        showEmail:    false,
        showPhone:    false,
        showBirthDate: false,
        showAddress:  false,
        allowMessages: 'everyone',
        searchable:   true,
        updatedAt:    new Date().toISOString(),
      };
    }
    return {
      userId,
      profileVisibility:  data['profile_visibility'] as PrivacySettings['profileVisibility'],
      contactVisibility:  data['contact_visibility'] as PrivacySettings['contactVisibility'],
      documentVisibility: data['document_visibility'] as PrivacySettings['documentVisibility'],
      showEmail:    data['show_email'] as boolean,
      showPhone:    data['show_phone'] as boolean,
      showBirthDate: data['show_birth_date'] as boolean,
      showAddress:  data['show_address'] as boolean,
      allowMessages: data['allow_messages'] as PrivacySettings['allowMessages'],
      searchable:   data['searchable'] as boolean,
      updatedAt:    data['updated_at'] as string,
    };
  },

  async setPrivacy(userId: string, settings: Partial<PrivacySettings>): Promise<void> {
    const row: Record<string, unknown> = { user_id: userId, updated_at: new Date().toISOString() };
    if (settings.profileVisibility  !== undefined) row['profile_visibility']  = settings.profileVisibility;
    if (settings.contactVisibility  !== undefined) row['contact_visibility']  = settings.contactVisibility;
    if (settings.documentVisibility !== undefined) row['document_visibility'] = settings.documentVisibility;
    if (settings.showEmail          !== undefined) row['show_email']          = settings.showEmail;
    if (settings.showPhone          !== undefined) row['show_phone']          = settings.showPhone;
    if (settings.showBirthDate      !== undefined) row['show_birth_date']     = settings.showBirthDate;
    if (settings.showAddress        !== undefined) row['show_address']        = settings.showAddress;
    if (settings.allowMessages      !== undefined) row['allow_messages']      = settings.allowMessages;
    if (settings.searchable         !== undefined) row['searchable']          = settings.searchable;

    await db.client().from('user_privacy_settings').upsert(row, { onConflict: 'user_id' }).select();
  },

  // ——— Analytics ——————————————————————————————————————————————————————————
  async recordView(profileUserId: string, viewerUserId?: string, source?: string): Promise<void> {
    await db.client().from('user_profile_views').insert({
      user_id:     profileUserId,
      viewer_id:   viewerUserId ?? null,
      viewer_type: viewerUserId ? 'user' : 'anonymous',
      source:      source ?? null,
    }).select();
  },

  async getAnalytics(userId: string): Promise<Record<string, unknown>> {
    const { data } = await db.client()
      .from('user_profile_analytics')
      .select('*')
      .eq('user_id', userId)
      .single<Record<string, unknown>>();
    return data ?? { totalViews: 0, viewsThisWeek: 0, viewsThisMonth: 0, searchAppearances: 0, employerVisits: 0, customerVisits: 0 };
  },
};
