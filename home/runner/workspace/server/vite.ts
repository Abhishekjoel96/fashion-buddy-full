const express = require("express");
const path = require("path");
const fs = require("node:fs");
const app = express();
const port = process.env.PORT || 5000;

const distPath = path.resolve(__dirname, "..", "dist");

  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

app.use(express.static(distPath));

app.get("*", (req, res) => {
  res.sendFile(path.resolve(distPath, "index.html"));
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});