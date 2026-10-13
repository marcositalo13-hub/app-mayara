// Dev-only fixtures for the Hoje screen (break-ui pass). Never imported by production routes.
import type { TodayData, TodayMeal, TodaySwapGroup } from "@/lib/data/today-types";

type Ok = Extract<TodayData, { status: "ok" }>;

let seq = 0;
const id = (p: string) => `${p}-${++seq}`;
const items = (...pairs: [string, string | null][]) =>
  pairs.map(([food, quantity]) => ({ id: id("it"), food, quantity }));

const option = (
  label: string,
  kcal: number | null,
  list: ReturnType<typeof items>,
  extra: Partial<{ max_per_week: number; note: string }> = {},
) => ({
  id: id("op"),
  label,
  kcal,
  protein_g: null,
  carbs_g: null,
  fat_g: null,
  max_per_week: extra.max_per_week ?? null,
  note: extra.note ?? null,
  items: list,
});

const demoMeals: TodayMeal[] = [
  {
    id: "meal-cafe",
    name: "Café da manhã",
    time_hint: "09:00:00",
    note: null,
    options: [
      option("Opção 1", 436, items(["1 pão francês", "50 g"], ["Ovos mexidos ou cozidos (frigideira antiaderente)", "2 unidades"], ["Café com leite desnatado", "150 mL"], ["Açúcar", "até 5 g (1 colher de chá)"], ["Banana prata", "70 g"])),
      option("Opção 2", 422, items(["1 pão francês", "50 g"], ["Muçarela", "2 fatias (40 g)"], ["Banana prata", "70 g"], ["Café com leite desnatado", "150 mL"], ["Açúcar", "5 g"])),
    ],
  },
  {
    id: "meal-almoco",
    name: "Almoço",
    time_hint: "12:30:00",
    note: null,
    options: [
      option("Prato do dia", 474, items(["Arroz branco cozido", "80 g"], ["Feijão cozido", "120 g"], ["Tilápia grelhada ou assada", "120 g"], ["Legumes cozidos", "150 g"], ["Folhas, tomate e pepino", "à vontade"], ["Azeite (medido)", "10 mL (2 colheres de chá)"])),
    ],
  },
  {
    id: "meal-lanche",
    name: "Lanche da tarde",
    time_hint: "15:30:00",
    note: null,
    options: [
      option("Opção 1", 271, items(["Iogurte natural desnatado", "170 g"], ["Aveia em flocos", "15 g"], ["Fruta (ver trocas)", "2 porções"])),
      option("Doce planejado", 240, items(["Iogurte natural desnatado", "170 g"], ["Bolo caseiro simples", "1 fatia (50 g)"]), {
        max_per_week: 3,
        note: "Até 3x por semana. Separe a fatia na hora e coma sentada, no horário do lanche.",
      }),
    ],
  },
  {
    id: "meal-pre",
    name: "Pré-treino",
    time_hint: "18:00:00",
    note: "Faça 1 a 1,5 h antes do treino; se o horário do treino mudar, esta refeição acompanha.",
    options: [
      option("Opção 1", 324, items(["1 pão francês", "50 g"], ["Ovo", "1 unidade"], ["Muçarela", "1 fatia (20 g)"], ["Café com leite desnatado, sem açúcar", "100 mL"])),
      option("Wrap", 284, items(["Rap10", "1 unidade (40 g)"], ["Frango desfiado", "60 g"], ["Muçarela", "1 fatia (20 g)"])),
      option("Opção 3", 296, items(["Iogurte natural desnatado", "170 g"], ["Aveia em flocos", "40 g"], ["Banana prata", "70 g"])),
    ],
  },
  {
    id: "meal-jantar",
    name: "Jantar",
    time_hint: "21:00:00",
    note: null,
    options: [
      option("Opção 1", 423, items(["Arroz branco cozido", "80 g"], ["Feijão cozido", "100 g"], ["Peito de frango grelhado", "100 g"], ["Legumes cozidos", "150 g"], ["Azeite (medido)", "5 mL"], ["Salada", "à vontade"])),
      option("Macarronada", 447, items(["Macarrão cozido", "120 g"], ["Patinho moído", "90 g"], ["Molho de tomate", "50 g"], ["Legumes cozidos", "150 g"]), { note: "Substitui arroz e feijão." }),
      option("Pizza de Rap10", 511, items(["Rap10", "2 unidades"], ["Molho de tomate", "40 g"], ["Frango desfiado", "100 g"], ["Muçarela", "1 fatia (20 g)"], ["Tomate e orégano", "à vontade"], ["Legumes cozidos", "100 g"]), { max_per_week: 2 }),
    ],
  },
];

