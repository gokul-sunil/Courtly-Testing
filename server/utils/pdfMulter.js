import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootUploadDir = path.join(__dirname, "../uploads");

const ensureDir = (subfolder) => {
  const dir = path.join(rootUploadDir, subfolder);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
};

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let subfolder = "others";

    if (file.fieldname === "dietPdf") subfolder = "diets";
    if (file.fieldname === "profilePicture") subfolder = "profiles";

    const dir = ensureDir(subfolder);
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.fieldname === "dietPdf") {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new Error("Invalid file type for diet plan. Only PDF allowed!"));
  } else if (file.fieldname === "profilePicture") {
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Invalid file type for profile picture. Only JPG/PNG/WebP allowed!"));
  } else {
    cb(new Error("Unknown field for file upload"));
  }
};

const uploadFiles = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
}).fields([
  { name: "dietPdf", maxCount: 10 },
  { name: "profilePicture", maxCount: 1 },
]);

export default uploadFiles;
