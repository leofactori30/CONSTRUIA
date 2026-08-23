export const STRIPE_PRICES: Record<string, string> = {
  student:      process.env.STRIPE_PRICE_STUDENT || "",
  professional: process.env.STRIPE_PRICE_PROFESSIONAL || "",
};

export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  student:      80_000,
  professional: 150_000,
  enterprise:   500_000,
};
