const multer = require("multer");

const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    callback(null, "./upload/images");
  },
  filename: (req, file, callback) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    console.log("uniqueSuffix", uniqueSuffix);
    callback(null, file.fieldname + "-" + uniqueSuffix);
  },
});

const fileFilter = (req, file, callback) => {
  if (
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpeg"
  ) {
    callback(null, true);
  } else {
    callback(null, false);
    return callback(
      new Error(
        "Please upload files in the following extenstions: jpeg, jpg, png",
      ),
    );
  }
};

exports.multerMiddleware = multer({
  storage,
  fileFilter,
});