import mongoose from "mongoose";
import { number } from "zod";

export interface SequenceInput {
    prefix: string,
    counter: number,
}

export interface SequenceDocument extends SequenceInput, mongoose.Document {
  createdAt: Date;
}

const SequenceSchema = new mongoose.Schema(
  {
    prefix: { type: String, required: true },
    counter: { type: Number, required: true },
  },
  {
    timestamps: true,
  }
);

SequenceSchema.pre("save", async function (next) {
  return next();
});

const SequenceModel = mongoose.model<SequenceDocument>(
  "Sequence",
  SequenceSchema
);

export default SequenceModel;
