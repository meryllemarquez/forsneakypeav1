import axios from 'axios';
import api from './axiosConfig';

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Why a file can't be uploaded, or '' when it can. Shared by every upload picker. */
export function validateImageFile(file) {
  if (!file.type || !file.type.startsWith('image/')) return 'Not an image';
  if (file.size > MAX_UPLOAD_BYTES) {
    return `Too big (${(file.size / (1024 * 1024)).toFixed(1)} MB, max 15)`;
  }
  return '';
}

// Uploads an image straight from the browser to Google Drive and returns the Drive file id.
// target: 'memories' | 'avatars' | 'date-covers'. The backend creates the resumable upload
// session (and later checks the file); the bytes never pass through our server.
// signal (optional AbortSignal) cancels the session request and the upload.
export async function uploadImageToDrive(file, target, onProgress, signal) {
  const problem = validateImageFile(file);
  if (problem === 'Not an image') {
    throw new Error('Only image files can be uploaded.');
  }
  if (problem) {
    throw new Error('Images must be 15 MB or smaller.');
  }

  const { data: session } = await api.post('/uploads/session', {
    target,
    mimeType: file.type,
    size: file.size,
  }, { signal });

  // A plain axios call: the session URL is its own credential, so no app Authorization header.
  const res = await axios.put(session.uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    withCredentials: false,
    signal,
    onUploadProgress: onProgress
      ? (e) => onProgress(e.total ? e.loaded / e.total : 0)
      : undefined,
  });
  return res.data.id;
}
