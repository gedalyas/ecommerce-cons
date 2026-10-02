import { describe, expect, it } from "vitest";
import { managementLiveKpis } from "./managementLiveKpis";

describe("managementLiveKpis", () => {
  it("compares the concentration with the previous window and names the channel", () => {
    const kpi = managementLiveKpis(
      { share: 60, channel: "Site" },
      { share: 50, channel: "Site" },
    ).revenueConcentration!;
    expect(kpi.metric.value).toBe(60);
    expect(kpi.metric.previous).toBe(50);
    expect(kpi.goodWhen).toBe("down");
    expect(kpi.subNote).toBe("Site é o maior canal do período");
  });

  it("says so when the period has no paid sales", () => {
    const kpi = managementLiveKpis({ share: null, channel: null }, null).revenueConcentration!;
    expect(kpi.metric.value).toBeNull();
    expect(kpi.subNote).toBe("Sem vendas pagas no período");
  });
});
