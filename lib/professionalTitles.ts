export const PROFESSIONAL_TITLES = [
  "Realtor", "Service Bureau", "Tax Professional", "Records Compliance Manager", "ERO", "CAA",
  "General Contractor", "Insurance Agent", "Banker", "Software Provider", "Real Estate Broker",
  "Real Estate Investor", "Mortgage Broker", "Loan Officer", "Investment Broker", "Stock Trader",
  "Financial Trader", "Investment Advisor", "Notary Public", "Loan Signing Agent", "Title Agent",
  "Escrow Officer", "Enrolled Agent", "CPA", "Tax Attorney", "Tax Office Owner", "Tax Resolution Specialist",
  "Tax Consultant", "Bookkeeper", "Accountant", "Payroll Specialist", "Financial Advisor", "Business Consultant",
  "Service Bureau Owner", "Educator / Trainer", "Marketing Professional", "Administrative Professional",
  "Operations Manager", "Compliance Officer", "Business Owner", "Vendor / Industry Partner",
  "Student / Aspiring Professional", "Other",
] as const;

export function isProfessionalTitle(value: unknown): value is typeof PROFESSIONAL_TITLES[number] {
  return typeof value === "string" && (PROFESSIONAL_TITLES as readonly string[]).includes(value);
}
