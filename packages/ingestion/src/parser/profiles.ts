import type { LawProfile } from "./types.js";

function identity(
  id: string,
  lawName: string,
  lawNumber: string,
  year: string,
  kind: "law" | "decree_law" | "ministerial_decision",
  title: string,
  startPage: number,
  endPage: number,
  startMarkerOrdinal?: number,
  startAfter?: {
    page: number;
    articleNumber: string;
    occurrenceOnPage?: number;
  },
) {
  return {
    id,
    lawName,
    lawNumber,
    year,
    kind,
    title,
    startPage,
    endPage,
    ...(startMarkerOrdinal === undefined ? {} : { startMarkerOrdinal }),
    ...(startAfter === undefined ? {} : { startAfter }),
  };
}

export const LABOUR_PROFILE: LawProfile = {
  id: "labour-law-14-2025",
  displayName: "Egyptian Labour Law",
  sourceFilePattern: /14.*2025|labou?r/i,
  defaultIdentity: identity(
    "labour-law-14-2025",
    "labour_law",
    "14",
    "2025",
    "law",
    "قانون رقم 14 لسنة 2025 بإصدار قانون العمل",
    2,
    112,
  ),
  pdfRecovery: {
    enabled: true,
    requireUniqueAnchor: true,
    requiresReview: true,
  },
  identities: [
    identity(
      "labour-law-14-2025",
      "labour_law",
      "14",
      "2025",
      "law",
      "قانون رقم 14 لسنة 2025 بإصدار قانون العمل",
      2,
      112,
    ),
  ],
};

export const FINANCIAL_PROFILE: LawProfile = {
  id: "financial-law-6-2022",
  displayName: "Unified Public Finance Law",
  sourceFilePattern: /U0645#U0627#U0644#U064a|financial|المالية/i,
  defaultIdentity: identity(
    "financial-law-6-2022",
    "financial_law",
    "6",
    "2022",
    "law",
    "قانون رقم 6 لسنة 2022 بإصدار قانون المالية العامة الموحد",
    1,
    10,
  ),
  pdfRecovery: {
    enabled: false,
    requireUniqueAnchor: true,
    requiresReview: true,
  },
  identities: [
    identity(
      "financial-law-6-2022",
      "financial_law",
      "6",
      "2022",
      "law",
      "قانون رقم 6 لسنة 2022 بإصدار قانون المالية العامة الموحد",
      1,
      10,
    ),
  ],
};

