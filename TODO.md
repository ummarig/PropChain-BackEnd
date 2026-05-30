# TODO - Manage property documents (upload, categorization, download, access control)

## Progress
- [x] Create initial implementation plan

## Steps
- [ ] Step 1: Add per-user authorization to all document-by-id operations (findOne/update/remove/sign/verify/flag expiry/notified/expiration actions).
- [ ] Step 2: Add secure download endpoint that checks authorization then redirects to a short-lived signed URL based on `fileUrl`.
- [ ] Step 3: Add bulk download to use secure signed URLs (zips streamed content or redirects with signed URLs list).
- [ ] Step 4: Add endpoint to request signed upload URL and persist document metadata (fileName/fileSize/mimeType/fileUrl).
- [ ] Step 5: Implement a pluggable Signed URL provider abstraction (S3/GCS/Azure placeholders) driven by env vars; default throws “not configured”.
- [ ] Step 6: Update DTOs + Swagger decorators for new endpoints.
- [ ] Step 7: Run `npm test`, `npm run lint`, `npm run build`.

