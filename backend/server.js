const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
require("dotenv").config();

const tankRoutes = require("./routes/tankRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use("/api/tank", tankRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Smart Water Tank Management API is running"
  });
});-

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });