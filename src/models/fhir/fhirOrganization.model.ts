import mongoose from "mongoose";

export interface FhirOrganizationInput {
  groupId: string;
  hospitalId: string;
  organizationType: string;
  organizationName: string;
  organizationAddress: string;
  organizationPhone: string;
  fhirId: string;
  fhirMeta: Object;
  fhirPartOfId: string;
  active: boolean;
}

export interface FhirOrganizationDocument extends FhirOrganizationInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Organization Type Reference
 * https://terminology.hl7.org/5.2.0/CodeSystem-organization-type.html
 */

const FhirOrganizationSchema = new mongoose.Schema(
  {
    groupId: { type: String },
    hospitalId: { type: String, required: true },
    organizationType: {
      type: String,
      enum: [
        "prov",
        "dept",
        "team",
        "govt",
        "ins",
        "pay",
        "edu",
        "reli",
        "crs",
        "cg",
        "bus",
        "other",
      ],
      required: true,
    },
    organizationName: { type: String, required: true },
    organizationAddress: { type: String, required: true },
    organizationPhone: { type: String },
    fhirId: { type: String },
    fhirMeta: { type: Object },
    fhirPartOfId: { type: String },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

FhirOrganizationSchema.pre("save", async function (next) {
  return next();
});

const FhirOrganizationModel = mongoose.model<FhirOrganizationDocument>(
  "Fhir_Organization",
  FhirOrganizationSchema
);

export default FhirOrganizationModel;
