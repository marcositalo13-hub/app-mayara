# Banco de dados (Supabase)

Os arquivos são executados **manualmente** no SQL Editor do Supabase, nesta ordem:

1. `migrations/0001_schema.sql`: cria tabelas, RLS, funções e views. Rode uma vez só.
2. `seed/0001_cycle1.sql`: insere o conteúdo do **Ciclo 1**. É de uso único: se o "Ciclo 1" já existir, o script para com erro e não altera nada.
3. `checks/0001_verify.sql`: apenas leitura. Rode cada consulta e compare com o esperado.
4. `seed/0002_exercise_media.sql`: instruções, cuidados e caminhos das imagens dos exercícios (as imagens ficam em `public/exercises/`). Também troca o terra sumô por agachamento sumô com halter. Pode ser rodado de novo sem problema.
5. `checks/0002_verify.sql`: apenas leitura, uma linha por exercício.
6. `migrations/0003_workout_logging.sql`: uma sessão de treino aberta por vez e o incremento de carga de cada exercício. Rode uma vez só.
7. `checks/0003_verify.sql`: apenas leitura (esperado: 21 exercícios com incremento e o índice criado).

## Depois de criar as contas

Sem uma linha em `members`, a pessoa não vê nada (RLS). Crie as contas em Authentication e depois rode, trocando os e-mails:

```sql
insert into public.members (user_id, role, display_name)
select id, 'user', 'Mayara' from auth.users where email = 'EMAIL_DA_MAYARA';

insert into public.members (user_id, role, display_name)
select id, 'admin', 'Porto' from auth.users where email = 'EMAIL_DO_PORTO';
```

A tabela `members` não pode ser alterada pelo app; é editada só pelo SQL Editor.
