import { cloneElement, useId } from 'react';
import { Form } from 'antd';

// Form.Item без имени не связывает подпись с полем, поэтому связываем сами: label[for] = id поля
export default function Field({ children, ...itemProps }) {
  const id = useId();
  return (
    <Form.Item htmlFor={id} {...itemProps}>
      {cloneElement(children, { id })}
    </Form.Item>
  );
}
