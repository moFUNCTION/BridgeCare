import countriesJson from "./countries.json";
import languagesJson from "./languages.json";
import languagesTranslationsJson from "./languages-translations.json";
import universitiesJson from "./world_universities_and_domains.json";

export type Country = (typeof countriesJson)[number];

type LanguageRaw = (typeof languagesJson)[keyof typeof languagesJson];
type LanguagesTranslations = typeof languagesTranslationsJson;

export type Language = {
  code: string;
  name: string;
  speakers: number | null;
};

export type LanguageLocale = "en" | "ar";

export type WorldUniversity = (typeof universitiesJson)[number];

export const countries = countriesJson as Country[];
export const worldUniversitiesAndDomains =
  universitiesJson as WorldUniversity[];
export interface PageResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export class CountriesRepository {
  private readonly data: Country[];
  private readonly byCode: Map<string, Country>;
  private readonly byName: Map<string, Country>;

  constructor(source: Country[] = countries) {
    this.data = source;
    this.byCode = new Map();
    this.byName = new Map();

    for (const country of source) {
      const code = (country as any).cca3 as string | undefined;
      if (code) {
        this.byCode.set(code.toUpperCase(), country);
      }

      const commonName = (country as any).name?.common as string | undefined;
      if (commonName) {
        this.byName.set(commonName.toLowerCase(), country);
      }
    }
  }

  getAll(): Country[] {
    return this.data;
  }

  getPage(page = 1, pageSize = 20): PageResult<Country> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const total = this.data.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;

    return {
      items: this.data.slice(start, end),
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  }

  getByCode(code: string): Country | undefined {
    return this.byCode.get(code.toUpperCase());
  }

  getByName(commonName: string): Country | undefined {
    return this.byName.get(commonName.toLowerCase());
  }

  searchByName(query: string, page = 1, pageSize = 20): PageResult<Country> {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? this.data.filter((country) => {
          const name = (country as any).name?.common as string | undefined;
          return name?.toLowerCase().includes(normalized);
        })
      : this.data;

    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;

    return {
      items: filtered.slice(start, end),
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  }
}

const languagesData: Language[] = Object.entries(languagesJson).map(
  ([code, item]) => ({
    code,
    name: (item as LanguageRaw).name,
    speakers: (item as LanguageRaw).speakers ?? null,
  }),
);

export class LanguagesRepository {
  private readonly data: Language[];
  private readonly byCode: Map<string, Language>;
  private readonly byName: Map<string, Language>;
  private readonly translations: LanguagesTranslations;

  constructor(
    source: Language[] = languagesData,
    translationsSource: LanguagesTranslations = languagesTranslationsJson,
  ) {
    this.data = source;
    this.translations = translationsSource;
    this.byCode = new Map();
    this.byName = new Map();

    for (const lang of source) {
      this.byCode.set(lang.code.toLowerCase(), lang);
      this.byName.set(lang.name.toLowerCase(), lang);
    }
  }

  getAll(): Language[] {
    return this.data;
  }

  getByCode(code: string): Language | undefined {
    return this.byCode.get(code.toLowerCase());
  }

  getByName(name: string): Language | undefined {
    return this.byName.get(name.toLowerCase());
  }

  /**
   * Get the translated name of a language in the specified locale (en or ar).
   */
  getTranslation(code: string, locale: LanguageLocale): string | undefined {
    const t = this.translations[code as keyof LanguagesTranslations];
    if (!t) return this.getByCode(code)?.name;
    return t[locale];
  }

  getPage(page = 1, pageSize = 20): PageResult<Language> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const total = this.data.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;

    return {
      items: this.data.slice(start, end),
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  }

  searchByName(
    query: string,
    page = 1,
    pageSize = 20,
  ): PageResult<Language> {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? this.data.filter((lang) =>
          lang.name.toLowerCase().includes(normalized),
        )
      : this.data;

    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;

    return {
      items: filtered.slice(start, end),
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  }
}

export class UniversitiesRepository {
  private readonly data: WorldUniversity[];
  private readonly byName: Map<string, WorldUniversity>;
  private readonly byCountryCode: Map<string, WorldUniversity[]>;
  private readonly byDomain: Map<string, WorldUniversity>;

  constructor(source: WorldUniversity[] = worldUniversitiesAndDomains) {
    this.data = source;
    this.byName = new Map();
    this.byCountryCode = new Map();
    this.byDomain = new Map();

    for (const uni of source) {
      const name = (uni as any).name as string | undefined;
      if (name) {
        this.byName.set(name.toLowerCase(), uni);
      }

      const countryCode = (uni as any).alpha_two_code as string | undefined;
      if (countryCode) {
        const key = countryCode.toUpperCase();
        const list = this.byCountryCode.get(key) ?? [];
        list.push(uni);
        this.byCountryCode.set(key, list);
      }

      const domains = (uni as any).domains as string[] | undefined;
      if (domains?.length) {
        for (const domain of domains) {
          this.byDomain.set(domain.toLowerCase(), uni);
        }
      }
    }
  }

  getAll(): WorldUniversity[] {
    return this.data;
  }

  getPage(page = 1, pageSize = 20): PageResult<WorldUniversity> {
    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const total = this.data.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;

    return {
      items: this.data.slice(start, end),
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  }

  getByName(name: string): WorldUniversity | undefined {
    return this.byName.get(name.toLowerCase());
  }

  getByCountryCode(alphaTwoCode: string): WorldUniversity[] {
    return this.byCountryCode.get(alphaTwoCode.toUpperCase()) ?? [];
  }

  getByDomain(domain: string): WorldUniversity | undefined {
    return this.byDomain.get(domain.toLowerCase());
  }

  searchByName(
    query: string,
    page = 1,
    pageSize = 20,
  ): PageResult<WorldUniversity> {
    const normalized = query.trim().toLowerCase();
    const filtered = normalized
      ? this.data.filter((uni) =>
          (uni as any).name?.toLowerCase().includes(normalized),
        )
      : this.data;

    const safePage = Math.max(1, page);
    const safePageSize = Math.max(1, pageSize);
    const total = filtered.length;
    const totalPages = Math.max(1, Math.ceil(total / safePageSize));
    const start = (safePage - 1) * safePageSize;
    const end = start + safePageSize;

    return {
      items: filtered.slice(start, end),
      page: safePage,
      pageSize: safePageSize,
      total,
      totalPages,
    };
  }
}

// Convenient singletons
export const countriesRepository = new CountriesRepository();
export const languagesRepository = new LanguagesRepository();
export const universitiesRepository = new UniversitiesRepository();

export type { GradeOption, SubjectOption } from "./education";
export { grades, subjects } from "./education";
export * from "./virtualDomains";
export { default as googleFontsData } from './fonts.json';

export type Role =
  | "Teacher"
  | "Student"
  | "Affiliate"
  | "Center_Owner"
  | "Content_Creator"
  | "Assistant";

export const ROLES = [
  "Teacher",
  "Student",
  "Affiliate",
  "Center_Owner",
  "Content_Creator",
  "Assistant",
] as const;

