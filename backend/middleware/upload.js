// middleware/upload.js
import multer from "multer";
import path from "path";
import fs from "fs";
// here in this file we configure multer storage folder
// and file name
// and export the configured multer instance
const uploadDir = "./uploads";
console.log("====================================");
console.log(
  "from middleware/upload.js file that config multer storage folder "
);
console.log("====================================");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });

export default upload;
