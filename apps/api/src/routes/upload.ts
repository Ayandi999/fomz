import express from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Configure Cloudinary locally in the router with connection URL
cloudinary.config({
  cloudinary_url: process.env.CLOUDINARY_URL,
});

// Target Home Folders on Cloudinary as per approved spec
const FOLDERS = {
  IMAGE: "images",
  VIDEO: "video",
  AUDIO: "audio",
  PDF: "pdf",
};

// Size constraints
const LIMITS = {
  IMAGE: 300 * 1024,      // 300 KB
  PDF: 200 * 1024,        // 200 KB
  VIDEO: 10 * 1024 * 1024, // 10 MB
  AUDIO: 10 * 1024 * 1024, // 10 MB
};

router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { type } = req.body; // Expecting 'IMAGE' | 'VIDEO' | 'AUDIO' | 'PDF'

    if (!file) {
      return res.status(400).json({ error: "No file was uploaded." });
    }

    if (!type || !FOLDERS[type as keyof typeof FOLDERS]) {
      return res.status(400).json({ error: "Invalid or missing file type metadata parameter." });
    }

    const fileType = type as keyof typeof FOLDERS;
    const maxLimit = LIMITS[fileType];

    // Backend fallback validation check in case frontend check is bypassed
    if (file.size > maxLimit) {
      const displaySize = maxLimit >= 1024 * 1024 
        ? `${maxLimit / (1024 * 1024)}MB` 
        : `${maxLimit / 1024}KB`;
      return res.status(400).json({ 
        error: `File size exceeds backend constraint of ${displaySize} for type ${fileType}.` 
      });
    }

    // Convert memory buffer to Base64 URI for Cloudinary upload
    const base64Data = file.buffer.toString("base64");
    const fileUri = `data:${file.mimetype};base64,${base64Data}`;

    // Upload resource dynamically to target home directory folder
    const targetFolder = FOLDERS[fileType];
    const resourceType = fileType === "VIDEO" || fileType === "AUDIO" ? "video" : "auto";

    const uploadResult = await cloudinary.uploader.upload(fileUri, {
      folder: targetFolder,
      resource_type: resourceType,
    });

    return res.status(200).json({
      success: true,
      url: uploadResult.secure_url,
      publicId: uploadResult.public_id,
    });
  } catch (error: any) {
    return res.status(500).json({
      error: error.message || "An unexpected error occurred during Cloudinary upload."
    });
  }
});

export default router;
