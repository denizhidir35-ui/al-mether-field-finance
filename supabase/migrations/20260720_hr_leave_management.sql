begin;
set local lock_timeout = '5s';
set local statement_timeout = '60s';

create extension if not exists btree_gist;
alter type public.hr_event_type add value if not exists 'LEAVE_CANCELLED';

-- The same checks also live in the read-only preflight so production can inspect counts first.
do $$
begin
  if exists (select 1 from public.hr_leave_requests where ends_on < starts_on) then raise exception 'LEAVE_PREFLIGHT_INVALID_DATE_RANGE'; end if;
  if exists (
    select 1 from public.hr_leave_requests leave_record left join public.hr_employees employee
      on employee.company_id = leave_record.company_id and employee.employee_code = leave_record.employee_code
    where employee.id is null
  ) then raise exception 'LEAVE_PREFLIGHT_BROKEN_EMPLOYEE_REFERENCE'; end if;
  if exists (
    select 1 from public.hr_leave_requests a join public.hr_leave_requests b
      on a.company_id = b.company_id and a.employee_code = b.employee_code and a.id < b.id
     and a.status in ('PENDING','APPROVED') and b.status in ('PENDING','APPROVED')
     and daterange(a.starts_on, a.ends_on, '[]') && daterange(b.starts_on, b.ends_on, '[]')
  ) then raise exception 'LEAVE_PREFLIGHT_ACTIVE_DATE_OVERLAP'; end if;
  if exists (
    select 1 from public.hr_access_grants grant_record where grant_record.status = 'ACTIVE' and (
      (grant_record.scope_type = 'ORGANIZATION' and not exists (select 1 from public.hr_organizations item where item.id = grant_record.organization_id and item.company_id = grant_record.company_id))
      or (grant_record.scope_type = 'DEPARTMENT' and not exists (select 1 from public.hr_departments item where item.id = grant_record.department_id and item.company_id = grant_record.company_id))
    )
  ) then raise exception 'LEAVE_PREFLIGHT_INVALID_MANAGER_SCOPE_GRANT'; end if;
end $$;

alter table public.hr_leave_requests add column if not exists day_part text not null default 'FULL_DAY';
alter table public.hr_leave_requests add column if not exists description text;
alter table public.hr_leave_requests add column if not exists source text not null default 'SYSTEM';
alter table public.hr_leave_requests add column if not exists intervention_reason text;
alter table public.hr_leave_requests add column if not exists requested_by uuid references auth.users(id);
alter table public.hr_leave_requests add column if not exists decision_reason text;
alter table public.hr_leave_requests add column if not exists decided_by uuid references auth.users(id);
alter table public.hr_leave_requests add column if not exists decided_at timestamptz;
alter table public.hr_leave_requests add column if not exists cancelled_by uuid references auth.users(id);
alter table public.hr_leave_requests add column if not exists cancelled_at timestamptz;
alter table public.hr_leave_requests add column if not exists idempotency_key text;
alter table public.hr_leave_requests add column if not exists updated_at timestamptz not null default now();
update public.hr_leave_requests set source = 'SYSTEM' where source is null;

alter table public.hr_leave_requests drop constraint if exists hr_leave_requests_date_range_check;
alter table public.hr_leave_requests add constraint hr_leave_requests_date_range_check check (ends_on >= starts_on);
alter table public.hr_leave_requests drop constraint if exists hr_leave_requests_day_part_check;
alter table public.hr_leave_requests add constraint hr_leave_requests_day_part_check check (day_part in ('FULL_DAY','HALF_DAY') and (day_part = 'FULL_DAY' or starts_on = ends_on));
alter table public.hr_leave_requests drop constraint if exists hr_leave_requests_source_check;
alter table public.hr_leave_requests add constraint hr_leave_requests_source_check check (source in ('EMPLOYEE_REQUEST','MANAGER_ENTRY','HR_MANUAL','SYSTEM'));
alter table public.hr_leave_requests drop constraint if exists hr_leave_requests_manual_reason_check;
alter table public.hr_leave_requests add constraint hr_leave_requests_manual_reason_check check (source <> 'HR_MANUAL' or nullif(btrim(intervention_reason), '') is not null);
create unique index if not exists hr_leave_idempotency_idx on public.hr_leave_requests(company_id, idempotency_key) where idempotency_key is not null;
alter table public.hr_leave_requests drop constraint if exists hr_leave_no_active_overlap;
alter table public.hr_leave_requests add constraint hr_leave_no_active_overlap exclude using gist (
  company_id with =, employee_code with =, daterange(starts_on, ends_on, '[]') with &&
) where (status in ('PENDING','APPROVED'));

