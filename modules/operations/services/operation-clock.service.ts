export interface OperationClockService {
  now(): string;
}

export const systemOperationClock: OperationClockService = {
  now: () => new Date().toISOString()
};
