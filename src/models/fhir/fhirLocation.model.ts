import mongoose from "mongoose";

export interface FhirLocationInput {
  hospitalId: string;
  source: string;
  referenceId: string;
  physicalType: string;
  fhirId: string;
  fhirName: string;
  fhirMeta: string;
  active: boolean;
}

export interface FhirLocationDocument extends FhirLocationInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Location | Physical Type Reference
 * https://terminology.hl7.org/5.2.0/CodeSystem-location-physical-type.html
 */

const FhirLocationSchema = new mongoose.Schema(
  {
    hospitalId: { type: String, required: true },
    source: { type: String, required: true },
    referenceId: { type: String, required: true },
    physicalType: {
      type: String,
      enum: [
        "si",
        "bu",
        "wi",
        "wa",
        "lvl",
        "co",
        "ro",
        "bd",
        "ve",
        "ho",
        "ca",
        "rd",
        "area",
        "jdn",
        "vi",
      ],
      required: true,
    },
    fhirId: { type: String, required: true, unique: true },
    fhirName: { type: String },
    fhirMeta: { type: Object },
    active: { type: Boolean, default: true },
  },
  {
    timestamps: true,
  }
);

FhirLocationSchema.pre("save", async function (next) {
  return next();
});

const FhirLocationModel = mongoose.model<FhirLocationDocument>(
  "Fhir_Location",
  FhirLocationSchema
);

export default FhirLocationModel;
