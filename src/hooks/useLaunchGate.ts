import { useEffect, useState } from "react";
import { isGateOpen, isLaunchMode, onGateChange } from "@/lib/launchGate";

export function useLaunchGate() {
  const [open, setOpen] = useState(() => isGateOpen());
  useEffect(() => onGateChange(() => setOpen(isGateOpen())), []);
  return { gateOpen: open, launchMode: isLaunchMode() };
}
