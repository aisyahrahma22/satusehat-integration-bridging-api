import mongoose from "mongoose";

export interface FhirProcedureInput {
  encounterId: string;
  code: string;
  name: string;
  categoryCode: string;
  categoryName: string;
  fhirProcedureId: string;
  pmrRefId: string;
  description: string;
}

export interface FhirProcedureDocument extends FhirProcedureInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}


const FhirProcedureSchema = new mongoose.Schema(
  {
    encounterId: { type: String, required: true },
    code: { type: String },
    name: { type: String},
    pmrRefId: { type: String},
    procedureUuid: { type: String},
    categoryCode: { type: String },
    categoryName: { type: String},
    patientMedicalRecordId: { type: Number },
    clinicProceduresId: { type: Number },
    datetime: { type: Date},
    fhirRequest: { type: Object },
    fhirResponse: { type: Object },
    fhirProcedureId: { type: String },
    fhirResourceType:{type: String},
    active: { type: Boolean, default: true },
    description: { type: String },
  },
  {
    timestamps: true,
  }
);

FhirProcedureSchema.pre("save", async function (next) {
  return next();
});

const FhirProcedureModel = mongoose.model<FhirProcedureDocument>(
  "Fhir_Procedure",
  FhirProcedureSchema
);

export default FhirProcedureModel;
