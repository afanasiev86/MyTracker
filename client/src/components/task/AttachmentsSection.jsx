import { Flex, Image, Typography, Upload } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import AttachmentThumb from './AttachmentThumb.jsx';

// Скриншоты задачи: миниатюры и плитка загрузки новой картинки
export default function AttachmentsSection({ taskId, attachments, busy, onUpload }) {
  return (
    <>
      <Image.PreviewGroup>
        <Flex wrap gap={8}>
          {attachments?.map((a) => <AttachmentThumb key={a._id} taskId={taskId} attachment={a} />)}
          <Upload
            accept="image/png,image/jpeg,image/gif,image/webp"
            showUploadList={false}
            disabled={busy}
            beforeUpload={(file) => {
              onUpload(file);
              return false;
            }}
          >
            <button type="button" className="task-upload-tile" disabled={busy}>
              <PlusOutlined />
              <span>Прикрепить</span>
            </button>
          </Upload>
        </Flex>
      </Image.PreviewGroup>
      <Typography.Text type="secondary" style={{ display: 'block', marginTop: 8 }}>
        PNG, JPEG, GIF, WebP до 5 МБ. Скриншоты помогают Claude увидеть, что именно не так.
      </Typography.Text>
    </>
  );
}
