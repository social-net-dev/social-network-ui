import type { UserPrivacy } from '@/lib/api/types';

export function privacyToFlatSettings(privacy: UserPrivacy): Record<string, string> {
  const defaults: Record<string, string> = {
    display_name_visibility: privacy.default_visibility,
    birth_date_visibility: privacy.default_visibility,
    bio_visibility: privacy.default_visibility,
    avatar_visibility: privacy.default_visibility,
  };
  for (const override of privacy.overrides ?? []) {
    defaults[`${override.field}_visibility`] = override.visibility;
  }
  return defaults;
}