create or replace function public.can_access_hr_leave_employee(target_employee_code text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.hr_employees employee
    where employee.company_id = public.current_company_id() and employee.employee_code = target_employee_code
      and (
        public.can_manage_hr()
        or employee.employee_code = public.current_employee_code()
        or exists (
          select 1 from public.hr_access_grants grant_record
          where grant_record.company_id = employee.company_id and grant_record.profile_id = auth.uid() and grant_record.status = 'ACTIVE'
            and ((grant_record.access_role = 'ORGANIZATION_MANAGER' and grant_record.scope_type = 'ORGANIZATION' and grant_record.organization_id = employee.organization_id)
              or (grant_record.access_role = 'DEPARTMENT_MANAGER' and grant_record.scope_type = 'DEPARTMENT' and grant_record.department_id = employee.department_id))
        )
        or exists (select 1 from public.hr_teams team where team.company_id = employee.company_id and team.id = employee.team_id and team.manager_employee_code = public.current_employee_code())
      )
  );
$$;
revoke all on function public.can_access_hr_leave_employee(text) from public;
grant execute on function public.can_access_hr_leave_employee(text) to authenticated;

create or replace function public.execute_hr_leave_command(
  p_action text, p_leave_request_id uuid, p_employee_code text, p_leave_type text,
  p_starts_on date, p_ends_on date, p_day_part text, p_description text,
  p_source text, p_reason text, p_idempotency_key text
) returns uuid language plpgsql security definer set search_path = public as $$
declare
  v_company_id text := public.current_company_id();
  v_actor uuid := auth.uid();
  v_actor_employee text := public.current_employee_code();
  v_request public.hr_leave_requests%rowtype;
  v_employee public.hr_employees%rowtype;
  v_id uuid := coalesce(p_leave_request_id, gen_random_uuid());
  v_previous text;
  v_next text;
  v_event text;
  v_is_hr boolean := public.can_manage_hr();
  v_is_manager boolean := false;
