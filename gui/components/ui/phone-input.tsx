"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { BD_PHONE_LENGTH, normalizePhoneInput } from "@/lib/phone";

type PhoneInputProps = Omit<React.ComponentProps<typeof Input>, "type" | "value" | "onChange" | "maxLength"> & {
  value: string;
  onChange: (value: string) => void;
};

/**
 * Mobile number field: digits only, at most 11, numeric keypad on phones.
 * Pasted numbers like "+880 1712-345678" become "01712345678".
 * (No maxLength attribute on purpose — the browser would cut a pasted "+880…" before it's cleaned.)
 */
export function PhoneInput({ value, onChange, placeholder = "01XXXXXXXXX", ...props }: PhoneInputProps) {
  return (
    <Input
      type="tel"
      inputMode="numeric"
      autoComplete="tel"
      pattern={`[0-9]{${BD_PHONE_LENGTH}}`}
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(normalizePhoneInput(e.target.value))}
      {...props}
    />
  );
}
