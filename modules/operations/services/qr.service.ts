export interface OperationQrService {
  scan(): Promise<string>;
}
