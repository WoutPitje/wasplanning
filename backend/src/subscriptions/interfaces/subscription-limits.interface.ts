export interface SubscriptionLimits {
  cars_per_month: number | null;
  max_users: number | null;
  max_locations: number | null;
}

export interface LimitCheckResult {
  allowed: boolean;
  currentUsage: number;
  limit: number | null;
  percentage: number;
  message?: string;
}

export class SubscriptionLimitExceededException extends Error {
  constructor(
    public readonly limitType: string,
    public readonly currentUsage: number,
    public readonly limit: number,
    public readonly upgradeUrl?: string,
  ) {
    super(
      `Subscription limit exceeded for ${limitType}. Current: ${currentUsage}, Limit: ${limit}`,
    );
    this.name = 'SubscriptionLimitExceededException';
  }
}