const demoSwaps: TodaySwapGroup[] = [
  {
    id: "sg-1",
    name: "Carboidrato (almoço/jantar)",
    base_portion: "Arroz 80 g",
    items: [
      { id: "si-1", food: "Batata inglesa", portion: "190 g" },
      { id: "si-2", food: "Abóbora cabotiá", portion: "210 g" },
      { id: "si-3", food: "Mandioca", portion: "75 g" },
    ],
  },
  {
    id: "sg-2",
    name: "Feijão",
    base_portion: "120 g",
    items: [{ id: "si-4", food: "Sem feijão", portion: "some metade do peso ao arroz (120 g → +60 g de arroz)" }],
  },
];

const base: Ok = {
  status: "ok",
  today: "2026-10-13",
  member: { displayName: "Mayara", role: "user" },
  cycle: { id: "cycle-1", name: "Ciclo 1", kcal_target: 1900 },
  week: { week_no: 1, total_weeks: 4, water_ml_target: 2500 },
  meals: demoMeals,
  mealLogs: [{ meal_id: "meal-cafe", option_id: demoMeals[0].options[1].id }],
  waterMl: 750,
  nextWorkout: { code: "A", name: "Inferiores — glúteo e posterior", exercise_count: 6 },
  openSessionId: null,
  cardio: { week_no: 1, targetMinutes: 60, targetSessions: 3, rpeMin: 6, rpeMax: 7, loggedMinutes: 20, loggedSessions: 1 },
  swapGroups: demoSwaps,
};

const worstMeals: TodayMeal[] = [
  {
    id: "w-1",
    name: "Lanche da manhã depois de levar as crianças na escola",
    time_hint: "09:45:00",
    note: "Se acordar depois das 10h, junte esta refeição com o almoço e mantenha só a fruta e o iogurte, sem o pão, para não passar da meta do dia.",
    options: [
      option("Pizza de Rap10 com frango desfiado e legumes assados", 1234, items(["Ovos mexidos ou cozidos (frigideira antiaderente, sem óleo, só com uma pitada de sal)", "2 unidades grandes (aproximadamente 110 g no total)"], ["Pão", null])),
      option("Opção 2", null, []),
      option("Wrap", 284, items(["Rap10", "1"])),
      option("Iogurte com aveia, banana e canela", 296, items(["Iogurte", "170 g"]), { max_per_week: 1 }),
      option("X", 99, items(["Café", "100 mL"])),
    ],
  },
  {
    id: "w-2",
    name: "Ceia",
    time_hint: null,
    note: null,
    options: [option("Única", 120, items(["Chá de camomila", "1 xícara"]))],
  },
  ...demoMeals.slice(1, 3),
];

const fixtures: Record<string, TodayData> = {
  demo: base,
  worst: {
    ...base,
    member: { displayName: "Mayara Cristina de Albuquerque Wiśniewska-Kowalczyk", role: "admin" },
    week: { week_no: 12, total_weeks: 12, water_ml_target: 5000 },
    meals: worstMeals,
    mealLogs: [{ meal_id: "w-2", option_id: null }],
    waterMl: 5250,
    nextWorkout: {
      code: "D",
      name: "Glúteo e corpo inteiro com ênfase em posterior de coxa e estabilidade de core",
      exercise_count: 1,
    },
    swapGroups: [
      ...demoSwaps,
      {
        id: "sg-w",
        name: "Proteína para almoço e jantar quando não houver peixe fresco no mercado",
        base_portion: "Tilápia grelhada ou assada sem pele, 120 g",
        items: [{ id: "si-w", food: "Patinho, coxão mole ou lagarto sem gordura aparente", portion: "120 g (máx. 2x/semana)" }],
      },
    ],
  },
  vazio: { ...base, meals: [], mealLogs: [], swapGroups: [], nextWorkout: null, waterMl: 0 },
  "uma-opcao": {
    ...base,
    meals: demoMeals.map((m) => ({ ...m, options: m.options.slice(0, 1) })),
    mealLogs: [],
  },
  "agua-1500": { ...base, week: { ...base.week, water_ml_target: 1500 }, waterMl: 1250 },
  "sem-treino": { ...base, nextWorkout: null, cardio: null },
  "treino-aberto": { ...base, openSessionId: "00000000-0000-4000-8000-000000000001" },
  "quase-100": {
    ...base,
    mealLogs: demoMeals.map((m) => ({ meal_id: m.id, option_id: m.options[0].id })),
    waterMl: 2250,
  },
  completo: {
    ...base,
    mealLogs: demoMeals.map((m) => ({ meal_id: m.id, option_id: m.options[0].id })),
    waterMl: 2500,
  },
  encerrado: {
    status: "no_active_week",
    today: "2026-11-12",
    member: base.member,
    lastCycleEnd: "2026-11-09",
    startsOn: null,
  },
  "sem-ciclo": {
    status: "no_active_week",
    today: "2026-10-13",
    member: base.member,
    lastCycleEnd: null,
    startsOn: null,
  },
};

export const FIXTURE_NAMES = Object.keys(fixtures);

export function getFixture(name: string | undefined): TodayData {
  return fixtures[name ?? "demo"] ?? fixtures.demo;
}
