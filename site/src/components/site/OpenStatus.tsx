import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { openStatus, type OpenState } from "@/lib/status";

import type { Schedule } from "@/lib/data";
export type { Schedule };

/** Live "Open now · until 8 pm" line, worked out in Tehachapi time on the visitor's device. */
export default function OpenStatus({
  schedule,
  fallback = "Dinner Tuesday – Saturday · 4:30 – 8",
  className,
}: {
  schedule: Schedule;
  fallback?: string;
  className?: string;
}) {
  const [status, setStatus] = useState<{ state?: OpenState; text: string }>({ text: fallback });

  useEffect(() => {
    const tick = () => {
      try {
        setStatus(openStatus(schedule));
      } catch {
        /* keep the regular hours */
      }
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [schedule]);

  return (
    <p className={cn("m-0 inline-flex items-center gap-3 text-[0.86rem] tracking-[0.04em]", className)} data-state={status.state}>
      <i className="status-dot" aria-hidden="true" />
      <span>{status.text}</span>
    </p>
  );
}
