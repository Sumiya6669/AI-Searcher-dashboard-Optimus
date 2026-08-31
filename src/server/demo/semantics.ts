import type { SemanticsRow } from '@/lib/types';

/**
 * Образец для демонстрационного режима: два направления из двадцати, чтобы
 * страница показывала свою форму без базы.
 */
export const DEMO_SEMANTICS: SemanticsRow[] = [
  {
    entity_id: 1,
    canonical_name: 'Мосты, путепроводы и эстакады',
    description:
      'Мостовые сооружения: гидроизоляция пролётных строений, ремонт опор, деформационные швы, защита бетона от солей и мороза.',
    product_groups: 'Гидроизоляция, Ремонт бетона, Деформационные швы, Защита бетона',
    aliases_total: 79,
    aliases_phrase: 78,
    aliases_pattern: 1,
    examples: 'моста · виадука · эстакады · ремонт моста · строительство моста · гидроизоляция моста',
    events_30d: 4,
    is_active: true,
  },
  {
    entity_id: 2,
    canonical_name: 'Промышленные полы и напольные покрытия',
    description:
      'Наливные и упрочнённые полы: эпоксидные, полиуретановые и метилметакрилатные системы, Ucrete для пищевых производств.',
    product_groups: 'Промышленные полы, Ucrete, Стяжки',
    aliases_total: 25,
    aliases_phrase: 25,
    aliases_pattern: 0,
    examples: 'топпинг · Ucrete · наливной пол · бетонный пол · полимерный пол · эпоксидный пол',
    events_30d: 0,
    is_active: true,
  },
];
