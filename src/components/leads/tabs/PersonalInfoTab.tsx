import { Input } from "@/components/ui/Input";
import { Phone, Mail, MapPin } from "lucide-react";
import { format } from "date-fns";

interface PersonalInfoTabProps {
  lead: any;
  formData: any;
  isEditing: boolean;
  onInputChange: (field: string, value: any) => void;
}

export function PersonalInfoTab({ lead, formData, isEditing, onInputChange }: PersonalInfoTabProps) {
  return (
    <section>
      <h3 className="font-semibold text-foreground mb-6 text-lg">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">First Name</label>
          {isEditing ? (
            <Input
              value={formData.first_name}
              onChange={(e) => onInputChange("first_name", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.first_name || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Last Name</label>
          {isEditing ? (
            <Input
              value={formData.last_name}
              onChange={(e) => onInputChange("last_name", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.last_name || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Date of Birth</label>
          {isEditing ? (
            <Input
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => onInputChange("date_of_birth", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.date_of_birth ? format(new Date(lead.date_of_birth), "MMM d, yyyy") : "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Age</label>
          {isEditing ? (
            <Input
              type="number"
              value={formData.age}
              onChange={(e) => onInputChange("age", e.target.value ? parseInt(e.target.value) : "")}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.age || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">SSN</label>
          {isEditing ? (
            <Input
              value={formData.ssn}
              onChange={(e) => onInputChange("ssn", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.ssn ? "***-**-" + lead.ssn.slice(-4) : "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Phone
          </label>
          {isEditing ? (
            <Input
              value={formData.phone_number}
              onChange={(e) => onInputChange("phone_number", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.phone_number || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Email
          </label>
          {isEditing ? (
            <Input
              type="email"
              value={formData.email}
              onChange={(e) => onInputChange("email", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.email || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Birth State</label>
          {isEditing ? (
            <Input
              value={formData.birth_state}
              onChange={(e) => onInputChange("birth_state", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.birth_state || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Driver License</label>
          {isEditing ? (
            <Input
              value={formData.driver_license}
              onChange={(e) => onInputChange("driver_license", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.driver_license || "N/A"}</p>
          )}
        </div>
        <div className="md:col-span-2">
          <label className="text-muted-foreground text-xs font-medium mb-1 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            Address
          </label>
          {isEditing ? (
            <Input
              value={formData.address}
              onChange={(e) => onInputChange("address", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.address || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">City</label>
          {isEditing ? (
            <Input
              value={formData.city}
              onChange={(e) => onInputChange("city", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.city || "N/A"}</p>
          )}
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="text-muted-foreground text-xs font-medium mb-1 block">State</label>
            {isEditing ? (
              <Input
                value={formData.state}
                onChange={(e) => onInputChange("state", e.target.value)}
                maxLength={2}
              />
            ) : (
              <p className="font-medium text-foreground">{lead.state || "N/A"}</p>
            )}
          </div>
          <div className="flex-1">
            <label className="text-muted-foreground text-xs font-medium mb-1 block">Zip Code</label>
            {isEditing ? (
              <Input
                value={formData.zip_code}
                onChange={(e) => onInputChange("zip_code", e.target.value)}
              />
            ) : (
              <p className="font-medium text-foreground">{lead.zip_code || "N/A"}</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

