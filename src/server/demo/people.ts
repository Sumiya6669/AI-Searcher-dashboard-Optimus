import type { AccessGroupRow, AdminUserRow, EntityOptionRow } from '@/lib/types';

/**
 * Набор для демонстрационного режима. Он живёт отдельно от рабочего слоя
 * данных и никогда не смешивается с ним: показать вымышленного сотрудника
 * вместо настоящего в рабочем режиме — худшее, что может сделать раздел
 * управления доступом.
 */
export const DEMO_USERS: AdminUserRow[] = [
  {
    user_id: 'demo-1',
    email: 'a.gaan@example.kz',
    full_name: 'Альберт Гаан',
    role: 'admin',
    is_active: true,
    created_at: '2026-08-01T09:00:00Z',
    last_sign_in_at: '2026-08-29T05:40:00Z',
    group_ids: [1, 2],
    group_names: 'Sika, Тиккурила',
  },
  {
    user_id: 'demo-2',
    email: 'm.serik@example.kz',
    full_name: 'Марат Серик',
    role: 'user',
    is_active: true,
    created_at: '2026-08-05T09:00:00Z',
    last_sign_in_at: '2026-08-28T11:20:00Z',
    group_ids: [2],
    group_names: 'Тиккурила',
  },
  {
    user_id: 'demo-3',
    email: 'd.kim@example.kz',
    full_name: 'Дарья Ким',
    role: 'user',
    is_active: false,
    created_at: '2026-08-27T09:00:00Z',
    last_sign_in_at: null,
    group_ids: [],
    group_names: '',
  },
];

export const DEMO_GROUPS: AccessGroupRow[] = [
  {
    id: 1,
    code: 'sika',
    name: 'Sika',
    description: 'Гидроизоляция, промышленные полы, строительная химия',
    restrict_view: false,
    min_importance: 3,
    recipient_id: null,
    recipient_name: 'Отдел строительной химии',
    is_active: true,
    entity_ids: [11, 12],
    entity_names: 'Sika, Sikafloor',
    member_ids: ['demo-1'],
    members_count: 1,
    events_30d: 18,
  },
  {
    id: 2,
    code: 'tikkurila',
    name: 'Тиккурила',
    description: 'Декоративные ЛКМ',
    restrict_view: true,
    min_importance: 2,
    recipient_id: null,
    recipient_name: 'Направление ЛКМ',
    is_active: true,
    entity_ids: [21, 22],
    entity_names: 'Tikkurila, Тиккурила ТОО',
    member_ids: ['demo-1', 'demo-2'],
    members_count: 2,
    events_30d: 7,
  },
];

export const DEMO_ENTITY_OPTIONS: EntityOptionRow[] = [
  { id: 11, canonical_name: 'Sika', entity_type: 'brand', product_group: 'строительная химия', is_active: true, events_30d: 14 },
  { id: 12, canonical_name: 'Sikafloor', entity_type: 'brand', product_group: 'промышленные полы', is_active: true, events_30d: 4 },
  { id: 21, canonical_name: 'Tikkurila', entity_type: 'brand', product_group: 'ЛКМ', is_active: true, events_30d: 7 },
  { id: 22, canonical_name: 'Тиккурила ТОО', entity_type: 'supplier', product_group: null, is_active: true, events_30d: 0 },
  { id: 31, canonical_name: 'Master Builders Solutions', entity_type: 'brand', product_group: 'строительная химия', is_active: true, events_30d: 9 },
  { id: 32, canonical_name: 'PCI', entity_type: 'brand', product_group: 'строительная химия', is_active: true, events_30d: 3 },
  { id: 33, canonical_name: 'Ucrete', entity_type: 'brand', product_group: 'промышленные полы', is_active: true, events_30d: 2 },
  { id: 41, canonical_name: 'Гидроизоляция', entity_type: 'topic', product_group: 'гидроизоляция', is_active: true, events_30d: 22 },
];
