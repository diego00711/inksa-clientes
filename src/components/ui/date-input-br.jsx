import { useState, useEffect, forwardRef } from "react";
import { Input } from "./input";

const isoToBr = (iso) => {
  if (!iso) return "";
  const m = String(iso).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : "";
};

const brToIso = (br) => {
  const m = String(br).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return "";
  const [, d, mo, y] = m;
  return `${y}-${mo}-${d}`;
};

const applyMask = (raw) => {
  const digits = raw.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
};

export const DateInputBR = forwardRef(function DateInputBR(
  { value, onChange, name, id, ...props },
  ref
) {
  const [display, setDisplay] = useState(() => isoToBr(value));

  useEffect(() => {
    setDisplay(isoToBr(value));
  }, [value]);

  const handleChange = (e) => {
    const masked = applyMask(e.target.value);
    setDisplay(masked);
    const iso = brToIso(masked);
    onChange?.({ target: { name, value: iso || "" } });
  };

  return (
    <Input
      ref={ref}
      id={id}
      name={name}
      type="text"
      inputMode="numeric"
      placeholder="DD/MM/AAAA"
      maxLength={10}
      value={display}
      onChange={handleChange}
      autoComplete="bday"
      {...props}
    />
  );
});
