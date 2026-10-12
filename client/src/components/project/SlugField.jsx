// Код проекта: латиница, цифры и дефис. После создания менять нельзя.
export default function SlugField({ value, onChange, isEdit, valid }) {
  return (
    <label>
      Код проекта
      <input
        value={value}
        onChange={onChange}
        placeholder="shop-api"
        disabled={isEdit}
        required
        aria-describedby="slug-hint"
      />
      <span id="slug-hint" className="hint">
        {isEdit
          ? 'Код менять нельзя: по нему привязаны задачи.'
          : 'Латиница, цифры и дефис. Должен совпадать с папкой репозитория на сервере.'}
      </span>
      {value && !valid && (
        <span className="error" role="alert">Пока не подходит: используйте латиницу, цифры и дефис.</span>
      )}
    </label>
  );
}
