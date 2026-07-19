begin;

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
  v_new_leave_id uuid;
  v_existing_leave_id uuid;
  v_id uuid;
  v_previous text;
  v_next text;
  v_event text;
  v_is_hr boolean := public.can_manage_hr();
  v_is_manager boolean := false;
begin
  if v_company_id is null or v_actor is null then raise exception 'LEAVE_AUTH_REQUIRED'; end if;
  if nullif(btrim(p_idempotency_key), '') is null then raise exception 'LEAVE_IDEMPOTENCY_REQUIRED'; end if;
  select aggregate_id::uuid into v_existing_leave_id from public.hr_events where company_id = v_company_id and aggregate_type = 'LEAVE_REQUEST' and deduplication_key = p_idempotency_key;
  if found then return v_existing_leave_id; end if;

  if p_action = 'CREATE' then
    v_new_leave_id := coalesce(p_leave_request_id, gen_random_uuid());
    v_id := v_new_leave_id;
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
    v_id := p_leave_request_id;
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

commit;