export const PERSONAL_PROFILE: LawProfile = {
  id: "personal-affairs-compilation",
  displayName: "Personal Affairs / Inheritance / Wills Compilation",
  sourceFilePattern:
    /U0627#U0644#U0623#U062d#U0648#U0627#U0644|personal|الأحوال|الشخصية/i,
  defaultIdentity: identity(
    "personal-affairs-collection",
    "personal_affairs",
    "",
    "",
    "law",
    "مجموعة قوانين الأحوال الشخصية",
    1,
    66,
  ),
  pdfRecovery: {
    enabled: false,
    requireUniqueAnchor: true,
    requiresReview: true,
  },
  identities: [
    identity(
      "personal-law-25-1920",
      "personal_affairs",
      "25",
      "1920",
      "law",
      "القانون رقم 25 لسنة 1920 بأحكام النفقة وبعض مسائل الأحوال الشخصية",
      1,
      3,
    ),
    identity(
      "personal-decree-25-1929",
      "personal_affairs",
      "25",
      "1929",
      "decree_law",
      "مرسوم بقانون رقم 25 لسنة 1929 خاص ببعض أحكام الأحوال الشخصية",
      3,
      8,
      4,
      { page: 3, articleNumber: "13" },
    ),
    identity(
      "inheritance-law-77-1943",
      "inheritance",
      "77",
      "1943",
      "law",
      "القانون رقم 77 لسنة 1943 بشأن المواريث",
      8,
      15,
      4,
      { page: 8, articleNumber: "25" },
    ),
    identity(
      "inheritance-application-law-35-1944",
      "inheritance",
      "35",
      "1944",
      "law",
      "القانون رقم 35 لسنة 1944 بشأن بيان القانون الواجب التطبيق في مسائل المواريث والوصايا",
      15,
      15,
      2,
      { page: 15, articleNumber: "48" },
    ),
    identity(
      "wills-law-71-1946",
      "wills",
      "71",
      "1946",
      "law",
      "قانون رقم 71 لسنة 1946 بإصدار قانون الوصية",
      15,
      27,
      4,
      { page: 15, articleNumber: "2", occurrenceOnPage: 1 },
    ),
    identity(
      "guardianship-person-decree-118-1952",
      "guardianship",
      "118",
      "1952",
      "decree_law",
      "مرسوم بقانون رقم 118 لسنة 1952 بتقرير حالات لسلب الولاية على النفس",
      27,
      29,
      5,
      { page: 27, articleNumber: "82" },
    ),
    identity(
      "guardianship-property-decree-119-1952",
      "guardianship",
      "119",
      "1952",
      "decree_law",
      "مرسوم بقانون رقم 119 لسنة 1952 بأحكام الولاية على المال",
      29,
      40,
      5,
      { page: 29, articleNumber: "13" },
    ),
    identity(
      "litigation-law-1-2000",
      "personal_affairs",
      "1",
      "2000",
      "law",
      "قانون رقم 1 لسنة 2000 بإصدار قانون تنظيم بعض أوضاع وإجراءات التقاضي في مسائل الأحوال الشخصية",
      40,
      55,
      1,
      { page: 39, articleNumber: "88" },
    ),
    identity(
      "ministerial-decision-3269-1985",
      "personal_affairs",
      "3269",
      "1985",
      "ministerial_decision",
      "قرار وزير العدل رقم 3269 لسنة 1985",
      56,
      57,
      0,
      { page: 55, articleNumber: "79" },
    ),
    identity(
      "ministerial-decision-1086-2000",
      "personal_affairs",
      "1086",
      "2000",
      "ministerial_decision",
      "قرار وزير العدل رقم 1086 لسنة 2000",
      58,
      58,
      0,
      { page: 57, articleNumber: "11" },
    ),
    identity(
      "ministerial-decision-1087-2000",
      "personal_affairs",
      "1087",
      "2000",
      "ministerial_decision",
      "قرار وزير العدل رقم 1087 لسنة 2000",
      58,
      59,
      2,
      { page: 58, articleNumber: "2", occurrenceOnPage: 1 },
    ),
    identity(
      "ministerial-decision-1088-2000",
      "personal_affairs",
      "1088",
      "2000",
      "ministerial_decision",
      "قرار وزير العدل رقم 1088 لسنة 2000",
      60,
      62,
      0,
      { page: 59, articleNumber: "9" },
    ),
    identity(
      "ministerial-decision-1089-2000",
      "personal_affairs",
      "1089",
      "2000",
      "ministerial_decision",
      "قرار وزير العدل رقم 1089 لسنة 2000",
      62,
      64,
      5,
      { page: 62, articleNumber: "23" },
    ),
    identity(
      "ministerial-decision-1090-2000",
      "personal_affairs",
      "1090",
      "2000",
      "ministerial_decision",
      "قرار وزير العدل رقم 1090 لسنة 2000",
      64,
      66,
      2,
      { page: 64, articleNumber: "12" },
    ),
  ],
};

export const PROFILES = [
  LABOUR_PROFILE,
  FINANCIAL_PROFILE,
  PERSONAL_PROFILE,
] as const;

export function getProfile(pdfPath: string, explicit?: string): LawProfile {
  if (explicit === "labour") return LABOUR_PROFILE;
  if (explicit === "financial") return FINANCIAL_PROFILE;
  if (explicit === "personal") return PERSONAL_PROFILE;

  const match = PROFILES.find((profile) =>
    profile.sourceFilePattern.test(pdfPath),
  );
  if (!match)
    throw new Error(`Cannot determine law profile from PDF: ${pdfPath}`);
  return match;
}
