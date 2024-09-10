import mongoose from "mongoose";

export interface FhirEncounterInput {
  status: string;
  registrationId: string;
  hospitalId: string;
  medicalCategory: string;
  diagnoses: any;
  groupId: string;
  registrationDate: Date;
  fhirEncounterId: string;
  description: Object;
  isPaid: boolean;
  history: any,
  patientFhirId: string,
  doctorFhirId: string,
  locationFhirId: string,
  fhirRequest : any
}

export interface FhirEncounterDocument extends FhirEncounterInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const historyItemSchema = new mongoose.Schema(
  {
      start: { type: String },
      end: { type: String }
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
      arrived: { type: historyItemSchema },
      inProgress: { type: historyItemSchema },
      finished: { type: historyItemSchema },
      cancelled: { type: historyItemSchema }
  },
  { _id: false }
);

const diagnoseSchema = new mongoose.Schema(
  {
      code: { type: String },
      name: { type: String },
      rank: { type: Number }
  }
);

const FhirEncounterSchema = new mongoose.Schema(
  {
    groupId: { type: String, required: true },
    hospitalId: { type: String, required: true },
    medicalCategory: { type: String, enum: ['opd', 'ipd', 'er', 'lab', 'rad'], required: true },
    registrationId: { type: String, required: true },
    registrationDate: { type: Date, required: true },
    patientId: { type: String, required: true },
    patientFhirId: { type: String },
    patientName: { type: String},
    doctorId: { type: String, required: true },
    doctorFhirId: { type: String },
    doctorName: { type: String },
    isPaid: { type: Boolean, default: false },
    history: { type: historySchema },
    locationSource: { type: String },
    locationReferenceId: { type: String },
    locationReferenceName: { type: String },
    locationFhirId: { type: String },
    diagnoses: { type: [diagnoseSchema] },
    fhirRequest: { type: Object },
    fhirResponse: { type: Object },
    fhirEncounterId: { type: String },
    fhirResourceType:{type: String},
    status: { type: String, enum: ['arrived', 'inprogress', 'finished', 'cancelled'] },
    active: { type: Boolean, default: true },
    description: { type: Object }
  },
  {
    timestamps: true,
  }
);

FhirEncounterSchema.pre("save", async function (next) {
  return next();
});

const FhirEncounterModel = mongoose.model<FhirEncounterDocument>(
  "Fhir_Encounter",
  FhirEncounterSchema
);

export default FhirEncounterModel;
