import mongoose from "mongoose";

const requirementSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  requirement: { type: String, required: true },
}, { timestamps: true });

export default mongoose.model("Requirement", requirementSchema);
