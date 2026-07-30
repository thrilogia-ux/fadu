import type { PickupInfo } from "@/lib/pickup";

type Props = {
  info: PickupInfo;
  className?: string;
  showNotes?: boolean;
};

export function PickupScheduleDisplay({ info, className = "", showNotes = true }: Props) {
  return (
    <div className={className}>
      <p className="text-sm text-gray-700">
        <span className="font-semibold text-[#1d1d1b]">Dirección:</span> {info.address}
      </p>
      {info.scheduleLines.length > 0 ? (
        <ul className="mt-2 space-y-1 text-sm text-gray-700">
          {info.scheduleLines.map((line) => (
            <li key={line} className="flex gap-2">
              <span className="text-[#0f3bff]" aria-hidden>
                •
              </span>
              <span>{line}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-gray-600">Horarios de retiro próximamente.</p>
      )}
      {showNotes && info.notes ? (
        <p className="mt-3 text-xs text-gray-600">{info.notes}</p>
      ) : null}
    </div>
  );
}
