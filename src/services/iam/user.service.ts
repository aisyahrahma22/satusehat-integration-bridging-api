import mongoose, { FilterQuery, QueryOptions, UpdateQuery } from "mongoose";
import { omit } from "lodash";
import UserModel, { UserDocument, UserInput } from "../../models/iam/user.model";

export async function createUser(input: UserInput) {
  try {
    const user = await UserModel.create(input);

    return user.toJSON();
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function findAndUpdateUser(
  query: FilterQuery<UserDocument>,
  update: UpdateQuery<UserDocument>,
  options: QueryOptions
) {
  try {
    const user = await UserModel.findOneAndUpdate(query, update, options);

    return user;
  } catch (e: any) {
    throw new Error(e);
  }
}

export async function validatePassword({
  username,
  password,
  authority
}: {
  username: string;
  password: string;
  authority: string;
}) {
  const user = await UserModel.findOne({ username, authority }).select("name active authority password");
  if (!user) {
    return false;
  }

  const isValid = await user.comparePassword(password);

  if (!isValid) return false;

  return omit(user.toJSON(), "password");
}

export async function findOneUser(query: FilterQuery<UserDocument>) {
  return UserModel.findOne(query).lean();
}

export async function findUser(query: FilterQuery<UserDocument>) {
  const _id = new mongoose.Types.ObjectId(query._id);
  
  let result: any;

  result = await UserModel.aggregate([
    { $match: { _id: _id } },
  ]);

  return result[0];

}
