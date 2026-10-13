-- 0002_exercise_media.sql — illustrations, pt-BR instructions and cautions for the 27 exercises.
-- Run after seed/0001_cycle1.sql, in the Supabase SQL Editor. Safe to re-run (idempotent updates).
-- Images: public/exercises/<slug>/0.jpg and 1.jpg, from free-exercise-db (Unlicense).
-- Also replaces "terra-sumo" with "agachamento-sumo" (same row, so all FKs keep working).

begin;

do $$
declare
  n int;
  v_expected int;
begin
  -- -------------------------------------------------------------------------
  -- Replacement: sumo deadlift -> sumo squat with dumbbell (renamed in place).
  -- Idempotent: skipped when the rename was already applied.
  -- -------------------------------------------------------------------------
  update public.exercises
     set slug = 'agachamento-sumo', name_pt = 'Agachamento sumô com halter'
   where slug = 'terra-sumo';
  get diagnostics n = row_count;
  if n = 0 and not exists (select 1 from public.exercises where slug = 'agachamento-sumo') then
    raise exception 'Exercício terra-sumo (ou agachamento-sumo) não encontrado.';
  end if;

  -- -------------------------------------------------------------------------
  -- Media + texts, keyed by slug only.
  -- -------------------------------------------------------------------------
  create temporary table tmp_media (
    slug         text primary key,
    has_image    boolean not null,
    source_id    text,
    instructions text[] not null,
    caution      text
  ) on commit drop;

  insert into tmp_media (slug, has_image, source_id, instructions, caution) values
    ('hip-thrust', true, 'Barbell_Hip_Thrust',
      array[
        'Sente no chão de costas para um banco e apoie as costas na beirada dele.',
        'Apoie a barra sobre o quadril, com uma almofada, ou ajuste a máquina na altura do quadril.',
        'Com os pés no chão e os joelhos dobrados, empurre o chão e suba o quadril.',
        'Aperte o bumbum no alto, sem arquear a lombar.',
        'Desça devagar até o quadril quase tocar o chão.'],
      'Solte o ar ao fazer força e firme a barriga antes de cada repetição. Se a linha do meio da barriga estufar, diminua a carga.'),

    ('stiff-halteres', true, 'Stiff-Legged_Dumbbell_Deadlift',
      array[
        'Fique em pé com um halter em cada mão, ao lado das coxas.',
        'Deixe os pés na largura do quadril e os joelhos levemente dobrados.',
        'Leve o quadril para trás e desça os halteres perto das pernas, com as costas retas.',
        'Pare quando sentir a parte de trás da coxa esticar.',
        'Suba empurrando o quadril para a frente e solte o ar.'],
      'Solte o ar ao fazer força e firme a barriga antes de cada repetição. Se a linha do meio da barriga estufar, diminua a carga.'),

    ('agachamento-bulgaro', true, 'Split_Squat_with_Dumbbells',
      array[
        'Fique de costas para um banco e apoie o peito de um pé nele.',
        'Dê um passo à frente com a outra perna e segure um halter em cada mão.',
        'Dobre os joelhos e desça o quadril, com o joelho da frente alinhado ao pé.',
        'Empurre o calcanhar da frente no chão para voltar à posição inicial.',
        'Complete as repetições e troque de perna.'],
      'Solte o ar ao fazer força e firme a barriga antes de cada repetição. Se a linha do meio da barriga estufar, diminua a carga.'),

    ('mesa-flexora', true, 'Lying_Leg_Curls',
      array[
        'Deite de barriga para baixo na máquina, com o rolo logo acima dos calcanhares.',
        'Segure nas alças e mantenha o corpo apoiado no banco.',
        'Dobre os joelhos e leve o rolo em direção ao bumbum, soltando o ar.',
        'Volte devagar até esticar as pernas, sem soltar o peso de uma vez.'],
      null),

    ('abducao-maquina', true, 'Thigh_Abductor',
      array[
        'Sente na máquina com as costas bem apoiadas e segure nas alças.',
        'Apoie as pernas nas almofadas, por fora dos joelhos.',
        'Abra as pernas para os lados, soltando o ar.',
        'Mantenha o tronco parado durante o movimento.',
        'Volte devagar, sem deixar o peso bater.'],
      null),

    ('dead-bug', true, 'Dead_Bug',
      array[
        'Deite de costas com os braços esticados para cima, apontando para o teto.',
        'Levante as pernas com os joelhos dobrados em ângulo reto, sobre o quadril.',
        'Solte o ar e encoste a lombar no chão, firmando a barriga.',
        'Estique uma perna devagar, quase até o chão, sem desencostar a lombar.',
        'Volte e troque de perna, alternando os lados.'],
      'Mantenha a lombar encostada no chão. Se a barriga estufar, mexa só as pernas.'),

    ('puxada-frontal', true, 'Wide-Grip_Lat_Pulldown',
      array[
        'Sente na máquina e ajuste o apoio das coxas para o corpo não levantar.',
        'Segure a barra com as mãos mais afastadas que a largura dos ombros.',
        'Incline o tronco um pouco para trás e estufe o peito.',
        'Puxe a barra até a parte de cima do peito, levando os cotovelos para baixo.',
        'Volte devagar até esticar os braços.'],
      null),

    ('remada-baixa', true, 'Seated_Cable_Rows',
      array[
        'Sente no aparelho com os pés apoiados e os joelhos levemente dobrados.',
        'Segure o puxador com os braços esticados e as costas retas.',
        'Puxe o puxador até a barriga, levando os cotovelos para trás.',
        'Segure um segundo e volte devagar, sem curvar as costas.'],
      null),

    ('supino-halteres', true, 'Dumbbell_Bench_Press',
      array[
        'Deite no banco com um halter em cada mão, na altura do peito.',
        'Deixe as palmas das mãos para a frente e os antebraços retos, apontando para cima.',
        'Empurre os halteres para cima, soltando o ar, até esticar os braços.',
        'Desça devagar até os halteres ficarem ao lado do peito.'],
      null),

    ('desenvolvimento-halteres', true, 'Seated_Dumbbell_Press',
      array[
        'Sente no banco com apoio para as costas e um halter em cada mão.',
        'Leve os halteres à altura dos ombros, com as palmas das mãos para a frente.',
        'Empurre os halteres para cima, soltando o ar, até quase se tocarem.',
        'Desça devagar até a altura dos ombros.'],
      null),

    ('elevacao-lateral', true, 'Side_Lateral_Raise',
      array[
        'Fique em pé com um halter em cada mão, ao lado do corpo.',
        'Com os cotovelos levemente dobrados, levante os braços para os lados até a altura dos ombros.',
        'Solte o ar ao subir e pare um segundo no alto.',
        'Desça devagar, sem balançar o corpo.'],
      null),

    ('rosca-direta', true, 'Barbell_Curl',
      array[
        'Fique em pé com a barra nas mãos, palmas para a frente, na largura dos ombros.',
        'Mantenha os cotovelos junto ao corpo.',
        'Dobre os cotovelos e levante a barra até a altura dos ombros, soltando o ar.',
        'Desça devagar, sem balançar o corpo.'],
      null),

    ('triceps-polia', true, 'Triceps_Pushdown',
      array[
        'Fique em pé de frente para a polia alta, segurando a barra com as palmas para baixo.',
        'Deixe os cotovelos colados ao corpo e os antebraços apontando para a polia.',
        'Estique os braços e leve a barra até a frente das coxas, soltando o ar.',
        'Volte devagar, mexendo só os antebraços.'],
      null),

    ('pallof-press', true, 'Pallof_Press',
      array[
        'Fique de lado para o cabo (ou elástico), na altura do peito, segurando a alça com as duas mãos.',
        'Afaste-se até sentir o peso, com os pés na largura do quadril e os joelhos levemente dobrados.',
        'Estique os braços à frente, firmando a barriga, sem girar o corpo.',
        'Segure alguns segundos e traga a alça de volta ao peito.',
        'Faça as repetições e troque de lado.'],
      'Respire normalmente, sem prender o ar. Se a barriga estufar, diminua o tempo ou a carga.'),

    ('leg-press-45', true, 'Leg_Press',
      array[
        'Sente na máquina com as costas apoiadas e os pés na plataforma, na largura dos ombros.',
        'Solte as travas e empurre a plataforma até esticar as pernas, sem travar os joelhos.',
        'Dobre os joelhos e traga a plataforma devagar, até as pernas formarem um ângulo reto.',
        'Empurre com os calcanhares para voltar, soltando o ar.',
        'Ao terminar, prenda a plataforma com as travas de segurança.'],
      'Solte o ar ao fazer força e firme a barriga antes de cada repetição. Se a linha do meio da barriga estufar, diminua a carga.'),

    ('agachamento-goblet', true, 'Goblet_Squat',
      array[
        'Fique em pé segurando um halter junto ao peito, com as duas mãos.',
        'Deixe os pés um pouco mais afastados que os ombros, com as pontas levemente para fora.',
        'Dobre os joelhos e desça o quadril, mantendo o peito aberto e as costas retas.',
        'Suba empurrando o chão com os pés, soltando o ar.'],
      'Solte o ar ao fazer força e firme a barriga antes de cada repetição. Se a linha do meio da barriga estufar, diminua a carga.'),

    ('passada', true, 'Dumbbell_Lunges',
      array[
        'Fique em pé com um halter em cada mão, ao lado do corpo.',
        'Dê um passo grande à frente com uma perna.',
        'Dobre os dois joelhos e desça o quadril, com o tronco reto.',
        'Empurre o calcanhar da frente para voltar, complete as repetições e troque de perna.'],
      'Solte o ar ao fazer força e firme a barriga antes de cada repetição. Se a linha do meio da barriga estufar, diminua a carga.'),

    ('cadeira-extensora', true, 'Leg_Extensions',
      array[
        'Sente na máquina com as costas apoiadas e segure nas alças.',
        'Ajuste a almofada logo acima dos pés, com os joelhos dobrados em ângulo reto.',
        'Estique as pernas, soltando o ar, e segure um segundo.',
        'Volte devagar, sem deixar o peso bater.'],
      null),

    ('gluteo-cabo', true, 'One-Legged_Cable_Kickback',
      array[
        'Prenda a tornozeleira no tornozelo e ligue-a ao cabo baixo.',
        'Fique de frente para o aparelho e segure na estrutura para se apoiar.',
        'Com a barriga firme, leve a perna para trás, apertando o bumbum.',
        'Volte devagar, sem balançar o tronco.',
        'Faça as repetições e troque de perna.'],
      null),

    ('panturrilha-em-pe', true, 'Standing_Calf_Raises',
      array[
        'Ajuste a máquina, apoie os ombros nas almofadas e fique com a ponta dos pés na plataforma.',
        'Deixe os calcanhares para fora da plataforma e os joelhos levemente dobrados.',
        'Suba o máximo que puder na ponta dos pés, soltando o ar.',
        'Segure um segundo e desça devagar até sentir a panturrilha esticar.'],
      null),

    ('step-up', true, 'Dumbbell_Step_Ups',
      array[
        'Fique em pé de frente para um banco, com um halter em cada mão.',
        'Apoie um pé inteiro no banco e suba empurrando com o calcanhar.',
        'Junte o outro pé no alto e solte o ar.',
        'Desça devagar, um pé de cada vez.',
        'Faça as repetições e troque de perna.'],
      'Solte o ar ao fazer força e firme a barriga antes de cada repetição. Se a linha do meio da barriga estufar, diminua a carga.'),

    ('remada-unilateral', true, 'One-Arm_Dumbbell_Row',
      array[
        'Apoie uma mão e um joelho no banco, com as costas retas e paralelas ao chão.',
        'Segure o halter com a outra mão, com o braço esticado e a palma voltada para o corpo.',
        'Puxe o halter até a lateral do peito, com o cotovelo junto ao corpo, soltando o ar.',
        'Desça devagar, sem girar o tronco.',
        'Faça as repetições e troque de braço.'],
      null),

    ('flexao-inclinada', true, 'Incline_Push-Up',
      array[
        'Apoie as mãos na beirada de um banco firme, um pouco mais afastadas que os ombros.',
        'Afaste os pés para trás, com o corpo reto como uma tábua.',
        'Dobre os cotovelos e leve o peito até a beirada do banco.',
        'Empurre o banco para voltar, esticando os braços.'],
      null),

    ('agachamento-sumo', true, 'Plie_Dumbbell_Squat',
      array[
        'Fique em pé segurando um halter pela ponta, com as duas mãos, entre as pernas.',
        'Afaste os pés mais que a largura dos ombros, com as pontas para fora.',
        'Dobre os joelhos e desça o quadril até as coxas ficarem paralelas ao chão.',
        'Suba empurrando o chão com os pés, soltando o ar.'],
      'Solte o ar ao fazer força e firme a barriga antes de cada repetição. Se a linha do meio da barriga estufar, diminua a carga.'),

    -- No illustration: image_paths stays empty.
    ('bird-dog', false, null,
      array[
        'Fique de quatro apoios: mãos abaixo dos ombros e joelhos abaixo do quadril.',
        'Firme a barriga e estique o braço direito à frente e a perna esquerda para trás.',
        'Segure 2 segundos sem girar o quadril.',
        'Volte devagar e troque o lado.'],
      'Respire normalmente, sem prender o ar. Se a barriga estufar, diminua o tempo ou a carga.'),

    ('prancha-lateral-joelhos', false, null,
      array[
        'Deite de lado, apoiada no antebraço, com o cotovelo abaixo do ombro e os joelhos dobrados.',
        'Suba o quadril até formar uma linha reta dos joelhos à cabeça.',
        'Segure o tempo indicado respirando normalmente.',
        'Desça devagar e troque o lado.'],
      'Respire normalmente, sem prender o ar. Se a barriga estufar, diminua o tempo ou a carga.'),

    ('caminhada-lateral-miniband', false, null,
      array[
        'Coloque o miniband logo acima dos joelhos.',
        'Pés na largura do quadril e joelhos levemente dobrados, como meio agachamento.',
        'Dê passos curtos para o lado sem juntar os pés, mantendo a banda esticada.',
        'Complete os passos para um lado e volte para o outro.'],
      null);

  select count(*) into v_expected from tmp_media;
  if v_expected <> 27 then
    raise exception 'Esperadas 27 linhas de mídia, encontradas %.', v_expected;
  end if;

  -- Every slug must exist, and every exercise must be covered.
  if exists (select 1 from tmp_media t where not exists (select 1 from public.exercises e where e.slug = t.slug)) then
    raise exception 'Algum slug de mídia não existe em exercises.';
  end if;
  if exists (select 1 from public.exercises e where not exists (select 1 from tmp_media t where t.slug = e.slug)) then
    raise exception 'Algum exercício não tem mídia definida.';
  end if;

  update public.exercises e
     set source_ref      = case when t.has_image then 'free-exercise-db:' || t.source_id end,
         image_paths     = case when t.has_image
                                then array['/exercises/' || t.slug || '/0.jpg', '/exercises/' || t.slug || '/1.jpg']
                                else '{}'::text[] end,
         instructions_pt = t.instructions,
         caution_pt      = t.caution
    from tmp_media t
   where e.slug = t.slug;
  get diagnostics n = row_count;
  if n <> v_expected then
    raise exception 'Atualização incompleta: % de % exercícios.', n, v_expected;
  end if;

  -- -------------------------------------------------------------------------
  -- Workout D: note for the replaced exercise.
  -- -------------------------------------------------------------------------
  update public.workout_exercises we
     set note = 'Segure um halter pela ponta, entre as pernas'
    from public.workouts w, public.plan_cycles c, public.exercises e
   where we.workout_id = w.id
     and w.cycle_id = c.id
     and e.id = we.exercise_id
     and c.name = 'Ciclo 1'
     and w.code = 'D'
     and e.slug = 'agachamento-sumo';
  get diagnostics n = row_count;
  if n <> 1 then
    raise exception 'Esperada 1 linha de workout_exercises (treino D), atualizadas %.', n;
  end if;
end
$$;

commit;
