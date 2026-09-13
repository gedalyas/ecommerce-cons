import { describe, expect, it } from "vitest";
import { sourcesStampedBy } from "./importSources";

describe("sourcesStampedBy", () => {
  it("stamps the manual source plus what the kind feeds", () => {
    expect(sourcesStampedBy("ORDERS", [])).toEqual(["manual_csv"]);
    expect(sourcesStampedBy("TRAFFIC", [])).toEqual(["manual_csv", "ga4"]);
    expect(sourcesStampedBy("AD_SPEND", ["META", "META", "TIKTOK"])).toEqual([
      "manual_csv",
      "meta_ads",
      "tiktok_ads",
    ]);
  });
});
