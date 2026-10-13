-- 0001_cycle1.sql — plan content for "Ciclo 1". One-shot: aborts if it already exists.
-- Run after migrations/0001_schema.sql, in the Supabase SQL Editor.

begin;

do $$
declare
  v_cycle uuid;
  v_meal  uuid;
  v_opt   uuid;
  v_group uuid;
  v_wk    uuid;
begin
  if exists (select 1 from public.plan_cycles where name = 'Ciclo 1') then
    raise exception 'Seed já aplicado: o ciclo "Ciclo 1" já existe.';
  end if;

  -- -------------------------------------------------------------------------
  -- Cycle & weeks
  -- -------------------------------------------------------------------------
  insert into public.plan_cycles (name, starts_on, ends_on, kcal_target, protein_g, carbs_g, fat_g, is_active)
  values ('Ciclo 1', '2026-10-13', '2026-11-09', 1900, 134, 246, 46, true)
  returning id into v_cycle;

  insert into public.cycle_weeks
    (cycle_id, week_no, starts_on, ends_on, cardio_minutes, cardio_sessions, rpe_min, rpe_max, water_ml_target)
  values
    (v_cycle, 1, '2026-10-13', '2026-10-19',  60, 3, 6, 7, 1500),
    (v_cycle, 2, '2026-10-20', '2026-10-26',  75, 3, 7, 7, 2000),
    (v_cycle, 3, '2026-10-27', '2026-11-02',  90, 3, 7, 8, 2500),
    (v_cycle, 4, '2026-11-03', '2026-11-09', 105, 3, 7, 8, 2500);

  -- -------------------------------------------------------------------------
  -- Meals, options, items
  -- -------------------------------------------------------------------------

  -- 1 Café da manhã
  insert into public.meals (cycle_id, sort, name, time_hint)
  values (v_cycle, 1, 'Café da manhã', '09:00') returning id into v_meal;

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g)
  values (v_meal, 1, 'Opção 1', 436, 23.3, 60.4, 11.3) returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, '1 pão francês', '50 g'),
    (v_opt, 2, 'Ovos mexidos ou cozidos (frigideira antiaderente)', '2 unidades'),
    (v_opt, 3, 'Café com leite desnatado', '150 mL'),
    (v_opt, 4, 'Açúcar', 'até 5 g (1 colher de chá)'),
    (v_opt, 5, 'Banana prata', '70 g');

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g)
  values (v_meal, 2, 'Opção 2', 422, 19.0, 61.0, 11.9) returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, '1 pão francês', '50 g'),
    (v_opt, 2, 'Muçarela', '2 fatias (40 g)'),
    (v_opt, 3, 'Banana prata', '70 g'),
    (v_opt, 4, 'Café com leite desnatado', '150 mL'),
    (v_opt, 5, 'Açúcar', '5 g');

  -- 2 Almoço
  insert into public.meals (cycle_id, sort, name, time_hint)
  values (v_cycle, 2, 'Almoço', '12:30') returning id into v_meal;

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g)
  values (v_meal, 1, 'Prato do dia', 474, 41.5, 47.8, 13.5) returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, 'Arroz branco cozido', '80 g'),
    (v_opt, 2, 'Feijão cozido', '120 g'),
    (v_opt, 3, 'Tilápia grelhada ou assada', '120 g'),
    (v_opt, 4, 'Legumes cozidos', '150 g'),
    (v_opt, 5, 'Folhas, tomate e pepino', 'à vontade'),
    (v_opt, 6, 'Azeite (medido)', '10 mL (2 colheres de chá)');

  -- 3 Lanche da tarde
  insert into public.meals (cycle_id, sort, name, time_hint)
  values (v_cycle, 3, 'Lanche da tarde', '15:30') returning id into v_meal;

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g)
  values (v_meal, 1, 'Opção 1', 271, 9.8, 57.8, 1.9) returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, 'Iogurte natural desnatado', '170 g'),
    (v_opt, 2, 'Aveia em flocos', '15 g'),
    (v_opt, 3, 'Fruta (ver trocas)', '2 porções');

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g, max_per_week, note)
  values (v_meal, 2, 'Doce planejado', 240, null, null, null, 3,
          'Até 3x por semana. Separe a fatia na hora e coma sentada, no horário do lanche.')
  returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, 'Iogurte natural desnatado', '170 g'),
    (v_opt, 2, 'Bolo caseiro simples', '1 fatia (50 g)');

  -- 4 Pré-treino
  insert into public.meals (cycle_id, sort, name, time_hint, note)
  values (v_cycle, 4, 'Pré-treino', '18:00',
          'Faça 1 a 1,5 h antes do treino; se o horário do treino mudar, esta refeição acompanha.')
  returning id into v_meal;

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g)
  values (v_meal, 1, 'Opção 1', 324, 18.6, 35.1, 11.4) returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, '1 pão francês', '50 g'),
    (v_opt, 2, 'Ovo', '1 unidade'),
    (v_opt, 3, 'Muçarela', '1 fatia (20 g)'),
    (v_opt, 4, 'Café com leite desnatado, sem açúcar', '100 mL');

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g)
  values (v_meal, 2, 'Wrap', 284, 26.7, 20.6, 9.9) returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, 'Rap10', '1 unidade (40 g)'),
    (v_opt, 2, 'Frango desfiado', '60 g'),
    (v_opt, 3, 'Muçarela', '1 fatia (20 g)');

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g)
  values (v_meal, 3, 'Opção 3', 296, 12.9, 54.7, 4.0) returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, 'Iogurte natural desnatado', '170 g'),
    (v_opt, 2, 'Aveia em flocos', '40 g'),
    (v_opt, 3, 'Banana prata', '70 g');

  -- 5 Jantar
  insert into public.meals (cycle_id, sort, name, time_hint)
  values (v_cycle, 5, 'Jantar', '21:00') returning id into v_meal;

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g)
  values (v_meal, 1, 'Opção 1', 423, 41.0, 45.1, 8.1) returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, 'Arroz branco cozido', '80 g'),
    (v_opt, 2, 'Feijão cozido', '100 g'),
    (v_opt, 3, 'Peito de frango grelhado', '100 g'),
    (v_opt, 4, 'Legumes cozidos', '150 g'),
    (v_opt, 5, 'Azeite (medido)', '5 mL'),
    (v_opt, 6, 'Salada', 'à vontade');

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g, max_per_week, note)
  values (v_meal, 2, 'Macarronada', 447, 42.1, 49.1, 8.1, null, 'Substitui arroz e feijão.')
  returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, 'Macarrão cozido', '120 g'),
    (v_opt, 2, 'Patinho moído', '90 g'),
    (v_opt, 3, 'Molho de tomate', '50 g'),
    (v_opt, 4, 'Legumes cozidos', '150 g');

  insert into public.meal_options (meal_id, sort, label, kcal, protein_g, carbs_g, fat_g, max_per_week)
  values (v_meal, 3, 'Pizza de Rap10', 511, 44.6, 49.0, 14.4, 2) returning id into v_opt;
  insert into public.meal_option_items (option_id, sort, food, quantity) values
    (v_opt, 1, 'Rap10', '2 unidades'),
    (v_opt, 2, 'Molho de tomate', '40 g'),
    (v_opt, 3, 'Frango desfiado', '100 g'),
    (v_opt, 4, 'Muçarela', '1 fatia (20 g)'),
    (v_opt, 5, 'Tomate e orégano', 'à vontade'),
    (v_opt, 6, 'Legumes cozidos', '100 g');

  -- -------------------------------------------------------------------------
  -- Swap groups
  -- -------------------------------------------------------------------------
  insert into public.swap_groups (cycle_id, sort, name, base_portion)
  values (v_cycle, 1, 'Carboidrato (almoço/jantar)', 'Arroz 80 g') returning id into v_group;
  insert into public.swap_items (group_id, sort, food, portion) values
    (v_group, 1, 'Batata inglesa', '190 g'),
    (v_group, 2, 'Abóbora cabotiá', '210 g'),
    (v_group, 3, 'Mandioca', '75 g'),
    (v_group, 4, 'Cuscuz', '90 g'),
    (v_group, 5, 'Macarrão cozido', '70 g');

  insert into public.swap_groups (cycle_id, sort, name, base_portion)
  values (v_cycle, 2, 'Feijão', '120 g') returning id into v_group;
  insert into public.swap_items (group_id, sort, food, portion) values
    (v_group, 1, 'Sem feijão', 'some metade do peso ao arroz (120 g → +60 g de arroz)');

  insert into public.swap_groups (cycle_id, sort, name, base_portion)
  values (v_cycle, 3, 'Proteína (almoço/jantar)', 'Tilápia 120 g') returning id into v_group;
  insert into public.swap_items (group_id, sort, food, portion) values
    (v_group, 1, 'Frango grelhado ou desfiado', '100 g'),
    (v_group, 2, 'Patinho, coxão mole ou lagarto', '90 g'),
    (v_group, 3, 'Sardinha fresca assada', '100 g'),
    (v_group, 4, 'Atum ao natural', '120 g (máx. 2x/semana)');

  insert into public.swap_groups (cycle_id, sort, name, base_portion)
  values (v_cycle, 4, 'Pão', '1 pão francês (50 g)') returning id into v_group;
  insert into public.swap_items (group_id, sort, food, portion) values
    (v_group, 1, 'Pão de forma', '2 fatias (50 g)'),
    (v_group, 2, 'Goma de tapioca', '50 g'),
    (v_group, 3, 'Cuscuz', '120 g'),
    (v_group, 4, 'Rap10', '1 unidade (40 g)');

  insert into public.swap_groups (cycle_id, sort, name, base_portion)
  values (v_cycle, 5, 'Ovos', '2 ovos') returning id into v_group;
  insert into public.swap_items (group_id, sort, food, portion) values
    (v_group, 1, '1 ovo + 1 fatia de muçarela', '20 g de muçarela'),
    (v_group, 2, 'Frango desfiado', '50 g');

  insert into public.swap_groups (cycle_id, sort, name, base_portion)
  values (v_cycle, 6, 'Fruta (~70 kcal)', 'Banana prata 70 g') returning id into v_group;
  insert into public.swap_items (group_id, sort, food, portion) values
    (v_group, 1, 'Maçã', '130 g'),
    (v_group, 2, 'Mamão', '170 g'),
    (v_group, 3, 'Abacaxi', '150 g'),
    (v_group, 4, 'Melancia', '220 g'),
    (v_group, 5, 'Melão', '240 g'),
    (v_group, 6, 'Uva', '130 g'),
    (v_group, 7, 'Morango', '250 g'),
    (v_group, 8, 'Pera', '130 g'),
    (v_group, 9, 'Laranja', '200 g');

  insert into public.swap_groups (cycle_id, sort, name, base_portion)
  values (v_cycle, 7, 'Laticínio', 'Leite desnatado 150 mL') returning id into v_group;
  insert into public.swap_items (group_id, sort, food, portion) values
    (v_group, 1, 'Iogurte natural desnatado', '150 g');

  -- -------------------------------------------------------------------------
  -- Rules
  -- -------------------------------------------------------------------------
  insert into public.rules (cycle_id, category, sort, title, body) values
    (v_cycle, 'dieta', 1, 'Água', 'Meta da semana no app. Um copo a cada mamada. Urina clara (nível 1–3) é o alvo.'),
    (v_cycle, 'dieta', 2, 'Fim de semana', 'Sábado segue o plano. Domingo: almoço livre com um prato só, metade com salada e legumes, e uma porção de sobremesa. O resto do domingo segue o plano.'),
    (v_cycle, 'dieta', 3, 'Doce planejado', 'Até 3x por semana no lanche. Ao fazer bolo para as crianças, separe sua fatia (50 g) na hora e guarde o resto.'),
    (v_cycle, 'dieta', 4, 'Açúcar', 'Até 5 g por dia, só no café da manhã. Café do pré-treino sem açúcar ou com adoçante.'),
    (v_cycle, 'dieta', 5, 'Cafeína', 'Até 2–3 xícaras de café coado por dia. Evite depois das 18h se atrapalhar o sono.'),
    (v_cycle, 'dieta', 6, 'Peixe', 'Tilápia, sardinha e salmão são seguros. Atum em lata no máximo 2x por semana.'),
    (v_cycle, 'dieta', 7, 'Fome', 'Comece almoço e jantar pelos legumes e salada. Não pule o lanche das 15h30.'),
    (v_cycle, 'dieta', 8, 'Preparo', 'Frigideira antiaderente. Azeite sempre medido na colher.'),
    (v_cycle, 'dieta', 9, 'Suplementos', 'Nenhum prescrito. Ferro e vitamina D só com exame e orientação médica.'),
    (v_cycle, 'treino', 1, 'Ordem dos treinos', 'Sempre o próximo da fila (A → B → C → D → A). Evite A e C em dias seguidos.'),
    (v_cycle, 'treino', 2, 'Progressão de carga', 'Use uma carga que permita o início da faixa deixando 2 repetições sobrando. Quando todas as séries chegarem ao topo da faixa, suba a carga e volte ao início.'),
    (v_cycle, 'treino', 3, 'Registro', 'Anote carga e repetições de todas as séries.'),
    (v_cycle, 'treino', 4, 'Descanso', 'Siga o tempo indicado em cada exercício.'),
    (v_cycle, 'treino', 5, 'Aquecimento', '5 min de escada leve + 2 × 15 elevações pélvicas sem carga + 10 agachamentos livres.'),
    (v_cycle, 'treino', 6, 'Abdômen (diástase)', 'Sem abdominal tradicional até a avaliação da fisioterapeuta. Solte o ar no esforço e firme o abdômen antes de cada repetição pesada. Se a linha do meio da barriga estufar em forma de cone, diminua a carga.');

  -- -------------------------------------------------------------------------
  -- Exercises (shared library; keyed by slug)
  -- -------------------------------------------------------------------------
  insert into public.exercises (slug, name_pt) values
    ('hip-thrust', 'Elevação pélvica (hip thrust)'),
    ('stiff-halteres', 'Stiff com halteres'),
    ('agachamento-bulgaro', 'Agachamento búlgaro com halteres'),
    ('mesa-flexora', 'Mesa flexora'),
    ('abducao-maquina', 'Abdução de quadril na máquina'),
    ('dead-bug', 'Dead bug'),
    ('puxada-frontal', 'Puxada frontal'),
    ('remada-baixa', 'Remada baixa'),
    ('supino-halteres', 'Supino com halteres'),
    ('desenvolvimento-halteres', 'Desenvolvimento com halteres sentada'),
    ('elevacao-lateral', 'Elevação lateral'),
    ('rosca-direta', 'Rosca direta'),
    ('triceps-polia', 'Tríceps na polia'),
    ('pallof-press', 'Pallof press'),
    ('leg-press-45', 'Leg press 45°'),
    ('agachamento-goblet', 'Agachamento goblet'),
    ('passada', 'Passada (afundo)'),
    ('cadeira-extensora', 'Cadeira extensora'),
    ('gluteo-cabo', 'Glúteo no cabo (coice)'),
    ('panturrilha-em-pe', 'Panturrilha em pé'),
    ('bird-dog', 'Bird dog'),
    ('terra-sumo', 'Levantamento terra sumô'),
    ('step-up', 'Subida no banco (step-up)'),
    ('remada-unilateral', 'Remada unilateral com halter'),
    ('flexao-inclinada', 'Flexão de braço inclinada'),
    ('caminhada-lateral-miniband', 'Caminhada lateral com miniband'),
    ('prancha-lateral-joelhos', 'Prancha lateral com joelhos apoiados')
  on conflict (slug) do nothing;

  -- -------------------------------------------------------------------------
  -- Workouts & their exercises (exercise ids resolved by slug)
  -- -------------------------------------------------------------------------

  -- A
  insert into public.workouts (cycle_id, code, sort, name)
  values (v_cycle, 'A', 1, 'Inferiores — glúteo e posterior') returning id into v_wk;
  insert into public.workout_exercises
    (workout_id, exercise_id, sort, sets, reps_min, reps_max, reps_unit, per_side, rest_s, note)
  select v_wk, e.id, v.sort, v.sets, v.rmin, v.rmax, v.unit, v.per_side, v.rest, v.note
  from (values
    (1, 'hip-thrust',          4,  8, 12, 'reps', false, 120, 'Barra ou máquina'),
    (2, 'stiff-halteres',      3, 10, 12, 'reps', false,  90, null),
    (3, 'agachamento-bulgaro', 3, 10, 12, 'reps', true,   90, null),
    (4, 'mesa-flexora',        3, 10, 15, 'reps', false,  60, null),
    (5, 'abducao-maquina',     3, 15, 20, 'reps', false,  60, 'Tronco inclinado à frente'),
    (6, 'dead-bug',            3,  8,  8, 'reps', true,   45, null)
  ) as v(sort, slug, sets, rmin, rmax, unit, per_side, rest, note)
  join public.exercises e on e.slug = v.slug;

  -- B
  insert into public.workouts (cycle_id, code, sort, name)
  values (v_cycle, 'B', 2, 'Superiores e core') returning id into v_wk;
  insert into public.workout_exercises
    (workout_id, exercise_id, sort, sets, reps_min, reps_max, reps_unit, per_side, rest_s, note)
  select v_wk, e.id, v.sort, v.sets, v.rmin, v.rmax, v.unit, v.per_side, v.rest, v.note
  from (values
    (1, 'puxada-frontal',           3, 10, 12, 'reps', false, 90, null),
    (2, 'remada-baixa',             3, 10, 12, 'reps', false, 90, 'Cabo ou máquina'),
    (3, 'supino-halteres',          3, 10, 12, 'reps', false, 60, 'Halteres ou máquina'),
    (4, 'desenvolvimento-halteres', 3, 10, 12, 'reps', false, 60, null),
    (5, 'elevacao-lateral',         3, 12, 15, 'reps', false, 60, null),
    (6, 'rosca-direta',             3, 12, 12, 'reps', false,  0, 'Bi-set: faça em seguida o tríceps, sem descanso'),
    (7, 'triceps-polia',            3, 12, 12, 'reps', false, 60, 'Bi-set com a rosca direta'),
    (8, 'pallof-press',             3, 10, 10, 'reps', true,  45, 'Cabo ou elástico')
  ) as v(sort, slug, sets, rmin, rmax, unit, per_side, rest, note)
  join public.exercises e on e.slug = v.slug;

  -- C
  insert into public.workouts (cycle_id, code, sort, name)
  values (v_cycle, 'C', 3, 'Inferiores — quadríceps e glúteo') returning id into v_wk;
  insert into public.workout_exercises
    (workout_id, exercise_id, sort, sets, reps_min, reps_max, reps_unit, per_side, rest_s, note)
  select v_wk, e.id, v.sort, v.sets, v.rmin, v.rmax, v.unit, v.per_side, v.rest, v.note
  from (values
    (1, 'leg-press-45',       4, 10, 12, 'reps', false, 120, null),
    (2, 'agachamento-goblet', 3, 10, 12, 'reps', false,  90, null),
    (3, 'passada',            3, 10, 12, 'reps', true,   90, null),
    (4, 'cadeira-extensora',  3, 12, 15, 'reps', false,  60, null),
    (5, 'gluteo-cabo',        3, 12, 15, 'reps', true,   60, null),
    (6, 'panturrilha-em-pe',  3, 12, 15, 'reps', false,  60, null),
    (7, 'bird-dog',           3,  8,  8, 'reps', true,   45, null)
  ) as v(sort, slug, sets, rmin, rmax, unit, per_side, rest, note)
  join public.exercises e on e.slug = v.slug;

  -- D
  insert into public.workouts (cycle_id, code, sort, name)
  values (v_cycle, 'D', 4, 'Glúteo e corpo inteiro') returning id into v_wk;
  insert into public.workout_exercises
    (workout_id, exercise_id, sort, sets, reps_min, reps_max, reps_unit, per_side, rest_s, note)
  select v_wk, e.id, v.sort, v.sets, v.rmin, v.rmax, v.unit, v.per_side, v.rest, v.note
  from (values
    (1, 'hip-thrust',                 3, 10, 12, 'reps',   false, 120, 'Pausa de 2 s no topo'),
    (2, 'terra-sumo',                 3, 10, 10, 'reps',   false,  90, 'Halter ou kettlebell'),
    (3, 'step-up',                    3, 10, 10, 'reps',   true,   60, null),
    (4, 'remada-unilateral',          3, 10, 12, 'reps',   true,   60, null),
    (5, 'flexao-inclinada',           3,  8, 12, 'reps',   false,  60, 'Mãos no banco'),
    (6, 'caminhada-lateral-miniband', 3, 15, 15, 'passos', true,   45, null),
    (7, 'prancha-lateral-joelhos',    3, 20, 30, 's',      true,   45, null)
  ) as v(sort, slug, sets, rmin, rmax, unit, per_side, rest, note)
  join public.exercises e on e.slug = v.slug;

  -- Guard: every slug above must have resolved (28 workout exercises in total).
  if (select count(*) from public.workout_exercises we
      join public.workouts w on w.id = we.workout_id
      where w.cycle_id = v_cycle) <> 28 then
    raise exception 'Seed inconsistente: esperados 28 exercícios nos treinos do Ciclo 1.';
  end if;
end
$$;

commit;
