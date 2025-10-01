const { successResponse, errorResponse } = require('../utils/responseUtils');

// Upload progress photos
// This is a simple controller since the actual upload is handled by middleware
const uploadProgressPhotos = async (req, res, next) => {
  try {
    // Photo URLs are set by upload middleware in req.uploadedPhotos
    if (!req.uploadedPhotos || req.uploadedPhotos.length === 0) {
      return errorResponse(res, 400, 'Tidak ada foto yang diupload');
    }

    return successResponse(res, 200, 'Foto berhasil diupload', {
      urls: req.uploadedPhotos,
      count: req.uploadedPhotos.length
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  uploadProgressPhotos
};