begin
  if v_company_id is null or v_actor is null then raise exception 'LEAVE_AUTH_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key), '') is null then raise exception 'LEAVE_IDEMPOTENCY_REQUIRED'; end if;
  select aggregate_id::uuid into v_id from public.hr_events where company_id = v_company_id and aggregate_type = 'LEAVE_REQUEST' and deduplication_key = p_idempotency_key;
  if found then return v_id; end if;

  if p_action = 'CREATE' then
    if p_employee_code is null or p_leave_type is null or p_starts_on is null or p_ends_on is null then raise exception 'LEAVE_FIELDS_REQUIRED'; end if;
    select * into v_employee from public.hr_employees where company_id = v_company_id and employee_code = p_employee_code for share;
    if not found then raise exception 'LEAVE_EMPLOYEE_NOT_FOUND'; end if;
    if v_employee.status <> 'ACTIVE' then raise exception 'LEAVE_EMPLOYEE_INACTIVE'; end if;
    if p_ends_on < p_starts_on then raise exception 'LEAVE_INVALID_DATE_RANGE'; end if;
    if p_day_part not in ('FULL_DAY','HALF_DAY') or (p_day_part = 'HALF_DAY' and p_starts_on <> p_ends_on) then raise exception 'LEAVE_INVALID_DAY_PART'; end if;
    v_is_manager := public.can_access_hr_leave_employee(p_employee_code) and p_employee_code <> coalesce(v_actor_employee, '');
    if p_source = 'EMPLOYEE_REQUEST' and p_employee_code <> coalesce(v_actor_employee, '') then raise exception 'LEAVE_SELF_SCOPE_REQUIRED'; end if;
    if p_source = 'HR_MANUAL' and (not v_is_hr or nullif(btrim(p_reason), '') is null) then raise exception 'LEAVE_MANUAL_REASON_REQUIRED'; end if;
    if p_source = 'MANAGER_ENTRY' and not v_is_manager then raise exception 'LEAVE_MANAGER_SCOPE_REQUIRED'; end if;
    if p_source not in ('EMPLOYEE_REQUEST','MANAGER_ENTRY','HR_MANUAL') then raise exception 'LEAVE_SOURCE_INVALID'; end if;
    if exists (select 1 from public.hr_leave_requests item where item.company_id = v_company_id and item.employee_code = p_employee_code and item.status in ('PENDING','APPROVED') and daterange(item.starts_on,item.ends_on,'[]') && daterange(p_starts_on,p_ends_on,'[]')) then raise exception 'LEAVE_DATE_OVERLAP'; end if;
    v_next := 'PENDING'; v_event := 'LEAVE_REQUEST_CREATED';
    execute 'insert into public.hr_events(company_id,aggregate_type,aggregate_id,event_type,payload,actor_user_id,deduplication_key) values ($1,''LEAVE_REQUEST'',$2,$3::public.hr_event_type,$4,$5,$6)'
      using v_company_id, v_id::text, v_event, jsonb_build_object('employeeCode',p_employee_code,'source',p_source,'previousStatus',null,'newStatus',v_next,'reason',p_reason), v_actor, p_idempotency_key;
    insert into public.hr_leave_requests(id,company_id,employee_code,leave_type,starts_on,ends_on,day_part,description,source,intervention_reason,requested_by,status,idempotency_key)
      values(v_id,v_company_id,p_employee_code,btrim(p_leave_type),p_starts_on,p_ends_on,p_day_part,nullif(btrim(p_description),''),p_source,nullif(btrim(p_reason),''),v_actor,v_next,p_idempotency_key);
  else
    select * into v_request from public.hr_leave_requests where id = p_leave_request_id and company_id = v_company_id for update;
    if not found then raise exception 'LEAVE_REQUEST_NOT_FOUND'; end if;
    if not public.can_access_hr_leave_employee(v_request.employee_code) then raise exception 'LEAVE_SCOPE_DENIED'; end if;
    v_is_manager := v_request.employee_code <> coalesce(v_actor_employee,'');
    v_previous := v_request.status;
    if p_action = 'APPROVE' then v_next := 'APPROVED'; v_event := 'LEAVE_APPROVED';
    elsif p_action = 'REJECT' then v_next := 'REJECTED'; v_event := 'LEAVE_REJECTED';
    elsif p_action = 'CANCEL' then v_next := 'CANCELLED'; v_event := 'LEAVE_CANCELLED';
    else raise exception 'LEAVE_ACTION_INVALID'; end if;
    if v_previous <> 'PENDING' and not (v_previous = 'APPROVED' and p_action = 'CANCEL') then raise exception 'LEAVE_TRANSITION_INVALID'; end if;
    if p_action in ('APPROVE','REJECT') and not (v_is_hr or v_is_manager) then raise exception 'LEAVE_DECISION_DENIED'; end if;
    if p_action = 'REJECT' and nullif(btrim(p_reason),'') is null then raise exception 'LEAVE_REJECT_REASON_REQUIRED'; end if;
    if p_action = 'CANCEL' then
      if v_request.employee_code = v_actor_employee then
        if v_previous = 'APPROVED' then raise exception 'LEAVE_EMPLOYEE_APPROVED_CANCEL_RULE_UNAVAILABLE'; end if;
        if v_request.starts_on <= timezone('UTC', now())::date then raise exception 'LEAVE_STARTED_CANNOT_CANCEL'; end if;
      elsif nullif(btrim(p_reason),'') is null then raise exception 'LEAVE_CANCEL_REASON_REQUIRED'; end if;
    end if;
    execute 'insert into public.hr_events(company_id,aggregate_type,aggregate_id,event_type,payload,actor_user_id,deduplication_key) values ($1,''LEAVE_REQUEST'',$2,$3::public.hr_event_type,$4,$5,$6)'
      using v_company_id, v_request.id::text, v_event, jsonb_build_object('employeeCode',v_request.employee_code,'source',v_request.source,'previousStatus',v_previous,'newStatus',v_next,'reason',p_reason), v_actor, p_idempotency_key;
    update public.hr_leave_requests set status=v_next, decision_reason=case when p_action in ('APPROVE','REJECT') then nullif(btrim(p_reason),'') else decision_reason end,
      decided_by=case when p_action in ('APPROVE','REJECT') then v_actor else decided_by end, decided_at=case when p_action in ('APPROVE','REJECT') then now() else decided_at end,
      cancelled_by=case when p_action='CANCEL' then v_actor else cancelled_by end, cancelled_at=case when p_action='CANCEL' then now() else cancelled_at end, updated_at=now()
      where id=v_request.id;
    v_id := v_request.id;
  end if;
  insert into public.hr_security_audit_logs(company_id,actor_user_id,action,resource_type,resource_id,result,request_metadata)
    values(v_company_id,v_actor,'LEAVE_'||p_action,'LEAVE_REQUEST',v_id::text,'ALLOWED',jsonb_build_object('employee_code',coalesce(p_employee_code,v_request.employee_code),'leave_request_id',v_id,'source',coalesce(p_source,v_request.source),'previous_status',v_previous,'new_status',v_next,'reason',p_reason,'idempotency_key',p_idempotency_key));
  return v_id;
