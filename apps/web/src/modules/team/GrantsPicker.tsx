import { accessAreaHint, accessAreaLabel, accessAreas } from "@ecommerce/contracts/auth";
import { SegmentedControl } from "@/shared/ui/SegmentedControl";
import { textClass } from "@/shared/styles/typography";
import { cn } from "@/shared/utils/cn";
import { pickerLevelLabel, pickerLevels, type GrantPicker, type PickerLevel } from "./grantPicker";

const levelOptions = pickerLevels.map((key) => ({ key, label: pickerLevelLabel[key] }));

export function GrantsPicker({
  value,
  onChange,
}: {
  value: GrantPicker;
  onChange: (next: GrantPicker) => void;
}) {
  return (
    <ul className="divide-y divide-border">
      {accessAreas.map((area) => (
        <li
          key={area}
          className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="min-w-0">
            <div className={cn(textClass.body, "font-semibold text-foreground")}>
              {accessAreaLabel[area]}
            </div>
            <div className={cn(textClass.meta, "text-muted-foreground")}>
              {accessAreaHint[area]}
            </div>
          </div>
          <SegmentedControl<PickerLevel>
            options={levelOptions}
            value={value[area]}
            onChange={(level) => onChange({ ...value, [area]: level })}
            label={`Acesso a ${accessAreaLabel[area]}`}
          />
        </li>
      ))}
    </ul>
  );
}
