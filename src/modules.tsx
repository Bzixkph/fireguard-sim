import { useState } from "react";
import {
  ControlExtensionCards,
  ControlExtensionDetails,
} from "./control-extensions";
import { AnimatePresence, motion } from "framer-motion";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  BellRing,
  Check,
  CheckCheck,
  ChevronDown,
  Clock3,
  DoorClosed,
  DoorOpen,
  Droplets,
  Fan,
  FileText,
  MapPin,
  Maximize2,
  Radio,
  Send,
  ShieldCheck,
  CloudFog as Smoke,
  Thermometer,
  Volume2,
  VolumeX,
  Zap,
} from "lucide-react";
import {
  exportLogs,
  levelText,
  useSim,
  type Log,
  type ModuleId,
} from "./model";
import {
  Chart,
  PipeDiagram,
  Reveal,
  SmokeGauge,
  Status,
  SubCard,
  ThermalMap,
  spring,
} from "./ui";

function SceneModule() {
  const { scene, dispatch } = useSim();
  const [open, setOpen] = useState<string | null>(null),
    [logic, setLogic] = useState(false);
  const toggle = (id: string) => {
    setOpen(open === id ? null : id);
    setLogic(false);
  };
  return (
    <>
      <div className="zone-line">
        <span>
          <MapPin size={13} />
          {scene.location}
        </span>
        <span>
          <i className="live-dot" />
          传感器实时采样 · 1.5s
        </span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SubCard
          id="temperature"
          title="温感探头"
          icon={Thermometer}
          open={open === "temperature"}
          onClick={() => toggle("temperature")}
          footer="TEMP-001 · 在线"
        >
          <div className="reading tabular-nums">
            {scene.temp.toFixed(1)}
            <small>°C</small>
            <span className="reading-note">温度</span>
          </div>
          <Chart values={scene.temps} color="#e4ba83" />
        </SubCard>
        <SubCard
          id="smoke"
          title="烟雾传感器"
          icon={Smoke}
          open={open === "smoke"}
          onClick={() => toggle("smoke")}
          footer="SMK-002 · 在线"
        >
          <SmokeGauge value={scene.smoke} />
        </SubCard>
        <SubCard
          id="thermal"
          title="红外热成像"
          icon={Maximize2}
          open={open === "thermal"}
          onClick={() => toggle("thermal")}
          footer="IR-003 · 在线"
        >
          <ThermalMap />
        </SubCard>
      </div>
      <AnimatePresence initial={false} mode="wait">
        {open && (
          <Reveal key={open} id={open}>
            <div className="detail-heading">
              <div>
                <span className="eyebrow">SENSOR DETAILS</span>
                <h3>
                  {open === "temperature"
                    ? "温度变化趋势"
                    : open === "smoke"
                      ? "烟雾浓度监测"
                      : "红外热成像面板"}
                </h3>
              </div>
              <Status level={scene.level}>{levelText[scene.level]}</Status>
            </div>
            {open === "thermal" ? (
              <ThermalMap large />
            ) : (
              <>
                <div className="trend-summary">
                  <strong className="tabular-nums">
                    {(open === "temperature"
                      ? scene.temp
                      : scene.smoke
                    ).toFixed(1)}
                    <small>{open === "temperature" ? "°C" : "%"}</small>
                  </strong>
                  <span>
                    <i className="legend-dot" />
                    实时读数
                    <i className="legend-dot limit-dot" />
                    报警阈值{" "}
                    {open === "temperature"
                      ? scene.tempLimit + "°C"
                      : scene.smokeLimit + "%"}
                  </span>
                </div>
                <Chart
                  large
                  values={open === "temperature" ? scene.temps : scene.smokes}
                  color={open === "temperature" ? "#e4ba83" : "#83e7b3"}
                  limit={
                    open === "temperature" ? scene.tempLimit : scene.smokeLimit
                  }
                />
                <div className="chart-axis">
                  <span>约 48 秒前</span>
                  <span>24 秒前</span>
                  <span>现在</span>
                </div>
                <label className="range-label">
                  手动模拟{open === "temperature" ? "温度" : "烟雾浓度"}
                  <strong>
                    {open === "temperature"
                      ? scene.temp.toFixed(1) + " °C"
                      : scene.smoke.toFixed(1) + " %"}
                  </strong>
                </label>
                <input
                  aria-label={
                    open === "temperature" ? "模拟温度" : "模拟烟雾浓度"
                  }
                  type="range"
                  min={open === "temperature" ? 15 : 0}
                  max={open === "temperature" ? 110 : 100}
                  step=".1"
                  value={open === "temperature" ? scene.temp : scene.smoke}
                  onChange={(e) =>
                    dispatch({
                      type: "SENSOR",
                      sensor: open === "temperature" ? "temp" : "smoke",
                      value: +e.target.value,
                    })
                  }
                />
              </>
            )}
            <button
              className="logic-toggle"
              aria-expanded={logic}
              onClick={() => setLogic(!logic)}
            >
              <ShieldCheck size={14} />
              预警逻辑与阈值
              <ChevronDown size={14} className={logic ? "rotate-180" : ""} />
            </button>
            <AnimatePresence>
              {logic && (
                <motion.div
                  className="threshold-panel"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={spring}
                >
                  <p>
                    温度达到阈值的 75% 或烟雾达到阈值的 50%
                    进入预警；任一读数达到报警阈值，触发声光警报与已启用的自动联动。
                  </p>
                  <div className="threshold-inputs">
                    <label>
                      温度报警阈值
                      <input
                        aria-label="温度报警阈值"
                        type="number"
                        min="40"
                        max="100"
                        value={scene.tempLimit}
                        onChange={(e) => {
                          const value = +e.target.value;
                          if (value >= 40 && value <= 100)
                            dispatch({
                              type: "LIMIT",
                              sensor: "tempLimit",
                              value,
                            });
                        }}
                      />
                      <span>°C</span>
                    </label>
                    <label>
                      烟雾报警阈值
                      <input
                        aria-label="烟雾报警阈值"
                        type="number"
                        min="10"
                        max="80"
                        value={scene.smokeLimit}
                        onChange={(e) => {
                          const value = +e.target.value;
                          if (value >= 10 && value <= 80)
                            dispatch({
                              type: "LIMIT",
                              sensor: "smokeLimit",
                              value,
                            });
                        }}
                      />
                      <span>%</span>
                    </label>
                  </div>
                  <div className="threshold-state">
                    <span className={`status-dot ${scene.level}`} />
                    当前判断：{levelText[scene.level]}
                    {scene.confirmed && " · 已人工确认"}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </Reveal>
        )}
      </AnimatePresence>
      <div className="module-hint">
        <ShieldCheck size={13} />
        温度 ≥ {scene.tempLimit}°C 或烟雾 ≥ {scene.smokeLimit}% 时触发模拟警报
        <span>
          策略已就绪
          <Check size={12} />
        </span>
      </div>
    </>
  );
}
function AlarmModule() {
  const { scene, state, dispatch } = useSim();
  const [open, setOpen] = useState<string | null>(null),
    [message, setMessage] = useState(
      "消防演练提示：请保持冷静，按照疏散指示有序离开当前区域。",
    );
  const toggle = (id: string) => setOpen(open === id ? null : id);
  return (
    <>
      <div className="zone-line">
        <span>
          当前区域：{scene.id} {scene.name}
        </span>
        <span>响应设备 · 3 台在线</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SubCard
          id="siren"
          title="声光警报器"
          icon={BellRing}
          open={open === "siren"}
          onClick={() => toggle("siren")}
        >
          <div
            className={`device-illustration siren ${scene.level === "alarm" ? "siren-active" : ""}`}
          >
            <BellRing size={42} strokeWidth={1.3} />
            <span>{scene.level === "alarm" ? "警报已触发" : "警报器待机"}</span>
          </div>
        </SubCard>
        <SubCard
          id="broadcast"
          title="广播系统"
          icon={Radio}
          open={open === "broadcast"}
          onClick={() => toggle("broadcast")}
        >
          <div className="device-illustration">
            <div className="sound-bars">
              {[12, 24, 37, 21, 46, 31, 17, 28, 13].map((h, i) => (
                <i key={i} style={{ height: h }} />
              ))}
            </div>
            <span>区域广播待命</span>
          </div>
        </SubCard>
        <SubCard
          id="elevator"
          title="消防电梯控制"
          icon={ArrowDownToLine}
          open={open === "elevator"}
          onClick={() => toggle("elevator")}
        >
          <div className="device-illustration">
            <div className="floor-display">
              {scene.elevatorDown ? "1F" : "3F"}
              <ArrowDownToLine size={20} />
            </div>
            <span>{scene.elevatorDown ? "已迫降 · 首层停靠" : "正常待机"}</span>
          </div>
        </SubCard>
      </div>
      <AnimatePresence mode="wait">
        {open && (
          <Reveal key={open} id={open}>
            {open === "siren" && (
              <>
                <div className="detail-heading">
                  <h3>声光警报器</h3>
                  <Status level={scene.level}>{levelText[scene.level]}</Status>
                </div>
                <p className="detail-copy">
                  触发后，警报状态与联动流程将同步更新。开启声音后可听到模拟警报。
                </p>
                <div className="flex flex-wrap gap-2">
                  <button
                    className="btn btn-danger"
                    disabled={scene.manualAlarm}
                    onClick={() => dispatch({ type: "ALARM" })}
                  >
                    <BellRing size={15} />
                    {scene.manualAlarm ? "手动警报已触发" : "触发警报"}
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => dispatch({ type: "SOUND" })}
                  >
                    {state.sound ? (
                      <Volume2 size={15} />
                    ) : (
                      <VolumeX size={15} />
                    )}
                    {state.sound ? "关闭警报声音" : "开启警报声音"}
                  </button>
                  {scene.level !== "normal" && (
                    <button
                      className="btn btn-secondary"
                      disabled={scene.confirmed}
                      onClick={() => dispatch({ type: "ACK" })}
                    >
                      <CheckCheck size={15} />
                      {scene.confirmed ? "已确认警报" : "确认警报"}
                    </button>
                  )}
                </div>
              </>
            )}
            {open === "broadcast" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (message.trim())
                    dispatch({ type: "BROADCAST", text: message.trim() });
                }}
              >
                <div className="detail-heading">
                  <h3>发送模拟广播</h3>
                  <span className="muted">仅当前区域</span>
                </div>
                <label className="sr-only" htmlFor="broadcast-message">
                  广播内容
                </label>
                <textarea
                  id="broadcast-message"
                  maxLength={300}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={3}
                />
                <div className="broadcast-bottom">
                  <span>{message.length} / 300 字</span>
                  <button
                    className="btn btn-primary"
                    disabled={!message.trim()}
                  >
                    <Send size={14} />
                    发送广播
                  </button>
                </div>
              </form>
            )}
            {open === "elevator" && (
              <>
                <div className="detail-heading">
                  <h3>电梯迫降控制</h3>
                  <Status level={scene.elevatorDown ? "warning" : "normal"}>
                    {scene.elevatorDown ? "首层停靠" : "正常待机"}
                  </Status>
                </div>
                <div className="elevator-detail">
                  <div className="elevator-shaft">
                    <span
                      className={scene.elevatorDown ? "car car-down" : "car"}
                    >
                      <ArrowDownToLine size={22} />
                    </span>
                    <i>3F</i>
                    <i>2F</i>
                    <i>1F</i>
                  </div>
                  <div>
                    <p className="detail-copy">
                      模拟消防电梯返回首层，并保持开门待命状态。
                    </p>
                    <button
                      className="btn btn-primary"
                      onClick={() =>
                        dispatch({ type: "DEVICE", device: "elevatorDown" })
                      }
                    >
                      <ArrowDownToLine size={15} />
                      {scene.elevatorDown ? "恢复待机" : "迫降首层"}
                    </button>
                  </div>
                </div>
              </>
            )}
          </Reveal>
        )}
      </AnimatePresence>
    </>
  );
}
function ControlModule() {
  const { scene, dispatch } = useSim();
  const [open, setOpen] = useState<string | null>(null);
  const toggle = (id: string) => setOpen(open === id ? null : id);
  const titles: Record<string, string> = {
    sprinkler: "喷淋阀门控制",
    fan: "排烟风机控制",
    door: "防火门控制",
    shutter: "防火卷帘控制",
    "emergency-power": "应急电源控制",
    "main-power": "常用电源控制",
  };
  return (
    <>
      <div className="zone-line">
        <span>手动控制 · 所有操作记录至事件日志</span>
        <span>控制设备 · 6 台在线</span>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <SubCard
          id="sprinkler"
          title="喷淋系统"
          icon={Droplets}
          open={open === "sprinkler"}
          onClick={() => toggle("sprinkler")}
          footer={scene.sprinkler ? "阀门已开 · 喷淋中" : "管道压力正常"}
        >
          <PipeDiagram active={scene.sprinkler} />
        </SubCard>
        <SubCard
          id="fan"
          title="排烟风机"
          icon={Fan}
          open={open === "fan"}
          onClick={() => toggle("fan")}
          footer={scene.fan ? "风机运行中" : "风机待机"}
        >
          <div className="device-illustration">
            <div className={`fan-shell ${scene.fan ? "fan-running" : ""}`}>
              <Fan size={56} strokeWidth={1.3} />
            </div>
          </div>
        </SubCard>
        <SubCard
          id="door"
          title="防火门"
          icon={DoorClosed}
          open={open === "door"}
          onClick={() => toggle("door")}
          footer={scene.doorClosed ? "已关闭 · 分区隔离" : "保持开启"}
        >
          <div className="device-illustration">
            {scene.doorClosed ? (
              <DoorClosed size={52} strokeWidth={1.2} />
            ) : (
              <DoorOpen size={52} strokeWidth={1.2} />
            )}
            <span>{scene.doorClosed ? "分区已隔离" : "通道开启"}</span>
          </div>
        </SubCard>
        <ControlExtensionCards open={open} toggle={toggle} />
      </div>
      <AnimatePresence mode="wait">
        {open && (
          <Reveal key={open} id={open}>
            <div className="detail-heading">
              <h3>{titles[open]}</h3>
              <Status
                level={
                  !scene.mainPower && !scene.emergencyPower ? "alarm" : "normal"
                }
              >
                {!scene.mainPower && !scene.emergencyPower
                  ? "供电告警"
                  : "控制器在线"}
              </Status>
            </div>
            {open === "sprinkler" && (
              <>
                <PipeDiagram active={scene.sprinkler} />
                <p className="detail-copy">
                  开启喷淋后，模拟温度会随采样逐步下降。
                </p>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    dispatch({ type: "DEVICE", device: "sprinkler" })
                  }
                >
                  <Droplets size={15} />
                  {scene.sprinkler ? "关闭阀门" : "开启阀门"}
                </button>
              </>
            )}
            {open === "fan" && (
              <div className="flex items-center gap-7">
                <div
                  className={`fan-shell fan-large ${scene.fan ? "fan-running" : ""}`}
                >
                  <Fan size={68} strokeWidth={1.2} />
                </div>
                <div>
                  <p className="detail-copy">
                    启动排烟后，模拟烟雾浓度会随采样逐步下降。
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() => dispatch({ type: "DEVICE", device: "fan" })}
                  >
                    <Fan size={15} />
                    {scene.fan ? "停止风机" : "启动风机"}
                  </button>
                </div>
              </div>
            )}
            {open === "door" && (
              <div className="flex items-center gap-7">
                <div className="door-large">
                  {scene.doorClosed ? (
                    <DoorClosed size={72} strokeWidth={1} />
                  ) : (
                    <DoorOpen size={72} strokeWidth={1} />
                  )}
                </div>
                <div>
                  <p className="detail-copy">
                    模拟分区隔离，状态会同步显示在联动流程中。
                  </p>
                  <button
                    className="btn btn-primary"
                    onClick={() =>
                      dispatch({ type: "DEVICE", device: "doorClosed" })
                    }
                  >
                    {scene.doorClosed ? (
                      <DoorOpen size={15} />
                    ) : (
                      <DoorClosed size={15} />
                    )}
                    {scene.doorClosed ? "打开防火门" : "关闭防火门"}
                  </button>
                </div>
              </div>
            )}
            <ControlExtensionDetails open={open} />
          </Reveal>
        )}
      </AnimatePresence>
    </>
  );
}
export function LogList({
  logs,
  compact = false,
}: {
  logs: Log[];
  compact?: boolean;
}) {
  return (
    <div className={`event-list ${compact ? "events-compact" : ""}`}>
      {logs.map((log) => (
        <div key={log.id} className={`event event-${log.level}`}>
          <span className="event-icon">
            {log.level === "danger" ? (
              <BellRing size={12} />
            ) : log.level === "success" ? (
              <Check size={12} />
            ) : log.level === "warning" ? (
              <Zap size={12} />
            ) : (
              <Activity size={12} />
            )}
          </span>
          <div>
            <p>{log.text}</p>
            <span>
              {log.scene}
              <i />
              {new Date(log.time).toLocaleTimeString("zh-CN", {
                hour12: false,
              })}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
export function CsvPreview() {
  const { state, dispatch } = useSim();
  return (
    <>
      <div className="csv-preview">
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>区域</th>
              <th>事件</th>
              <th>温度</th>
              <th>烟雾</th>
            </tr>
          </thead>
          <tbody>
            {state.logs.slice(0, 6).map((log) => (
              <tr key={log.id}>
                <td>
                  {new Date(log.time).toLocaleTimeString("zh-CN", {
                    hour12: false,
                  })}
                </td>
                <td>{log.scene}</td>
                <td>{log.text}</td>
                <td>{log.temp.toFixed(1)}°C</td>
                <td>{log.smoke.toFixed(1)}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="broadcast-bottom">
        <span className="muted">
          CSV · UTF-8 · 共 {state.logs.length} 条事件记录
        </span>
        <button
          className="btn btn-primary"
          onClick={() => {
            exportLogs(state.logs);
            dispatch({ type: "NOTICE", text: "事件记录 CSV 已导出" });
          }}
        >
          <ArrowDownToLine size={14} />
          导出 CSV
        </button>
      </div>
    </>
  );
}
function LogsModule() {
  const { state } = useSim();
  const [open, setOpen] = useState("timeline");
  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <SubCard
          id="timeline"
          title="实时时间轴"
          icon={Clock3}
          open={open === "timeline"}
          onClick={() => setOpen(open === "timeline" ? "" : "timeline")}
          footer="跨区域操作记录"
        >
          <div className="log-card-reading">
            {state.logs.length}
            <small>条事件</small>
            <Activity size={28} />
          </div>
        </SubCard>
        <SubCard
          id="csv"
          title="历史数据导出"
          icon={FileText}
          open={open === "csv"}
          onClick={() => setOpen(open === "csv" ? "" : "csv")}
          footer="支持 Excel 打开"
        >
          <div className="log-card-reading">
            CSV<small>数据预览与导出</small>
            <ArrowDownToLine size={28} />
          </div>
        </SubCard>
      </div>
      <AnimatePresence mode="wait">
        {open && (
          <Reveal key={open} id={open}>
            {open === "timeline" ? (
              <LogList logs={state.logs.slice(0, 15)} />
            ) : (
              <CsvPreview />
            )}
          </Reveal>
        )}
      </AnimatePresence>
    </>
  );
}
const modules = [
  { id: "scene", name: "场景监测", en: "Scene monitoring", icon: MapPin },
  { id: "alarm", name: "警报响应", en: "Alarm response", icon: BellRing },
  { id: "control", name: "灭火与控制", en: "Suppression & control", icon: Fan },
  { id: "logs", name: "数据与日志", en: "Data & logs", icon: FileText },
] as const;
export function ModuleGrid({
  open,
  setOpen,
}: {
  open: ModuleId | null;
  setOpen: (id: ModuleId | null) => void;
}) {
  const { scene, state } = useSim();
  const summary: Record<ModuleId, string> = {
    scene: `当前监控区域：${scene.id} ${scene.name}`,
    alarm: `当前警报状态：${scene.level === "normal" ? "正常" : scene.level === "warning" ? "环境预警" : scene.confirmed ? "警报已确认" : "警报已触发"}`,
    control: `消防设备状态：${!scene.mainPower && !scene.emergencyPower ? "供电告警" : scene.shutterMotion !== "stopped" ? "卷帘运行中" : scene.sprinkler || scene.fan || scene.doorClosed ? "联动运行中" : "待机"}`,
    logs: `最近 ${Math.min(3, state.logs.length)} 条事件记录`,
  };
  return (
    <div className="module-grid">
      {modules.map(({ id, name, en, icon: Icon }, index) => {
        const powerAlert =
          id === "control" && !scene.mainPower && !scene.emergencyPower;
        const alertLevel = powerAlert ? "alarm" : scene.level;
        const expanded = open === id,
          alert =
            powerAlert ||
            (scene.level !== "normal" && (id === "scene" || id === "alarm"));
        return (
          <motion.section
            layout
            transition={spring}
            key={id}
            className={`module-card ${expanded ? "module-expanded" : ""} ${alert ? `module-${alertLevel}` : ""}`}
          >
            <button
              className="module-header"
              id={`module-${id}`}
              aria-controls={`panel-${id}`}
              aria-expanded={expanded}
              onClick={() => setOpen(expanded ? null : id)}
            >
              <span className={`module-icon icon-${id}`}>
                <Icon size={20} strokeWidth={1.6} />
              </span>
              <span className="module-titles">
                <span className="module-name">
                  {name}
                  <span className="module-en">{en}</span>
                </span>
                <span className="module-description">{summary[id]}</span>
              </span>
              <span className="module-header-end">
                {expanded ? (
                  <Status level={alert ? alertLevel : "normal"}>
                    {powerAlert
                      ? "供电告警"
                      : alert
                        ? levelText[scene.level]
                        : "全部在线"}
                  </Status>
                ) : (
                  <span className="module-number">0{index + 1}</span>
                )}
                <ChevronDown
                  size={17}
                  className={expanded ? "rotate-180" : ""}
                />
              </span>
            </button>
            <AnimatePresence initial={false}>
              {expanded && (
                <motion.div
                  id={`panel-${id}`}
                  role="region"
                  aria-labelledby={`module-${id}`}
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={spring}
                  className="reveal-overflow"
                >
                  <motion.div
                    initial={{ y: 9 }}
                    animate={{ y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="module-content"
                  >
                    {id === "scene" ? (
                      <SceneModule />
                    ) : id === "alarm" ? (
                      <AlarmModule />
                    ) : id === "control" ? (
                      <ControlModule />
                    ) : (
                      <LogsModule />
                    )}
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            {!expanded && id === "logs" && (
              <div className="collapsed-log-preview">
                {state.logs.slice(0, 3).map((log) => (
                  <span key={log.id}>
                    <i className={`log-dot log-dot-${log.level}`} />
                    {log.text}
                  </span>
                ))}
              </div>
            )}
          </motion.section>
        );
      })}
    </div>
  );
}
