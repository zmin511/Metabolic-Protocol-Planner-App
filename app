import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Activity, ClipboardList, HeartPulse, Scale, TestTube2, Pill, CalendarRange, Info, Save, RotateCcw, Droplets } from "lucide-react";

const STORAGE_KEY = "metabolic-protocol-planner-v1";

const labCatalog = [
  { code: "06-009", name: "Глюкоза", why: "Базовая оценка углеводного обмена", ref: "4.1–6.0 ммоль/л" },
  { code: "06-015", name: "Инсулин", why: "Нужен для оценки инсулинорезистентности", ref: "2.7–10.4 мкЕд/мл" },
  { code: "06-021", name: "Холестерин общий", why: "Общий кардиометаболический риск", ref: "желательно < 5.0 ммоль/л" },
  { code: "06-028", name: "Холестерин ЛПНП", why: "Оценка атерогенного риска", ref: "желательно < 3.0 ммоль/л" },
  { code: "06-027", name: "Холестерин ЛПВП", why: "Защитный липидный фактор", ref: "муж. > 1.0 / жен. > 1.2" },
  { code: "06-023", name: "Триглицериды", why: "Маркер инсулинорезистентности и кардиориска", ref: "< 1.7 ммоль/л" },
  { code: "06-010", name: "АлАТ", why: "Контроль печени и жирового гепатоза", ref: "< 41 Ед/л" },
  { code: "06-011", name: "АсАТ", why: "Контроль печени и метаболической нагрузки", ref: "< 37 Ед/л" },
  { code: "06-012", name: "Билирубин общий", why: "Базовый печеночный скрининг", ref: "3.4–20.5 мкмоль/л" },
  { code: "06-020", name: "Креатинин", why: "Оценка функции почек", ref: "64–104 мкмоль/л" },
  { code: "06-018", name: "Мочевина", why: "Косвенно отражает белковую нагрузку и гидратацию", ref: "2.1–7.1 ммоль/л" },
  { code: "06-034", name: "Мочевая кислота", why: "Риск подагры, особенно при похудении", ref: "210–420 мкмоль/л" },
  { code: "06-051", name: "ТТГ", why: "Исключение тиреоидной причины колебаний веса", ref: "0.4–4.0 мМЕ/л" },
  { code: "06-052", name: "Т4 свободный", why: "Уточнение функции щитовидной железы", ref: "9–19.05 пмоль/л" },
  { code: "06-076", name: "Витамин D (25-OH)", why: "Оценка дефицита и подбор поддерживающей дозы", ref: "30–100 нг/мл" },
  { code: "06-036", name: "Ферритин", why: "Запасы железа и риск скрытого дефицита", ref: "индивидуально по полу и лаборатории" },
  { code: "06-039", name: "СРБ", why: "Оценка хронического воспаления", ref: "обычно < 5 мг/л" },
];

const emptyData = {
  age: "",
  sex: "male",
  height: "",
  weight: "",
  waist: "",
  systolic: "",
  diastolic: "",
  glucose: "",
  insulin: "",
  tg: "",
  hdl: "",
  ldl: "",
  alt: "",
  ast: "",
  uric: "",
  vitaminD: "",
  tsh: "",
  creatinine: "",
  useTirzepatide: true,
};

