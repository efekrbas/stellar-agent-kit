import { describe, it, expect } from "vitest";
import {
  validateStellarEnv,
  validateX402Env,
  validateMcpEnv,
  StellarEnvSchema,
  X402EnvSchema,
} from "../config/env.js";

const VALID_SECRET =
  "SCZWJ5X5NPL6I6ET6QRTQZLXH6CCPIYKIACHGUPMAZHMFVYUL234JVXC";
const VALID_PUBLIC =
  "GAMVCXSK654EKLOWMPJZCGUXKEW7X5RF74YZ6GBZV2FUJGJT6XG7HMHI";

describe("StellarEnvSchema", () => {
  it("accepts a valid Stellar secret key", () => {
    const result = StellarEnvSchema.safeParse({
      SECRET_KEY: VALID_SECRET,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing SECRET_KEY", () => {
    const result = StellarEnvSchema.safeParse({});
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain("required");
  });

  it("rejects a public key used as SECRET_KEY", () => {
    const result = StellarEnvSchema.safeParse({
      SECRET_KEY: VALID_PUBLIC,
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain(
      "valid Stellar secret key"
    );
  });

  it("rejects an empty string SECRET_KEY", () => {
    const result = StellarEnvSchema.safeParse({ SECRET_KEY: "" });
    expect(result.success).toBe(false);
  });

  it("rejects a plaintext password as SECRET_KEY", () => {
    const result = StellarEnvSchema.safeParse({
      SECRET_KEY: "mypassword123",
    });
    expect(result.success).toBe(false);
  });
});

describe("X402EnvSchema", () => {
  it("accepts a valid Stellar public key", () => {
    const result = X402EnvSchema.safeParse({
      X402_DESTINATION: VALID_PUBLIC,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing X402_DESTINATION", () => {
    const result = X402EnvSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects a secret key used as X402_DESTINATION", () => {
    const result = X402EnvSchema.safeParse({
      X402_DESTINATION: VALID_SECRET,
    });
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain(
      "valid Stellar public key"
    );
  });
});

describe("validateStellarEnv", () => {
  it("returns typed env when valid", () => {
    const env = validateStellarEnv({ SECRET_KEY: VALID_SECRET });
    expect(env.SECRET_KEY).toBe(VALID_SECRET);
  });

  it("throws descriptive error when SECRET_KEY is missing", () => {
    expect(() => validateStellarEnv({})).toThrow(
      "StellarAgentKit startup failed"
    );
  });

  it("error message includes the field name and reason", () => {
    expect(() => validateStellarEnv({ SECRET_KEY: "bad" })).toThrow(
      "SECRET_KEY"
    );
  });
});

describe("validateX402Env", () => {
  it("returns typed env when valid", () => {
    const env = validateX402Env({ X402_DESTINATION: VALID_PUBLIC });
    expect(env.X402_DESTINATION).toBe(VALID_PUBLIC);
  });

  it("throws descriptive error when X402_DESTINATION is missing", () => {
    expect(() => validateX402Env({})).toThrow(
      "x402-stellar-sdk startup failed"
    );
  });
});

describe("validateMcpEnv", () => {
  it("returns success true with data when both vars present", () => {
    const result = validateMcpEnv({
      SECRET_KEY: VALID_SECRET,
      SOROSWAP_API_KEY: "test-api-key-123",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.SECRET_KEY).toBe(VALID_SECRET);
    }
  });

  it("returns success false when SECRET_KEY missing", () => {
    const result = validateMcpEnv({
      SOROSWAP_API_KEY: "test-api-key-123",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("SECRET_KEY");
    }
  });

  it("returns success false when SOROSWAP_API_KEY missing", () => {
    const result = validateMcpEnv({ SECRET_KEY: VALID_SECRET });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toContain("SOROSWAP_API_KEY");
    }
  });

  it("returns success false when both are missing", () => {
    const result = validateMcpEnv({});
    expect(result.success).toBe(false);
  });

  it("does not throw — returns error string instead", () => {
    expect(() => validateMcpEnv({})).not.toThrow();
  });
});
