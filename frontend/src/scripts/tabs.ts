type TabOption<T extends string> = {
  value: T;
  label: string;
};

type TabsOptions<T extends string> = {
  options: TabOption<T>[];
  value: T;
  onChange?: (value: T) => void;
};

export function createTabs<T extends string>({ options, value, onChange }: TabsOptions<T>) {
  let current = value;
  const root = document.createElement('div');
  root.className = 'site-tabs';
  root.setAttribute('role', 'tablist');

  const setValue = (nextValue: T) => {
    current = nextValue;
    root.querySelectorAll<HTMLButtonElement>('[data-tab-value]').forEach((button) => {
      const active = button.dataset.tabValue === current;
      button.dataset.active = active ? 'true' : 'false';
      button.setAttribute('aria-selected', active ? 'true' : 'false');
      button.tabIndex = active ? 0 : -1;
    });
    onChange?.(current);
  };

  options.forEach((option) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'site-tabs__trigger';
    button.dataset.tabValue = option.value;
    button.setAttribute('role', 'tab');
    button.textContent = option.label;
    button.addEventListener('click', () => setValue(option.value));
    root.append(button);
  });

  setValue(current);

  return {
    root,
    getValue: () => current,
    setValue,
  };
}
