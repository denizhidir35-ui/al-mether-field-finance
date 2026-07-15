-- AL METHER HR workflow: Chief credentials and Chief-owned Personnel QR records.

-- Remove superseded draft artifacts; the final workflow needs none of them.
drop trigger if exists profiles_assign_workforce_employee_code on profiles;
drop trigger if exists profiles_enforce_workforce_lifecycle on profiles;
drop trigger if exists operation_personnel_lifecycle on operation_personnel;
drop function if exists assign_workforce_employee_code();
drop function if exists enforce_workforce_lifecycle();
drop function if exists sync_operation_personnel_lifecycle();
drop function if exists provision_workforce_identity(uuid,text,text,text,text,text,text,text,text,uuid);
drop sequence if exists workforce_personnel_code_seq;

alter table profiles drop constraint if exists profiles_assigned_chief_fk;
alter table profiles drop column if exists region;
alter table profiles drop column if exists store_id;
alter table profiles drop column if exists assigned_chief_code;
alter table profiles drop column if exists must_change_password;
alter table profiles drop column if exists temporary_password_issued_at;
alter table profiles drop column if exists password_changed_at;
alter table profiles drop column if exists archived_at;
alter table profiles drop constraint if exists profiles_status_check;
alter table profiles add constraint profiles_status_check check (status in ('ACTIVE', 'PASSIVE'));

alter table operation_personnel drop column if exists auth_user_id;
alter table operation_personnel drop column if exists region;
alter table operation_personnel drop column if exists store_id;
alter table operation_personnel drop column if exists archived_at;

drop policy if exists "hr manage personnel" on operation_personnel;
drop policy if exists "hr leadership manage personnel" on operation_personnel;
create policy "hr leadership manage personnel" on operation_personnel for all to authenticated
using (company_id = current_company_id() and current_platform_role() in ('CEO', 'PARTNER', 'MANAGER', 'HR'))
with check (company_id = current_company_id() and current_platform_role() in ('CEO', 'PARTNER', 'MANAGER', 'HR'));

create sequence if not exists workforce_chief_code_seq start 1;

do $$
declare chief_floor bigint;
begin
  select coalesce(max(substring(employee_code from 6)::bigint), 0) into chief_floor
  from profiles where employee_code ~ '^SMTHR[0-9]{6}$';
  if chief_floor > 0 then perform setval('workforce_chief_code_seq', chief_floor, true); end if;
end $$;

create or replace function next_workforce_chief_code()
returns text
language sql
security definer
set search_path = public
as $$
  select 'SMTHR' || lpad(nextval('workforce_chief_code_seq')::text, 6, '0');
$$;

revoke all on function next_workforce_chief_code() from public, anon, authenticated;
grant execute on function next_workforce_chief_code() to service_role;

alter table operation_personnel add column if not exists assigned_chief_code text;
alter table operation_personnel drop constraint if exists operation_personnel_assigned_chief_fk;
alter table operation_personnel add constraint operation_personnel_assigned_chief_fk
  foreign key (company_id, assigned_chief_code)
  references profiles(company_id, employee_code);

create or replace function assign_operation_personnel_qr()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.qr_value is null or new.qr_value = '' or new.qr_value = 'AUTO' then
    new.qr_value := 'ALMETHER:PERSONNEL:' || new.personnel_code || ':V' || new.qr_version;
  end if;
  return new;
end;
$$;

drop trigger if exists operation_personnel_assign_qr on operation_personnel;
create trigger operation_personnel_assign_qr
before insert or update of qr_version on operation_personnel
for each row execute function assign_operation_personnel_qr();

-- Existing records inherit the Chief from their most recent WorkOrder assignment.
update operation_personnel personnel
set assigned_chief_code = (
  select work_order.assigned_chief_id
  from work_orders work_order
  where work_order.company_id = personnel.company_id
    and personnel.personnel_code = any(work_order.assigned_personnel_ids)
  order by work_order.created_at desc
  limit 1
)
where personnel.assigned_chief_code is null
  and exists (
    select 1 from work_orders work_order
    where work_order.company_id = personnel.company_id
      and personnel.personnel_code = any(work_order.assigned_personnel_ids)
  );
