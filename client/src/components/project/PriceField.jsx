import { useId } from 'react';
import { Form, InputNumber, Select, Space } from 'antd';
import { CURRENCIES } from '../../../../shared/crm.js';

// Сумма по проекту и валюта
export default function PriceField({ amount, currency, onAmount, onCurrency }) {
  const id = useId();
  return (
    <Form.Item label="Сумма по проекту" htmlFor={id}>
      <Space.Compact style={{ width: '100%' }}>
        <InputNumber
          id={id}
          min={0}
          value={amount === '' ? null : Number(amount)}
          onChange={(n) => onAmount(n == null ? '' : String(n))}
          style={{ width: '100%' }}
        />
        <Select
          value={currency}
          onChange={onCurrency}
          options={CURRENCIES.map((c) => ({ value: c, label: c }))}
          style={{ width: 90 }}
        />
      </Space.Compact>
    </Form.Item>
  );
}
