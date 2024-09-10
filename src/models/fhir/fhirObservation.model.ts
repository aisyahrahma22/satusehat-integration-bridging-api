import mongoose from "mongoose";

export interface FhirObservationInput {
  registrationId: string;
  encounterId: string;
  active: boolean;
  datetime:any;
  category: string;
  fhirObservationId: string,
  value: any
}

export interface FhirObservationDocument extends FhirObservationInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const FhirObservationSchema = new mongoose.Schema(
  {
    registrationId: { type: String, required: true },
    encounterId: { type: String, required: true},
    encounterfhirId: { type: String},
    fhirRequest: { type: Object },
    fhirResponse: { type: Object },
    fhirObservationId: { type: String },
    fhirResourceType:{type: String},
    status: { type: String},
    datetime: { type: Date},
    value: { type: mongoose.Schema.Types.Mixed},
    active: { type: Boolean, default: true },
    category: { type: String, enum: ['heart_rate', 'respiratory_rate', 'oxygen_saturation', 'body_temperature', 'systolic_blood', 'diastolic_blood'], required: true },
  },
  {
    timestamps: true,
  }
);

FhirObservationSchema.pre("save", async function (next) {
  return next();
});

const FhirObservationModel = mongoose.model<FhirObservationDocument>(
  "Fhir_Observation",
  FhirObservationSchema
);

export default FhirObservationModel;
