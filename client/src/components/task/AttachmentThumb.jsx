import { useEffect, useState } from 'react';
import { fetchAttachmentUrl } from '../../api.js';

// Миниатюра вложения. Картинка грузится с токеном и освобождается при уходе со страницы.
export default function AttachmentThumb({ taskId, attachment }) {
  const [src, setSrc] = useState('');
  useEffect(() => {
    let url = '';
    let alive = true;
    fetchAttachmentUrl(taskId, attachment._id)
      .then((objectUrl) => {
        url = objectUrl;
        if (alive) setSrc(objectUrl);
        else URL.revokeObjectURL(objectUrl);
      })
      .catch(() => {});
    return () => {
      alive = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [taskId, attachment._id]);
  return src
    ? <a href={src} target="_blank" rel="noreferrer"><img className="thumb" src={src} alt={attachment.name} /></a>
    : <span className="muted">{attachment.name}</span>;
}
