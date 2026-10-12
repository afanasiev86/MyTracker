import { authHeaders, networkError, httpError } from './http.js';

// Вложения: файл отправляется как есть, тип и имя передаются в заголовках
export async function uploadAttachment(id, file) {
  let res;
  try {
    res = await fetch(`/api/tasks/${id}/attachments`, {
      method: 'POST',
      headers: authHeaders({ 'Content-Type': file.type, 'X-File-Name': encodeURIComponent(file.name) }),
      body: file,
    });
  } catch {
    throw networkError();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw httpError(res.status, data.error);
  return data;
}

// Картинка вложения: <img> не умеет передавать заголовок с токеном, поэтому берём blob
export async function fetchAttachmentUrl(id, attachmentId) {
  let res;
  try {
    res = await fetch(`/api/tasks/${id}/attachments/${attachmentId}`, { headers: authHeaders() });
  } catch {
    throw networkError();
  }
  if (!res.ok) throw httpError(res.status);
  return URL.createObjectURL(await res.blob());
}
