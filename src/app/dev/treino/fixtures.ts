// Dev-only fixtures for the Treino screens (break-ui pass). Never imported by production routes.
import type { CardioWeek, LoggedSet, SessionDetail, SessionExercise, WorkoutPreview } from "@/lib/data/workout-types";
import type { RepsUnit } from "@/lib/types/db";
import { computeSuggestion, NO_HISTORY_HINT } from "@/lib/workout/format";

const CAUTION_CORE =
  "Solte o ar ao fazer força e firme a barriga antes de cada repetição. Se a linha do meio da barriga estufar, diminua a carga.";

const PURPOSES: Record<string, string> = {
  "hip-thrust": "O exercício número 1 do bumbum. É ele que deixa o glúteo empinado e bonito na calça, e mais forte para pegar as crianças no colo.",
  "stiff-halteres": "Trabalha a parte de trás da coxa e o bumbum juntos. Desenha a perna por trás e protege a lombar quando você se abaixa.",
  "agachamento-bulgaro": "Uma perna de cada vez, então nenhum lado trabalha mais que o outro. Bumbum e coxa ganham forma por igual, e o equilíbrio agradece.",
  "dead-bug": "Fortalece a parte funda da barriga sem forçar a linha do meio. É um dos melhores amigos de quem tem diástase.",
  "rosca-direta": "Fortalece a frente do braço. É o músculo que carrega criança, sacola e tudo mais no dia a dia.",
  "leg-press-45": "Trabalha coxa e bumbum com as costas apoiadas, então dá para pôr carga com segurança e ver a força crescer semana a semana.",
  "prancha-lateral-joelhos": "Fortalece a lateral da barriga, que ajuda a desenhar a cintura. Com os joelhos apoiados, é segura para a diástase.",
};

let seq = 0;
const uuid = () => `00000000-0000-4000-8000-${String(++seq).padStart(12, "0")}`;

const sets = (...pairs: [number, number][]): LoggedSet[] =>
  pairs.map(([load_kg, reps], i) => ({ set_no: i + 1, load_kg, reps }));

function exercise(p: {
  slug: string;
  name: string;
  sets: number;
  min: number;
  max: number;
  unit?: RepsUnit;
  perSide?: boolean;
  rest: number;
  note?: string;
  inc: number;
  images?: boolean;
  caution?: string;
  purpose?: string | null;
  steps?: string[];
  last?: LoggedSet[] | null;
  logged?: LoggedSet[];
}): SessionExercise {
  const unit = p.unit ?? "reps";
  const suggestion = computeSuggestion(p.last ?? null, {
    sets: p.sets,
    reps_max: p.max,
    reps_unit: unit,
    increment_kg: p.inc,
  });
  return {
    id: uuid(),
    sort: seq,
    sets: p.sets,
    reps_min: p.min,
    reps_max: p.max,
    reps_unit: unit,
    per_side: p.perSide ?? false,
    rest_s: p.rest,
    note: p.note ?? null,
    exercise: {
      slug: p.slug,
      name_pt: p.name,
      instructions_pt: p.steps ?? [
        "Fique em pé com um halter em cada mão, ao lado do corpo.",
        "Faça o movimento devagar, com as costas retas.",
        "Volte à posição inicial soltando o ar.",
      ],
      caution_pt: p.caution ?? null,
      purpose_pt: p.purpose === undefined ? PURPOSES[p.slug] ?? null : p.purpose,
      image_paths: p.images === false ? [] : [`/exercises/${p.slug}/0.jpg`, `/exercises/${p.slug}/1.jpg`],
      increment_kg: p.inc,
    },
    loggedSets: p.logged ?? [],
    lastPerformance: p.last ? { performed_on: "2026-10-09", sets: p.last } : null,
    suggestion,
    hint: suggestion ? null : NO_HISTORY_HINT,
  };
}

const session = (exercises: SessionExercise[], code = "A", name = "Inferiores — glúteo e posterior"): SessionDetail => ({
  session: { id: uuid(), started_at: new Date(Date.now() - 23 * 60 * 1000).toISOString(), finished_at: null },
  workout: { id: uuid(), code, name },
  exercises,
});

export const cardioWeek: CardioWeek = {
  week_no: 1,
  targetMinutes: 60,
  targetSessions: 3,
  rpeMin: 6,
  rpeMax: 7,
  loggedMinutes: 20,
  loggedSessions: 1,
};

