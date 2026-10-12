import AttachmentThumb from './AttachmentThumb.jsx';

// Скриншоты задачи: миниатюры и загрузка новой картинки
export default function AttachmentsSection({ taskId, attachments, busy, onUpload }) {
  return (
    <>
      <h3>Скриншоты</h3>
      {attachments?.length > 0 && (
        <div className="thumbs">
          {attachments.map((a) => <AttachmentThumb key={a._id} taskId={taskId} attachment={a} />)}
        </div>
      )}
      <label className="upload">
        Прикрепить картинку (PNG, JPEG, GIF, WebP до 5 МБ)
        <input
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          disabled={busy}
          onChange={(e) => {
            const file = e.target.files?.[0];
            e.target.value = '';
            if (file) onUpload(file);
          }}
        />
      </label>
    </>
  );
}
