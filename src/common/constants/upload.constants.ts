/**
 * Multer stream-level size limit for file uploads, read at module-load time
 * (decorator arguments are evaluated synchronously, so `ConfigService` DI
 * isn't usable here — matches the pattern already used for `@Throttle()`).
 *
 * Without this, `FileInterceptor`'s default in-memory storage buffers the
 * entire request body before `validateFile()` ever runs its size check,
 * letting an authenticated caller exhaust server memory with one oversized
 * upload. This rejects the stream early instead.
 */
export const UPLOAD_FILE_SIZE_LIMIT = parseInt(
  process.env.UPLOAD_MAX_FILE_SIZE ?? '52428800',
  10,
);

export const MULTER_FILE_LIMITS = {
  limits: { fileSize: UPLOAD_FILE_SIZE_LIMIT },
};
