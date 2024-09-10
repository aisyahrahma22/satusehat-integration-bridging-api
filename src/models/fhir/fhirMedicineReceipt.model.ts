import mongoose from "mongoose";

export interface FhirMedicineReceiptInput {
  registrationId: String;
  hospitalId: String;
  fhirMedicineReceiptId: String;
  pmrReceiptId: String,
  pmrReceiptConcoctionId: String,
  kfaCodeGroup: String,
  kfaNameGroup: String,
  type: String,
  ingredientItem: [Object],
  description: String
}

const ingredientSchema = new mongoose.Schema(
  {
      kfaCode: { type: String },
      kfaName: { type: String },
  }
);

export interface FhirMedicineReceiptDocument extends FhirMedicineReceiptInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}


const FhirMedicineReceiptSchema = new mongoose.Schema(
  {
    registrationId: { type: String, required: true },
    hospitalId: { type: String, required: true },
    kfaCodeGroup: { type: String },
    kfaNameGroup: { type: String},
    dosageCode: { type: String},
    dosageName: { type: String},
    createdAt: { type: Date},
    active: { type: Boolean},
    pmrReceiptId: { type: String },
    pmrReceiptConcoctionId: { type: String },
    type:{ type: String },
    ingredientItem: { type: [ingredientSchema] },
    fhirRequest:  { type: Object },
    fhirMedicineReceiptId: { type: String },
    fhirResponse: { type: Object },
    fhirResourceType:{ type: String },
    description:{ type: String },
  },
  {
    timestamps: true,
  }
);

FhirMedicineReceiptSchema.pre("save", async function (next) {
  return next();
});

const FhirMedicineReceiptModel = mongoose.model<FhirMedicineReceiptDocument>(
  "Fhir_Medicine_Receipt",
  FhirMedicineReceiptSchema
);

export default FhirMedicineReceiptModel;
