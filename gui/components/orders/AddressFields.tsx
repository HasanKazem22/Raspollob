"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { FormField } from "@/components/ui/form-field";
import { PhoneInput } from "@/components/ui/phone-input";
import { BD_PHONE_ERROR, isValidBdPhone } from "@/lib/phone";
import type { Address } from "@/types/order";

export type AddressErrors = Partial<Record<keyof Address, string>>;

export const EMPTY_ADDRESS: Address = {
  fullName: "",
  phone: "",
  email: "",
  addressLine: "",
  area: "",
  city: "",
  postalCode: "",
};

/** Same rules as the backend's AddressDto, so most mistakes are caught before submitting. */
export function validateAddress(a: Address): AddressErrors {
  const errors: AddressErrors = {};
  if (!a.fullName.trim()) errors.fullName = "Full name is required";
  if (!a.phone.trim()) errors.phone = "Phone number is required";
  else if (!isValidBdPhone(a.phone)) errors.phone = BD_PHONE_ERROR;
  if (a.email?.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(a.email.trim())) errors.email = "Enter a valid email address";
  if (!a.addressLine.trim()) errors.addressLine = "Address is required";
  if (!a.city.trim()) errors.city = "City / district is required";
  return errors;
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-[11px] font-medium text-red-600">{message}</p> : null;
}

interface AddressFieldsProps {
  idPrefix: string;
  value: Address;
  onChange: (next: Address) => void;
  errors?: AddressErrors;
  disabled?: boolean;
}

export function AddressFields({ idPrefix, value, onChange, errors = {}, disabled }: AddressFieldsProps) {
  const set = (field: keyof Address) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    onChange({ ...value, [field]: e.target.value });
  const invalid = (field: keyof Address) => (errors[field] ? "border-red-400 focus-visible:border-red-500" : "");

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <FormField label="Full Name" required htmlFor={`${idPrefix}-fullName`}>
        <Input
          id={`${idPrefix}-fullName`}
          autoComplete="name"
          value={value.fullName}
          onChange={set("fullName")}
          placeholder="e.g. Md Bahar Uddin"
          disabled={disabled}
          className={invalid("fullName")}
        />
        <FieldError message={errors.fullName} />
      </FormField>

      <FormField label="Mobile Number" required htmlFor={`${idPrefix}-phone`}>
        <PhoneInput
          id={`${idPrefix}-phone`}
          value={value.phone}
          onChange={(phone) => onChange({ ...value, phone })}
          disabled={disabled}
          className={invalid("phone")}
        />
        <FieldError message={errors.phone} />
      </FormField>

      <FormField label="Email" optional htmlFor={`${idPrefix}-email`} className="sm:col-span-2">
        <Input
          id={`${idPrefix}-email`}
          type="email"
          autoComplete="email"
          value={value.email ?? ""}
          onChange={set("email")}
          placeholder="For order updates"
          disabled={disabled}
          className={invalid("email")}
        />
        <FieldError message={errors.email} />
      </FormField>

      <FormField label="Full Address" required htmlFor={`${idPrefix}-addressLine`} className="sm:col-span-2">
        <Textarea
          id={`${idPrefix}-addressLine`}
          autoComplete="street-address"
          rows={2}
          value={value.addressLine}
          onChange={set("addressLine")}
          placeholder="House, road, block / village"
          disabled={disabled}
          className={`resize-none ${invalid("addressLine")}`}
        />
        <FieldError message={errors.addressLine} />
      </FormField>

      <FormField label="Area / Thana" optional htmlFor={`${idPrefix}-area`}>
        <Input
          id={`${idPrefix}-area`}
          value={value.area ?? ""}
          onChange={set("area")}
          placeholder="e.g. Dhanmondi"
          disabled={disabled}
        />
      </FormField>

      <div className="grid grid-cols-2 gap-3">
        <FormField label="City / District" required htmlFor={`${idPrefix}-city`}>
          <Input
            id={`${idPrefix}-city`}
            autoComplete="address-level2"
            value={value.city}
            onChange={set("city")}
            placeholder="e.g. Dhaka"
            disabled={disabled}
            className={invalid("city")}
          />
          <FieldError message={errors.city} />
        </FormField>
        <FormField label="Postcode" optional htmlFor={`${idPrefix}-postalCode`}>
          <Input
            id={`${idPrefix}-postalCode`}
            inputMode="numeric"
            autoComplete="postal-code"
            value={value.postalCode ?? ""}
            onChange={set("postalCode")}
            placeholder="1205"
            disabled={disabled}
          />
        </FormField>
      </div>
    </div>
  );
}
