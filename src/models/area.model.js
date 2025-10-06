// /src/models/area.model.js
import mongoose from "mongoose";
const areaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  district: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'District',
    required: false,
  },
});

const Area = mongoose.model("Area", areaSchema);
export default Area;
