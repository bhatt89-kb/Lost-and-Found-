const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Upload an image buffer (from multer memory storage) to Cloudinary
exports.uploadImage = (buffer) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'campus-lost-and-found',
        resource_type: 'image',
        transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    stream.end(buffer);
  });

exports.deleteImage = (publicId) => cloudinary.uploader.destroy(publicId);