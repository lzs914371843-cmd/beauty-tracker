import { useState, useEffect } from "react";

// ---------------- Service Worker 离线注册 ----------------
if (typeof window !== "undefined" && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((err) => {
      console.log("SW 注册失败: ", err);
    });
  });
}

const TASKS = {
  morning: [
    { id: "water", icon: "ti-droplet", label: "起床喝温水", note: "200ml，空腹，不等口渴", phase: 1, time: "起床" },
    { id: "posture", icon: "ti-arrows-vertical", label: "靠墙站体态练习", note: "5分钟，头肩臀跟四点贴墙", phase: 1, time: "起床" },
    { id: "cleanse_am", icon: "ti-sparkles", label: "早晨洁面", note: "清水或温和氨基酸洗面奶", phase: 2, time: "洗漱" },
    { id: "moisturize_am", icon: "ti-droplet-half", label: "早晨保湿", note: "皮肤微湿润时涂，薄薄一层", phase: 2, time: "洁面后" },
    { id: "sunscreen", icon: "ti-sun", label: "涂防晒", note: "SPF30+ PA+++，黄豆粒大小点在脸上", phase: 2, time: "出门前" },
    { id: "hair", icon: "ti-scissors", label: "吹发定型", note: "冷风最后定型30秒固定发型", phase: 3, time: "出门前" },
  ],
  daytime: [
    { id: "water_day", icon: "ti-cup", label: "全天喝够水", note: "目标1.5-2L，设置水杯在桌上", phase: 1, time: "全天" },
    { id: "posture_check", icon: "ti-arrow-up", label: "每小时体态检查", note: "肩膀后沉，下巴内收，腹部微收", phase: 1, time: "每小时" },
  ],
  evening: [
    { id: "exercise", icon: "ti-run", label: "运动20-30分钟", note: "快走/慢跑，能说话但有点喘", phase: 5, time: "傍晚" },
    { id: "no_phone", icon: "ti-device-mobile-off", label: "放下手机", note: "睡前1小时停止使用屏幕", phase: 1, time: "睡前1h" },
    { id: "cleanse_pm", icon: "ti-sparkles", label: "晚间洁面", note: "洗面奶，温水洗，冷水收毛孔", phase: 2, time: "睡前" },
    { id: "essence", icon: "ti-flask", label: "功能性精华", note: "只选一种针对主要皮肤问题", phase: 2, time: "洁面后" },
    { id: "moisturize_pm", icon: "ti-droplet-half", label: "晚间保湿", note: "略厚重，皮肤夜间修复", phase: 2, time: "精华后" },
    { id: "lip", icon: "ti-heart", label: "嘴唇护理", note: "厚涂凡士林或唇膜睡觉", phase: 2, time: "睡前" },
  ],
};

const PHASES = [
  { id: 1, label: "体态 & 基础习惯", period: "第1-2周", desc: "喝水 · 体态 · 睡眠", accentText: "var(--text-success)", accentBg: "var(--bg-success)", accentBorder: "var(--border-success)", accentFill: "var(--fill-success)" },
  { id: 2, label: "皮肤基础护理", period: "第2-4周", desc: "洁面 · 保湿 · 防晒", accentText: "var(--text-accent)", accentBg: "var(--bg-accent)", accentBorder: "var(--border-accent)", accentFill: "var(--fill-accent)" },
  { id: 3, label: "发型管理", period: "第1个月", desc: "合适发型 · 日常吹发", accentText: "var(--text-warning)", accentBg: "var(--bg-warning)", accentBorder: "var(--border-warning)", accentFill: "var(--fill-warning)" },
  { id: 4, label: "穿搭合身度", period: "第1-2个月", desc: "清点衣柜 · 裁缝改衣", accentText: "var(--text-pro)", accentBg: "var(--bg-pro)", accentBorder: "var(--border-pro)", accentFill: "var(--fill-pro)" },
  { id: 5, label: "运动 & 体型", period: "第2个月起", desc: "有氧+力量 · 建立线条", accentText: "var(--text-danger)", accentBg: "var(--bg-danger)", accentBorder: "var(--border-danger)", accentFill: "var(--fill-danger)" },
];

