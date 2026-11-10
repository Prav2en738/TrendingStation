import { HttpError } from '../utils/http.js';

// multer has already saved the files; we just return their public URLs.
export const uploadImages = (req, res) => {
  if (!req.files || req.files.length === 0) {
    throw new HttpError(400, 'No image selected');
  }
  const base = process.env.SERVER_URL || `${req.protocol}://${req.get('host')}`;
  const urls = req.files.map((f) => `${base}/uploads/${f.filename}`);
  res.status(201).json({ success: true, data: { urls } });
};
