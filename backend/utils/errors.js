export function notFound(req, res) {
  res.status(404).json({ message: `Route not found: ${req.method} ${req.originalUrl}` });
}

export function errorHandler(error, req, res, next) {
  console.error(error);
  if (res.headersSent) return next(error);
  if (error.name === "MulterError") return res.status(400).json({ message: error.code === "LIMIT_FILE_SIZE" ? "Each attachment must be 5 MB or smaller." : "The attachment upload is invalid." });
  if (error.message === "Only PDF, JPEG, and PNG attachments are allowed.") return res.status(400).json({ message: error.message });
  if (error.name === "ValidationError") return res.status(400).json({ message: error.message });
  if (error.code === 11000) return res.status(409).json({ message: "A record with that value already exists." });
  if (error.name === "CastError") return res.status(400).json({ message: "Invalid resource identifier." });
  res.status(error.status || 500).json({ message: error.status ? error.message : "An unexpected server error occurred." });
}
