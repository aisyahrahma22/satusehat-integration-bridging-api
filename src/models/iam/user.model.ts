import mongoose from "mongoose";
import bcrypt from 'bcryptjs';
import config from "config";

export interface UserInput {
  username: string,
  email: string;
  name: string;
  password: string;
  authority: string;
  active: boolean;
}

export interface UserInfoInput {
  info: object;
}

export interface UserDocument extends UserInput, UserInfoInput, mongoose.Document {
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<Boolean>;
}

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String },
    name: { type: String, required: true },
    password: { type: String, required: true },
    authority: { type: String, required: true },
    active: { type: Boolean, default: true }
  },
  {
    timestamps: true,
  }
);

userSchema.pre("save", async function (next) {
  let user = this as UserDocument;

  if (!user.isModified("password")) {
    return next();
  }

  const salt = await bcrypt.genSalt(config.get<number>("saltWorkFactor"));

  const hash = await bcrypt.hashSync(user.password, salt);

  user.password = hash;

  return next();
});

userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  const user = this as UserDocument;
  return bcrypt.compare(candidatePassword, user.password);
};

const UserModel = mongoose.model<UserDocument>("User", userSchema);

export default UserModel;
