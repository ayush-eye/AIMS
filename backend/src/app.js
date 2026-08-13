import express from "express";
import cors from "cors";
import compression from "compression";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import authRoutes from "../features/auth/auth.routes.js";
import adminRoutes from "../features/admin/admin.routes.js";
import courseRoutes from "../features/courses/course.routes.js";
import chapterRoutes from "../features/chapters/chapter.routes.js";
import lectureRoutes from "../features/lectures/lecture.routes.js";
import noteRoutes from "../features/notes/note.routes.js";

const app = express();
app.set("etag", false);
app.use(cors());
app.use(compression());

app.use(helmet());

// Disable caching for all API responses to prevent HTTP 304 errors on React Native
app.use((req, res, next) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  next();
});

app.use(express.json());

app.use(cookieParser());

app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use('/courses', courseRoutes);
app.use('/chapters', chapterRoutes);
app.use('/lectures', lectureRoutes);
app.use('/notes', noteRoutes);

app.get("/", (req, res) => {
    res.send("Hello World!");
});

app.get("/health", (req, res) => {
    res.status(200).json({ success: true, status: "ok", timestamp: new Date().toISOString() });
});

export default app;