import type { ReactNode } from "react";

export function Frame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col w-full max-w-md mx-auto px-5 pt-6 pb-8 min-h-screen">
      {children}
    </div>
  );
}
