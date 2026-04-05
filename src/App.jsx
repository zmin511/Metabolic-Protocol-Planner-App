import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ClipboardList,
  HeartPulse,
  Scale,
  TestTube2,
  Pill,
  CalendarRange,
  Info,
  Save,
  RotateCcw,
  Droplets,
  Link as LinkIcon,
  TrendingUp,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const STORAGE_KEY = "metabolic-protocol-planner-v3";
const APP_VERSION = "Альфа 05.04.02";
const DEVELOPER_EMAIL = "zmin511@gmail.com";
const GITHUB_URL = "https://github.com/zmin511/Metabolic-Protocol-Planner-App";

// Palette inspired by the Promedica website/logo look: dark blue, teal, white, warm highlight.
const COLORS = {
  primary: "#173b6d",
  primarySoft: "#e8eef8",
  accent: "#1db7aa",
  accentSoft: "#e8faf7",
  warn: "#fff4d8",
  surface: "#ffffff",
  surfaceAlt: "#f7fafc",
  border: "#dbe5ef",
  text: "#16324f",
  textMuted: "#5f7591",
  danger: "#f8d7df",
  dangerText: "#9f2f4a",
  success: "#dff5e8",
  successText: "#1f7a45",
};

const labCatalog = [
  { code: "06-009", name: "Глюкоза", why: "Базовая оценка углеводного обмена", ref: "4.1–6.0 ммоль/л", min: 4.1, max: 6.0, monitor: true },
  { code: "06-015", name: "Инсулин", why: "Нужен для оценки инсулинорезистентности", ref: "2.7–10.4 мкЕд/мл", min: 2.7, max: 10.4, monitor: true },
  { code: "06-021", name: "Холестерин общий", why: "Общий кардиометаболический риск", ref: "желательно < 5.0 ммоль/л", max: 5.0, monitor: true },
  { code: "06-028", name: "Холестерин ЛПНП", why: "Оценка атерогенного риска", ref: "желательно < 3.0 ммоль/л", max: 3.0, monitor: true },
  { code: "06-027", name: "Холестерин ЛПВП", why: "Защитный липидный фактор", ref: "муж. > 1.0 / жен. > 1.2", monitor: true },
  { code: "06-023", name: "Триглицериды", why: "Маркер инсулинорезистентности и кардиориска", ref: "< 1.7 ммоль/л", max: 1.7, monitor: true },
  { code: "06-010", name: "АлАТ", why: "Контроль печени и жирового гепатоза", ref: "< 41 Ед/л", max: 41, monitor: true },
  { code: "06-011", name: "АсАТ", why: "Контроль печени и метаболической нагрузки", ref: "< 37 Ед/л", max: 37, monitor: true },
  { code: "06-012", name: "Билирубин общий", why: "Базовый печеночный скрининг", ref: "3.4–20.5 мкмоль/л", min: 3.4, max: 20.5, monitor: false },
  { code: "06-020", name: "Креатинин", why: "Оценка функции почек", ref: "64–104 мкмоль/л", min: 64, max: 104, monitor: true },
  { code: "06-018", name: "Мочевина", why: "Косвенно отражает белковую нагрузку и гидратацию", ref: "2.1–7.1 ммоль/л", min: 2.1, max: 7.1, monitor: false },
  { code: "06-034", name: "Мочевая кислота", why: "Риск подагры, особенно при похудении", ref: "210–420 мкмоль/л", min: 210, max: 420, monitor: true },
  { code: "06-051", name: "ТТГ", why: "Исключение тиреоидной причины колебаний веса", ref: "0.4–4.0 мМЕ/л", min: 0.4, max: 4.0, monitor: false },
  { code: "06-052", name: "Т4 свободный", why: "Уточнение функции щитовидной железы", ref: "9–19.05 пмоль/л", min: 9, max: 19.05, monitor: false },
  { code: "06-076", name: "Витамин D (25-OH)", why: "Оценка дефицита и подбор поддерживающей дозы", ref: "30–100 нг/мл", min: 30, max: 100, monitor: true },
  { code: "06-036", name: "Ферритин", why: "Запасы железа и риск скрытого дефицита", ref: "индивидуально", monitor: false },
  { code: "06-039", name: "СРБ", why: "Оценка хронического воспаления", ref: "обычно < 5 мг/л", max: 5, monitor: false },
];

