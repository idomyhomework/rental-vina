// --- TABLE — UI COMPONENT ---

import { cn } from "@/utils/cn";

// --- Props ---

interface TableElementProps {
  children: React.ReactNode;
  className?: string;
}

// --- Components ---

export function Table({ children, className }: TableElementProps) {
  return (
    <div className="w-full overflow-x-auto rounded-card border border-hairline">
      <table className={cn("w-full text-left text-sm", className)}>
        {children}
      </table>
    </div>
  );
}

export function Thead({ children, className }: TableElementProps) {
  return (
    <thead className={cn("border-b border-hairline bg-surface-soft", className)}>
      {children}
    </thead>
  );
}

export function Tbody({ children, className }: TableElementProps) {
  return <tbody className={cn("divide-y divide-hairline", className)}>{children}</tbody>;
}

export function Tr({ children, className }: TableElementProps) {
  return (
    <tr className={cn("transition-colors hover:bg-surface-soft/50", className)}>
      {children}
    </tr>
  );
}

export function Th({ children, className }: TableElementProps) {
  return (
    <th
      className={cn(
        "px-4 py-3 text-xs font-medium uppercase tracking-wider text-muted",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function Td({ children, className }: TableElementProps) {
  return (
    <td className={cn("px-4 py-3 text-sm text-ink", className)}>
      {children}
    </td>
  );
}
