const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const streamUpload = (buffer, options) =>
  new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (error, result) =>
      error ? reject(error) : resolve(result)
    );
    stream.end(buffer);
  });

// Item photos (feed posts)
exports.uploadImage = (buffer) =>
  streamUpload(buffer, {
    folder: 'campus-lost-and-found',
    resource_type: 'image',
    transformation: [{ width: 1200, crop: 'limit' }, { quality: 'auto', fetch_format: 'auto' }],
  });

// Profile photos: square 400x400, centered on the face when one is found
exports.uploadAvatarImage = (buffer) =>
  streamUpload(buffer, {
    folder: 'campus-lost-and-found/avatars',
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

exports.deleteImage = (publicId) => cloudinary.uploader.destroy(publicId);