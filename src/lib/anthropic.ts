import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

export const MODEL      = "claude-sonnet-4-6";
export const MAX_TOKENS = 1024;
export const COST_INPUT  = 3  / 1_000_000;
export const COST_OUTPUT = 15 / 1_000_000;
