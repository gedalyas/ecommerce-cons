import {
  accessAreas,
  type AccessArea,
  type AccessLevel,
  type AreaGrant,
} from "@ecommerce/contracts/auth";

export const pickerLevels = ["none", "view", "edit"] as const;
export type PickerLevel = (typeof pickerLevels)[number];

export const pickerLevelLabel: Record<PickerLevel, string> = {
  none: "Sem acesso",
  view: "Ver",
  edit: "Editar",
};

export type GrantPicker = Record<AccessArea, PickerLevel>;

export function pickerOfGrants(grants: readonly AreaGrant[]): GrantPicker {
  const picker = Object.fromEntries(accessAreas.map((area) => [area, "none"])) as GrantPicker;
  for (const grant of grants) picker[grant.area] = grant.level;
  return picker;
}

export function grantsOfPicker(picker: GrantPicker): AreaGrant[] {
  return accessAreas.flatMap((area): AreaGrant[] => {
    const level = picker[area];
    return level === "none" ? [] : [{ area, level: level as AccessLevel }];
  });
}
