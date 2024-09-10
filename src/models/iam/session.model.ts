import mongoose from "mongoose";
import { UserDocument } from "./user.model";

export interface SessionDocument extends mongoose.Document {
  id: number
  uuid: string;
  userId: number;
  valid: boolean;
  userAgent: string;
  lastAccess: Date;
  createdAt: Date;
  updatedAt: Date;
}

const sessionSchema = new mongoose.Schema(
  {
    id:{ type: Number},
    uuid: { type: String, required: true },
    userId:{ type: Number},
    valid: { type: Boolean, default: true },
    userAgent: { type: String },
    lastAccess: { type: Date},
    createdAt: { type: Date},
    updatedAt: { type: Date}
  },
  {
    timestamps: true,
  }
);

const SessionModel = mongoose.model<SessionDocument>("Session", sessionSchema);

export default SessionModel;
