/**
 * KSO Opportunity Service
 *
 * Loads opportunities from Supabase.
 * Karachi opportunities are prioritized first.
 *
 * Supports:
 * - Supabase opportunities
 * - Karachi priority
 * - Location filtering
 * - Category filtering
 * - Education filtering
 * - Field filtering
 * - Search
 * - Deadline filtering
 * - Sorting
 */

import {
  supabase,
  isSupabaseConfigured,
} from './supabaseClient';

import { mockOpportunities } from '../data/mockOpportunities';

import {
  Opportunity,
  OpportunityCategory,
  EducationLevel,
} from '../types/opportunity';

import {
  getDaysRemaining,
} from '../utils/deadline';

// ─────────────────────────────────────────────
// TYPES
// ─────────────────────────────────────────────

export type SortOption =
  | 'newest'
  | 'deadline'
  | 'popular';

export type LocationFilter =
  | 'all'
  | 'karachi'
  | 'lahore'
  | 'islamabad'
  | 'online';

export interface ExploreFilters {
  category?: OpportunityCategory | 'all';

  educationLevel?:
    | EducationLevel
    | 'all';

  fieldOfStudy?: string | 'all';

  organization?: string | 'all';

  location?: LocationFilter;

  isRemote?: boolean | null;

  isPaid?: boolean | null;

  deadlineRange?:
    | 'all'
    | 'week'
    | 'month'
    | 'open';

  search?: string;

  sortBy?: SortOption;
}

// ─────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────

function toArray(value: any): string[] {
  if (Array.isArray(value)) {
    return value;
  }

  if (
    typeof value === 'string' &&
    value.trim()
  ) {
    return [value];
  }

  return [];
}

// ─────────────────────────────────────────────
// DATABASE → APP OBJECT
// ─────────────────────────────────────────────

