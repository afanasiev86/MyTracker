import { useId } from 'react';
import { Col, Form, InputNumber, Select, Space } from 'antd';
import { RATE_KINDS, RATE_LABELS, CURRENCIES } from '../../../../shared/crm.js';
import Field from '../Field.jsx';

// Тип оплаты, ставка или сумма и валюта
export default function RateFields({ form, set }) {
  const amountId = useId();
  return (
    <>
      <Col xs={24} md={12}>
        <Field label="Тип оплаты">
          <Select
            value={form.rateKind}
            onChange={set('rateKind')}
            options={RATE_KINDS.map((k) => ({ value: k, label: RATE_LABELS[k] }))}
          />
        </Field>
      </Col>
      <Col xs={24} md={12}>
        <Form.Item label="Ставка или сумма" htmlFor={amountId}>
          <Space.Compact style={{ width: '100%' }}>
            <InputNumber
              id={amountId}
              min={0}
              value={form.rateAmount === '' ? null : Number(form.rateAmount)}
              onChange={(n) => set('rateAmount')(n == null ? '' : String(n))}
              style={{ width: '100%' }}
            />
            <Select
              value={form.rateCurrency}
              onChange={set('rateCurrency')}
              options={CURRENCIES.map((c) => ({ value: c, label: c }))}
              style={{ width: 90 }}
            />
          </Space.Compact>
        </Form.Item>
      </Col>
    </>
  );
}
