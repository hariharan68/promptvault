import { describe, it, expect } from "vitest";
import { getToken, setToken, beginLogout, currentEpoch } from "./authState.js";

// §8 #4 (frontend) — a refresh that resolves AFTER a logout must not resurrect
// the session. This is the auth-epoch guard from §6.5.
describe("authState epoch guard", () => {
  it("accepts a token written under the current epoch", () => {
    const epoch = currentEpoch();
    setToken("token-a", epoch);
    expect(getToken()).toBe("token-a");
  });

  it("drops a stale token write issued before a logout", () => {
    const epochAtStart = currentEpoch();
    setToken("token-a", epochAtStart);
    expect(getToken()).toBe("token-a");

    // User logs out while a refresh is still in flight...
    beginLogout();
    expect(getToken()).toBe(null);

    // ...the in-flight refresh resolves and tries to write with the old epoch.
    setToken("token-stale", epochAtStart);
    expect(getToken()).toBe(null); // silently dropped
  });
});