function mapRowToOpportunity(
  row: any
): Opportunity {
  return {
    id: row.id,

    title:
      row.title || '',

    organization:
      row.organization || '',

    category:
      row.category || 'other',

    description:
      row.description ||
      row.short_description ||
      '',

    shortDescription:
      row.short_description || '',

    deadline:
      row.deadline || null,

    startDate:
      row.start_date || null,

    location:
      row.location || '',

    locationType:
      row.location_type || 'onsite',

    eligibility:
      toArray(row.eligibility),

    educationLevel:
      toArray(
        row.education_level
      ) as any,

    fieldOfStudy:
      toArray(
        row.field_of_study
      ),

    stipend:
      row.stipend || null,

    isRemote:
      row.is_remote === true,

    applicationUrl:
      row.application_url || null,

    sourceUrl:
      row.source_url || null,

    howToApply:
      row.how_to_apply || '',

    requirements:
      Array.isArray(
        row.requirements
      )
        ? row.requirements
        : [],

    tags:
      Array.isArray(row.tags)
        ? row.tags
        : [],

    image:
      row.image_url || null,

    isFeatured:
      row.is_featured === true,

    isDemoData:
      row.is_demo_data === true,

    createdAt:
      row.created_at ||
      new Date().toISOString(),

    updatedAt:
      row.updated_at ||
      new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────
// LOCATION
// ─────────────────────────────────────────────

function isKarachi(
  opportunity: Opportunity
): boolean {
  const text = `
    ${opportunity.location || ''}
    ${opportunity.description || ''}
    ${opportunity.shortDescription || ''}
    ${opportunity.organization || ''}
  `.toLowerCase();

  return (
    text.includes('karachi') ||
    text.includes('khi')
  );
}

function isLahore(
  opportunity: Opportunity
): boolean {
  const text = `
    ${opportunity.location || ''}
    ${opportunity.description || ''}
  `.toLowerCase();

  return text.includes('lahore');
}

function isIslamabad(
  opportunity: Opportunity
): boolean {
  const text = `
    ${opportunity.location || ''}
    ${opportunity.description || ''}
  `.toLowerCase();

  return (
    text.includes('islamabad') ||
    text.includes('rawalpindi')
  );
}

function isOnline(
  opportunity: Opportunity
): boolean {
  const text = `
    ${opportunity.location || ''}
    ${opportunity.locationType || ''}
    ${opportunity.description || ''}
  `.toLowerCase();

  return (
    opportunity.isRemote === true ||
    text.includes('online') ||
    text.includes('remote')
  );
}

// ─────────────────────────────────────────────
// KARACHI FIRST
// ─────────────────────────────────────────────

function sortKarachiFirst(
  opportunities: Opportunity[]
): Opportunity[] {
  return [...opportunities].sort(
    (a, b) => {
      const aKarachi =
        isKarachi(a);

      const bKarachi =
        isKarachi(b);

      // Karachi first
      if (
        aKarachi &&
        !bKarachi
      ) {
        return -1;
      }

      if (
        !aKarachi &&
        bKarachi
      ) {
        return 1;
      }

      // Newest after Karachi priority
      return (
        new Date(
          b.createdAt
        ).getTime() -
        new Date(
          a.createdAt
        ).getTime()
      );
    }
  );
}

// ─────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────

function searchMatch(
  opportunity: Opportunity,
  search?: string
): boolean {
  const query =
    search?.trim().toLowerCase();

  if (!query) {
    return true;
  }

  return (
    opportunity.title
      .toLowerCase()
      .includes(query) ||

    opportunity.organization
      .toLowerCase()
      .includes(query) ||

    opportunity.category
      .toLowerCase()
      .includes(query) ||

    opportunity.location
      .toLowerCase()
      .includes(query) ||

    opportunity.description
      .toLowerCase()
      .includes(query) ||

    opportunity.shortDescription
      .toLowerCase()
      .includes(query) ||

    opportunity.tags.some(
      (tag) =>
        tag
          .toLowerCase()
          .includes(query)
    )
  );
}

// ─────────────────────────────────────────────
// FILTERS
// ─────────────────────────────────────────────

function applyFilters(
  opportunities: Opportunity[],
  filters: ExploreFilters
): Opportunity[] {
  let results = [
    ...opportunities,
  ];

  // Category
  if (
    filters.category &&
    filters.category !== 'all'
  ) {
    results =
      results.filter(
        (opportunity) =>
          opportunity.category ===
          filters.category
      );
  }

  // Location
  if (
    filters.location &&
    filters.location !== 'all'
  ) {
    if (
      filters.location ===
      'karachi'
    ) {
      results =
        results.filter(
          isKarachi
        );
    }

    if (
      filters.location ===
      'lahore'
    ) {
      results =
        results.filter(
          isLahore
        );
    }

    if (
      filters.location ===
      'islamabad'
    ) {
      results =
        results.filter(
          isIslamabad
        );
    }

    if (
      filters.location ===
      'online'
    ) {
      results =
        results.filter(
          isOnline
        );
    }
  }

  // Education
  if (
    filters.educationLevel &&
    filters.educationLevel !== 'all'
  ) {
    results =
      results.filter(
        (opportunity) =>
          opportunity.educationLevel.includes(
            filters.educationLevel as any
          ) ||
          opportunity.educationLevel.includes(
            'any'
          )
      );
  }

  // Field
  if (
    filters.fieldOfStudy &&
    filters.fieldOfStudy !== 'all'
  ) {
    const field =
      filters.fieldOfStudy
        .toLowerCase();

    results =
      results.filter(
        (opportunity) =>
          opportunity.fieldOfStudy.some(
            (item) =>
              item
                .toLowerCase()
                .includes(field) ||
              item
                .toLowerCase() ===
                'any'
          )
      );
  }

  // Organization
  if (
    filters.organization &&
    filters.organization !== 'all'
  ) {
    results =
      results.filter(
        (opportunity) =>
          opportunity.organization
            .toLowerCase() ===
          filters.organization!
            .toLowerCase()
      );
  }

  // Remote
  if (
    filters.isRemote === true
  ) {
    results =
      results.filter(
        (opportunity) =>
          opportunity.isRemote
      );
  }

  if (
    filters.isRemote === false
  ) {
    results =
      results.filter(
        (opportunity) =>
          !opportunity.isRemote
      );
  }

  // Paid
  if (
    filters.isPaid === true
  ) {
    results =
      results.filter(
        (opportunity) =>
          !!opportunity.stipend
      );
  }

  if (
    filters.isPaid === false
  ) {
    results =
      results.filter(
        (opportunity) =>
          !opportunity.stipend
      );
  }

  // Deadline
  if (
    filters.deadlineRange &&
    filters.deadlineRange !== 'all'
  ) {
    results =
      results.filter(
        (opportunity) => {
          if (
            filters.deadlineRange ===
            'open'
          ) {
            return (
              opportunity.deadline ===
              null
            );
          }

          const days =
            getDaysRemaining(
              opportunity.deadline
            );

          if (days === null) {
            return false;
          }

          if (
            filters.deadlineRange ===
            'week'
          ) {
            return (
              days >= 0 &&
              days <= 7
            );
          }

          if (
            filters.deadlineRange ===
            'month'
          ) {
            return (
              days >= 0 &&
              days <= 30
            );
          }

          return true;
        }
      );
  }

  // Search
  if (filters.search) {
    results =
      results.filter(
        (opportunity) =>
          searchMatch(
            opportunity,
            filters.search
          )
      );
  }

  // Sort
  switch (
    filters.sortBy
  ) {
    case 'deadline':
      results.sort(
        (a, b) => {
          if (
            !a.deadline &&
            !b.deadline
          ) {
            return 0;
          }

          if (!a.deadline) return 1;

          if (!b.deadline) return -1;

          return (
            new Date(
              a.deadline
            ).getTime() -
            new Date(
              b.deadline
            ).getTime()
          );
        }
      );
      break;

    case 'popular':
      results.sort(
        (a, b) => {
          if (
            a.isFeatured &&
            !b.isFeatured
          ) {
            return -1;
          }

          if (
            !a.isFeatured &&
            b.isFeatured
          ) {
            return 1;
          }

          return (
            new Date(
              b.createdAt
            ).getTime() -
            new Date(
              a.createdAt
            ).getTime()
          );
        }
      );
      break;

    case 'newest':
    default:
      results =
        sortKarachiFirst(
          results
        );
      break;
  }

  return results;
}

// ─────────────────────────────────────────────
// GET ALL
// ─────────────────────────────────────────────

export async function getAllOpportunities(): Promise<
  Opportunity[]
> {
  // Fallback
  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    console.log(
      'Supabase not configured. Using mock opportunities.'
    );

    return sortKarachiFirst(
      mockOpportunities
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('opportunities')
    .select('*')
    .order(
      'created_at',
      {
        ascending: false,
      }
    );

  if (error) {
    console.error(
      'Failed to load opportunities:',
      error
    );

    throw new Error(
      `Failed to load opportunities: ${error.message}`
    );
  }

  const opportunities =
    (data || []).map(
      mapRowToOpportunity
    );

  console.log(
    `Loaded ${opportunities.length} opportunities from Supabase`
  );

  return sortKarachiFirst(
    opportunities
  );
}

// ─────────────────────────────────────────────
// SEARCH
// ─────────────────────────────────────────────

export async function searchOpportunities(
  filters: ExploreFilters
): Promise<Opportunity[]> {
  const opportunities =
    await getAllOpportunities();

  return applyFilters(
    opportunities,
    filters
  );
}

// ─────────────────────────────────────────────
// FEATURED
// ─────────────────────────────────────────────

export async function getFeaturedOpportunities(): Promise<
  Opportunity[]
> {
  const opportunities =
    await getAllOpportunities();

  return opportunities.filter(
    (opportunity) =>
      opportunity.isFeatured
  );
}

// ─────────────────────────────────────────────
// SINGLE OPPORTUNITY
// ─────────────────────────────────────────────

export async function getOpportunityById(
  id: string
): Promise<Opportunity | null> {
  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    return (
      mockOpportunities.find(
        (opportunity) =>
          opportunity.id === id
      ) || null
    );
  }

  const {
    data,
    error,
  } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error(
      'Failed to load opportunity:',
      error
    );

    throw new Error(
      `Failed to load opportunity: ${error.message}`
    );
  }

  return data
    ? mapRowToOpportunity(data)
    : null;
}

// ─────────────────────────────────────────────
// CATEGORY
// ─────────────────────────────────────────────

export async function getOpportunitiesByCategory(
  category: OpportunityCategory
): Promise<Opportunity[]> {
  const opportunities =
    await getAllOpportunities();

  return opportunities.filter(
    (opportunity) =>
      opportunity.category ===
      category
  );
}

// ─────────────────────────────────────────────
// ORGANIZATIONS
// ─────────────────────────────────────────────

export async function getAllOrganizations(): Promise<
  string[]
> {
  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    return Array.from(
      new Set(
        mockOpportunities.map(
          (opportunity) =>
            opportunity.organization
        )
      )
    ).sort();
  }

  const {
    data,
    error,
  } = await supabase
    .from('opportunities')
    .select(
      'organization'
    );

  if (error) {
    throw new Error(
      `Failed to load organizations: ${error.message}`
    );
  }

  return Array.from(
    new Set(
      (data || [])
        .map(
          (row: any) =>
            row.organization
        )
        .filter(Boolean)
    )
  ).sort();
}

// ─────────────────────────────────────────────
// FIELDS OF STUDY
// ─────────────────────────────────────────────

export async function getAllFieldsOfStudy(): Promise<
  string[]
> {
  if (
    !isSupabaseConfigured() ||
    !supabase
  ) {
    return Array.from(
      new Set(
        mockOpportunities
          .flatMap(
            (opportunity) =>
              opportunity.fieldOfStudy
          )
          .filter(
            (field) =>
              field !== 'any'
          )
      )
    ).sort();
  }

  const {
    data,
    error,
  } = await supabase
    .from('opportunities')
    .select(
      'field_of_study'
    );

  if (error) {
    throw new Error(
      `Failed to load fields: ${error.message}`
    );
  }

  const fields =
    new Set<string>();

  (data || []).forEach(
    (row: any) => {
      toArray(
        row.field_of_study
      ).forEach(
        (field) => {
          if (
            field &&
            field !== 'any'
          ) {
            fields.add(
              field
            );
          }
        }
      );
    }
  );

  return Array.from(fields).sort();
}