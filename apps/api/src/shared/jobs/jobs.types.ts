export type JobSendOptions = {
  singletonKey?: string;
  retryLimit?: number;
  retryDelaySeconds?: number;
  expireInMinutes?: number;
  startAfterSeconds?: number;
};

export type JobHandler<T> = (data: T, jobId: string) => Promise<void>;

export type Jobs = {
  start(): Promise<void>;
  stop(): Promise<void>;
  ensureQueue(name: string, retryLimit?: number): Promise<void>;
  send<T extends object>(name: string, data: T, options?: JobSendOptions): Promise<string | null>;
  schedule<T extends object>(name: string, cron: string, data: T): Promise<void>;
  work<T extends object>(name: string, handler: JobHandler<T>): Promise<void>;
};
