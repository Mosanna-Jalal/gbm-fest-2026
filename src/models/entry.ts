import mongoose, { InferSchemaType, Model } from "mongoose";

const entrySchema = new mongoose.Schema(
  {
    passNo: { type: String, required: true, trim: true },
    studentId: { type: String, required: true },
    studentName: { type: String, required: true, trim: true },
    phoneNo: { type: String, required: true, trim: true },
    classRoll: { type: String, required: true, trim: true },
    action: { type: String, enum: ["ENTRY", "EXIT"], required: true },
    festDay: { type: String, enum: ["2026-04-06", "2026-04-07"], required: true },
    operatorUsername: { type: String, required: true, trim: true },
    batchId: { type: String, default: null },
  },
  { timestamps: true }
);

entrySchema.index({ passNo: 1, createdAt: -1 });
entrySchema.index({ operatorUsername: 1, createdAt: -1 });

export type EntryDoc = InferSchemaType<typeof entrySchema> & { _id: mongoose.Types.ObjectId };

export const EntryModel: Model<EntryDoc> =
  (mongoose.models.Entry as Model<EntryDoc>) || mongoose.model<EntryDoc>("Entry", entrySchema);
