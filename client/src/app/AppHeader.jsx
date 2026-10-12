// Верхняя панель: название и действия справа
export default function AppHeader({ children }) {
  return (
    <header className="topbar">
      <h1>MyTracker</h1>
      {children}
    </header>
  );
}
