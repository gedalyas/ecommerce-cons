/** Site traffic and funnel events over a window (store only; marketplaces have no sessions). */
export type TrafficAggregate = {
  sessions: number;
  users: number;
  newUsers: number;
  viewItem: number;
  addToCart: number;
  beginCheckout: number;
};

export type TrafficBucket = TrafficAggregate & { bucket: string };

/** Paid-media totals over a window. The platform fee is kept apart from spend on purpose. */
export type AdSpendAggregate = {
  spend: number;
  platformFee: number;
  impressions: number;
  clicks: number;
  attributedRevenue: number;
};

export type AdSpendBucket = AdSpendAggregate & { bucket: string };
