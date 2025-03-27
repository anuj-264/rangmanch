import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';



// Configuring Cloudinary globally
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Function to upload image to Cloudinary
const uploadOnCloudinary = async (filePath) => {
    try {
        if (!filePath) {
            return null;
        }

        // Uploading file to Cloudinary
        const response = await cloudinary.uploader.upload(filePath, {
            resource_type: "auto",
        });

        // File uploaded successfully
        console.log("File uploaded successfully:", response.secure_url);
        
        
        return response;
    } catch (error) {
        console.error("Error while uploading file:", error.message);

        // Remove locally saved file asynchronously
        try {
            await fs.promises.unlink(filePath);
        } catch (unlinkError) {
            console.error("Failed to delete local file:", unlinkError.message);
        }

        return null;// Return null on failure
    }
};

export default uploadOnCloudinary;
