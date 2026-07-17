-- READ ONLY. Run before requesting production migration approval.
begin;
set transaction read only;
set local statement_timeout = '30s';

do $$
declare
  missing_base text[];
  duplicate_count bigint;
begin
  select array_agg(required.name order by required.name)
  into missing_base
  from unnest(array['companies','profiles','operation_personnel','work_orders']) required(name)
  where to_regclass('public.' || required.name) is null;
  if missing_base is not null then
    raise exception 'Missing base tables: %', missing_base;
  end if;

  select count(*) into duplicate_count from (
    select company_id, employee_code from profiles
    where employee_code is not null group by company_id, employee_code having count(*) > 1
  ) duplicate_profiles;
  if duplicate_count > 0 then raise exception 'Duplicate profile employee_code groups: %', duplicate_count; end if;

  select count(*) into duplicate_count from (
    select company_id, personnel_code from operation_personnel
    group by company_id, personnel_code having count(*) > 1
  ) duplicate_personnel;
  if duplicate_count > 0 then raise exception 'Duplicate operation personnel codes: %', duplicate_count; end if;

  if to_regnamespace('storage') is null or to_regclass('storage.buckets') is null or to_regclass('storage.objects') is null then
    raise exception 'Supabase Storage schema is incomplete';
  end if;
  if to_regclass('public.operation_personnel_code_seq') is null then
    raise exception 'operation_personnel_code_seq is missing';
  end if;
end $$;

select
  current_setting('server_version') as server_version,
  (select count(*) from companies) as company_count,
  (select count(*) from profiles) as profile_count,
  (select count(*) from operation_personnel) as operation_personnel_count,
  (select count(*) from work_orders) as work_order_count,
  (select count(*) from operation_personnel personnel where personnel.assigned_chief_code is not null and not exists (
    select 1 from profiles chief where chief.company_id = personnel.company_id
      and chief.employee_code = personnel.assigned_chief_code and chief.role = 'CHIEF'
      and chief.is_active and chief.status = 'ACTIVE'
  )) as orphan_chief_assignment_count,
  (select count(*) from work_orders work_order where not exists (
    select 1 from profiles chief where chief.company_id = work_order.company_id
      and chief.employee_code = work_order.assigned_chief_id and chief.role = 'CHIEF'
      and chief.is_active and chief.status = 'ACTIVE'
  )) as orphan_work_order_chief_count,
  (select count(*) from pg_class table_record join pg_namespace namespace_record on namespace_record.oid = table_record.relnamespace
    where namespace_record.nspname = 'public' and table_record.relname like 'hr\_%' escape '\' and table_record.relkind = 'r') as existing_hr_table_count,
  exists(select 1 from storage.buckets where id = 'hr-private') as hr_private_bucket_exists;

rollback;
