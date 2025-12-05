import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";
import { toast } from "react-toastify";
import { Upload, FileText, X, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { leadSchema, LeadFormData } from "@/types/lead";

interface BulkUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadComplete: () => void;
}

export function BulkUploadModal({ isOpen, onClose, onUploadComplete }: BulkUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<{
    total: number;
    successful: number;
    failed: number;
    errors: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
    if (fileExtension !== 'csv' && fileExtension !== 'json') {
      toast.error("Please upload a CSV or JSON file");
      return;
    }

    setFile(selectedFile);
    setUploadResults(null);
  };

  const parseCSV = (text: string): any[] => {
    const lines = text.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];

    // Simple CSV parser that handles quoted fields
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            current += '"';
            i++; // Skip next quote
          } else {
            inQuotes = !inQuotes;
          }
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };

    // Parse header
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, ''));
    
    // Parse rows
    const rows: any[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, ''));
      const row: any = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }
    return rows;
  };

  const parseJSON = (text: string): any[] => {
    try {
      const data = JSON.parse(text);
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      throw new Error("Invalid JSON format");
    }
  };

  const normalizeLeadData = (row: any): Partial<LeadFormData> => {
    return {
      first_name: row.first_name || row.firstName || row['First Name'] || '',
      last_name: row.last_name || row.lastName || row['Last Name'] || '',
      date_of_birth: row.date_of_birth || row.dateOfBirth || row.dob || row['Date of Birth'] || '',
      ssn: row.ssn || row.SSN || row['SSN'] || '',
      phone_number: row.phone_number || row.phoneNumber || row.phone || row['Phone Number'] || '',
      email: row.email || row.Email || row['Email'] || '',
      address: row.address || row.Address || row['Address'] || '',
      city: row.city || row.City || row['City'] || '',
      state: row.state || row.State || row['State'] || '',
      zip_code: row.zip_code || row.zipCode || row.zip || row['Zip Code'] || row['Zip'] || '',
      height: row.height || row.Height || row['Height'] || '',
      weight: row.weight || row.Weight || row['Weight'] || '',
      tobacco_use: row.tobacco_use === 'true' || row.tobacco_use === true || row.tobaccoUse === 'true' || row.tobaccoUse === true || false,
      health_conditions: row.health_conditions || row.healthConditions || row['Health Conditions'] || '',
      medications: row.medications || row.Medications || row['Medications'] || '',
      desired_coverage: row.desired_coverage ? Number(row.desired_coverage) : row.desiredCoverage ? Number(row.desiredCoverage) : row['Desired Coverage'] ? Number(row['Desired Coverage']) : undefined,
      monthly_budget: row.monthly_budget ? Number(row.monthly_budget) : row.monthlyBudget ? Number(row.monthlyBudget) : row['Monthly Budget'] ? Number(row['Monthly Budget']) : undefined,
      existing_coverage: row.existing_coverage || row.existingCoverage || row['Existing Coverage'] || '',
      beneficiary_name: row.beneficiary_name || row.beneficiaryName || row['Beneficiary Name'] || '',
      beneficiary_relation: row.beneficiary_relation || row.beneficiaryRelation || row['Beneficiary Relation'] || '',
      bank_name: row.bank_name || row.bankName || row['Bank Name'] || '',
      routing_number: row.routing_number || row.routingNumber || row['Routing Number'] || '',
      account_number: row.account_number || row.accountNumber || row['Account Number'] || '',
      call_center_id: row.call_center_id || row.callCenterId || row['Call Center ID'] || '',
      assigned_agent_id: row.assigned_agent_id || row.assignedAgentId || row['Assigned Agent ID'] || '',
    };
  };

  const validateAndSaveLeads = async (leads: any[]) => {
    const results = {
      total: leads.length,
      successful: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Get default pipeline and stage
    const { data: firstPipeline, error: pipelineError } = await supabase
      .from("pipelines")
      .select("id")
      .order("created_at", { ascending: true })
      .limit(1)
      .single();

    if (pipelineError || !firstPipeline) {
      throw new Error("Failed to fetch default pipeline. Please create a pipeline first.");
    }

    const { data: firstStage, error: stageError } = await supabase
      .from("stages")
      .select("id")
      .eq("pipeline_id", (firstPipeline as any).id)
      .order("order_index", { ascending: true })
      .limit(1)
      .single();

    if (stageError || !firstStage) {
      throw new Error("Failed to fetch default stage. Please create a stage first.");
    }

    const validLeads: any[] = [];
    const seenSSNs = new Map<string, Set<string>>();

    for (let i = 0; i < leads.length; i++) {
      const row = leads[i];
      try {
        const normalizedData = normalizeLeadData(row);
        
        // Validate using schema
        const validationResult = leadSchema.safeParse(normalizedData);
        
        if (validationResult.success) {
          const { beneficiary_name, beneficiary_relation, call_center_id, assigned_agent_id, ...dbData } = validationResult.data;
          
          const finalCallCenterId = call_center_id && call_center_id !== "" ? call_center_id : null;
          const ssn = dbData.ssn;

          if (ssn && finalCallCenterId) {
            if (seenSSNs.has(ssn) && seenSSNs.get(ssn)!.has(finalCallCenterId)) {
              results.failed++;
              results.errors.push(`Row ${i + 1}: A lead with this SSN already exists in this call center within the upload file.`);
              continue;
            }

            const { data: existingLead, error: checkError } = await supabase
              .from("leads")
              .select("id")
              .eq("ssn", ssn)
              .eq("call_center_id", finalCallCenterId)
              .limit(1)
              .single();

            if (checkError && checkError.code !== "PGRST116") {
              results.failed++;
              results.errors.push(`Row ${i + 1}: Failed to check for duplicate leads: ${checkError.message}`);
              continue;
            }

            if (existingLead) {
              results.failed++;
              results.errors.push(`Row ${i + 1}: A lead with this SSN already exists in this call center. Duplicate leads cannot be added.`);
              continue;
            }

            if (!seenSSNs.has(ssn)) {
              seenSSNs.set(ssn, new Set());
            }
            seenSSNs.get(ssn)!.add(finalCallCenterId);
          }
          
          validLeads.push({
            ...dbData,
            beneficiary_info: {
              name: beneficiary_name || '',
              relation: beneficiary_relation || ''
            },
            call_center_id: finalCallCenterId,
            assigned_agent_id: assigned_agent_id && assigned_agent_id !== "" ? assigned_agent_id : null,
            submission_id: `SUB-${Date.now()}-${i}`,
            pipeline_id: (firstPipeline as any).id,
            stage_id: (firstStage as any).id,
          });
        } else {
          results.failed++;
          results.errors.push(`Row ${i + 1}: ${validationResult.error.issues.map(e => e.message).join(', ')}`);
        }
      } catch (error: any) {
        results.failed++;
        results.errors.push(`Row ${i + 1}: ${error.message || 'Invalid data'}`);
      }
    }

    // Batch insert valid leads
    if (validLeads.length > 0) {
      const { error: insertError } = await (supabase
        .from("leads") as any)
        .insert(validLeads);

      if (insertError) {
        throw new Error("Failed to save leads: " + insertError.message);
      }

      results.successful = validLeads.length;
    }

    return results;
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setUploadResults(null);

    try {
      const text = await file.text();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      let leads: any[] = [];
      
      if (fileExtension === 'csv') {
        leads = parseCSV(text);
      } else if (fileExtension === 'json') {
        leads = parseJSON(text);
      }

      if (leads.length === 0) {
        toast.error("No leads found in the file");
        setIsUploading(false);
        return;
      }

      const results = await validateAndSaveLeads(leads);
      setUploadResults(results);

      if (results.successful > 0) {
        toast.success(`Successfully uploaded ${results.successful} lead(s)`);
        onUploadComplete();
      }

      if (results.failed > 0) {
        toast.warning(`${results.failed} lead(s) were skipped due to missing required fields`);
      }

    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error("Failed to upload leads: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setUploadResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Bulk Upload Leads</DialogTitle>
          <DialogDescription>
            Upload a CSV or JSON file to bulk import leads. Leads with missing required fields will be skipped.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* File Upload Area */}
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.json"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
            />
            <label
              htmlFor="file-upload"
              className="cursor-pointer flex flex-col items-center gap-4"
            >
              {file ? (
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div className="text-left">
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = '';
                      }
                    }}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <>
                  <Upload className="w-12 h-12 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV or JSON files only
                    </p>
                  </div>
                </>
              )}
            </label>
          </div>

          {/* Upload Results */}
          {uploadResults && (
            <div className="bg-muted/50 rounded-lg p-4 space-y-3">
              <div className="flex items-center gap-2">
                {uploadResults.successful > 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600" />
                )}
                <h4 className="font-semibold text-foreground">Upload Results</h4>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total</p>
                  <p className="font-semibold text-foreground">{uploadResults.total}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Successful</p>
                  <p className="font-semibold text-green-600">{uploadResults.successful}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Skipped</p>
                  <p className="font-semibold text-amber-600">{uploadResults.failed}</p>
                </div>
              </div>
              {uploadResults.errors.length > 0 && (
                <div className="mt-3 max-h-32 overflow-y-auto">
                  <p className="text-xs font-medium text-muted-foreground mb-2">Errors:</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {uploadResults.errors.slice(0, 10).map((error, index) => (
                      <li key={index} className="truncate">• {error}</li>
                    ))}
                    {uploadResults.errors.length > 10 && (
                      <li className="text-muted-foreground">
                        ... and {uploadResults.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleClose} disabled={isUploading}>
              {uploadResults ? "Close" : "Cancel"}
            </Button>
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading}
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Leads
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

