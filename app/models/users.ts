import mongoose from "mongoose";

const Schema = mongoose.Schema;

const usersSchema = new Schema({
  _id: { type: Schema.Types.ObjectId },
  address: { type: String, required: true },
  transactionHash: {type: String, required: true},
  amount: { type: Schema.Types.Number, required: true },
  phase: { type: Schema.Types.Number, required: true },
});

export default mongoose.model("Users", usersSchema);
