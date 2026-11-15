export interface NavItem {
  label: string;
  icon: string;
  route: string;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Продукты',
    items: [
      { label: 'Обзор', icon: 'space_dashboard', route: '/dashboard' },
      { label: 'Страховые продукты', icon: 'inventory_2', route: '/products' },
      { label: 'Страховые компании', icon: 'business', route: '/ins-companies' },
      { label: 'Доп.продукты', icon: 'extension', route: '/addons' },
      { label: 'Линии бизнеса', icon: 'account_tree', route: '/business-lines' },
    ],
  },
  {
    label: 'Договоры',
    items: [
      { label: 'Котировки', icon: 'request_quote', route: '/quotes' },
    ],
  },
  {
    label: 'Администрирование',
    items: [
      { label: 'Партнеры', icon: 'groups', route: '/partners' },
      { label: 'Правила', icon: 'rule', route: '/rules' },
      { label: 'Справочники', icon: 'menu_book', route: '/refdicts' },
    ],
  },
  {
    label: 'Платформа',
    items: [
      { label: 'Демо компонентов', icon: 'widgets', route: '/demo' },
    ],
  },
];