const REMINDERS = [
  { time: "07:00", label: "起床喝温水", detail: "200ml，空腹" },
  { time: "07:05", label: "靠墙站体态练习", detail: "5分钟，养成体态意识" },
  { time: "07:20", label: "早晨护肤", detail: "洁面 → 保湿 → 防晒" },
  { time: "07:40", label: "吹发定型", detail: "冷风结尾，定型30秒" },
  { time: "09:00", label: "体态检查（每小时重复）", detail: "肩沉后背，下巴内收" },
  { time: "12:00", label: "检查喝水量", detail: "上午至少喝600ml" },
  { time: "15:00", label: "下午补水", detail: "下午容易忘，设提醒" },
  { time: "19:00", label: "运动时间", detail: "快走/慢跑（第2个月起加入）" },
  { time: "21:30", label: "放下手机", detail: "睡前1小时关屏" },
  { time: "22:00", label: "晚间护肤", detail: "洁面 → 精华 → 保湿 → 唇膜" },
  { time: "22:30", label: "准备入睡", detail: "4-7-8呼吸法助眠" },
];

function ProgressRing({ pct }) {
  const size = 68, r = 28;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-strong)" strokeWidth={4.5} />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--fill-accent)" strokeWidth={4.5}
          strokeDasharray={`${dash.toFixed(2)} ${circ.toFixed(2)}`} strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.4s ease" }} />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", lineHeight: 1 }}>{pct}%</span>
      </div>
    </div>
  );
}

export default function App() {
  const todayKey = new Date().toISOString().split("T")[0];
  const [stored, setStored] = useState({ phase: 1, days: {} });
  const [tab, setTab] = useState("today");
  const [loading, setLoading] = useState(true);

  const todayData = stored.days?.[todayKey] || {};
  const completions = todayData.completions || {};
  const notes = todayData.notes || "";
  const currentPhase = stored.phase || 1;

  // ---------------- 使用 localStorage 读取数据 ----------------
  useEffect(() => {
    try {
      const r = localStorage.getItem("beauty_tracker_v2");
      if (r) setStored(JSON.parse(r));
    } catch (e) {
      console.error("加载失败", e);
    }
    setLoading(false);
  }, []);

  // ---------------- 使用 localStorage 保存数据 ----------------
  async function persist(next) {
    setStored(next);
    try {
      localStorage.setItem("beauty_tracker_v2", JSON.stringify(next));
    } catch (e) {
      console.error("保存失败", e);
    }
  }

  function patch(dayPatch) {
    const next = { ...stored, days: { ...stored.days, [todayKey]: { ...todayData, ...dayPatch } } };
    persist(next);
  }

  function toggleTask(id) {
    patch({ completions: { ...completions, [id]: !completions[id] } });
  }

  function setNotes(val) { patch({ notes: val }); }

  function setPhase(p) { persist({ ...stored, phase: p }); }

  const streak = (() => {
    let s = 0;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    for (let i = 0; i < 365; i++) {
      const k = d.toISOString().split("T")[0];
      if (stored.days?.[k]?.allDone) { s++; d.setDate(d.getDate() - 1); } else break;
    }
    return s;
  })();

  const allTasks = [...TASKS.morning, ...TASKS.daytime, ...TASKS.evening];
  const activeTasks = allTasks.filter(t => t.phase <= currentPhase);
  const doneCount = activeTasks.filter(t => completions[t.id]).length;
  const pct = activeTasks.length ? Math.round((doneCount / activeTasks.length) * 100) : 0;

  if (pct === 100 && !todayData.allDone) patch({ allDone: true });

  if (loading) return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, fontFamily: "var(--font-sans)", color: "var(--text-muted)", fontSize: 14 }}>
      加载中…
    </div>
  );

  const dateStr = new Date().toLocaleDateString("zh-CN", { month: "long", day: "numeric", weekday: "short" });
  const phaseInfo = PHASES[currentPhase - 1];

  return (
    <div style={{ fontFamily: "var(--font-sans)", maxWidth: 500, margin: "0 auto" }}>
      <div style={{ background: "var(--surface-2)", borderBottom: "0.5px solid var(--border)", padding: "14px 16px 0", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 14 }}>
          <ProgressRing pct={pct} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)" }}>变好看日志</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{dateStr}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
              {phaseInfo.label} · {doneCount}/{activeTasks.length} 完成
            </div>
          </div>
          <div style={{
            textAlign: "center", borderRadius: 10, padding: "6px 12px", flexShrink: 0,
            background: streak > 0 ? "var(--bg-success)" : "var(--surface-1)",
          }}>
            <div style={{ fontSize: 22, fontWeight: 500, lineHeight: 1, color: streak > 0 ? "var(--text-success)" : "var(--text-muted)" }}>{streak}</div>
            <div style={{ fontSize: 10, marginTop: 2, color: streak > 0 ? "var(--text-success)" : "var(--text-muted)" }}>连续天</div>
          </div>
        </div>
        <div style={{ display: "flex" }}>
          {[["today", "今日任务"], ["phase", "阶段进度"], ["remind", "提醒清单"]].map(([key, lbl]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              flex: 1, padding: "9px 4px", border: "none", background: "none", cursor: "pointer",
              fontSize: 13, fontWeight: tab === key ? 500 : 400,
              color: tab === key ? "var(--text-primary)" : "var(--text-secondary)",
              borderBottom: `2px solid ${tab === key ? "var(--text-primary)" : "transparent"}`,
              transition: "color 0.15s, border-color 0.15s",
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "12px 14px 48px" }}>
        {tab === "today" && <TodayTab tasks={TASKS} completions={completions} onToggle={toggleTask} notes={notes} onNotes={setNotes} currentPhase={currentPhase} />}
        {tab === "phase" && <PhaseTab currentPhase={currentPhase} onPhase={setPhase} />}
        {tab === "remind" && <RemindTab />}
      </div>
    </div>
  );
}

