import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import morgan from "morgan";
import dotenv from "dotenv";
import Note from "./models/Note.js";

dotenv.config();

const app = express();

// Config
const PORT = process.env.PORT || 4000; // we are sending PORT as env in deployment.yaml
const MONGO_URI =
  process.env.MONGO_URI || "mongodb://mongo-svc:27017/k8s_notes_db"; // mongo-svc is name of my mongoDB service or i can pass env var in backend deployment.yaml for MONGO_URI

// Middlewares
app.use(cors({
  origin: '*',  // Allow all origins (for development)
  credentials: true
}));
app.use(express.json());
app.use(morgan("dev"));

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Backend is running" });
});

// CRUD Routes
// Get all notes
app.get("/api/notes", async (req, res) => {
  try {
    const notes = await Note.find().sort({ createdAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error("Error fetching notes:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create note
app.post("/api/notes", async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const note = await Note.create({ title, description });
    res.status(201).json(note);
  } catch (err) {
    console.error("Error creating note:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update note
app.put("/api/notes/:id", async (req, res) => {
  try {
    const { title, description } = req.body;
    const { id } = req.params;

    if (!title || title.trim() === "") {
      return res.status(400).json({ error: "Title is required" });
    }

    const note = await Note.findByIdAndUpdate(
      id,
      { title, description },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json(note);
  } catch (err) {
    console.error("Error updating note:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete note
app.delete("/api/notes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const note = await Note.findByIdAndDelete(id);

    if (!note) {
      return res.status(404).json({ error: "Note not found" });
    }

    res.json({ message: "Note deleted successfully" });
  } catch (err) {
    console.error("Error deleting note:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// MongoDB connect + start
mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Backend listening on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });

