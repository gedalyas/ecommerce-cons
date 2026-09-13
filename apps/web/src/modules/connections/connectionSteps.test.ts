import { describe, expect, it } from "vitest";
import { stepIndexOf, stepperStages } from "./connectionSteps";

describe("connection steps", () => {
  it("shows four steps and places an error on the import step", () => {
    expect(stepperStages).toEqual(["AUTHORIZED", "IMPORTING", "PROCESSING", "READY"]);
    expect(stepIndexOf("AUTHORIZED")).toBe(0);
    expect(stepIndexOf("READY")).toBe(3);
    expect(stepIndexOf("ERROR")).toBe(1);
  });
});