function num(v) {
  if (v === "" || v === null || typeof v === "undefined") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function hasValue(v) {
  return v !== "" && v !== null && typeof v !== "undefined";
}

function statusBadge(label, tone) {
  const styles = {
    good: "bg-emerald-100 text-emerald-800 border-emerald-200",
    warn: "bg-amber-100 text-amber-800 border-amber-200",
    bad: "bg-rose-100 text-rose-800 border-rose-200",
    info: "bg-sky-100 text-sky-800 border-sky-200",
  };
  return <Badge className={`border ${styles[tone]}`}>{label}</Badge>;
}

function AppSection({ title, icon: Icon, children, right }) {
  return (
    <Card className="rounded-2xl shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-slate-100 p-2"><Icon className="h-5 w-5" /></div>
            <CardTitle className="text-xl">{title}</CardTitle>
          </div>
          {right}
        </div>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

export default function MetabolicProtocolPlanner() {
  const [data, setData] = useState(emptyData);
  const [accepted, setAccepted] = useState(false);
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({ ...emptyData, ...parsed });
      }
      setLoadedFromStorage(true);
    } catch {
      setLoadedFromStorage(true);
    }
  }, []);

  useEffect(() => {
    if (!loadedFromStorage) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data, loadedFromStorage]);

  const setField = (field, value) => setData((prev) => ({ ...prev, [field]: value }));
  const resetAll = () => {
    setData(emptyData);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
  };

  const derived = useMemo(() => {
    const height = num(data.height);
    const weight = num(data.weight);
    const waist = num(data.waist);
    const systolic = num(data.systolic);
    const diastolic = num(data.diastolic);
    const glucose = num(data.glucose);
    const insulin = num(data.insulin);
    const tg = num(data.tg);
    const hdl = num(data.hdl);
    const alt = num(data.alt);
    const ast = num(data.ast);
    const uric = num(data.uric);
    const vitaminD = num(data.vitaminD);
    const creatinine = num(data.creatinine);

    const heightM = height ? height / 100 : null;
    const bmi = heightM && weight ? weight / (heightM * heightM) : null;
    const idealMaxWeight = heightM ? 24.9 * heightM * heightM : null;
    const excessWeight = bmi && weight && bmi > 24.9 ? weight - idealMaxWeight : 0;
    const homa = glucose && insulin ? (glucose * insulin) / 22.5 : null;

    const triglycerideRisk = tg !== null ? tg >= 1.7 : false;
    const hdlLow = hdl !== null ? ((data.sex === "male" && hdl < 1.0) || (data.sex === "female" && hdl < 1.2)) : false;
    const ir = homa !== null ? homa >= 2.7 || (insulin !== null && insulin > 10.4) : false;
    const liverStress = ast !== null || alt !== null ? (ast !== null && ast > 37) || (alt !== null && alt > 41) : false;
    const hyperuricemia = uric !== null ? uric > 420 : false;
    const vitaminDLow = vitaminD !== null ? vitaminD < 30 : false;
    const waistHigh = waist !== null ? ((data.sex === "male" && waist >= 94) || (data.sex === "female" && waist >= 80)) : false;
    const bpHigh = systolic !== null || diastolic !== null ? (systolic !== null && systolic >= 135) || (diastolic !== null && diastolic >= 85) : false;

    const metabolicFlags = [ir, triglycerideRisk, hdlLow, waistHigh, bpHigh].filter(Boolean).length;

    let riskLevel = "Недостаточно данных";
    let riskTone = "info";
    if (weight || waist || glucose || insulin || tg || hdl || systolic || diastolic) {
      riskLevel = "Низкий";
      riskTone = "good";
      if (metabolicFlags >= 2) {
        riskLevel = "Умеренный";
        riskTone = "warn";
      }
      if (metabolicFlags >= 4) {
        riskLevel = "Высокий";
        riskTone = "bad";
      }
    }

    let vitaminDPlan = "Введите уровень витамина D, чтобы рассчитать рекомендацию";
    if (vitaminD !== null) {
      if (vitaminD < 20) vitaminDPlan = "Нагрузка 10000 МЕ/сут 6–8 недель, затем 4000 МЕ/сут";
      else if (vitaminD < 30) vitaminDPlan = "Нагрузка 5000–10000 МЕ/сут 4–6 недель, затем 2000–4000 МЕ/сут";
      else vitaminDPlan = "Поддерживающая доза 2000 МЕ/сут";
    }

    const proteinMin = weight ? Math.round(weight * 1.2) : null;
    const proteinTarget = weight ? Math.round(weight * 1.5) : null;
    const waterMin = weight ? Math.max(2, Math.round(weight * 0.03 * 10) / 10) : null;

    const canEscalate = weight !== null && (systolic === null || systolic < 150) && (creatinine === null || creatinine <= 110);

    return {
      bmi,
      idealMaxWeight,
      excessWeight,
      homa,
      ir,
      triglycerideRisk,
      hdlLow,
      liverStress,
      hyperuricemia,
      vitaminDLow,
      waistHigh,
      bpHigh,
      metabolicFlags,
      riskLevel,
      riskTone,
      vitaminDPlan,
      proteinMin,
      proteinTarget,
      waterMin,
      canEscalate,
    };
  }, [data]);

  const plan = useMemo(() => {
    const weeks = [];
    const weight = num(data.weight);
    const insulin = num(data.insulin);
    const vitaminD = num(data.vitaminD);
    const heavyCase = weight !== null ? weight >= 115 : false;
    const insulinHigh = insulin !== null && derived.homa !== null ? insulin >= 15 || derived.homa >= 3.5 : false;
    const liverSupportDose = derived.liverStress ? (weight !== null && weight >= 100 ? "500 мг 2 раза в день" : "500 мг 1 раз в день") : "по ситуации";
    const inositolDose = insulinHigh ? "2000 мг 2 раза в день" : "1000 мг 2 раза в день";
    const alaDose = insulinHigh ? "300 мг утром, при переносимости до 600 мг/сут" : "300 мг утром";
    const vitaminDStart = vitaminD === null ? "после анализа" : vitaminD < 20 ? "10000 МЕ/сут" : vitaminD < 30 ? "5000–10000 МЕ/сут" : "2000 МЕ/сут";
    const week5Dose = heavyCase ? "5 мг" : "5 мг";
    const week9Dose = derived.canEscalate && (insulinHigh || (weight !== null && weight >= 100)) ? "5 мг или 7.5 мг при плато" : "оставить 5 мг";

    for (let i = 1; i <= 12; i++) {
      let tirz = "не назначено";
      if (data.useTirzepatide) {
        if (i <= 4) tirz = "2.5 мг 1 раз в неделю";
        else if (i <= 8) tirz = `${week5Dose} 1 раз в неделю`;
        else tirz = `${week9Dose}`;
      }

      let vitaminDLine = i <= 6 ? vitaminDStart : "2000–4000 МЕ/сут";
      if (vitaminD !== null && vitaminD >= 30) vitaminDLine = "2000 МЕ/сут";

      weeks.push({
        week: i,
        tirz,
        morning: [
          `Витамин D: ${vitaminDLine}`,
          `Альфа-липоевая кислота: ${alaDose}`,
          `Инозит: ${inositolDose.includes("2 раза") ? inositolDose.split(" 2 раза в день")[0] : inositolDose}`,
        ],
        evening: [
          `Инозит: ${inositolDose.includes("2 раза") ? inositolDose.split(" 2 раза в день")[0] : inositolDose}`,
          "Магний: 300–400 мг",
          `Урсодезоксихолевая кислота: ${liverSupportDose}`,
        ],
        notes:
          i <= 4
            ? "Фаза адаптации: контролировать аппетит, тошноту, стул, воду и белок"
            : i <= 8
              ? "Рабочая фаза: отслеживать вес, талию, давление, переносимость"
              : "Фаза пересмотра: повышать дозу только при плато и хорошей переносимости",
      });
    }
    return weeks;
  }, [data, derived]);

  const checkpoints = [
    "Перед стартом: антропометрия, давление, исходные анализы",
    "Неделя 4: вес, талия, давление, переносимость",
    "Неделя 6–8: глюкоза, инсулин, HOMA, липиды, АСТ/АЛТ, мочевая кислота",
    "Неделя 12: повтор ключевых анализов + витамин D",
  ];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="grid gap-4 md:grid-cols-[1.5fr_1fr]">
          <Card className="rounded-3xl border-none bg-gradient-to-r from-slate-900 to-slate-700 text-white shadow-lg">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-sm">
                    <Activity className="h-4 w-4" /> Метаболический планировщик
                  </div>
                  <h1 className="text-3xl font-bold md:text-4xl">Мини-приложение для старта терапии</h1>
                  <p className="mt-3 max-w-3xl text-sm text-slate-200 md:text-base">
                    Все поля изначально пустые. Пользователь сам вводит параметры и сразу видит расчеты: ИМТ, HOMA-IR,
                    ориентировочный избыточный вес, белок, воду, флаги риска, список анализов и 12-недельный шаблон.
                  </p>
                </div>
                <Badge className="border-white/20 bg-white/10 text-white">Альфа 1.04.01</Badge>
              </div>
            </CardContent>
          </Card>

          <Alert className="rounded-3xl border-amber-200 bg-amber-50">
            <Info className="h-4 w-4" />
            <AlertTitle>Важно</AlertTitle>
            <AlertDescription className="space-y-3 text-sm leading-6">
              <p>Это образовательный шаблон, а не назначение лечения. Дозировки и лекарства должны подтверждаться врачом.</p>
              <div className="flex items-start gap-3">
                <Checkbox id="agree" checked={accepted} onCheckedChange={(v) => setAccepted(Boolean(v))} />
                <label htmlFor="agree" className="text-sm">Понимаю, что приложение не заменяет очный прием и медицинское решение.</label>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={resetAll}><RotateCcw className="mr-2 h-4 w-4" />Очистить всё</Button>
                <Badge className="bg-slate-100 text-slate-700"><Save className="mr-1 h-3 w-3" />Автосохранение в браузере</Badge>
              </div>
            </AlertDescription>
          </Alert>
        </div>

        <Tabs defaultValue="input" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-white p-1 shadow-sm">
            <TabsTrigger value="input">Ввод и расчёт</TabsTrigger>
            <TabsTrigger value="summary">Сводка</TabsTrigger>
            <TabsTrigger value="labs">Анализы</TabsTrigger>
            <TabsTrigger value="plan">12 недель</TabsTrigger>
          </TabsList>

          <TabsContent value="input" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-2">
              <AppSection title="Анкета" icon={ClipboardList}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Возраст" value={data.age} onChange={(v) => setField("age", v)} placeholder="например, 35" />
                  <SelectField label="Пол" value={data.sex} onChange={(v) => setField("sex", v)} options={[{ value: "male", label: "Мужской" }, { value: "female", label: "Женский" }]} />
                  <Field label="Рост, см" value={data.height} onChange={(v) => setField("height", v)} placeholder="175" />
                  <Field label="Вес, кг" value={data.weight} onChange={(v) => setField("weight", v)} placeholder="107" />
                  <Field label="Талия, см" value={data.waist} onChange={(v) => setField("waist", v)} placeholder="110" />
                  <Field label="Систолическое АД" value={data.systolic} onChange={(v) => setField("systolic", v)} placeholder="135" />
                  <Field label="Диастолическое АД" value={data.diastolic} onChange={(v) => setField("diastolic", v)} placeholder="85" />
                  <SelectField label="Тирзепатид в плане" value={String(data.useTirzepatide)} onChange={(v) => setField("useTirzepatide", v === "true")} options={[{ value: "true", label: "Да" }, { value: "false", label: "Нет" }]} />
                </div>
              </AppSection>

              <AppSection title="Лабораторные данные" icon={TestTube2}>
                <div className="grid gap-4 md:grid-cols-2">
                  <Field label="Глюкоза, ммоль/л" value={data.glucose} onChange={(v) => setField("glucose", v)} placeholder="5.3" />
                  <Field label="Инсулин, мкЕд/мл" value={data.insulin} onChange={(v) => setField("insulin", v)} placeholder="13.2" />
                  <Field label="Триглицериды, ммоль/л" value={data.tg} onChange={(v) => setField("tg", v)} placeholder="1.88" />
                  <Field label="ЛПВП, ммоль/л" value={data.hdl} onChange={(v) => setField("hdl", v)} placeholder="0.84" />
                  <Field label="ЛПНП, ммоль/л" value={data.ldl} onChange={(v) => setField("ldl", v)} placeholder="2.65" />
                  <Field label="АлАТ, Ед/л" value={data.alt} onChange={(v) => setField("alt", v)} placeholder="38" />
                  <Field label="АсАТ, Ед/л" value={data.ast} onChange={(v) => setField("ast", v)} placeholder="44" />
                  <Field label="Мочевая кислота, мкмоль/л" value={data.uric} onChange={(v) => setField("uric", v)} placeholder="468" />
                  <Field label="Креатинин, мкмоль/л" value={data.creatinine} onChange={(v) => setField("creatinine", v)} placeholder="101" />
                  <Field label="Витамин D, нг/мл" value={data.vitaminD} onChange={(v) => setField("vitaminD", v)} placeholder="20.9" />
                  <Field label="ТТГ, мМЕ/л" value={data.tsh} onChange={(v) => setField("tsh", v)} placeholder="1.06" />
                </div>
              </AppSection>
            </div>

            <div className="grid gap-6 xl:grid-cols-3">
              <AppSection title="Ключевые показатели" icon={Scale}>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Metric label="ИМТ" value={derived.bmi !== null ? derived.bmi.toFixed(1) : "—"} helper={derived.bmi === null ? "введите рост и вес" : derived.bmi >= 30 ? "ожирение" : derived.bmi >= 25 ? "избыточный вес" : "норма"} />
                  <Metric label="HOMA-IR" value={derived.homa !== null ? derived.homa.toFixed(2) : "—"} helper={derived.homa === null ? "введите глюкозу и инсулин" : derived.homa >= 2.7 ? "повышен" : "в пределах цели"} />
                  <Metric label="Идеальный верхний вес" value={derived.idealMaxWeight !== null ? `${derived.idealMaxWeight.toFixed(1)} кг` : "—"} helper="по ИМТ 24.9" />
                  <Metric label="Избыточный вес" value={derived.excessWeight ? `${derived.excessWeight.toFixed(1)} кг` : "—"} helper="ориентировочно" />
                  <Metric label="Белок/сут" value={derived.proteinTarget !== null ? `${derived.proteinTarget} г` : "—"} helper={derived.proteinMin !== null ? `минимум ${derived.proteinMin} г` : "введите вес"} />
                  <Metric label="Вода/сут" value={derived.waterMin !== null ? `${derived.waterMin} л` : "—"} helper="минимум" />
                </div>
              </AppSection>

              <AppSection title="Флаги риска" icon={HeartPulse} right={statusBadge(derived.riskLevel, derived.riskTone)}>
                <div className="flex flex-wrap gap-2">
                  {derived.ir && statusBadge("Инсулинорезистентность", "bad")}
                  {derived.triglycerideRisk && statusBadge("Триглицериды повышены", "warn")}
                  {derived.hdlLow && statusBadge("ЛПВП низкий", "warn")}
                  {derived.liverStress && statusBadge("Нагрузка на печень", "warn")}
                  {derived.hyperuricemia && statusBadge("Мочевая кислота повышена", "warn")}
                  {derived.waistHigh && statusBadge("Абдоминальное ожирение", "bad")}
                  {derived.bpHigh && statusBadge("Давление требует контроля", "warn")}
                  {!derived.ir && !derived.triglycerideRisk && !derived.hdlLow && !derived.liverStress && !derived.hyperuricemia && !derived.waistHigh && !derived.bpHigh && statusBadge("Заполните данные для оценки", "info")}
                </div>
                <Separator className="my-4" />
                <div className="text-sm leading-6 text-slate-600">
                  Совокупных критериев: <span className="font-semibold text-slate-900">{derived.metabolicFlags}</span>
                </div>
                <div className="mt-3">
                  <Progress value={Math.min(100, derived.metabolicFlags * 20)} />
                </div>
              </AppSection>

              <AppSection title="Быстрые рекомендации" icon={Droplets}>
                <ul className="space-y-3 text-sm leading-6 text-slate-700">
                  <li><span className="font-semibold">Витамин D:</span> {derived.vitaminDPlan}</li>
                  <li><span className="font-semibold">Белок:</span> при слабом аппетите добавлять мягкий творог, йогурт, рыбу, протеин.</li>
                  <li><span className="font-semibold">Вода:</span> пить по расписанию, а не только по жажде.</li>
                  <li><span className="font-semibold">Повышение дозы:</span> только при плато и хорошей переносимости.</li>
                </ul>
              </AppSection>
            </div>
          </TabsContent>

          <TabsContent value="summary" className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-3">
              <AppSection title="Сводка расчётов" icon={Scale}>
                <div className="space-y-3 text-sm text-slate-700">
                  <SummaryRow label="ИМТ" value={derived.bmi !== null ? derived.bmi.toFixed(1) : "—"} />
                  <SummaryRow label="HOMA-IR" value={derived.homa !== null ? derived.homa.toFixed(2) : "—"} />
                  <SummaryRow label="Целевой верхний вес" value={derived.idealMaxWeight !== null ? `${derived.idealMaxWeight.toFixed(1)} кг` : "—"} />
                  <SummaryRow label="Ориентир по белку" value={derived.proteinTarget !== null ? `${derived.proteinTarget} г/сут` : "—"} />
                  <SummaryRow label="Ориентир по воде" value={derived.waterMin !== null ? `${derived.waterMin} л/сут` : "—"} />
                </div>
              </AppSection>

              <AppSection title="Логика назначения" icon={Pill}>
                <div className="space-y-3 text-sm text-slate-700 leading-6">
                  <p>План на вкладке “12 недель” автоматически меняется при вводе массы тела, давления, глюкозы, инсулина, витамина D, АСТ/АЛТ и креатинина.</p>
                  <p>Если анализы ещё не сданы, остаются справочные подсказки и список обязательных исследований.</p>
                </div>
              </AppSection>

              <AppSection title="Сохранение" icon={Save}>
                <div className="space-y-3 text-sm text-slate-700 leading-6">
                  <p>Сейчас включено локальное автосохранение в браузере.</p>
                  <p>Если пользователь откроет страницу на том же устройстве и в том же браузере, введённые данные подтянутся автоматически.</p>
                  <p>Для общего облачного хранения позже можно подключить Firebase, Supabase или Google Sheets API.</p>
                </div>
              </AppSection>
            </div>
          </TabsContent>

          <TabsContent value="labs" className="space-y-6">
            <AppSection title="Рекомендуемые анализы Инвитро" icon={TestTube2}>
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {labCatalog.map((item) => (
                  <div key={item.code} className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-semibold">{item.name}</div>
                      <Badge variant="outline">{item.code}</Badge>
                    </div>
                    <div className="mt-2 text-sm text-slate-600">{item.why}</div>
                    <div className="mt-2 text-xs text-slate-500">Референс: {item.ref}</div>
                  </div>
                ))}
              </div>
            </AppSection>
          </TabsContent>

          <TabsContent value="plan" className="space-y-6">
            <AppSection title="12-недельный шаблон" icon={CalendarRange} right={<Button variant="outline" onClick={() => window.print()} disabled={!accepted}>Печать</Button>}>
              <div className="space-y-4">
                {plan.map((item) => (
                  <div key={item.week} className="rounded-2xl border bg-white p-4 shadow-sm">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div>
                        <div className="text-lg font-semibold">Неделя {item.week}</div>
                        <div className="text-sm text-slate-600">{item.notes}</div>
                      </div>
                      <Badge className="bg-slate-900">{item.tirz}</Badge>
                    </div>
                    <div className="mt-4 grid gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="mb-2 font-medium">Утро</div>
                        <ul className="space-y-2 text-sm text-slate-700">
                          {item.morning.map((m) => <li key={m}>• {m}</li>)}
                        </ul>
                      </div>
                      <div className="rounded-2xl bg-slate-50 p-4">
                        <div className="mb-2 font-medium">Вечер</div>
                        <ul className="space-y-2 text-sm text-slate-700">
                          {item.evening.map((m) => <li key={m}>• {m}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AppSection>

            <AppSection title="Контрольные точки" icon={ClipboardList}>
              <div className="grid gap-3">
                {checkpoints.map((item) => (
                  <div key={item} className="rounded-2xl border bg-white p-4 text-sm text-slate-700">{item}</div>
                ))}
              </div>
            </AppSection>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </div>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

function Metric({ label, value, helper }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-sm text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-bold">{value}</div>
      <div className="mt-1 text-xs text-slate-500">{helper}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-2">
      <div className="text-slate-500">{label}</div>
      <div className="font-semibold text-slate-900">{value}</div>
    </div>
  );
}