function SectionHead({ icon, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "18px 0 8px" }}>
      <i className={`ti ${icon}`} style={{ fontSize: 14, color: "var(--text-muted)" }} aria-hidden />
      <span style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", letterSpacing: 0.2 }}>{label}</span>
      <div style={{ flex: 1, height: "0.5px", background: "var(--border)" }} />
    </div>
  );
}

function TaskCard({ task, done, onToggle, locked }) {
  return (
    <div onClick={() => !locked && onToggle(task.id)} style={{
      display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
      background: done ? "var(--bg-success)" : locked ? "var(--surface-1)" : "var(--surface-2)",
      borderRadius: 12, marginBottom: 6,
      border: `0.5px solid ${done ? "var(--border-success)" : "var(--border)"}`,
      opacity: locked ? 0.38 : 1, cursor: locked ? "default" : "pointer",
      transition: "background 0.15s, border-color 0.15s", userSelect: "none",
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: "50%", flexShrink: 0,
        background: done ? "var(--fill-success)" : "transparent",
        border: `1.5px solid ${done ? "var(--fill-success)" : "var(--border-stronger)"}`,
        display: "flex", alignItems: "center", justifyContent: "center",
        transition: "all 0.15s",
      }}>
        {done && <i className="ti ti-check" style={{ fontSize: 11, color: "white" }} aria-hidden />}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13.5, fontWeight: done ? 400 : 500,
          color: done ? "var(--text-success)" : "var(--text-primary)",
          textDecoration: done ? "line-through" : "none",
        }}>{task.label}</div>
        <div style={{ fontSize: 11.5, color: done ? "var(--text-success)" : "var(--text-muted)", marginTop: 2, opacity: done ? 0.8 : 1 }}>{task.note}</div>
      </div>
      <div style={{ fontSize: 10.5, color: "var(--text-muted)", flexShrink: 0, whiteSpace: "nowrap" }}>{task.time}</div>
    </div>
  );
}

