import { Input } from "@/components/ui/Input";
import { LucideIcon } from "lucide-react";

interface FieldDisplayProps {
  label: string;
  value: any;
  isEditing: boolean;
  onChange?: (value: any) => void;
  type?: "text" | "number" | "date" | "email";
  icon?: LucideIcon;
  formatValue?: (value: any) => string;
  maxLength?: number;
  placeholder?: string;
}

export function FieldDisplay({
  label,
  value,
  isEditing,
  onChange,
  type = "text",
  icon: Icon,
  formatValue,
  maxLength,
  placeholder,
}: FieldDisplayProps) {
  const displayValue = formatValue ? formatValue(value) : value || "N/A";

  return (
    <div>
      <label className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-2">
        {Icon && <Icon className="w-4 h-4" />}
        {label}
      </label>
      {isEditing ? (
        <Input
          type={type}
          value={value || ""}
          onChange={(e) => onChange?.(type === "number" ? (e.target.value ? parseFloat(e.target.value) : "") : e.target.value)}
          maxLength={maxLength}
          placeholder={placeholder}
        />
      ) : (
        <p className="font-medium text-foreground">{displayValue}</p>
      )}
    </div>
  );
}

