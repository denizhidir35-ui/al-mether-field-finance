import { BANK_PROVIDERS } from "../banks/bank-engine";

export function useFinanceFoundation() {
  return {
    providers: BANK_PROVIDERS,
    liveConnections: 0,
    architectureReady: true,
  } as const;
}
