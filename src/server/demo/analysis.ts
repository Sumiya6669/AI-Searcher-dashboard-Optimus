import type {
  CatalogGroupRow,
  CatalogItemRow,
  CatalogTotalsRow,
  EventAnalysisRow,
  ProjectRow,
  ScoringFactorRow,
  StageRow,
  TenderAnalysisRow,
} from '@/lib/types';

/**
 * Демонстрационный набор. Числа взяты из настоящих замеров, чтобы показ не
 * обещал больше, чем система умеет.
 */

export function demoEventAnalysis(id: number): EventAnalysisRow {
  return {
    event_id: id,
    stream: 'competitor_news',
    base_score: 25,
    total_score: 70,
    priority: 'critical',
    confidence: 'high',
    verification_status: 'partially_verified',
    evidence: [
      { claim: 'Упомянут конкурент: Ceresit', source_fragment: 'Ceresit' },
      { claim: 'Тип события: Цены и поставки', source_fragment: 'prices_supply' },
      { claim: 'Рынок: Алматы', source_fragment: 'Алматы' },
    ],
    positive_factors: [
      { code: 'kazakhstan_or_uzbekistan', name: 'Казахстан или Узбекистан', weight: 20 },
      { code: 'priority_city', name: 'Приоритетный город: Алматы', weight: 10 },
      { code: 'competing_product', name: 'Конкурирующий продукт', weight: 15 },
    ],
    penalties: [],
    recommended_action:
      'Проверить складские остатки по затронутым позициям и сроки текущих заказов. Если речь о подорожании — зафиксировать цену по действующим контрактам до вступления изменений.',
    department_code: 'supply',
    department_name: 'Закуп и логистика',
    department_scope: 'Цены, поставки, дефицит, склад',
    contact_role: 'менеджер по закупу у поставщика',
    product_categories: ['tile_adhesive', 'dry_mix'],
    project_id: null,
    product_category_names: 'Клеи для плитки и камня, Сухие строительные смеси',
    product_positions: 62,
  };
}

export function demoTenderAnalysis(id: number): TenderAnalysisRow {
  return {
    tender_id: id,
    opportunity: 'direct_supply',
    opportunity_name: 'Покупают товар',
    equivalent_allowed: null,
    brand_requirement: 'Knauf',
    total_score: 110,
    priority: 'critical',
    positive_factors: [
      { code: 'exact_brand_or_product_code', name: 'Точный бренд или линейка', weight: 30 },
      { code: 'exact_product_phrase', name: 'Точная товарная фраза', weight: 30 },
      { code: 'goods_lot', name: 'Лот на товар', weight: 15 },
    ],
    penalties: [{ code: 'deadline_less_than_3_days', name: 'До окончания приёма менее 3 дней', weight: -10 }],
    recommended_action:
      'Поставка товара из нашего ассортимента. Проверить требования к бренду и допуск эквивалента, собрать комплект документов, подать заявку до срока приёма.',
    department_code: 'tender_sales',
    department_name: 'Тендерный отдел',
    contact_role: 'контактное лицо организатора',
    product_categories: ['putty', 'dry_mix'],
    product_category_names: 'Шпатлёвки и штукатурки, Сухие строительные смеси',
    product_positions: 123,
  };
}

export function demoProjects(): ProjectRow[] {
  return [
    {
      id: 1,
      project_name: 'В области Абай началось строительство завода по выпуску 36 млн кирпичей в год',
      object_type: 'manufacturing',
      object_type_name: 'Производство',
      stage_code: 'P09_construction',
      stage_name: 'Строительство начато',
      stage_score: 65,
      stage_sort: 9,
      country: 'Казахстан',
      region: 'область Абай',
      city: null,
      place: 'область Абай',
      investor: null,
      customer: null,
      designer: null,
      general_contractor: null,
      total_score: 71,
      priority: 'high',
      status: 'active',
      confidence: 'low',
      verification_status: 'unverified',
      sources_count: 1,
      positive_factors: [
        { code: 'exact_location', name: 'Точная локация', weight: 8 },
        { code: 'product_fit_multiple', name: 'Подходит несколько наших направлений', weight: 20 },
      ],
      penalties: [{ code: 'no_legal_entity', name: 'Не назван ни один юридический субъект', weight: -20 }],
      evidence: [{ claim: 'Стадия: Строительство начато', source_fragment: 'начато строительство' }],
      product_categories: ['concrete_admixture', 'industrial_coating', 'floor_industrial'],
      product_category_names: 'Добавки в бетон, Промышленные покрытия, Промышленные полы',
      recommended_action:
        'Определить объект, стадию и заказчика. Занести в список объектов и назначить ответственного за вход в спецификацию.',
      department_code: 'project_sales',
      department_name: 'Проектные продажи',
      contact_role: 'руководитель снабжения генподрядчика',
      first_event_id: 1,
      last_event_id: 1,
      first_seen_at: '2026-08-28T09:00:00Z',
      updated_at: '2026-09-01T09:00:00Z',
      link: null,
    },
  ];
}

