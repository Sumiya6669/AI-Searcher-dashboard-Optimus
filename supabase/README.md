# База данных

Схема и права живут в проекте Supabase `ajmwzzahcdtkikzhxzqu` и версионируются
его историей миграций. Здесь они не дублируются сознательно: копия SQL в
репозитории рано или поздно расходится с тем, что применено, и тогда неясно,
какая из двух версий настоящая.

Забрать текущее состояние в этот каталог:

```bash
npx supabase link --project-ref ajmwzzahcdtkikzhxzqu
npx supabase db pull            # схема
npx supabase migration list     # что применено
```

## Что было добавлено под дашборд

Ничего из существующего не переписано. Таблицы `events`, `raw_items`,
`tenders`, `competitors`, `dict_entity` и остальные остались как были; роль
`n8n_app` сохранила полный доступ, сценарии n8n изменений не заметили.

| Миграция | Что делает |
|---|---|
| `dashboard_close_anon_and_protect_new_tables` | Включает RLS на `recipient_subscriptions`, `access_requests`, `research_questions`, `api_usage` с политикой под `n8n_app`. Отзывает у роли `anon` все права в схеме `public`. Закрывает анонимный вызов `backup_json()`, `restore_drill()`, `row_counts()`. Фиксирует `search_path` у `text_brief` и `route_event`. |
| `dashboard_app_users_roles_and_read_policies` | Таблица `app_users` (профиль и роль), функции `is_admin()` и `app_role()`, политики на `app_users`, триггер создания профиля при регистрации. Первый зарегистрировавшийся становится администратором. |
| `dashboard_authenticated_read_grants` | Права чтения для роли `authenticated`: наблюдательные данные — да, служебные — только администратору. Столбец `recipients.chat_id` недоступен вообще (права выданы по столбцам). Представления `v_event_card`, `v_events_enriched`, `v_tenders_active` переведены на `security_invoker`, то есть больше не обходят RLS. |
| `dashboard_event_list_and_tender_card_views` | `v_event_list` (лента с массивом сущностей для отбора), `v_tender_card` (лот со срочностью и признаками совпадения), `v_app_subscriptions` (подписки без идентификатора чата). |
| `dashboard_event_list_source_code_fallback` | Событию с сайта конкурента подставляется код существующего источника `competitor_sites`, иначе фильтр по источнику терял такие события. |
| `dashboard_rpc_kpi_competitors_brands` | `app_dashboard_kpi`, `app_competitor_activity` (здоровье обхода по числу падений подряд), `app_brand_stats` (доля потока, получатели, настроечные дыры). |
| `dashboard_sources_config_intervals` | Ожидаемая частота обновления и сценарий-владелец записаны в `sources.config`, а не зашиты в код интерфейса. |
| `dashboard_rpc_sources_and_settings` | `app_thresholds` (белый список настроек без ключей), `app_stop_word_stats`. |
| `dashboard_rpc_source_stats_v2` | `app_source_stats`: свежесть считается по собственной активности источника, отдельно различаются «не подключён», «выключен», «простаивает», «данные устарели», «ошибка». |
| `dashboard_rpc_admin` | `app_admin_health`, `app_workflow_health`, `app_failed_runs`, `app_llm_daily`, `app_delivery_state`. Каждая проверяет `is_admin()` и отказывает не администратору. |
| `dashboard_rpc_global_search` | `app_search` — поиск по событиям, конкурентам, брендам, лотам и источникам с правами вызывающего. |

## Как устроено разграничение

Приложение обращается к базе **только от имени вошедшего пользователя**.
Сервисный ключ Supabase в приложении не используется: с ним RLS перестаёт
действовать, и вся защита сводится к проверкам в коде, то есть к тому, что
можно обойти одним забытым условием.

Из этого следует три вещи:

1. Роль `anon` в схеме `public` не имеет ни одного права. Публичный ключ
   Supabase, который по назначению попадает в браузер, сам по себе не даёт
   доступа ни к одной строке.
2. Роль `authenticated` читает наблюдательные данные и не читает служебные:
   `workflow_runs`, `llm_calls`, `notifications`, `settings`, `api_usage`,
   `access_requests`, `research_questions`, `staging_dict`,
   `competitor_snapshots` закрыты политикой `public.is_admin()`.
3. Служебные показатели администратор получает не прямым чтением таблиц, а
   функциями с правами владельца, которые отдают только агрегаты и сами
   проверяют роль. Маршрут `/admin` в интерфейсе можно обойти; функцию нельзя.

Проверить разграничение можно прямо в SQL-редакторе Supabase:

```sql
begin;
set local role authenticated;                        -- вошедший без роли admin
select count(*) from public.events;                  -- вернёт события
select count(*) from public.workflow_runs;           -- вернёт 0 строк
select * from public.app_admin_health();             -- ERROR: forbidden
rollback;

begin;
set local role anon;                                 -- публичный ключ
select count(*) from public.events;                  -- ERROR: permission denied
rollback;
```

## Первый вход

Регистрация со стороны интерфейса закрыта: пользователей заводит
администратор в Supabase → Authentication → Users → Add user. Первый
созданный пользователь получает роль `admin` автоматически (иначе некому
выдать роли остальным). Дальше роли назначаются так:

```sql
update public.app_users set role = 'admin' where email = 'кто-то@optimus-kz.kz';
```
