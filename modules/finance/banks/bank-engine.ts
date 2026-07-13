import type { BankService } from "../services";

export type BankProviderDefinition = {
  code: string;
  name: string;
  enabled: boolean;
};

export interface BankEngine extends BankService {
  providers(): readonly BankProviderDefinition[];
}

export const BANK_PROVIDERS: readonly BankProviderDefinition[] = [
  "İş Bankası", "Garanti BBVA", "Ziraat", "QNB", "VakıfBank",
  "TEB", "Akbank", "DenizBank", "Kuveyt Türk", "Türkiye Finans",
].map((name, index) => ({ code: `bank-${index + 1}`, name, enabled: false }));
