import mongoose from "mongoose";

export interface FhirServiceRequestInput {
  refId: string;
  fhirServiceReqId: string;
  fhirResponse: any
}

export interface FhirServiceRequestDocument extends FhirServiceRequestInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirServiceRequestSchema = new mongoose.Schema(
  {
    refId: { type: String, required: true },
    fhirRequest:  { type: Object },
    fhirServiceReqId: { type: String },
    fhirResponse: { type: Object },
    fhirResourceType:{ type: String },
    category: { type: String, enum: ['lab', 'rad'] },
    active: { type: Boolean},
  },
  {
    timestamps: true,
  }
);

FhirServiceRequestSchema.pre("save", async function (next) {
  return next();
});

const FhirServiceRequestModel = mongoose.model<FhirServiceRequestDocument>(
  "Fhir_Service_Request",
  FhirServiceRequestSchema
);

export default FhirServiceRequestModel;
