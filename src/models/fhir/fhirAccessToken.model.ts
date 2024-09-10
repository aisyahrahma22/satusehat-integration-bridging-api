import mongoose from "mongoose";

export interface FhirAccessTokenInput {
  hospitalId: string;
  apiProductList: string;
  organizationName: string;
  developerEmail: string;
  applicationName: string;
  tokenType: string;
  accessToken: string;
  issuedAt: number;
  expiresIn: number;
  status: string;
}

export interface FhirAccessTokenDocument extends FhirAccessTokenInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirAccessTokenSchema = new mongoose.Schema(
  {
    hospitalId: { type: String, required: true },
    apiProductList: { type: String },
    organizationName: { type: String },
    developerEmail: { type: String },
    applicationName: { type: String },
    tokenType: { type: String, required: true },
    accessToken: { type: String, required: true },
    issuedAt: { type: Number, required: true },
    expiresIn: { type: Number, required: true },
    status: { type: String, required: true }
  },
  {
    timestamps: true,
  }
);

FhirAccessTokenSchema.pre("save", async function (next) {
  return next();
});

const FhirAccessTokenModel = mongoose.model<FhirAccessTokenDocument>(
  "Fhir_Access_Token",
  FhirAccessTokenSchema
);

export default FhirAccessTokenModel;
