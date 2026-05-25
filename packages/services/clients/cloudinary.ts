import { v2 as cloudinary } from "cloudinary";
import { env } from "../env";

// Configure cloudinary using CLOUDINARY_URL from env schema
cloudinary.config({
  cloudinary_api_url: env.CLOUDINARY_URL,
});

export { cloudinary };
