import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    }
  },
  {
    timestamps: true
  }
);

const Note = mongoose.model("Note", noteSchema);

export default Note;

