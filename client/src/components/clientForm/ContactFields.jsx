// Имя, компания, email и телефон клиента
export default function ContactFields({ form, set }) {
  return (
    <>
      <label>
        Имя
        <input value={form.name} onChange={set('name')} required />
      </label>
      <label>
        Компания
        <input value={form.company} onChange={set('company')} />
      </label>
      <label>
        Email
        <input type="email" value={form.email} onChange={set('email')} />
      </label>
      <label>
        Телефон
        <input value={form.phone} onChange={set('phone')} />
      </label>
    </>
  );
}
