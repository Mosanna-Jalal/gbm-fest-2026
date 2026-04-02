import mongoose, { InferSchemaType, Model } from "mongoose";

const sessionSchema = new mongoose.Schema(
  {
    token: { type: String, required: true, unique: true },
    userId: { type: String, required: true },
    username: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export type SessionDoc = InferSchemaType<typeof sessionSchema> & { _id: mongoose.Types.ObjectId };

export const SessionModel: Model<SessionDoc> =
  (mongoose.models.FestSession as Model<SessionDoc>) ||
  mongoose.model<SessionDoc>("FestSession", sessionSchema);
