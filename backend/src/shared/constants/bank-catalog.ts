// ─── Bank Catalog ────────────────────────────────────────────

export type BankCategory = 'state-owned' | 'private' | 'international' | 'finance-company';

export interface IBankCatalogEntry {
  bankCode: string;
  name: string;
  shortName: string;
  logoPath: string;
  category: BankCategory;
}

export const BANK_CATALOG: ReadonlyArray<IBankCatalogEntry> = [
  // State-owned banks (Big 4)
  {
    bankCode: 'vietcombank',
    name: 'Ngân hàng TMCP Ngoại thương Việt Nam',
    shortName: 'Vietcombank',
    logoPath: '/images/banks/vietcombank.svg',
    category: 'state-owned',
  },
  {
    bankCode: 'bidv',
    name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam',
    shortName: 'BIDV',
    logoPath: '/images/banks/bidv.svg',
    category: 'state-owned',
  },
  {
    bankCode: 'vietinbank',
    name: 'Ngân hàng TMCP Công thương Việt Nam',
    shortName: 'VietinBank',
    logoPath: '/images/banks/vietinbank.svg',
    category: 'state-owned',
  },
  {
    bankCode: 'agribank',
    name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn Việt Nam',
    shortName: 'Agribank',
    logoPath: '/images/banks/agribank.svg',
    category: 'state-owned',
  },
  // Private banks
  {
    bankCode: 'vpbank',
    name: 'Ngân hàng TMCP Việt Nam Thịnh Vượng',
    shortName: 'VPBank',
    logoPath: '/images/banks/vpbank.svg',
    category: 'private',
  },
  {
    bankCode: 'techcombank',
    name: 'Ngân hàng TMCP Kỹ thương Việt Nam',
    shortName: 'Techcombank',
    logoPath: '/images/banks/techcombank.svg',
    category: 'private',
  },
  {
    bankCode: 'sacombank',
    name: 'Ngân hàng TMCP Sài Gòn Thương Tín',
    shortName: 'Sacombank',
    logoPath: '/images/banks/sacombank.svg',
    category: 'private',
  },
  {
    bankCode: 'vib',
    name: 'Ngân hàng TMCP Quốc tế Việt Nam',
    shortName: 'VIB',
    logoPath: '/images/banks/vib.svg',
    category: 'private',
  },
  {
    bankCode: 'mbbank',
    name: 'Ngân hàng TMCP Quân đội',
    shortName: 'MBBank',
    logoPath: '/images/banks/mbbank.svg',
    category: 'private',
  },
  {
    bankCode: 'acb',
    name: 'Ngân hàng TMCP Á Châu',
    shortName: 'ACB',
    logoPath: '/images/banks/acb.svg',
    category: 'private',
  },
  // International banks
  {
    bankCode: 'uob',
    name: 'United Overseas Bank',
    shortName: 'UOB',
    logoPath: '/images/banks/uob.svg',
    category: 'international',
  },
  {
    bankCode: 'hsbc',
    name: 'HSBC Bank (Vietnam) Ltd.',
    shortName: 'HSBC',
    logoPath: '/images/banks/hsbc.svg',
    category: 'international',
  },
  {
    bankCode: 'standard-chartered',
    name: 'Standard Chartered Bank (Vietnam) Ltd.',
    shortName: 'Standard Chartered',
    logoPath: '/images/banks/standard-chartered.svg',
    category: 'international',
  },
  // Finance companies
  {
    bankCode: 'home-credit',
    name: 'Công ty Tài chính TNHH MTV Home Credit Việt Nam',
    shortName: 'Home Credit',
    logoPath: '/images/banks/home-credit.svg',
    category: 'finance-company',
  },
] as const;

/**
 * Find a bank entry by its stable code identifier.
 * @returns the matching entry or undefined if the code is not in the catalog
 */
export function findBankByCode(code: string): IBankCatalogEntry | undefined {
  return BANK_CATALOG.find((bank) => bank.bankCode === code);
}
