import { useEffect, useState } from 'react';
import { Image, Typography } from 'antd';
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
    ? <Image src={src} alt={attachment.name} width={96} height={96} style={{ objectFit: 'cover', borderRadius: 8 }} />
    : <div className="task-upload-tile"><Typography.Text type="secondary" ellipsis>{attachment.name}</Typography.Text></div>;
}
