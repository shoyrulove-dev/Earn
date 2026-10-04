import mongoose, { Schema, models } from "mongoose";
const SubmissionSchema = new Schema({ userId: { type: Schema.Types.ObjectId, ref: "User", required: true }, minijobId: { type: Schema.Types.ObjectId, ref: "Minijob", required: true }, proofUrl: { type: String, required: true }, note: String, status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" }, reviewedBy: Schema.Types.ObjectId, reviewedAt: Date, reviewNote: String }, { timestamps: true });
SubmissionSchema.index({ userId: 1, minijobId: 1, status: 1 });
export default models.Submission || mongoose.model("Submission", SubmissionSchema);