function TodayTab({ tasks, completions, onToggle, notes, onNotes, currentPhase }) {
  return (
    <div>
      <SectionHead icon="ti-sun-rise" label="早晨" />
      {tasks.morning.map(t => <TaskCard key={t.id} task={t} done={!!completions[t.id]} onToggle={onToggle} locked={t.phase > currentPhase} />)}
      <SectionHead icon="ti-sun" label="白天" />
      {tasks.daytime.map(t => <TaskCard key={t.id} task={t} done={!!completions[t.id]} onToggle={onToggle} locked={t.phase > currentPhase} />)}
      <SectionHead icon="ti-moon" label="晚间" />
      {tasks.evening.map(t => <TaskCard key={t.id} task={t} done={!!completions[t.id]} onToggle={onToggle} locked={t.phase > currentPhase} />)}
      <div style={{ marginTop: 22 }}>
        <div style={{ fontSize: 12, fontWeight: 500, color: "var(--text-secondary)", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-notes" style={{ fontSize: 14 }} aria-hidden />
          今日记录
        </div>
        <textarea
          value={notes}
          onChange={e => onNotes(e.target.value)}
          placeholder="记录今天皮肤状态、体态感受、能量水平…"
          rows={4}
          style={{
            width: "100%", padding: "10px 12px", borderRadius: 12,
            border: "0.5px solid var(--border)", fontSize: 13.5,
            color: "var(--text-primary)", background: "var(--surface-2)",
            resize: "none", outline: "none", boxSizing: "border-box",
            fontFamily: "var(--font-sans)", lineHeight: 1.65,
          }}
        />
      </div>
    </div>
  );
}

function PhaseTab({ currentPhase, onPhase }) {
  return (
    <div>
      <p style={{ fontSize: 12, color: "var(--text-muted)", margin: "8px 0 14px" }}>点击切换当前阶段，解锁对应任务</p>
      {PHASES.map(p => {
        const active = currentPhase === p.id;
        const passed = currentPhase > p.id;
        return (
          <div key={p.id} onClick={() => onPhase(p.id)} style={{
            padding: "14px", borderRadius: 12, marginBottom: 8, cursor: "pointer",
            border: `${active ? "1.5px" : "0.5px"} solid ${active ? p.accentBorder : "var(--border)"}`,
            background: active ? p.accentBg : "var(--surface-2)",
            transition: "all 0.15s",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 32, height: 32, borderRadius: "50%", flexShrink: 0,
                background: active ? p.accentFill : passed ? "var(--fill-success)" : "var(--surface-1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: (active || passed) ? "white" : "var(--text-muted)",
                fontWeight: 500, fontSize: 13,
              }}>
                {passed ? <i className="ti ti-check" style={{ fontSize: 14 }} aria-hidden /> : p.id}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: active ? p.accentText : "var(--text-primary)" }}>{p.label}</div>
                <div style={{ fontSize: 12, color: active ? p.accentText : "var(--text-muted)", marginTop: 2, opacity: active ? 0.85 : 1 }}>{p.period} · {p.desc}</div>
              </div>
              {active && (
                <div style={{ background: p.accentFill, color: "white", fontSize: 11, padding: "3px 9px", borderRadius: 99, fontWeight: 500, flexShrink: 0 }}>
                  进行中
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function RemindTab() {
  return (
    <div>
      <div style={{ background: "var(--bg-warning)", border: "0.5px solid var(--border-warning)", borderRadius: 12, padding: "12px 14px", marginBottom: 12, marginTop: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-warning)", marginBottom: 5, display: "flex", alignItems: "center", gap: 6 }}>
          <i className="ti ti-device-mobile" style={{ fontSize: 15 }} aria-hidden />
          如何在手机上设置
        </div>
        <div style={{ fontSize: 12, color: "var(--text-warning)", lineHeight: 1.75, opacity: 0.9 }}>
          iPhone：「时钟」→「闹钟」→「+」，或「提醒事项」中添加<br />
          Android：「时钟」→「闹钟」，或「日历」中创建提醒<br />
          将下方时间点逐一录入即可
        </div>
      </div>
      {REMINDERS.map((r, i) => (
        <div key={i} style={{
          display: "flex", gap: 12, padding: "10px 12px",
          background: "var(--surface-2)", borderRadius: 12, marginBottom: 6,
          border: "0.5px solid var(--border)", alignItems: "flex-start",
        }}>
          <div style={{ fontWeight: 500, color: "var(--text-accent)", fontSize: 13, minWidth: 46, flexShrink: 0, fontVariantNumeric: "tabular-nums", marginTop: 1 }}>{r.time}</div>
          <div>
            <div style={{ fontSize: 13.5, fontWeight: 500, color: "var(--text-primary)" }}>{r.label}</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>{r.detail}</div>
          </div>
        </div>
      ))}
      <div style={{ marginTop: 10, padding: "12px 14px", background: "var(--bg-accent)", border: "0.5px solid var(--border-accent)", borderRadius: 12 }}>
        <div style={{ fontSize: 12, color: "var(--text-accent)", lineHeight: 1.7 }}>
          <i className="ti ti-bulb" style={{ fontSize: 14, verticalAlign: "-2px", marginRight: 4 }} aria-hidden />
          体态检查（每小时）可在 iOS「健康」→「站立」中开启；Android 用 Google Fit 的活动提醒。
        </div>
      </div>
    </div>
  );
}