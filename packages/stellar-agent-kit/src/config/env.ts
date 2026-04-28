import { z } from "zod";

const stellarSecretKeyRegex = /^S[A-Z2-7]{55}$/;
const stellarPublicKeyRegex = /^G[A-Z2-7]{55}$/;

export const StellarEnvSchema = z.object({
  SECRET_KEY: z
    .string({ required_error: "SECRET_KEY is required" })
    .regex(
      stellarSecretKeyRegex,
      "SECRET_KEY must be a valid Stellar secret key starting with S (56 chars)"
    ),
});

export const X402EnvSchema = z.object({
  X402_DESTINATION: z
    .string({ required_error: "X402_DESTINATION is required" })
    .regex(
      stellarPublicKeyRegex,
      "X402_DESTINATION must be a valid Stellar public key starting with G (56 chars)"
    ),
});

export const SoroSwapEnvSchema = z.object({
  SOROSWAP_API_KEY: z
    .string({ required_error: "SOROSWAP_API_KEY is required" })
    .min(1, "SOROSWAP_API_KEY cannot be empty"),
});

export const McpEnvSchema = z.object({
  SECRET_KEY: z
    .string({ required_error: "SECRET_KEY is required for execute_swap" })
    .regex(
      stellarSecretKeyRegex,
      "SECRET_KEY must be a valid Stellar secret key starting with S (56 chars)"
    ),
  SOROSWAP_API_KEY: z
    .string({ required_error: "SOROSWAP_API_KEY is required" })
    .min(1, "SOROSWAP_API_KEY cannot be empty"),
});

export type StellarEnv = z.infer<typeof StellarEnvSchema>;
export type X402Env = z.infer<typeof X402EnvSchema>;
export type SoroSwapEnv = z.infer<typeof SoroSwapEnvSchema>;
export type McpEnv = z.infer<typeof McpEnvSchema>;

/**
 * Validate required env vars for StellarAgentKit.
 * Throws a descriptive ZodError if any are missing or malformed.
 * Call once at startup before constructing StellarAgentKit.
 */
export function validateStellarEnv(
  env: NodeJS.ProcessEnv = process.env
): StellarEnv {
  const result = StellarEnvSchema.safeParse(env);
  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(
      `StellarAgentKit startup failed — missing or invalid env vars:\n${messages}`
    );
  }
  return result.data;
}

/**
 * Validate required env vars for x402-stellar-sdk server middleware.
 */
export function validateX402Env(
  env: NodeJS.ProcessEnv = process.env
): X402Env {
  const result = X402EnvSchema.safeParse(env);
  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `  - ${e.path.join(".")}: ${e.message}`)
      .join("\n");
    throw new Error(
      `x402-stellar-sdk startup failed — missing or invalid env vars:\n${messages}`
    );
  }
  return result.data;
}

/**
 * Validate env vars for MCP execute_swap tool.
 * Returns a typed result instead of throwing — 
 * MCP tools return error messages rather than crashing.
 */
export function validateMcpEnv(
  env: NodeJS.ProcessEnv = process.env
): { success: true; data: McpEnv } | { success: false; error: string } {
  const result = McpEnvSchema.safeParse(env);
  if (!result.success) {
    const messages = result.error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    return { success: false, error: messages };
  }
  return { success: true, data: result.data };
}
