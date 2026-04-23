"use client";

import { createContext, useContext } from "react";
import type { Doctor } from "@/lib/api";

export const DoctorContext = createContext<Doctor | null>(null);

export function useDoctor() {
  const doctor = useContext(DoctorContext);
  if (!doctor) throw new Error("useDoctor must be used within app layout");
  return doctor;
}
