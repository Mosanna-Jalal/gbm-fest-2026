import mongoose, { InferSchemaType, Model } from "mongoose";

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    displayName: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

export type AdminDoc = InferSchemaType<typeof adminSchema> & { _id: mongoose.Types.ObjectId };

export const AdminModel: Model<AdminDoc> =
  (mongoose.models.Admin as Model<AdminDoc>) || mongoose.model<AdminDoc>("Admin", adminSchema);
