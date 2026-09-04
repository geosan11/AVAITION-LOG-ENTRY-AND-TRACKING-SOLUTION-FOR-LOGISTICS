import { TenantTier, Subscription } from './types/database';

export interface PaystackCheckoutOptions {
  key: string;
  email: string;
  amount: number; // in kobo (e.g. 2500000 for ₦25,000)
  currency?: 'NGN' | 'USD';
  plan?: string;
  ref?: string;
  metadata?: Record<string, any>;
  onSuccess: (response: { reference: string; trxref: string; status: string }) => void;
  onClose: () => void;
}

/**
 * Check if a tenant's subscription is currently active or within the 72-hour grace period.
 */
export function isSubscriptionOperational(sub?: Subscription | null): {
  allowed: boolean;
  status: 'active' | 'trialing' | 'grace_period' | 'locked';
  message: string;
  daysRemaining?: number;
} {
  if (!sub) {
    return {
      allowed: false,
      status: 'locked',
      message: 'No active subscription found. Please subscribe to start issuing waybills.',
    };
  }

  const now = new Date();

  // 1. Trial Mode
  if (sub.status === 'trialing') {
    const trialEnd = sub.trial_end_at ? new Date(sub.trial_end_at) : null;
    if (trialEnd && trialEnd > now) {
      const days = Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      return {
        allowed: true,
        status: 'trialing',
        message: `Free Trial Active (${days} days remaining)`,
        daysRemaining: days,
      };
    }
    return {
      allowed: false,
      status: 'locked',
      message: 'Your 14-day free trial has expired. Subscribe to a plan to resume operations.',
    };
  }

  // 2. Active Subscription
  if (sub.status === 'active') {
    return {
      allowed: true,
      status: 'active',
      message: 'Subscription Active',
    };
  }

  // 3. Past Due / Grace Period
  if (sub.status === 'past_due') {
    const graceEnd = sub.grace_period_end ? new Date(sub.grace_period_end) : null;
    if (graceEnd && graceEnd > now) {
      const hours = Math.ceil((graceEnd.getTime() - now.getTime()) / (1000 * 60 * 60));
      return {
        allowed: true,
        status: 'grace_period',
        message: `Payment failed. Grace period active (${hours} hours left to update card).`,
      };
    }
    return {
      allowed: false,
      status: 'locked',
      message: 'Grace period expired. Account is in Read-Only mode until payment is settled.',
    };
  }

  // 4. Suspended or Cancelled
  return {
    allowed: false,
    status: 'locked',
    message: 'Subscription is inactive. Reactivate your subscription to issue new waybills.',
  };
}

/**
 * Verify if tenant has reached their plan limits
 */
export function checkTierLimit(
  tier: TenantTier,
  resource: 'hubs' | 'staff' | 'monthly_awb',
  currentCount: number
): { allowed: boolean; limit: number; current: number } {
  const limits: Record<TenantTier, { hubs: number; staff: number; monthly_awb: number }> = {
    starter: { hubs: 1, staff: 3, monthly_awb: 500 },
    growth: { hubs: 5, staff: 15, monthly_awb: 3000 },
    enterprise: { hubs: 9999, staff: 9999, monthly_awb: 999999 },
  };

  const limit = limits[tier][resource];
  return {
    allowed: currentCount < limit,
    limit,
    current: currentCount,
  };
}