exception when exclusion_violation then raise exception 'LEAVE_DATE_OVERLAP';
end $$;
revoke all on function public.execute_hr_leave_command(text,uuid,text,text,date,date,text,text,text,text,text) from public;
grant execute on function public.execute_hr_leave_command(text,uuid,text,text,date,date,text,text,text,text,text) to authenticated;

create or replace function public.reject_hr_leave_delete() returns trigger language plpgsql as $$ begin raise exception 'HR leave projections are never physically deleted'; end $$;
drop trigger if exists hr_leave_requests_no_delete on public.hr_leave_requests;
create trigger hr_leave_requests_no_delete before delete on public.hr_leave_requests for each row execute function public.reject_hr_leave_delete();

drop policy if exists "hr scoped records" on public.hr_leave_requests;
create policy "hr scoped records" on public.hr_leave_requests for select to authenticated using (company_id = public.current_company_id() and public.can_access_hr_leave_employee(employee_code));
drop policy if exists "hr insert records" on public.hr_leave_requests;
drop policy if exists "hr update records" on public.hr_leave_requests;
drop policy if exists "hr leave direct insert denied" on public.hr_leave_requests;
create policy "hr leave direct insert denied" on public.hr_leave_requests for insert to authenticated with check (false);
drop policy if exists "hr leave direct update denied" on public.hr_leave_requests;
create policy "hr leave direct update denied" on public.hr_leave_requests for update to authenticated using (false) with check (false);

drop policy if exists "hr scoped leave events" on public.hr_events;
create policy "hr scoped leave events" on public.hr_events for select to authenticated using (
  company_id = public.current_company_id() and aggregate_type = 'LEAVE_REQUEST'
  and exists (select 1 from public.hr_leave_requests item where item.id::text = aggregate_id and item.company_id = hr_events.company_id and public.can_access_hr_leave_employee(item.employee_code))
);

set constraints all immediate;
commit;
