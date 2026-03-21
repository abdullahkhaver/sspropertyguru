// /src/models/district.model.js
import mongoose from 'mongoose';
const districtSchema = new mongoose.Schema({
  name: { type: String, required: false, unique: true },
});

const District = mongoose.model('District', districtSchema);
export default District;
