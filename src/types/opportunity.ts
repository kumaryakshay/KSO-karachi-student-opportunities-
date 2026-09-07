/**
 * KSO Core Type Definitions
 * The Opportunity interface is the central data model for the entire app.
 */

/** Opportunity categories available in KSO */
export type OpportunityCategory =
  | 'scholarship'
  | 'internship'
  | 'course'
  | 'competition'
  | 'fellowship'
  | 'training'
  | 'exchange'
  | 'volunteer'
  | 'job'
  | 'other';

/** Education level requirements */
export type EducationLevel =
  | 'matric'
  | 'intermediate'
  | 'bachelors'
  | 'masters'
  | 'phd'
  | 'diploma'
  | 'certificate'
  | 'any';

/** Location type */
export type LocationType = 'onsite' | 'remote' | 'hybrid';

/** Main Opportunity interface */
export interface Opportunity {
  id: string;
  title: string;
  organization: string;
  category: OpportunityCategory;
  description: string;
  shortDescription: string;
  deadline: string | null; // ISO date string
  startDate: string | null; // ISO date string
  location: string;
  locationType: LocationType;
  eligibility: string[];
  educationLevel: EducationLevel[];
  fieldOfStudy: string[];
  stipend: string | null;
  isRemote: boolean;
  applicationUrl: string | null;
  sourceUrl: string | null;
  howToApply: string;
  requirements: string[];
  tags: string[];
  image: string | null;
  isFeatured: boolean;
  isDemoData: boolean;
  createdAt: string; // ISO date string
  updatedAt: string; // ISO date string
}

/** Subset used for list/card views */
export type OpportunityCard = Pick<
  Opportunity,
  | 'id'
  | 'title'
  | 'organization'
  | 'category'
  | 'shortDescription'
  | 'deadline'
  | 'location'
  | 'isRemote'
  | 'stipend'
  | 'tags'
  | 'image'
  | 'isFeatured'
  | 'isDemoData'
>;

/** Filter options for Explore screen */
export interface OpportunityFilters {
  category?: OpportunityCategory[];
  educationLevel?: EducationLevel[];
  isRemote?: boolean;
  location?: string;
  search?: string;
}

/** User profile (will be expanded in Phase 4 with Supabase Auth) */
export interface UserProfile {
  id: string;
  name: string;
  email: string;
  educationLevel?: EducationLevel;
  fieldOfStudy?: string;
  interests?: string[];
  savedOpportunities?: string[]; // array of opportunity IDs
}
