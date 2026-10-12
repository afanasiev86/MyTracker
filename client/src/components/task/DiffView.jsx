import { Alert } from 'antd';

// Diff ветки задачи или пояснение, что изменений пока нет
export default function DiffView({ diff }) {
  return diff.trim()
    ? <pre className="diff">{diff}</pre>
    : <Alert type="info" showIcon message="В ветке пока нет изменений относительно основной." />;
}
