export type CustomersAggregate = {
  /** Distinct buyers with a paid order in the window. */
  customers: number;
  /** Buyers whose first paid order falls in the window. */
  newCustomers: number;
};

export type CustomersBucket = CustomersAggregate & { bucket: string };
