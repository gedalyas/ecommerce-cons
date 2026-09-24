import { describe, expect, it } from "vitest";
import {
  adsetNounOf,
  audienceValueLabelOf,
  campaignTypeLabelOf,
  matchTypeLabelOf,
  platformLevelLabel,
} from "./adTaxonomy";

describe("campaignTypeLabelOf", () => {
  it("names the known campaign types in Portuguese", () => {
    expect(campaignTypeLabelOf("PERFORMANCE_MAX")).toBe("Performance Max");
    expect(campaignTypeLabelOf("SEARCH")).toBe("Pesquisa");
  });

  it("keeps an unknown type as the platform sent it and dashes an absent one", () => {
    expect(campaignTypeLabelOf("SMART")).toBe("SMART");
    expect(campaignTypeLabelOf(null)).toBe("—");
    expect(campaignTypeLabelOf("")).toBe("—");
  });
});

describe("matchTypeLabelOf", () => {
  it("names the keyword match types", () => {
    expect(matchTypeLabelOf("EXACT")).toBe("Exata");
    expect(matchTypeLabelOf("BROAD")).toBe("Ampla");
    expect(matchTypeLabelOf("")).toBe("—");
  });
});

describe("platformLevelLabel", () => {
  it("calls the middle level by each platform's name", () => {
    expect(platformLevelLabel("GOOGLE", "conjunto")).toBe("Grupos de anúncios");
    expect(platformLevelLabel("META", "conjunto")).toBe("Conjuntos de anúncios");
    expect(platformLevelLabel("GOOGLE", "campanha")).toBe("Campanhas");
  });
});

describe("adsetNounOf", () => {
  it("names one ad set the way each platform does", () => {
    expect(adsetNounOf("GOOGLE")).toBe("Grupo");
    expect(adsetNounOf("META")).toBe("Conjunto");
  });
});

describe("audienceValueLabelOf", () => {
  it("names the GA4 gender and age values in Portuguese", () => {
    expect(audienceValueLabelOf("GENDER", "female")).toBe("Feminino");
    expect(audienceValueLabelOf("GENDER", "unknown")).toBe("Não informado");
    expect(audienceValueLabelOf("AGE", "25-34")).toBe("25–34");
    expect(audienceValueLabelOf("AGE", "65+")).toBe("65+");
    expect(audienceValueLabelOf("AGE", "unknown")).toBe("Não informado");
  });
});
