// Значение поля из onChange: у Input это событие, у Select, DatePicker и Checkbox-обёрток уже значение
export const fieldValue = (arg) => (arg?.target ? arg.target.value : arg);

// Обработчик поля формы, хранящей значения в state: set('title') → onChange
export const fieldSetter = (setForm) => (key) => (arg) =>
  setForm((f) => ({ ...f, [key]: fieldValue(arg) ?? '' }));
