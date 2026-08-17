"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";

/**
 * Formats digits as US dollars while you type: 1700 becomes $1,700.
 *
 * Values are stored formatted, so the column stays text and rows written
 * before this existed (a plain "$170", or a "min 50%") are left alone until
 * someone edits them.
 */
export function formatMoney(raw: string) {
  const cleaned = raw.replace(/[^\d.]/g, "");
  if (!cleaned) return "";

  const [whole = "", ...rest] = cleaned.split(".");
  const hasDecimal = cleaned.includes(".");
  const decimals = rest.join("").slice(0, 2);

  const digits = whole.replace(/^0+(?=\d)/, "");
  const grouped = digits ? Number(digits).toLocaleString("en-US") : "0";

  return `$${grouped}${hasDecimal ? `.${decimals}` : ""}`;
}

export function MoneyInput({
  id,
  value,
  onChange,
  placeholder = "$250",
}: {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <Input
      id={id}
      // decimal rather than numeric so phones offer the point.
      inputMode="decimal"
      autoComplete="off"
      value={value}
      onChange={(e) => onChange(formatMoney(e.target.value))}
      placeholder={placeholder}
    />
  );
}
