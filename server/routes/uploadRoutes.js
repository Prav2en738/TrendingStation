import express from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { uploadImages } from '../controllers/uploadController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';
import { adminMiddleware } from '../middleware/adminMiddleware.js';
import { HttpError } from '../utils/http.js';

export const uploadDir = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'uploads');

// Only these types are accepted; the file extension is chosen by us, not by the client.
const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/gif': '.gif' };

const upload = multer({
  storage: multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => cb(null, crypto.randomBytes(12).toString('hex') + EXTENSIONS[file.mimetype])
  }),
  limits: { fileSize: 5 * 1024 * 1024, files: 8 },
  fileFilter: (req, file, cb) =>
    EXTENSIONS[file.mimetype] ? cb(null, true) : cb(new HttpError(400, 'Only JPG, PNG, WEBP or GIF images are allowed'))
});

const router = express.Router();

router.post('/', authMiddleware, adminMiddleware, upload.array('images', 8), uploadImages);

export default router;
