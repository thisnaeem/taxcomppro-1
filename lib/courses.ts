export interface CourseOffering {
  id: string;
  slug: string;
  title: string;
  category: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED";
  description: string;
  thumbnail: string;
  modules: number;
  totalLessons: number;
  interactiveLabs: number;
  duration: string;
  totalDurationSeconds: number;
  enrolledCount: number;
  price: number;
  isFree: boolean;
  externalUrl: string;
  instructor: {
    name: string;
    image: string | null;
    role?: string;
  };
}

export const COURSES: CourseOffering[] = [
  {
    id: "30-day-tax-office-launch",
    slug: "30-day-launch",
    title: "30 Day Tax Office Launch Course",
    category: "Tax Office Startup",
    level: "BEGINNER",
    description:
      "A 30-day step-by-step roadmap to building, licensing, marketing, securing, and scaling a compliant professional tax practice with Commander Nova Grant.",
    thumbnail: "/30daylucnh_course.png",
    modules: 6,
    totalLessons: 30,
    interactiveLabs: 30,
    duration: "10.0 hrs",
    totalDurationSeconds: 36000,
    enrolledCount: 142,
    price: 97,
    isFree: false,
    externalUrl: "https://30daylaunch.taxcomppro.com/",
    instructor: {
      name: "Commander Nova Grant",
      image: "/fevicon.webp",
      role: "ADMIN",
    },
  },
  {
    id: "irs-fine-defense-masterclass",
    slug: "irs-fine-defense",
    title: "IRS Fine Defense Course",
    category: "Compliance",
    level: "BEGINNER",
    description:
      "The complete owner/ERO defense curriculum: 7 modules, 30 lessons, Evidence Locker, Red Flag Lab, Notice Response Room, and verifiable Certificate.",
    thumbnail: "/irsfinedefnce course.png",
    modules: 7,
    totalLessons: 30,
    interactiveLabs: 3,
    duration: "8.0 hrs",
    totalDurationSeconds: 28800,
    enrolledCount: 389,
    price: 97,
    isFree: false,
    externalUrl: "https://irsfinedefense.taxcomppro.com/",
    instructor: {
      name: "TaxCompPro Compliance Team",
      image: "/fevicon.webp",
      role: "ADMIN",
    },
  },
  {
    id: "schedule-c-reconstruction-course",
    slug: "schedule-c-reconstruction",
    title: "Schedule C Reconstruction Course",
    category: "Business Tax",
    level: "INTERMEDIATE",
    description:
      "Defensible income and expense reconstruction methodologies under Cohan and IRC §6001. Complete with Vega video briefings, deposit analysis schedules, and audit workpapers.",
    thumbnail: "/schdulec_course.png",
    modules: 12,
    totalLessons: 12,
    interactiveLabs: 3,
    duration: "4.8 hrs",
    totalDurationSeconds: 17280,
    enrolledCount: 215,
    price: 97,
    isFree: false,
    externalUrl: "https://schedulecrecon.taxcomppro.com/",
    instructor: {
      name: "TaxCompPro Advisory",
      image: "/fevicon.webp",
      role: "ADMIN",
    },
  },
  {
    id: "irs-audit-playbook-course",
    slug: "irs-audit-playbook",
    title: "IRS Audit Playbook Course",
    category: "Audit",
    level: "INTERMEDIATE",
    description:
      "Pre-audit containment, IDR scope-locking, and defensible audit binder construction. Train your office to handle correspondence examinations with zero penalty exposure.",
    thumbnail: "/audit_playbook_course.png",
    modules: 5,
    totalLessons: 20,
    interactiveLabs: 3,
    duration: "5.2 hrs",
    totalDurationSeconds: 18720,
    enrolledCount: 178,
    price: 97,
    isFree: false,
    externalUrl: "https://auditplaybook.taxcomppro.com/",
    instructor: {
      name: "TaxCompPro Audit Division",
      image: "/fevicon.webp",
      role: "ADMIN",
    },
  },
  {
    id: "credits-filing-status-course",
    slug: "credits-filing-status",
    title: "Credits & Filing Status Explained Course",
    category: "Compliance",
    level: "BEGINNER",
    description:
      "Statutory due-diligence framework covering EITC, CTC/ACTC, AOTC, and Head of Household. Master the 5-separate-questions method and eliminate multi-credit collision errors.",
    thumbnail: "/credit_course.png",
    modules: 7,
    totalLessons: 30,
    interactiveLabs: 4,
    duration: "6.5 hrs",
    totalDurationSeconds: 23400,
    enrolledCount: 294,
    price: 97,
    isFree: false,
    externalUrl: "https://credits.taxcomppro.com/",
    instructor: {
      name: "TaxCompPro Masterclass",
      image: "/fevicon.webp",
      role: "ADMIN",
    },
  },
  {
    id: "staff-audit-ready-due-diligence",
    slug: "due-diligence",
    title: "The Staff's Audit Ready Due Diligence Playbook",
    category: "Compliance",
    level: "BEGINNER",
    description:
      "Train staff, document completion, and maintain stronger office due-diligence records under Form 8867 compliance guidelines.",
    thumbnail: "/audirready due dillgenmce _course.png",
    modules: 4,
    totalLessons: 10,
    interactiveLabs: 2,
    duration: "3.0 hrs",
    totalDurationSeconds: 10800,
    enrolledCount: 310,
    price: 299,
    isFree: false,
    externalUrl: "https://staffaudit.taxcomppro.com/",
    instructor: {
      name: "Atlas Academy Faculty",
      image: "/fevicon.webp",
      role: "ADMIN",
    },
  },
];

export function getCourseBySlug(slug: string): CourseOffering | undefined {
  return COURSES.find((c) => c.slug === slug || c.id === slug);
}

export function getAllCourses(): CourseOffering[] {
  return COURSES;
}