export function demoCatalogTotals(): CatalogTotalsRow {
  return {
    positions: 11674,
    trade: 11334,
    brands: 30,
    lines: 214,
    with_pack: 9561,
    with_application: 9457,
    needs_review: 340,
    discontinued: 668,
  };
}

export function demoCatalogGroups(): CatalogGroupRow[] {
  return [
    {
      code: 'paint_interior',
      name: 'Краски интерьерные',
      applies_to: 'Стены и потолки внутри помещений',
      cluster_code: 'T01_paints',
      cluster_name: 'Лакокрасочные материалы',
      is_trade: true,
      sort: 10,
      positions: 4928,
      discontinued: 312,
      needs_review: 0,
      brands: 9,
      lines: 41,
      top_brands: 'Tikkurila, Dekoral, Finncolor, ТЕКС, Perfecta',
    },
    {
      code: 'floor_industrial',
      name: 'Промышленные полы',
      applies_to: 'Наливные и полимерные полы',
      cluster_code: 'T07_floors_facades_roofing',
      cluster_name: 'Полы, фасады, кровля',
      is_trade: true,
      sort: 160,
      positions: 217,
      discontinued: 4,
      needs_review: 0,
      brands: 4,
      lines: 6,
      top_brands: 'Master Builders Solutions, Tikkurila, Sika, Ucrete',
    },
  ];
}

export function demoCatalogItems(query: string, category: string | null): CatalogItemRow[] {
  const all: CatalogItemRow[] = [
    {
      id: 1,
      sku: '700010600',
      name: 'PERFECTA А гл/мат краска интерьерная 9 л G485',
      brand_name: 'Perfecta',
      product_line: 'Perfecta',
      category_code: 'paint_interior',
      category_name: 'Краски интерьерные',
      pack_size: 9,
      pack_unit: 'л',
      color_code: null,
      color_name: null,
      tint_base: 'A',
      gloss: 'полуматовое',
      substrate: ['минеральное'],
      project_codes: ['zhilie', 'kommerc', 'social'],
      discontinued: false,
      needs_review: false,
    },
    {
      id: 2,
      sku: '58308-12',
      name: 'Lilack (Decorix) аэрозольная эмаль, глубокий черный мат., 520 мл RAL 9005',
      brand_name: 'Decorix',
      product_line: 'Lilack',
      category_code: 'aerosol',
      category_name: 'Аэрозольные эмали',
      pack_size: 520,
      pack_unit: 'мл',
      color_code: '9005',
      color_name: 'чёрный',
      tint_base: null,
      gloss: 'матовое',
      substrate: ['металл', 'дерево'],
      project_codes: ['zhilie', 'prom'],
      discontinued: false,
      needs_review: false,
    },
  ];
  const q = query.trim().toLowerCase();
  return all.filter(
    (x) =>
      (!category || x.category_code === category) && (!q || x.name.toLowerCase().includes(q)),
  );
}

export function demoScoring(): ScoringFactorRow[] {
  return [
    {
      id: 1,
      stream: 'project_lead',
      code: 'contractor_named',
      name: 'Назван подрядчик',
      weight: 12,
      kind: 'positive',
      is_active: true,
      note: 'Дороже остальных участников: он выбирает материал.',
    },
    {
      id: 2,
      stream: 'tender',
      code: 'unrelated_semantic_context',
      name: 'Совпадение в чужом смысловом контексте',
      weight: -50,
      kind: 'penalty',
      is_active: true,
      note: '«Валик дорожный» — не малярный инструмент.',
    },
  ];
}

export function demoStages(): StageRow[] {
  return [
    { code: 'P06_design', name: 'Проектирование', score: 40, sort: 6, note: 'Лучший момент для входа в спецификацию.', projects: 0 },
    { code: 'P08_contractor', name: 'Генподрядчик определён', score: 70, sort: 8, note: 'Подрядчик и есть тот, кто закупает материал.', projects: 0 },
    { code: 'P09_construction', name: 'Строительство начато', score: 65, sort: 9, note: null, projects: 1 },
  ];
}
