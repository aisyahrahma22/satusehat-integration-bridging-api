import mongoose, { ObjectId, Types } from "mongoose";

export interface HospitalInput {
  uuid: string,
  alias: string,
  name: string,
  groupId: string,
  active: boolean
}

export interface HospitalSecretInput {
  pcareSecret: string,
  pcareInSecret: string
  icareInSecret: string
}

export interface HospitalJknInternalSecretInput {
  username: string,
  password: string
}

export interface HospitalJknExternalSecretInput {
  jknExternalSecret: string
}

export interface HospitalAplicaresSecretInput {
  aplicaresSecret: string
}

export interface HospitalVClaimSecretInput {
  vclaimSecret : string
}

export interface HospitalEClaimSecretInput {
  eclaimSecret : string,
  eclaimUrl: string,
  eclaimCoderNik: string,
}

export interface HospitalFhirSecretInput {
  fhirSecret : string
}

export interface HospitalConfigInput {
  configs: {
    enableFhirEncounter: boolean,
  }
}

export interface HospitalQueueFKTPSecretInput {
  queueFKTPSecret : objectQueueFKTPSecretInput
}

export interface objectQueueFKTPSecretInput {
  username: string,
  password: string
}


export interface ObjectQueueUserLoginInput {
  email: string,
  password: string,
  token : string,
  tokenQueue? : string
}
export interface HospitalQueueUserLoginInput {
  queueUserLogin : ObjectQueueUserLoginInput
}

export interface HospitalQueueWsBpjsFktpSecretInput {
  wsBpjsFKTPSecret : string
}

export interface HospitalDocument extends HospitalInput, HospitalSecretInput, HospitalJknInternalSecretInput, HospitalJknExternalSecretInput, HospitalAplicaresSecretInput, HospitalVClaimSecretInput, HospitalFhirSecretInput, HospitalEClaimSecretInput, HospitalConfigInput, HospitalQueueFKTPSecretInput, HospitalQueueUserLoginInput, HospitalQueueWsBpjsFktpSecretInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
}

const JknInternalSecretSchema = new mongoose.Schema ({
  username: { type: String },
  password: { type: String }
}, {
  _id: false
});

const HospitalConfigsScheme = new mongoose.Schema ({
  enableFhirEncounter: { type: Boolean }
}, {
  _id: false
});

const HospitalQueueFKTPSecretSchema = new mongoose.Schema ({
  username: { type: String },
  password: { type: String }
}, {
  _id: false
});

const HospitalQueueUserLoginSchema = new mongoose.Schema ({
  email: { type: String },
  password: { type: String },
  token : {type: String},
  tokenQueue : {type: String}
}, {
  _id: false
});

const HospitalSchema = new mongoose.Schema(
  {
    uuid: { type: String, required: true },
    alias: { type: String },
    name: { type: String, required: true },
    groupId: { type: String, required: true },
    pcareSecret: { type: String },
    pcareInSecret:{ type: String },
    icareInSecret:{ type: String },
    jknInternalSecret: { type: JknInternalSecretSchema },
    jknExternalSecret: { type: String },
    aplicaresSecret: { type: String },
    vclaimSecret: { type : String },
    eclaimSecret: { type: String },
    eclaimUrl: { type: String },
    eclaimCoderNik : { type: String},
    fhirSecret: { type: String },
    configs: { type: HospitalConfigsScheme},
    createdBy: { type: String },
    updatedBy: { type: String },
    active: { type: Boolean, default: true },
    queueFKTPSecret : { type : HospitalQueueFKTPSecretSchema },
    queueUserLogin : { type : HospitalQueueUserLoginSchema},
    wsBpjsFKTPSecret : { type : String }
  },
  {
    timestamps: true,
  }
);

HospitalSchema.pre("save", async function (next) {
  return next();
});

const HospitalModel = mongoose.model<HospitalDocument>(
  "Tm_Hospital",
  HospitalSchema
);

export default HospitalModel;
