export interface CompletionFields {
  image?: string | null;
  coverImage?: string | null;
  professionalTitle?: string | null;
  headline?: string | null;
  bio?: string | null;
  location?: string | null;
  specialties?: string[];
}

export function profileCompletionSteps(profile: CompletionFields) {
  return [
    { id: "image", label: "Add a profile photo", done: !!profile.image, tab: "basic" as const },
    { id: "professionalTitle", label: "Choose your professional title", done: !!profile.professionalTitle?.trim(), tab: "basic" as const },
    { id: "headline", label: "Write your headline", done: !!profile.headline?.trim(), tab: "basic" as const },
    { id: "bio", label: "Introduce yourself", done: !!profile.bio?.trim(), tab: "basic" as const },
    { id: "location", label: "Add your city or region", done: !!profile.location?.trim(), tab: "basic" as const },
    { id: "specialties", label: "Choose your specialties", done: !!profile.specialties?.length, tab: "expertise" as const },
    { id: "coverImage", label: "Add a cover image", done: !!profile.coverImage, tab: "basic" as const },
  ];
}