export function sessionFixture(name: string): SessionDetail {
  seq = 0;
  if (name === "worst") {
    return session(
      [
        exercise({
          slug: "bird-dog",
          name: "Bird dog com pausa isométrica e alternância de braço e perna contralaterais",
          sets: 5,
          min: 8,
          max: 8,
          perSide: true,
          rest: 45,
          inc: 0,
          images: false,
          caution: "Respire normalmente, sem prender o ar. Se a barriga estufar, diminua o tempo ou a carga.",
          last: sets([0, 8], [0, 8], [0, 8], [0, 8], [0, 8]),
          logged: [...sets([0, 8], [0, 8], [0, 8], [0, 8], [0, 8]), { set_no: 6, load_kg: 0, reps: 6 }, { set_no: 7, load_kg: 0, reps: 5 }],
        }),
        exercise({
          slug: "rosca-direta",
          name: "Rosca direta",
          sets: 3,
          min: 12,
          max: 12,
          rest: 0,
          inc: 1,
          note: "Bi-set: faça em seguida o tríceps, sem descanso",
          last: sets([7, 12], [7, 12], [8, 10]),
        }),
        exercise({
          slug: "triceps-polia",
          name: "Tríceps na polia",
          sets: 3,
          min: 12,
          max: 12,
          rest: 60,
          inc: 2.5,
          note: "Bi-set com a rosca direta",
          last: sets([12.5, 12], [12.5, 12], [12.5, 12]),
          logged: sets([15, 12], [15, 12], [15, 11]),
        }),
        exercise({
          slug: "prancha-lateral-joelhos",
          name: "Prancha lateral com joelhos apoiados",
          sets: 3,
          min: 20,
          max: 30,
          unit: "s",
          perSide: true,
          rest: 45,
          inc: 0,
          images: false,
          last: sets([0, 30], [0, 30], [0, 30]),
        }),
        exercise({
          slug: "leg-press-45",
          name: "Leg press 45°",
          sets: 4,
          min: 10,
          max: 12,
          rest: 120,
          inc: 5,
          caution: CAUTION_CORE,
          last: sets([142.5, 12], [142.5, 12], [147.5, 9], [147.5, 8]),
        }),
      ],
      "B",
      "Superiores, core e um nome de treino bem comprido para testar quebra de linha",
    );
  }

  return session([
    exercise({
      slug: "hip-thrust",
      name: "Elevação pélvica (hip thrust)",
      sets: 4,
      min: 8,
      max: 12,
      rest: 120,
      inc: 2,
      note: "Barra ou máquina",
      caution: CAUTION_CORE,
      steps: [
        "Sente no chão de costas para um banco e apoie as costas na beirada dele.",
        "Apoie a barra sobre o quadril, com uma almofada, ou ajuste a máquina na altura do quadril.",
        "Com os pés no chão e os joelhos dobrados, empurre o chão e suba o quadril.",
        "Aperte o bumbum no alto, sem arquear a lombar.",
        "Desça devagar até o quadril quase tocar o chão.",
      ],
      last: sets([30, 12], [30, 12], [30, 12], [30, 12]),
    }),
    exercise({
      slug: "stiff-halteres",
      name: "Stiff com halteres",
      sets: 3,
      min: 10,
      max: 12,
      rest: 90,
      inc: 1,
      caution: CAUTION_CORE,
      last: sets([10, 12], [10, 11], [10, 10]),
    }),
    exercise({
      slug: "agachamento-bulgaro",
      name: "Agachamento búlgaro com halteres",
      sets: 3,
      min: 10,
      max: 12,
      perSide: true,
      rest: 90,
      inc: 1,
      caution: CAUTION_CORE,
      last: null,
    }),
    exercise({
      slug: "dead-bug",
      name: "Dead bug",
      sets: 3,
      min: 8,
      max: 8,
      perSide: true,
      rest: 45,
      inc: 0,
      caution: "Mantenha a lombar encostada no chão. Se a barriga estufar, mexa só as pernas.",
      last: sets([0, 8], [0, 8], [0, 8]),
    }),
  ]);
}

const preview = (id: string, code: string, name: string, n: number): WorkoutPreview => ({
  id,
  code,
  name,
  exercises: Array.from({ length: n }, (_, i) => ({
    id: `${id}-${i}`,
    purpose_pt: null,
    name_pt: ["Elevação pélvica (hip thrust)", "Stiff com halteres", "Agachamento búlgaro com halteres", "Mesa flexora", "Abdução de quadril na máquina", "Dead bug", "Pallof press", "Panturrilha em pé"][i % 8],
    sets: i === 0 ? 4 : 3,
    reps_min: 10,
    reps_max: 12,
    reps_unit: "reps" as const,
    per_side: i === 2,
  })),
});

export const startFixture = {
  workouts: [
    preview("00000000-0000-4000-8000-0000000000a1", "A", "Inferiores — glúteo e posterior", 6),
    preview("00000000-0000-4000-8000-0000000000b2", "B", "Superiores e core", 8),
    preview("00000000-0000-4000-8000-0000000000c3", "C", "Inferiores — quadríceps e glúteo", 7),
    preview("00000000-0000-4000-8000-0000000000d4", "D", "Glúteo e corpo inteiro", 7),
  ],
  nextWorkoutId: "00000000-0000-4000-8000-0000000000b2",
};
