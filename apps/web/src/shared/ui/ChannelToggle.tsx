import { cn } from "@/shared/utils/cn";
import { channelLabel, channels, type Channel } from "@ecommerce/contracts/shared/period";
import { radiusClass } from "@/shared/styles/radius";

/** Sales-channel filter shared by every data screen: all · e-commerce · marketplace. */
export function ChannelToggle({
  value,
  onChange,
  className,
}: {
  value: Channel;
  onChange: (channel: Channel) => void;
  className?: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label="Canal de venda"
      className={cn(
        "inline-flex h-9 items-center gap-1 border border-border bg-card p-1",
        radiusClass.control,
        className,
      )}
    >
      {channels.map((channel) => {
        const active = channel === value;
        return (
          <button
            key={channel}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(channel)}
            className={cn(
              "h-7 whitespace-nowrap px-3 text-[13px] leading-[18px] transition-colors duration-150",
              radiusClass.badge,
              active
                ? "bg-primary font-semibold text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {channelLabel[channel]}
          </button>
        );
      })}
    </div>
  );
}
