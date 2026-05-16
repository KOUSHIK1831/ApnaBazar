import { describe, expect, it } from "vitest";

import { getTranslation, languageLabels } from "./translations";

describe("translations", () => {
  it("exposes the supported language labels", () => {
    expect(languageLabels).toEqual({
      en: "English",
      te: "తెలుగు",
      hi: "हिंदी",
    });
  });

  it("returns the translated value for a known key", () => {
    expect(getTranslation("common.appName", "en")).toBe("ApnaBazar");
    expect(getTranslation("common.signOut", "hi")).toBe("साइन आउट");
  });
});
