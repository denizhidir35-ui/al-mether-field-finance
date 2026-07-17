-- Read-only HR Foundation postflight. Safe to run after the migration.
-- Every assertion raises and stops the script when the production contract is incomplete.

do $$
declare
  missing_tables text[];
  missing_policies integer;
begin
  select array_agg(required.name order by required.name)
  into missing_tables
  from unnest(array[
    'hr_organizations','hr_departments','hr_teams','hr_employees','hr_employee_placements',
    'hr_access_grants','hr_employee_files','hr_documents','hr_document_versions',
    'hr_document_recipients','hr_document_audit_events','hr_security_audit_logs',
    'hr_asset_assignments','hr_leave_requests','hr_payroll_records','hr_notifications',
    'hr_events','hr_read_models'
  ]) required(name)
  where to_regclass('public.' || required.name) is null;

  if missing_tables is not null then
    raise exception 'Missing HR tables: %', missing_tables;
  end if;

  select count(*) into missing_policies
  from pg_class table_record
  join pg_namespace namespace_record on namespace_record.oid = table_record.relnamespace
  where namespace_record.nspname = 'public'
    and table_record.relname like 'hr\_%' escape '\'
    and table_record.relkind = 'r'
    and not table_record.relrowsecurity;
  if missing_policies > 0 then
    raise exception '% HR tables do not have RLS enabled', missing_policies;
  end if;

  if not exists (select 1 from storage.buckets where id = 'hr-private' and public = false) then
    raise exception 'hr-private bucket is absent or public';
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'hr_events_no_update' and not tgisinternal)
     or not exists (select 1 from pg_trigger where tgname = 'hr_events_no_delete' and not tgisinternal)
     or not exists (select 1 from pg_trigger where tgname = 'hr_document_audit_no_update' and not tgisinternal)
     or not exists (select 1 from pg_trigger where tgname = 'hr_document_audit_no_delete' and not tgisinternal)
     or not exists (select 1 from pg_trigger where tgname = 'hr_employee_files_no_delete' and not tgisinternal)
     or not exists (select 1 from pg_trigger where tgname = 'hr_document_versions_no_delete' and not tgisinternal)
     or not exists (select 1 from pg_trigger where tgname = 'hr_payroll_records_no_delete' and not tgisinternal) then
    raise exception 'Append-only or archive lifecycle trigger is missing';
  end if;

  if not exists (
    select 1 from pg_constraint
    where conrelid = 'public.hr_employees'::regclass
      and contype = 'u'
      and pg_get_constraintdef(oid) like '%company_id, employee_code%'
  ) then
    raise exception 'Company-scoped employee_code uniqueness is missing';
  end if;

  if (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname in ('hr private document read','hr private document upload')) <> 2 then
    raise exception 'HR storage policies are incomplete';
  end if;
end $$;

select
  true as hr_foundation_postflight_ok,
  (select public from storage.buckets where id = 'hr-private') as bucket_public,
  (select count(*) from pg_policies where schemaname = 'public' and tablename like 'hr\_%' escape '\') as hr_policy_count,
  (select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects' and policyname like 'hr private%') as storage_policy_count;
