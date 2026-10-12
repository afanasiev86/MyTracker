import { Link, useLocation } from 'react-router-dom';
import { Menu } from 'antd';
import { SECTIONS } from './sections.js';

// Вкладки разделов владельца: ссылки, у каждого раздела свой адрес
export default function SectionTabs() {
  const { pathname } = useLocation();
  const current = SECTIONS.find((s) => pathname === s.path || pathname.startsWith(`${s.path}/`));

  return (
    <Menu
      mode="horizontal"
      aria-label="Разделы"
      selectedKeys={current ? [current.path] : []}
      items={SECTIONS.map((s) => ({ key: s.path, label: <Link to={s.path}>{s.title}</Link> }))}
      className="section-tabs"
    />
  );
}
