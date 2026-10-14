-- 0004_exercise_purpose.sql — short "Para que serve" text per exercise.
-- Run after migrations/0003_workout_logging.sql, in the Supabase SQL Editor (once).

begin;

alter table public.exercises
  add column purpose_pt text null
  check (char_length(purpose_pt) <= 280);

do $$
declare
  r record;
  n int;
begin
  for r in
    select * from (values
      ('hip-thrust', 'O exercício número 1 do bumbum. É ele que deixa o glúteo empinado e bonito na calça, e mais forte para pegar as crianças no colo.'),
      ('stiff-halteres', 'Trabalha a parte de trás da coxa e o bumbum juntos. Desenha a perna por trás e protege a lombar quando você se abaixa.'),
      ('agachamento-bulgaro', 'Uma perna de cada vez, então nenhum lado trabalha mais que o outro. Bumbum e coxa ganham forma por igual, e o equilíbrio agradece.'),
      ('mesa-flexora', 'Isola a parte de trás da coxa, que quase ninguém lembra de treinar. Coxa firme por trás deixa a perna bonita no short e na calça.'),
      ('abducao-maquina', 'Trabalha a lateral do bumbum. É ela que dá o formato arredondado visto de lado e deixa o quadril firme para caminhar e subir escada.'),
      ('dead-bug', 'Fortalece a parte funda da barriga sem forçar a linha do meio. É um dos melhores amigos de quem tem diástase.'),
      ('puxada-frontal', 'Trabalha as costas largas. Costas fortes fazem a cintura parecer mais fina e seguram a postura de quem vive com criança no colo.'),
      ('remada-baixa', 'Fortalece o meio das costas e puxa os ombros para trás. Adeus postura curvada de tanto olhar para baixo.'),
      ('supino-halteres', 'Trabalha peito, ombros e a parte de trás do braço. Deixa o colo mais firme e a parte de cima do corpo mais forte.'),
      ('desenvolvimento-halteres', 'Fortalece os ombros. Dá um desenho bonito na regata e facilita levantar criança e sacola acima da cabeça.'),
      ('elevacao-lateral', 'Trabalha a lateral do ombro. Ombros um pouco mais largos fazem a cintura parecer mais fina: é um truque de proporção.'),
      ('rosca-direta', 'Fortalece a frente do braço. É o músculo que carrega criança, sacola e tudo mais no dia a dia.'),
      ('triceps-polia', 'Trabalha a parte de trás do braço, aquela que costuma ficar mais molinha. É o exercício do tchauzinho firme.'),
      ('pallof-press', 'Ensina a barriga a não girar, sem fazer abdominal. Fortalece o centro do corpo de um jeito seguro para a diástase.'),
      ('leg-press-45', 'Trabalha coxa e bumbum com as costas apoiadas, então dá para pôr carga com segurança e ver a força crescer semana a semana.'),
      ('agachamento-goblet', 'O agachamento mais fácil de aprender: o peso na frente ajuda a manter o tronco reto. Treina coxa e bumbum do jeito que você se abaixa na vida real.'),
      ('passada', 'Trabalha coxa e bumbum uma perna por vez e ainda treina o equilíbrio. É dos que mais deixam a perna desenhada.'),
      ('cadeira-extensora', 'Isola a frente da coxa. Coxa forte protege os joelhos e deixa a perna mais firme e definida.'),
      ('gluteo-cabo', 'Isola o bumbum, uma perna de cada vez. É o acabamento: o toque final para levantar e arredondar.'),
      ('panturrilha-em-pe', 'Trabalha a batata da perna. Dá formato bonito para vestido e salto, e ajuda a circulação de quem passa muito tempo em pé.'),
      ('bird-dog', 'Treina barriga e costas juntas, em equilíbrio, sem forçar a linha do meio. Ótimo para a diástase e para aliviar a lombar.'),
      ('agachamento-sumo', 'Com as pernas afastadas e as pontas dos pés para fora, trabalha o bumbum e a parte de dentro da coxa, a região mais difícil de firmar.'),
      ('step-up', 'Subir no banco treina bumbum e coxa no movimento de subir escada. É força que você usa todo dia.'),
      ('remada-unilateral', 'Fortalece as costas um lado de cada vez. Equilibra a força de quem carrega criança sempre no mesmo braço.'),
      ('flexao-inclinada', 'A flexão na versão mais leve, com as mãos no banco. Fortalece peito, braços e barriga de uma vez; quando ficar fácil, o banco fica mais baixo.'),
      ('caminhada-lateral-miniband', 'Acorda a lateral do bumbum, que costuma dormir em quem passa muito tempo sentada. Deixa o quadril mais firme e arredondado.'),
      ('prancha-lateral-joelhos', 'Fortalece a lateral da barriga, que ajuda a desenhar a cintura. Com os joelhos apoiados, é segura para a diástase.')
    ) as v(slug, purpose)
  loop
    update public.exercises set purpose_pt = r.purpose where slug = r.slug;
    get diagnostics n = row_count;
    if n = 0 then
      raise exception 'Exercício % não encontrado.', r.slug;
    end if;
  end loop;

  if exists (select 1 from public.exercises where purpose_pt is null) then
    raise exception 'Há exercícios sem texto de "Para que serve".';
  end if;
end
$$;

commit;
