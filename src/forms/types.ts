// forms/types.ts

export interface FormFieldDefinition {
    fieldName: string;
    label: string;          // e.g. "Text1" or "Image1"
    promptMessage: string;  // e.g. "Please send Text 1"
    waitType: "text" | "photo";
  }
  
  export interface FormDefinition {
    name: string;                      // e.g. "form1", "profileForm", etc.
    fields: FormFieldDefinition[];     // array of fields
  }
  