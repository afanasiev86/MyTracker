import { Empty, Tag, Timeline, Typography } from 'antd';
import { sumRunCosts, formatUsd } from '../../lib/cost.js';

// История запусков (новые сверху) и суммарная стоимость задачи
export default function RunsSection({ runs }) {
  if (runs.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description="Запусков пока не было. Они появятся после запуска в Claude."
      />
    );
  }
  return (
    <>
      <Typography.Paragraph type="secondary">
        Стоимость задачи: <b>{formatUsd(sumRunCosts(runs))}</b>
      </Typography.Paragraph>
      <Timeline
        items={[...runs].reverse().map((run) => ({
          children: (
            <div>
              <Typography.Text strong>{new Date(run.startedAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}</Typography.Text>
              {run.costUsd != null && <Tag bordered={false} style={{ marginLeft: 8 }}>{formatUsd(run.costUsd)}</Tag>}
              <Typography.Paragraph style={{ margin: 0 }}>{run.summary?.slice(0, 300)}</Typography.Paragraph>
            </div>
          ),
        }))}
      />
    </>
  );
}
