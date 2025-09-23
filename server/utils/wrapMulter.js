// wrapMulter.js
const wrapMulter = (multerMiddleware) => {
  return (req, res, next) => {
    multerMiddleware(req, res, (err) => {
      if (err) {
        // Multer errors or fileFilter errors
        return res.status(400).json({ success: false, message: err.message });
      }
      next();
    });
  };
};

export { wrapMulter };
