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
} from "lucide-react";

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
  { code: "06-036", name: "Ферритин", why: "Запасы железа и риск скрытого дефицита", ref: "индивидуально" },
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

export default function App() {
  const [tab, setTab] = useState("input");
  const [data, setData] = useState(emptyData);
  const [accepted, setAccepted] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setData({ ...emptyData, ...JSON.parse(raw) });
    } catch {}
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {}
  }, [data, loaded]);

  const setField = (field, value) => setData((prev) => ({ ...prev, [field]: value }));
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
    const heavyCase = weight !== null ? weight >= 115 : false;
    const liverDose = d.liverStress ? (weight !== null && weight >= 100 ? "500 мг 2 раза в день" : "500 мг 1 раз в день") : "по ситуации";
    const inositolDose = insulinHigh ? "2000 мг 2 раза в день" : "1000 мг 2 раза в день";
    const alaDose = insulinHigh ? "300 мг утром, при переносимости до 600 мг/сут" : "300 мг утром";
    const vitaminDStart = vitaminD === null ? "после анализа" : vitaminD < 20 ? "10000 МЕ/сут" : vitaminD < 30 ? "5000–10000 МЕ/сут" : "2000 МЕ/сут";
    const week9Dose = d.canEscalate && (insulinHigh || (weight !== null && weight >= 100)) ? "5 мг или 7.5 мг при плато" : "оставить 5 мг";

    return Array.from({ length: 12 }, (_, idx) => {
      const week = idx + 1;
      let tirz = "не назначено";
      if (data.useTirzepatide) {
        if (week <= 4) tirz = "2.5 мг 1 раз в неделю";
        else if (week <= 8) tirz = `${heavyCase ? "5 мг" : "5 мг"} 1 раз в неделю`;
        else tirz = week9Dose;
      }

      let vitD = week <= 6 ? vitaminDStart : "2000–4000 МЕ/сут";
      if (vitaminD !== null && vitaminD >= 30) vitD = "2000 МЕ/сут";

      return {
        week,
        tirz,
        morning: [
          `Витамин D: ${vitD}`,
          `Альфа-липоевая кислота: ${alaDose}`,
          `Инозит: ${inositolDose.split(" 2 раза в день")[0]}`,
        ],
        evening: [
          `Инозит: ${inositolDose.split(" 2 раза в день")[0]}`,
          "Магний: 300–400 мг",
          `Урсодезоксихолевая кислота: ${liverDose}`,
        ],
      };
    });
  }, [data, d]);

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.hero}>
          <div>
            <div style={styles.heroBadge}><Activity size={16} /> Метаболический планировщик</div>
            <h1 style={{ margin: "12px 0 8px", fontSize: 36 }}>Мини-приложение для старта терапии</h1>
            <p style={{ margin: 0, color: "#cbd5e1", maxWidth: 900 }}>
              Все поля пустые при первом открытии. Пользователь сам вводит параметры и получает расчёты, список анализов,
              референсы и ориентировочный 12-недельный шаблон.
            </p>
          </div>
          <div style={styles.version}>Альфа 1.04.01</div>
        </div>

        <div style={styles.warning}>
          <div style={{ display: "flex", gap: 10, alignItems: "center", fontWeight: 700 }}>
            <Info size={18} /> Важно
          </div>
          <p style={{ marginTop: 10 }}>
            Это образовательный шаблон, а не медицинское назначение. Любые дозировки и препараты нужно подтверждать у врача.
          </p>
          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
            <span>Понимаю, что приложение не заменяет очный приём.</span>
          </label>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 12 }}>
            <button style={styles.secondaryButton} onClick={resetAll}>
              <RotateCcw size={16} /> Очистить всё
            </button>
            <div style={styles.savePill}><Save size={14} /> Автосохранение в браузере</div>
          </div>
        </div>

        <div style={styles.tabs}>
          {[
            ["input", "Ввод и расчёт"],
            ["summary", "Сводка"],
            ["labs", "Анализы"],
            ["plan", "12 недель"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              style={tab === key ? styles.tabActive : styles.tab}
            >
              {label}
            </button>
          ))}
        </div>

        {tab === "input" && (
          <>
            <div style={styles.grid2}>
              <Card title="Анкета" icon={<ClipboardList size={18} />}>
                <div style={styles.formGrid}>
                  <Field label="Возраст" value={data.age} onChange={(v) => setField("age", v)} placeholder="35" />
                  <SelectField label="Пол" value={data.sex} onChange={(v) => setField("sex", v)} options={[
                    { value: "male", label: "Мужской" },
                    { value: "female", label: "Женский" }
                  ]} />
                  <Field label="Рост, см" value={data.height} onChange={(v) => setField("height", v)} placeholder="175" />
                  <Field label="Вес, кг" value={data.weight} onChange={(v) => setField("weight", v)} placeholder="107" />
                  <Field label="Талия, см" value={data.waist} onChange={(v) => setField("waist", v)} placeholder="110" />
                  <Field label="Систолическое АД" value={data.systolic} onChange={(v) => setField("systolic", v)} placeholder="135" />
                  <Field label="Диастолическое АД" value={data.diastolic} onChange={(v) => setField("diastolic", v)} placeholder="85" />
                  <SelectField label="Тирзепатид в плане" value={String(data.useTirzepatide)} onChange={(v) => setField("useTirzepatide", v === "true")} options={[
                    { value: "true", label: "Да" },
                    { value: "false", label: "Нет" }
                  ]} />
                </div>
              </Card>

              <Card title="Лабораторные данные" icon={<TestTube2 size={18} />}>
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
              <div style={styles.textBlock}>
                План на вкладке “12 недель” автоматически меняется при вводе массы тела, давления, глюкозы,
                инсулина, витамина D, АСТ/АЛТ и креатинина.
              </div>
              <div style={styles.textBlock}>
                Если анализы ещё не сданы, остаются справочные подсказки и список обязательных исследований.
              </div>
            </Card>

            <Card title="Сохранение" icon={<Save size={18} />}>
              <div style={styles.textBlock}>Сейчас включено локальное автосохранение в браузере.</div>
              <div style={styles.textBlock}>На том же устройстве и в том же браузере данные подтянутся автоматически.</div>
              <div style={styles.textBlock}>Для облачного хранения позже можно подключить Supabase.</div>
            </Card>
          </div>
        )}

        {tab === "labs" && (
          <Card title="Рекомендуемые анализы Инвитро" icon={<TestTube2 size={18} />}>
            <div style={styles.labGrid}>
              {labCatalog.map((item) => (
                <div key={item.code} style={styles.labCard}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <div style={{ fontWeight: 700 }}>{item.name}</div>
                    <div style={styles.codeBadge}>{item.code}</div>
                  </div>
                  <div style={{ marginTop: 8, color: "#475569" }}>{item.why}</div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#64748b" }}>Референс: {item.ref}</div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {tab === "plan" && (
          <>
            <Card
              title="12-недельный шаблон"
              icon={<CalendarRange size={18} />}
              right={
                <button style={styles.secondaryButton} onClick={() => window.print()} disabled={!accepted}>
                  Печать
                </button>
              }
            >
              <div style={{ display: "grid", gap: 16 }}>
                {plan.map((w) => (
                  <div key={w.week} style={styles.weekCard}>
                    <div style={styles.weekHeader}>
                      <div style={{ fontWeight: 700, fontSize: 18 }}>Неделя {w.week}</div>
                      <div style={styles.darkBadge}>{w.tirz}</div>
                    </div>
                    <div style={styles.weekGrid}>
                      <div style={styles.weekCol}>
                        <div style={styles.weekColTitle}>Утро</div>
                        <ul style={styles.list}>
                          {w.morning.map((m) => <li key={m}>{m}</li>)}
                        </ul>
                      </div>
                      <div style={styles.weekCol}>
                        <div style={styles.weekColTitle}>Вечер</div>
                        <ul style={styles.list}>
                          {w.evening.map((m) => <li key={m}>{m}</li>)}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card title="Контрольные точки" icon={<ClipboardList size={18} />}>
              <div style={{ display: "grid", gap: 10 }}>
                {[
                  "Перед стартом: антропометрия, давление, исходные анализы",
                  "Неделя 4: вес, талия, давление, переносимость",
                  "Неделя 6–8: глюкоза, инсулин, HOMA, липиды, АСТ/АЛТ, мочевая кислота",
                  "Неделя 12: повтор ключевых анализов + витамин D",
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
          <div style={{ fontWeight: 700, fontSize: 22 }}>{title}</div>
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return (
    <label style={styles.field}>
      <span style={styles.label}>{label}</span>
      <input style={styles.input} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
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
      <div style={{ fontSize: 13, color: "#64748b" }}>{label}</div>
      <div style={{ fontSize: 28, fontWeight: 800, marginTop: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>{helper}</div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div style={styles.summaryRow}>
      <span style={{ color: "#64748b" }}>{label}</span>
      <b>{value}</b>
    </div>
  );
}

function Flag({ label, tone }) {
  const colors = {
    good: { bg: "#dcfce7", text: "#166534" },
    warn: { bg: "#fef3c7", text: "#92400e" },
    bad: { bg: "#ffe4e6", text: "#be123c" },
    info: { bg: "#e0f2fe", text: "#075985" },
  };
  return <span style={{ ...styles.flag, background: colors[tone].bg, color: colors[tone].text }}>{label}</span>;
}

function badgeForRisk(risk) {
  const tone = risk === "Высокий" ? "bad" : risk === "Умеренный" ? "warn" : risk === "Низкий" ? "good" : "info";
  return <Flag label={risk} tone={tone} />;
}

const styles = {
  page: { minHeight: "100vh", background: "#f8fafc", padding: 24 },
  container: { maxWidth: 1400, margin: "0 auto", display: "grid", gap: 24 },
  hero: {
    background: "linear-gradient(90deg, #0f172a, #334155)",
    color: "white",
    borderRadius: 24,
    padding: 28,
    display: "flex",
    justifyContent: "space-between",
    gap: 16,
    alignItems: "flex-start",
  },
  heroBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    padding: "6px 12px",
    borderRadius: 999,
    background: "rgba(255,255,255,0.12)",
    fontSize: 14,
  },
  version: {
    whiteSpace: "nowrap",
    background: "rgba(255,255,255,0.12)",
    borderRadius: 999,
    padding: "8px 12px",
    fontSize: 14,
  },
  warning: {
    background: "#fffbeb",
    border: "1px solid #fde68a",
    borderRadius: 24,
    padding: 20,
  },
  checkboxRow: { display: "flex", gap: 10, alignItems: "flex-start", marginTop: 10 },
  tabs: { display: "flex", flexWrap: "wrap", gap: 8, background: "white", padding: 8, borderRadius: 18 },
  tab: {
    border: "none",
    background: "transparent",
    padding: "12px 18px",
    borderRadius: 12,
    cursor: "pointer",
  },
  tabActive: {
    border: "none",
    background: "#0f172a",
    color: "white",
    padding: "12px 18px",
    borderRadius: 12,
    cursor: "pointer",
  },
  card: { background: "white", borderRadius: 20, padding: 20, boxShadow: "0 1px 4px rgba(15,23,42,0.08)" },
  cardHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 18 },
  iconBox: { background: "#f1f5f9", borderRadius: 14, padding: 10, display: "flex", alignItems: "center" },
  grid2: { display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))" },
  grid3: { display: "grid", gap: 24, gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" },
  formGrid: { display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" },
  field: { display: "grid", gap: 6 },
  label: { fontSize: 14, color: "#334155" },
  input: {
    height: 42,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    padding: "0 12px",
    background: "white",
  },
  metric: { border: "1px solid #e2e8f0", borderRadius: 16, padding: 16, marginBottom: 12 },
  badgesWrap: { display: "flex", flexWrap: "wrap", gap: 8 },
  flag: { display: "inline-block", padding: "7px 10px", borderRadius: 999, fontSize: 13, fontWeight: 600 },
  list: { margin: 0, paddingLeft: 18, display: "grid", gap: 8, color: "#334155" },
  textBlock: {
    background: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    color: "#334155",
    lineHeight: 1.55,
  },
  summaryRow: {
    display: "flex",
    justifyContent: "space-between",
    gap: 12,
    alignItems: "center",
    background: "#f8fafc",
    borderRadius: 12,
    padding: "10px 12px",
    marginBottom: 10,
  },
  labGrid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" },
  labCard: { border: "1px solid #e2e8f0", borderRadius: 16, padding: 16 },
  codeBadge: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 999, padding: "4px 10px", fontSize: 12 },
  weekCard: { border: "1px solid #e2e8f0", borderRadius: 16, padding: 16 },
  weekHeader: { display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", marginBottom: 14 },
  darkBadge: { background: "#0f172a", color: "white", borderRadius: 999, padding: "6px 10px", fontSize: 13 },
  weekGrid: { display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" },
  weekCol: { background: "#f8fafc", borderRadius: 14, padding: 14 },
  weekColTitle: { fontWeight: 700, marginBottom: 8 },
  checkpoint: { border: "1px solid #e2e8f0", borderRadius: 14, padding: 14, background: "white" },
  secondaryButton: {
    height: 38,
    borderRadius: 10,
    border: "1px solid #cbd5e1",
    background: "white",
    padding: "0 14px",
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  },
  savePill: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: "#f1f5f9",
    borderRadius: 999,
    padding: "8px 12px",
    color: "#334155",
    fontSize: 14,
  },
};
