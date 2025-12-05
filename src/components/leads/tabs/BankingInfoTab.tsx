import { Input } from "@/components/ui/Input";

interface BankingInfoTabProps {
  lead: any;
  formData: any;
  isEditing: boolean;
  onInputChange: (field: string, value: any) => void;
}

export function BankingInfoTab({ lead, formData, isEditing, onInputChange }: BankingInfoTabProps) {
  return (
    <section>
      <h3 className="font-semibold text-foreground mb-6 text-lg">Banking Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Bank Name</label>
          {isEditing ? (
            <Input
              value={formData.bank_name}
              onChange={(e) => onInputChange("bank_name", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.bank_name || "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Routing Number</label>
          {isEditing ? (
            <Input
              value={formData.routing_number}
              onChange={(e) => onInputChange("routing_number", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.routing_number ? "****" + lead.routing_number.slice(-4) : "N/A"}</p>
          )}
        </div>
        <div>
          <label className="text-muted-foreground text-xs font-medium mb-1 block">Account Number</label>
          {isEditing ? (
            <Input
              value={formData.account_number}
              onChange={(e) => onInputChange("account_number", e.target.value)}
            />
          ) : (
            <p className="font-medium text-foreground">{lead.account_number ? "****" + lead.account_number.slice(-4) : "N/A"}</p>
          )}
        </div>
      </div>
    </section>
  );
}

