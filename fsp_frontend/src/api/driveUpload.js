import axios from 'axios';
import api from './axiosConfig';

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

// Uploads an image straight from the browser to Google Drive and returns the Drive file id.
// target: 'memories' | 'avatars' | 'date-covers'. The backend creates the resumable upload
// session (and later checks the file); the bytes never pass through our server.
export async function uploadImageToDrive(file, target, onProgress) {
  if (!file.type.startsWith('image/')) {
    throw new Error('Only image files can be uploaded.');
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error('Images must be 15 MB or smaller.');
  }

  const { data: session } = await api.post('/uploads/session', {
    target,
    mimeType: file.type,
    size: file.size,
  });

  // A plain axios call: the session URL is its own credential, so no app Authorization header.
  const res = await axios.put(session.uploadUrl, file, {
    headers: { 'Content-Type': file.type },
    withCredentials: false,
    onUploadProgress: onProgress
      ? (e) => onProgress(e.total ? e.loaded / e.total : 0)
      : undefined,
  });
  return res.data.id;
}
