import mongoose, { InferSchemaType, Model } from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    serialNo: { type: Number, required: true },
    name: { type: String, required: true, trim: true },
    classRoll: { type: String, required: true, trim: true },
    passNumbers: { type: [String], required: true },
    phoneNo: { type: String, required: true, trim: true },
    notes: { type: String, default: "", trim: true },
    source: { type: String, default: "manual", trim: true },
    updatedBy: { type: String, default: "system", trim: true },
  },
  { timestamps: true, collection: "passes" }
);

studentSchema.index({ passNumbers: 1 });
studentSchema.index({ phoneNo: 1 });
studentSchema.index({ serialNo: 1 });

export type StudentDoc = InferSchemaType<typeof studentSchema> & { _id: mongoose.Types.ObjectId };

export const StudentModel: Model<StudentDoc> =
  (mongoose.models.Student as Model<StudentDoc>) || mongoose.model<StudentDoc>("Student", studentSchema);
