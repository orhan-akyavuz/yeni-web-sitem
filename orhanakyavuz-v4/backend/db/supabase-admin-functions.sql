-- Incremental admin migration.
-- Run this file after the base Supabase schema and RPC migration.
-- It does not create tables or policies.

create or replace function public.assert_admin()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null or not exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  ) then
    raise exception using errcode = '42501', message = 'Admin role required';
  end if;
end;
$$;

create or replace function public.admin_list_weekly_problems()
returns setof public.weekly_problems
language plpgsql security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  return query select * from public.weekly_problems order by published_at desc;
end;
$$;

create or replace function public.admin_create_weekly_problem(
  p_slug text, p_title text, p_problem_content text, p_solution_content text,
  p_topic text, p_grade_level text, p_difficulty text, p_answer_key text,
  p_published_at timestamptz, p_ends_at timestamptz, p_status text
)
returns bigint
language plpgsql security definer set search_path = public
as $$
declare new_id bigint;
begin
  perform public.assert_admin();
  insert into public.weekly_problems (slug, title, problem_content, solution_content, topic, grade_level, difficulty, answer_key, published_at, ends_at, status, created_by)
  values (p_slug, p_title, p_problem_content, nullif(p_solution_content, ''), p_topic, p_grade_level, p_difficulty, p_answer_key, p_published_at, p_ends_at, p_status, auth.uid())
  returning id into new_id;
  return new_id;
end;
$$;

drop function if exists public.admin_update_weekly_problem(
  bigint, text, text, text, text, text, text, text,
  timestamp without time zone, timestamp without time zone, text
);

drop function if exists public.admin_update_weekly_problem(
  bigint, text, text, text, text, text, text, text,
  timestamp with time zone, timestamp with time zone, text
);

create function public.admin_update_weekly_problem(
  p_id bigint, p_slug text, p_title text, p_problem_content text, p_solution_content text,
  p_topic text, p_grade_level text, p_difficulty text, p_answer_key text,
  p_published_at timestamptz, p_ends_at timestamptz, p_status text
)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  update public.weekly_problems set slug = p_slug, title = p_title, problem_content = p_problem_content,
    solution_content = nullif(p_solution_content, ''), topic = p_topic, grade_level = p_grade_level,
    difficulty = p_difficulty, answer_key = p_answer_key, published_at = p_published_at,
    ends_at = p_ends_at, status = p_status, updated_at = now() where id = p_id;
  return found;
end;
$$;

create or replace function public.admin_delete_weekly_problem(p_id bigint)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  delete from public.weekly_problems where id = p_id;
  return found;
end;
$$;

drop function if exists public.admin_list_submissions(bigint);

create function public.admin_list_submissions(p_problem_id bigint)
returns table (
  id bigint,
  problem_id bigint,
  answer_text text,
  solution_text text,
  is_correct boolean,
  has_explanation boolean,
  score integer,
  submitted_at timestamptz,
  display_name text,
  email text
)
language plpgsql security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  return query
    select
      s.id,
      s.problem_id,
      s.answer_text,
      s.solution_text,
      s.is_correct,
      s.has_explanation,
      s.score,
      s.submitted_at,
      coalesce(p.display_name, 'Matematikci') as display_name,
      u.email
    from public.submissions s
    join public.profiles p on p.id = s.user_id
    join auth.users u on u.id = s.user_id
    where s.problem_id = p_problem_id
    order by s.submitted_at desc;
end;
$$;

create or replace function public.admin_review_submission(
  p_problem_id bigint, p_submission_id bigint, p_is_correct boolean, p_has_explanation boolean
)
returns integer
language plpgsql security definer set search_path = public
as $$
declare
  awarded integer := case when p_is_correct then case when p_has_explanation then 15 else 10 end else 0 end;
  submission_user uuid;
begin
  perform public.assert_admin();
  update public.submissions
  set is_correct = p_is_correct, score = awarded
  where id = p_submission_id and problem_id = p_problem_id
  returning user_id into submission_user;
  if not found then raise exception using errcode = '22023', message = 'Submission not found'; end if;
  delete from public.score_events where submission_id = p_submission_id;
  if awarded > 0 then
    insert into public.score_events (user_id, submission_id, event_type, points)
    values (submission_user, p_submission_id, 'admin_review', awarded);
  end if;
  return awarded;
end;
$$;

create or replace function public.admin_highlight_submission(p_problem_id bigint, p_submission_id bigint)
returns boolean
language plpgsql security definer set search_path = public
as $$
begin
  perform public.assert_admin();
  if not exists (select 1 from public.submissions where id = p_submission_id and problem_id = p_problem_id) then
    raise exception using errcode = '22023', message = 'Submission not found';
  end if;
  delete from public.problem_highlights where problem_id = p_problem_id;
  insert into public.problem_highlights (problem_id, submission_id, approved_by)
  values (p_problem_id, p_submission_id, auth.uid());
  return true;
end;
$$;

revoke all on function public.assert_admin() from public;
revoke all on function public.admin_list_weekly_problems() from public;
revoke all on function public.admin_create_weekly_problem(text, text, text, text, text, text, text, text, timestamptz, timestamptz, text) from public;
revoke all on function public.admin_update_weekly_problem(
  bigint, text, text, text, text, text, text, text, text,
  timestamp with time zone, timestamp with time zone, text
) from public;
revoke all on function public.admin_delete_weekly_problem(bigint) from public;
revoke all on function public.admin_list_submissions(bigint) from public;
revoke all on function public.admin_review_submission(bigint, bigint, boolean, boolean) from public;
revoke all on function public.admin_highlight_submission(bigint, bigint) from public;

grant execute on function public.assert_admin() to authenticated;
grant execute on function public.admin_list_weekly_problems() to authenticated;
grant execute on function public.admin_create_weekly_problem(text, text, text, text, text, text, text, text, timestamptz, timestamptz, text) to authenticated;
grant execute on function public.admin_update_weekly_problem(
  bigint, text, text, text, text, text, text, text, text,
  timestamp with time zone, timestamp with time zone, text
) to authenticated;
grant execute on function public.admin_delete_weekly_problem(bigint) to authenticated;
grant execute on function public.admin_list_submissions(bigint) to authenticated;
grant execute on function public.admin_review_submission(bigint, bigint, boolean, boolean) to authenticated;
grant execute on function public.admin_highlight_submission(bigint, bigint) to authenticated;
