import { Input } from "@/components/ui/Input";

interface MedicalInfoTabProps {
  lead: any;
  formData: any;
  isEditing: boolean;
  onInputChange: (field: string, value: any) => void;
}

export function MedicalInfoTab({ lead, formData, isEditing, onInputChange }: MedicalInfoTabProps) {
  return (
    <section>
      <h3 className="font-semibold text-foreground mb-6 text-lg">Medical Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Height</label>
          {isEditing ? (
            <Input
              value={formData.height}
              onChange={(e) => onInputChange("height", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.height || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Weight</label>
          {isEditing ? (
            <Input
              value={formData.weight}
              onChange={(e) => onInputChange("weight", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.weight ? `${lead.weight} lbs` : "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Tobacco Use</label>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-2">
              <input
                type="checkbox"
                checked={formData.tobacco_use}
                onChange={(e) => onInputChange("tobacco_use", e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Tobacco User</span>
            </div>
          ) : (
            <p className="font-medium text-foreground">{lead.tobacco_use ? "Yes" : "No"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Doctor Name</label>
          {isEditing ? (
            <Input
              value={formData.doctor_name}
              onChange={(e) => onInputChange("doctor_name", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.doctor_name || "N/A"}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Health Conditions</label>
          {isEditing ? (
            <textarea
              value={formData.health_conditions}
              onChange={(e) => onInputChange("health_conditions", e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          ) : (
            <p className="font-medium text-foreground">{lead.health_conditions || "N/A"}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Medications</label>
          {isEditing ? (
            <textarea
              value={formData.medications}
              onChange={(e) => onInputChange("medications", e.target.value)}
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            />
          ) : (
            <p className="font-medium text-foreground">{lead.medications || "N/A"}</p>
          )}
        </div>
      </div>
    </section>
  );
}

