import { describe, it, expect } from "vitest";
import { fireEvent, fireEventAsync } from "@/lib/sequenzy";

describe("fireEvent (local stub)", () => {
  it("resolves without error", async () => {
    await expect(
      fireEvent("user.registered", {
        email: "TEST@example.com",
        firstName: "Test",
        properties: { source: "email_otp" },
      })
    ).resolves.toBeUndefined();
  });

  it("fireEventAsync never throws", () => {
    expect(() =>
      fireEventAsync("user.registered", { email: "x@y.z", firstName: "X" })
    ).not.toThrow();
  });
});
