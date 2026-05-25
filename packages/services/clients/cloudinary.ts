import { v2 as cloudinary } from "cloudinary";
import { env } from "../env";

// Configure Cloudinary using CLOUDINARY_URL from env schema
cloudinary.config({
  cloudinary_url: env.CLOUDINARY_URL,
});

export { cloudinary };