const emptyLabValues = Object.fromEntries(labCatalog.map((item) => [item.code, { baseline: "", control1: "", control2: "" }]));

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
  startDate: "",
  baselineDate: "",
  control1Date: "",
  control2Date: "",
  useTirzepatide: true,
  labs: emptyLabValues,
  diary: [
    { date: "", weight: "", waist: "", systolic: "", diastolic: "" },
  ],
};

function num(v) {
  if (v === "" || v === null || typeof v === "undefined") return null;
  const n = Number(String(v).replace(",", "."));
  return Number.isFinite(n) ? n : null;
}

function addMonths(dateStr, months) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return "";
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 10);
}

function evaluateValue(item, value, sex) {
  const n = num(value);
  if (n === null) return "neutral";
  if (item.code === "06-027") {
    const min = sex === "female" ? 1.2 : 1.0;
    return n >= min ? "good" : "bad";
  }
  if (typeof item.min === "number" && n < item.min) return "bad";
  if (typeof item.max === "number" && n > item.max) return "bad";
  return "good";
}

function displayDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("ru-RU");
}

export default function App() {
  const [tab, setTab] = useState("input");
  const [data, setData] = useState(emptyData);
  const [accepted, setAccepted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        setData({
          ...emptyData,
          ...parsed,
          labs: { ...emptyLabValues, ...(parsed.labs || {}) },
          diary: parsed.diary?.length ? parsed.diary : emptyData.diary,
        });
      }
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data, loaded]);

  useEffect(() => {
    if (data.baselineDate && !data.control1Date) {
      setData((prev) => ({ ...prev, control1Date: addMonths(prev.baselineDate, 3) }));
    }
  }, [data.baselineDate]);

  useEffect(() => {
    if (data.control1Date && !data.control2Date) {
      setData((prev) => ({ ...prev, control2Date: addMonths(prev.control1Date, 3) }));
    }
  }, [data.control1Date]);

  const setField = (field, value) => setData((prev) => ({ ...prev, [field]: value }));

  const setLabValue = (code, key, value) =>
    setData((prev) => ({
      ...prev,
      labs: {
        ...prev.labs,
        [code]: {
          ...(prev.labs?.[code] || { baseline: "", control1: "", control2: "" }),
          [key]: value,
        },
      },
    }));

  const setDiaryValue = (index, key, value) =>
    setData((prev) => ({
      ...prev,
      diary: prev.diary.map((row, i) => (i === index ? { ...row, [key]: value } : row)),
    }));

  const addDiaryRow = () =>
    setData((prev) => ({
      ...prev,
      diary: [...prev.diary, { date: "", weight: "", waist: "", systolic: "", diastolic: "" }],
    }));

  const removeDiaryRow = (index) =>
    setData((prev) => ({
      ...prev,
      diary: prev.diary.length === 1 ? prev.diary : prev.diary.filter((_, i) => i !== index),
    }));

  const resetAll = () => {
    setData(emptyData);
    localStorage.removeItem(STORAGE_KEY);
  };

  const d = useMemo(() => {
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
    const excessWeight = bmi && weight && bmi > 24.9 ? weight - idealMaxWeight : null;
    const homa = glucose && insulin ? (glucose * insulin) / 22.5 : null;

    const triglycerideRisk = tg !== null ? tg >= 1.7 : false;
    const hdlLow = hdl !== null ? ((data.sex === "male" && hdl < 1.0) || (data.sex === "female" && hdl < 1.2)) : false;
    const ir = homa !== null ? homa >= 2.7 || (insulin !== null && insulin > 10.4) : false;
    const liverStress = (ast !== null && ast > 37) || (alt !== null && alt > 41);
    const hyperuricemia = uric !== null ? uric > 420 : false;
    const waistHigh = waist !== null ? ((data.sex === "male" && waist >= 94) || (data.sex === "female" && waist >= 80)) : false;
    const bpHigh = (systolic !== null && systolic >= 135) || (diastolic !== null && diastolic >= 85);

    const flags = [ir, triglycerideRisk, hdlLow, waistHigh, bpHigh].filter(Boolean).length;

    let riskLevel = "Недостаточно данных";
    if (height || weight || glucose || insulin || tg || hdl || systolic || diastolic) {
      riskLevel = flags >= 4 ? "Высокий" : flags >= 2 ? "Умеренный" : "Низкий";
    }

    let vitaminDPlan = "Введите уровень витамина D";
    if (vitaminD !== null) {
      if (vitaminD < 20) vitaminDPlan = "10000 МЕ/сут 6–8 недель, затем 4000 МЕ/сут";
      else if (vitaminD < 30) vitaminDPlan = "5000–10000 МЕ/сут 4–6 недель, затем 2000–4000 МЕ/сут";
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
      triglycerideRisk,
      hdlLow,
      ir,
      liverStress,
      hyperuricemia,
      waistHigh,
      bpHigh,
      flags,
      riskLevel,
      vitaminDPlan,
      proteinMin,
      proteinTarget,
      waterMin,
      canEscalate,
    };
  }, [data]);

  const plan = useMemo(() => {
    const weight = num(data.weight);
    const insulin = num(data.insulin);
    const vitaminD = num(data.vitaminD);
    const insulinHigh = insulin !== null && d.homa !== null ? insulin >= 15 || d.homa >= 3.5 : false;
    const liverDose = d.liverStress ? (weight !== null && weight >= 100 ? "500 мг 2 раза в день" : "500 мг 1 раз в день") : "по ситуации";
    const inositolDose = insulinHigh ? "2000 мг 2 раза в день" : "1000 мг 2 раза в день";
    const alaDose = insulinHigh ? "300 мг утром, при переносимости до 600 мг/сут" : "300 мг утром";
    const vitaminDStart = vitaminD === null ? "после анализа" : vitaminD < 20 ? "10000 МЕ/сут" : vitaminD < 30 ? "5000–10000 МЕ/сут" : "2000 МЕ/сут";
    const week9Dose = d.canEscalate && (insulinHigh || (weight !== null && weight >= 100)) ? "5 мг или 7.5 мг при плато" : "оставить 5 мг";

    return Array.from({ length: 12 }, (_, idx) => {
      const week = idx + 1;
      let tirz = "не назначено";
      if (data.useTirzepatide) {
        if (week <= 4) tirz = "Тирзепатид 2.5 мг 1 раз в неделю";
        else if (week <= 8) tirz = "Тирзепатид 5 мг 1 раз в неделю";
        else tirz = `Тирзепатид: ${week9Dose}`;
      }

      let vitD = week <= 6 ? vitaminDStart : "2000–4000 МЕ/сут";
      if (vitaminD !== null && vitaminD >= 30) vitD = "2000 МЕ/сут";

      return {
        week,
        tirz,
        notes: week <= 4 ? "Фаза адаптации" : week <= 8 ? "Рабочая фаза" : "Фаза пересмотра",
        morning: [
          { name: `Витамин D: ${vitD}`, why: "Коррекция дефицита и поддержка метаболизма" },
          { name: `Альфа-липоевая кислота: ${alaDose}`, why: "Поддержка чувствительности к инсулину и антиоксидантная защита" },
          { name: `Инозит: ${inositolDose.split(" 2 раза в день")[0]}`, why: "Поддержка углеводного обмена и инсулинорезистентности" },
        ],
        evening: [
          { name: `Инозит: ${inositolDose.split(" 2 раза в день")[0]}`, why: "Поддержка углеводного обмена и инсулинорезистентности" },
          { name: "Магний: 300–400 мг", why: "Поддержка нервной системы, давления и мышечного баланса" },
          { name: `Урсодезоксихолевая кислота: ${liverDose}`, why: "Поддержка печени и желчного обмена" },
        ],
      };
    });
  }, [data, d]);

  const monitorLabs = labCatalog.filter((i) => i.monitor);
  const baselineDone = Object.values(data.labs || {}).some((v) => v?.baseline);
  const control1Done = Object.values(data.labs || {}).some((v) => v?.control1);
  const control2Done = Object.values(data.labs || {}).some((v) => v?.control2);

  const chartData = useMemo(() => {
    return (data.diary || [])
      .filter((row) => row.date)
      .map((row) => ({
        date: displayDate(row.date),
        weight: num(row.weight),
        waist: num(row.waist),
        systolic: num(row.systolic),
        diastolic: num(row.diastolic),
      }));
  }, [data.diary]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.hero}>
          <div>
            <div style={styles.heroBadge}><Activity size={16} /> Метаболический планировщик</div>
            <h1 style={{ margin: "12px 0 8px", fontSize: "clamp(24px, 4vw, 36px)" }}>Мини-приложение для старта терапии</h1>
            <p style={{ margin: 0, color: "#d6e2f2", maxWidth: 900, fontSize: "clamp(14px, 2vw, 16px)" }}>
              Все поля пустые при первом открытии. Пользователь сам вводит параметры и получает расчёты, список анализов,
              подсветку отклонений, журнал веса/талии/давления и ориентировочный план действий на 12 недель.
            </p>
          </div>
          <div style={{ display: "grid", gap: 8, justifyItems: "end" }}>
            <div style={styles.version}>{APP_VERSION}</div>
            <div style={styles.developer}>Связь с разработчиком: {DEVELOPER_EMAIL}</div>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" style={styles.githubLink}><LinkIcon size={14} /> GitHub проекта</a>
          </div>
        </div>

        <div style={styles.warning}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 700, color: COLORS.primary }}>
            <Info size={18} /> Важно
          </div>
          <p style={{ marginTop: 10, color: COLORS.text }}>
            Это образовательный шаблон, а не медицинское назначение. Любые дозировки и препараты нужно подтверждать у врача.
          </p>
          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>Понимаю, что приложение не заменяет очный приём.</span>
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button style={styles.secondaryButton} onClick={resetAll}><RotateCcw size={16} /> Очистить всё</button>
            <div style={styles.savePill}><Save size={14} /> Автосохранение в браузере</div>
          </div>
        </div>

        <div style={styles.tabs}>
          {[
            ["input", "Ввод и расчёт"],
            ["labs", "Контроль анализов"],
            ["summary", "Сводка"],
            ["plan", "Действия на 12 недель"],
          ].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={tab === key ? styles.tabActive : styles.tab}>{label}</button>
          ))}
        </div>

        {tab === "input" && (
          <>
            <div style={styles.grid2}>
              <Card title="Анкета" icon={<ClipboardList size={18} />}>
                <div style={styles.formGrid}>
                  <Field label="Дата старта терапии" value={data.startDate} onChange={(v) => setField("startDate", v)} type="date" />
                  <Field label="Дата базовых анализов" value={data.baselineDate} onChange={(v) => setField("baselineDate", v)} type="date" />
                  <Field label="Контроль через 3 месяца" value={data.control1Date} onChange={(v) => setField("control1Date", v)} type="date" />
                  <Field label="Следующий контроль" value={data.control2Date} onChange={(v) => setField("control2Date", v)} type="date" />
                  <Field label="Возраст" value={data.age} onChange={(v) => setField("age", v)} placeholder="35" />
                  <SelectField label="Пол" value={data.sex} onChange={(v) => setField("sex", v)} options={[{ value: "male", label: "Мужской" }, { value: "female", label: "Женский" }]} />
                  <Field label="Рост, см" value={data.height} onChange={(v) => setField("height", v)} placeholder="175" />
                  <Field label="Вес, кг" value={data.weight} onChange={(v) => setField("weight", v)} placeholder="107" />
                  <Field label="Талия, см" value={data.waist} onChange={(v) => setField("waist", v)} placeholder="110" />
                  <Field label="Систолическое АД" value={data.systolic} onChange={(v) => setField("systolic", v)} placeholder="135" />
                  <Field label="Диастолическое АД" value={data.diastolic} onChange={(v) => setField("diastolic", v)} placeholder="85" />
                  <SelectField label="Тирзепатид в плане" value={String(data.useTirzepatide)} onChange={(v) => setField("useTirzepatide", v === "true")} options={[{ value: "true", label: "Да" }, { value: "false", label: "Нет" }]} />
                </div>
              </Card>

              <Card title="Быстрый ввод ключевых анализов" icon={<TestTube2 size={18} />}>
                <div style={styles.formGrid}>
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
              </Card>
            </div>

            <div style={styles.grid3}>
              <Card title="Ключевые показатели" icon={<Scale size={18} />}>
                <Metric label="ИМТ" value={d.bmi !== null ? d.bmi.toFixed(1) : "—"} helper={d.bmi === null ? "введите рост и вес" : d.bmi >= 30 ? "ожирение" : d.bmi >= 25 ? "избыточный вес" : "норма"} />
                <Metric label="HOMA-IR" value={d.homa !== null ? d.homa.toFixed(2) : "—"} helper={d.homa === null ? "введите глюкозу и инсулин" : d.homa >= 2.7 ? "повышен" : "в пределах цели"} />
                <Metric label="Идеальный верхний вес" value={d.idealMaxWeight !== null ? `${d.idealMaxWeight.toFixed(1)} кг` : "—"} helper="по ИМТ 24.9" />
                <Metric label="Избыточный вес" value={d.excessWeight !== null ? `${d.excessWeight.toFixed(1)} кг` : "—"} helper="ориентировочно" />
                <Metric label="Белок/сут" value={d.proteinTarget !== null ? `${d.proteinTarget} г` : "—"} helper={d.proteinMin !== null ? `минимум ${d.proteinMin} г` : "введите вес"} />
                <Metric label="Вода/сут" value={d.waterMin !== null ? `${d.waterMin} л` : "—"} helper="минимум" />
              </Card>

              <Card title="Флаги риска" icon={<HeartPulse size={18} />}>
                <div style={{ marginBottom: 12 }}>{badgeForRisk(d.riskLevel)}</div>
                <div style={styles.badgesWrap}>
                  {d.ir && <Flag label="Инсулинорезистентность" tone="bad" />}
                  {d.triglycerideRisk && <Flag label="Триглицериды повышены" tone="warn" />}
                  {d.hdlLow && <Flag label="ЛПВП низкий" tone="warn" />}
                  {d.liverStress && <Flag label="Нагрузка на печень" tone="warn" />}
                  {d.hyperuricemia && <Flag label="Мочевая кислота повышена" tone="warn" />}
                  {d.waistHigh && <Flag label="Абдоминальное ожирение" tone="bad" />}
                  {d.bpHigh && <Flag label="Давление требует контроля" tone="warn" />}
                  {d.flags === 0 && <Flag label="Заполните данные для оценки" tone="info" />}
                </div>
              </Card>

              <Card title="Быстрые рекомендации" icon={<Droplets size={18} />}>
                <ul style={styles.list}>
                  <li><b>Витамин D:</b> {d.vitaminDPlan}</li>
                  <li><b>Белок:</b> при слабом аппетите добавлять творог, йогурт, рыбу, протеин.</li>
                  <li><b>Вода:</b> пить по расписанию, а не только по жажде.</li>
                  <li><b>Повышение дозы:</b> только при плато и хорошей переносимости.</li>
                </ul>
              </Card>
            </div>
          </>
        )}

        {tab === "labs" && (
          <>
            <Card title="Единый блок контроля анализов" icon={<TestTube2 size={18} />}>
              <div style={styles.textBlock}>Базовые анализы обычно сдаются перед стартом терапии. Контрольные — через 3 месяца, затем ещё через 3 месяца. Для контроля обычно достаточно ключевых анализов: глюкоза, инсулин, липидный профиль, АСТ/АЛТ, креатинин, мочевая кислота и витамин D.</div>
              <div style={{ display: "grid", gap: 10 }}>
                <SummaryRow label="Базовые анализы" value={displayDate(data.baselineDate)} />
                <SummaryRow label="Контроль 1" value={displayDate(data.control1Date)} />
                <SummaryRow label="Контроль 2" value={displayDate(data.control2Date)} />
              </div>
              <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
                {!baselineDone && <Flag label="Заполните базовые значения анализов" tone="info" />}
                {baselineDone && !control1Done && <Flag label="Подготовьте контроль через 3 месяца" tone="warn" />}
                {control1Done && !control2Done && <Flag label="Следующий контроль ещё через 3 месяца" tone="warn" />}
                {control2Done && <Flag label="Есть минимум два этапа контроля" tone="good" />}
              </div>
            </Card>

            <Card title="Таблица анализов" icon={<ClipboardList size={18} />}>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Код</th>
                      <th style={styles.th}>Анализ</th>
                      <th style={styles.th}>Для чего нужен</th>
                      <th style={styles.th}>Референс</th>
                      <th style={styles.th}>База</th>
                      <th style={styles.th}>Контроль 1</th>
                      <th style={styles.th}>Контроль 2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {labCatalog.map((item) => (
                      <tr key={item.code}>
                        <td style={styles.td}>{item.code}</td>
                        <td style={styles.td}><b>{item.name}</b></td>
                        <td style={styles.td}>{item.why}</td>
                        <td style={styles.td}>{item.ref}</td>
                        <td style={{ ...styles.td, ...cellStyle(evaluateValue(item, data.labs?.[item.code]?.baseline, data.sex)) }}><input style={styles.tableInput} value={data.labs?.[item.code]?.baseline || ""} onChange={(e) => setLabValue(item.code, "baseline", e.target.value)} /></td>
                        <td style={{ ...styles.td, ...cellStyle(evaluateValue(item, data.labs?.[item.code]?.control1, data.sex)) }}><input style={styles.tableInput} value={data.labs?.[item.code]?.control1 || ""} onChange={(e) => setLabValue(item.code, "control1", e.target.value)} /></td>
                        <td style={{ ...styles.td, ...cellStyle(evaluateValue(item, data.labs?.[item.code]?.control2, data.sex)) }}><input style={styles.tableInput} value={data.labs?.[item.code]?.control2 || ""} onChange={(e) => setLabValue(item.code, "control2", e.target.value)} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={styles.textBlock}>Зелёная ячейка — значение в референсе. Розовая — есть отклонение. Для повторного контроля обычно достаточно ключевых анализов: {monitorLabs.map((i) => i.name).join(", ")}.</div>
              </div>
            </Card>
          </>
        )}

        {tab === "summary" && (
          <div style={styles.grid3}>
            <Card title="Сводка расчётов" icon={<Scale size={18} />}>
              <SummaryRow label="ИМТ" value={d.bmi !== null ? d.bmi.toFixed(1) : "—"} />
              <SummaryRow label="HOMA-IR" value={d.homa !== null ? d.homa.toFixed(2) : "—"} />
              <SummaryRow label="Целевой верхний вес" value={d.idealMaxWeight !== null ? `${d.idealMaxWeight.toFixed(1)} кг` : "—"} />
              <SummaryRow label="Ориентир по белку" value={d.proteinTarget !== null ? `${d.proteinTarget} г/сут` : "—"} />
              <SummaryRow label="Ориентир по воде" value={d.waterMin !== null ? `${d.waterMin} л/сут` : "—"} />
            </Card>

            <Card title="Логика назначения" icon={<Pill size={18} />}>
              <div style={styles.textBlock}>План на вкладке “Действия на 12 недель” автоматически меняется при вводе массы тела, давления, глюкозы, инсулина, витамина D, АСТ/АЛТ и креатинина.</div>
              <div style={styles.textBlock}>Если анализы ещё не сданы, остаются справочные подсказки и список обязательных исследований.</div>
            </Card>

            <Card title="Сохранение" icon={<Save size={18} />}>
              <div style={styles.textBlock}>Сейчас включено локальное автосохранение в браузере.</div>
              <div style={styles.textBlock}>На том же устройстве и в том же браузере данные подтянутся автоматически.</div>
              <div style={styles.textBlock}>Никакие данные на внешний сервер не отправляются.</div>
            </Card>
          </div>
        )}

        {tab === "plan" && (
          <>
            <Card title="Действия пациента в течение 12 недель" icon={<CalendarRange size={18} />} right={<button style={styles.secondaryButton} onClick={() => window.print()} disabled={!accepted}>Печать</button>}>
              <div style={{ display: "grid", gap: 16 }}>
                {plan.map((w) => (
                  <div key={w.week} style={styles.weekCard}>
                    <div style={styles.weekHeader}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 18 }}>Неделя {w.week}</div>
                        <div style={{ color: COLORS.textMuted, fontSize: 13 }}>{w.notes}</div>
                      </div>
                      <div style={styles.darkBadge}>{w.tirz}</div>
                    </div>
                    <div style={styles.weekGrid}>
                      <div style={styles.weekCol}>
                        <div style={styles.weekColTitle}>Утро</div>
                        <ul style={styles.list}>
                          {w.morning.map((m) => <li key={m.name}><b>{m.name}</b><div style={{ fontSize: 12, color: COLORS.textMuted }}>{m.why}</div></li>)}
                        </ul>
                      </div>
                      <div style={styles.weekCol}>
                        <div style={styles.weekColTitle}>Вечер</div>
                        <ul style={styles.list}>
                          {w.evening.map((m) => <li key={m.name}><b>{m.name}</b><div style={{ fontSize: 12, color: COLORS.textMuted }}>{m.why}</div></li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Журнал веса, талии и давления" icon={<TrendingUp size={18} />}>
              <div style={styles.tableWrap}>
                <table style={styles.table}>
                  <thead>
                    <tr>
                      <th style={styles.th}>Дата</th>
                      <th style={styles.th}>Вес</th>
                      <th style={styles.th}>Талия</th>
                      <th style={styles.th}>Систола</th>
                      <th style={styles.th}>Диастола</th>
                      <th style={styles.th}>Действие</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.diary.map((row, index) => (
                      <tr key={index}>
                        <td style={styles.td}><input style={styles.tableInputWide} type="date" value={row.date} onChange={(e) => setDiaryValue(index, "date", e.target.value)} /></td>
                        <td style={styles.td}><input style={styles.tableInput} value={row.weight} onChange={(e) => setDiaryValue(index, "weight", e.target.value)} /></td>
                        <td style={styles.td}><input style={styles.tableInput} value={row.waist} onChange={(e) => setDiaryValue(index, "waist", e.target.value)} /></td>
                        <td style={styles.td}><input style={styles.tableInput} value={row.systolic} onChange={(e) => setDiaryValue(index, "systolic", e.target.value)} /></td>
                        <td style={styles.td}><input style={styles.tableInput} value={row.diastolic} onChange={(e) => setDiaryValue(index, "diastolic", e.target.value)} /></td>
                        <td style={styles.td}><button style={styles.removeButton} onClick={() => removeDiaryRow(index)}>Удалить</button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div style={{ marginTop: 12, display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button style={styles.secondaryButton} onClick={addDiaryRow}>Добавить строку</button>
              </div>

              <div style={styles.chartGrid}>
                <ChartCard title="Вес" data={chartData} dataKey="weight" stroke={COLORS.primary} />
                <ChartCard title="Талия" data={chartData} dataKey="waist" stroke={COLORS.accent} />
                <ChartCard title="Систолическое давление" data={chartData} dataKey="systolic" stroke="#d17a00" />
              </div>
            </Card>

            <Card title="Контрольные точки" icon={<ClipboardList size={18} />}>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  "Перед стартом: антропометрия, давление, исходные анализы",
                  "Неделя 4: вес, талия, давление, переносимость",
                  "Неделя 12: первый лабораторный контроль, если прошло около 3 месяцев",
                  "Следующие 12 недель: повторный цикл и следующий лабораторный контроль",
                ].map((item) => (
                  <div key={item} style={styles.checkpoint}>{item}</div>
                ))}
              </div>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}

function Card({ title, icon, children, right }) {
  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={styles.iconBox}>{icon}</div>
          <div style={{ fontWeight: 700, fontSize: 22, color: COLORS.primary }}>{title}</div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function ChartCard({ title, data, dataKey, stroke }) {
  return (
    <div style={styles.chartCard}>
      <div style={styles.chartTitle}>{title}</div>
      <div style={{ width: "100%", height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5edf5" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} width={40} />
            <Tooltip />
            <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={3} dot={{ r: 4 }} connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input style={styles.input} type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <select style={styles.input} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </label>
  );
}

function Metric({ label, value, helper }) {
  return (
    <div style={styles.metric}>
      <div style={{ fontSize: 13, color: COLORS.textMuted }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4, color: COLORS.primary }}>{value}</div>
      <div style={{ fontSize: 12, color: COLORS.textMuted, marginTop: 4 }}>{helper}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={styles.summaryRow}>
      <span style={{ color: COLORS.textMuted }}>{label}</span>
      <b style={{ color: COLORS.primary }}>{value}</b>
    </div>
  );
}

function Flag({ label, tone }) {
  const colors = {
    good: { bg: COLORS.success, text: COLORS.successText },
    warn: { bg: COLORS.warn, text: "#8b5b00" },
    bad: { bg: COLORS.danger, text: COLORS.dangerText },
    info: { bg: COLORS.primarySoft, text: COLORS.primary },
  };
  return <span style={{ ...styles.flag, background: colors[tone].bg, color: colors[tone].text }}>{label}</span>;
}

function badgeForRisk(risk) {
  const tone = risk === "Высокий" ? "bad" : risk === "Умеренный" ? "warn" : risk === "Низкий" ? "good" : "info";
  return <Flag label={risk} tone={tone} />;
}

function cellStyle(state) {
  if (state === "good") return { background: COLORS.success };
  if (state === "bad") return { background: COLORS.danger };
  return {};
}

const styles = {
  page: { minHeight: "100vh", background: "#f4f8fb", padding: 12 },
  container: { maxWidth: 1400, margin: "0 auto", display: "grid", gap: 16 },
  hero: {
    background: `linear-gradient(90deg, ${COLORS.primary}, #2f5a94)`,
    color: "white",
    borderRadius: 20,
    padding: 18,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
    flexWrap: "wrap",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.14)",
    fontSize: 13,
  },
  version: {
    whiteSpace: "nowrap",
    background: "rgba(255,255,255,0.14)",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 13,
  },
  developer: { fontSize: 12, color: "#dce7f5" },
  githubLink: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    color: "white",
    background: "rgba(255,255,255,0.12)",
    padding: "8px 12px",
    borderRadius: 999,
    fontSize: 13,
  },
  warning: {
    background: COLORS.warn,
    border: `1px solid #f0d48d`,
    borderRadius: 20,
    padding: 16,
  },
  checkboxRow: { display: "flex", gap: 10, alignItems: "flex-start", marginTop: 10, color: COLORS.text },
  tabs: { display: "flex", flexWrap: "wrap", gap: 8, background: COLORS.surface, padding: 8, borderRadius: 16, overflowX: "auto" },
  tab: { border: "none", background: "transparent", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontSize: 14, color: COLORS.primary },
  tabActive: { border: "none", background: COLORS.primary, color: "white", padding: "10px 14px", borderRadius: 12, cursor: "pointer", fontSize: 14 },
  card: { background: COLORS.surface, borderRadius: 18, padding: 16, boxShadow: "0 1px 4px rgba(15,23,42,0.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" },
  iconBox: { background: COLORS.primarySoft, color: COLORS.primary, borderRadius: 14, padding: 10, display: "flex", alignItems: "center" },
  grid2: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 320px), 1fr))" },
  grid3: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 260px), 1fr))" },
  chartGrid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 280px), 1fr))", marginTop: 16 },
  chartCard: { border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 12, background: COLORS.surfaceAlt },
  chartTitle: { fontWeight: 700, color: COLORS.primary, marginBottom: 8 },
  formGrid: { display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 180px), 1fr))" },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 13, color: COLORS.text },
  input: { height: 40, borderRadius: 10, border: `1px solid ${COLORS.border}`, padding: "0 12px", background: COLORS.surface, minWidth: 0, color: COLORS.text },
  metric: { border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 14, marginBottom: 12, background: COLORS.surfaceAlt },
  badgesWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  flag: { display: "inline-block", padding: "7px 10px", borderRadius: 999, fontSize: 13, fontWeight: 600 },
  list: { margin: 0, paddingLeft: 18, display: "grid", gap: 8, color: COLORS.text },
  textBlock: { background: COLORS.surfaceAlt, borderRadius: 14, padding: 14, marginBottom: 10, color: COLORS.text, lineHeight: 1.55 },
  summaryRow: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", background: COLORS.surfaceAlt, borderRadius: 12, padding: "10px 12px", marginBottom: 10, flexWrap: "wrap" },
  weekCard: { border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: 16 },
  weekHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14, flexWrap: "wrap" },
  darkBadge: { background: COLORS.primary, color: "white", borderRadius: 999, padding: "6px 10px", fontSize: 13 },
  weekGrid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 240px), 1fr))" },
  weekCol: { background: COLORS.surfaceAlt, borderRadius: 14, padding: 14 },
  weekColTitle: { fontWeight: 700, marginBottom: 8, color: COLORS.primary },
  checkpoint: { border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: 14, background: COLORS.surface },
  secondaryButton: { height: 38, borderRadius: 10, border: `1px solid ${COLORS.border}`, background: COLORS.surface, padding: "0 14px", display: "inline-flex", alignItems: "center", gap: 8, cursor: "pointer", color: COLORS.primary },
  removeButton: { height: 34, borderRadius: 8, border: `1px solid ${COLORS.border}`, background: COLORS.danger, color: COLORS.dangerText, padding: "0 10px", cursor: "pointer" },
  savePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: COLORS.primarySoft,
    borderRadius: 999,
    padding: "8px 12px",
    color: COLORS.primary,
    fontSize: 14,
  },
  tableWrap: {
    overflowX: "auto",
    border: `1px solid ${COLORS.border}`,
    borderRadius: 16,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    minWidth: 980,
    fontSize: 14,
  },
  th: {
    textAlign: "left",
    padding: 10,
    background: COLORS.primarySoft,
    borderBottom: `1px solid ${COLORS.border}`,
    position: "sticky",
    top: 0,
    color: COLORS.primary,
  },
  td: {
    padding: 10,
    borderBottom: `1px solid ${COLORS.border}`,
    verticalAlign: "top",
    color: COLORS.text,
  },
  tableInput: {
    width: 110,
    height: 34,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    padding: "0 8px",
    background: COLORS.surface,
    color: COLORS.text,
  },
  tableInputWide: {
    width: 140,
    height: 34,
    borderRadius: 8,
    border: `1px solid ${COLORS.border}`,
    padding: "0 8px",
    background: COLORS.surface,
    color: COLORS.text,
  },
};
