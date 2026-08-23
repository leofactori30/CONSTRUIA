// @ts-nocheck
import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-06-24.dahlia" as any,
});

export const STRIPE_PRICES: Record<string, string> = {
  student:      process.env.STRIPE_PRICE_STUDENT!,
  professional: process.env.STRIPE_PRICE_PROFESSIONAL!,
};

export const PLAN_TOKEN_LIMITS: Record<string, number> = {
  student:      80_000,
  professional: 150_000,
  enterprise:   500_000,
};
// cache bust Sun Aug 23 11:46:30 -03 2026
