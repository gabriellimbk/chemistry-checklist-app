alter table public.chemistry_checklist_app_card_mastery
  add column if not exists highlight_state text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chemistry_checklist_app_card_mastery_highlight_state_check'
  ) then
    alter table public.chemistry_checklist_app_card_mastery
      add constraint chemistry_checklist_app_card_mastery_highlight_state_check
      check (highlight_state is null or highlight_state in ('yellow', 'green'));
  end if;
end $$;
