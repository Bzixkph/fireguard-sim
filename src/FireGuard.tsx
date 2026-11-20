import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import {
  Activity,
  ArrowDownToLine,
  ArrowRight,
  Bell,
  BellRing,
  BookOpen,
  Check,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  DoorClosed,
  Droplets,
  Fan,
  FileText,
  Flame,
  FlaskConical,
  LayoutDashboard,
  MapPin,
  Network,
  Pause,
  Play,
  RotateCcw,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  CloudFog as Smoke,
  Thermometer,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  ReactFlow,
  Background,
  BackgroundVariant,
  Controls,
  Position,
  useNodesState,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import {
  SimProvider,
  useSim,
  exportLogs,
  sceneInfo,
  type ModuleId,
  type SceneId,
} from "./model";
import { Status, spring } from "./ui";
import { CsvPreview, LogList, ModuleGrid } from "./modules";
type Page = "dashboard" | "flow" | "logs";

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return (
    <span className="clock tabular-nums">
      <Clock3 size={13} />
      {time.toLocaleDateString("zh-CN", { month: "2-digit", day: "2-digit" })}
      <span className="clock-time">
        {time.toLocaleTimeString("zh-CN", { hour12: false })}
      </span>
    </span>
  );
}
function LinkageFlow({ full = false }: { full?: boolean }) {
  const { scene, state } = useSim();
  const horizontal = {
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
  };
  const style = {
    width: 148,
    borderRadius: 11,
    padding: 0,
    border: "1px solid #304239",
    background: "#141d19",
    color: "#dce8df",
    fontSize: 11,
  };
  const label = (
    Icon: LucideIcon,
    name: string,
    sub: string,
    active = false,
  ) => (
    <div className={`flow-node ${active ? "flow-node-active" : ""}`}>
      <Icon size={17} />
      <span>
        {name}
        <small>{sub}</small>
      </span>
      <i />
    </div>
  );
  const nodes: Node[] = useMemo(
    () => [
      {
        id: "sensor",
        position: { x: 0, y: 105 },
        data: {
          label: label(
            Activity,
            "环境传感器",
            `${scene.temp.toFixed(1)}°C / ${scene.smoke.toFixed(1)}%`,
            scene.level !== "normal",
          ),
        },
        style,
        ...horizontal,
      },
      {
        id: "logic",
        position: { x: 212, y: 105 },
        data: {
          label: label(
            ShieldCheck,
            "预警逻辑",
            state.automatic ? "自动联动 · 已启用" : "手动响应模式",
            scene.level === "alarm",
          ),
        },
        style: {
          ...style,
          borderColor: scene.level === "alarm" ? "#d97972" : "#5e9878",
        },
        ...horizontal,
      },
      {
        id: "siren",
        position: { x: 430, y: 0 },
        data: {
          label: label(
            BellRing,
            "声光警报",
            scene.level === "alarm" ? "警报中" : "待机",
            scene.level === "alarm",
          ),
        },
        style,
        ...horizontal,
      },
      {
        id: "sprinkler",
        position: { x: 430, y: 70 },
        data: {
          label: label(
            Droplets,
            "喷淋系统",
            scene.sprinkler ? "阀门开启" : "待机",
            scene.sprinkler,
          ),
        },
        style,
        ...horizontal,
      },
      {
        id: "fan",
        position: { x: 430, y: 140 },
        data: {
          label: label(
            Fan,
            "排烟风机",
            scene.fan ? "运行中" : "待机",
            scene.fan,
          ),
        },
        style,
        ...horizontal,
      },
      {
        id: "isolate",
        position: { x: 430, y: 210 },
        data: {
          label: label(
            DoorClosed,
            "分区与电梯",
            `${scene.doorClosed ? "门已关" : "门开启"} / ${scene.elevatorDown ? "1F" : "待机"}`,
            scene.doorClosed || scene.elevatorDown,
          ),
        },
        style,
        ...horizontal,
      },
    ],
    [scene, state.automatic],
  );
  const [flowNodes, setFlowNodes, onNodesChange] = useNodesState(nodes);
  useEffect(() => {
    setFlowNodes((previous) =>
      nodes.map((node) => {
        const existing = previous.find((item) => item.id === node.id);
        return {
          ...existing,
          ...node,
          position: existing?.position || node.position,
        };
      }),
    );
  }, [nodes, setFlowNodes]);
  const edges: Edge[] = [
    {
      id: "e-sensor",
      source: "sensor",
      target: "logic",
      animated: state.running,
      style: { stroke: "#7bc89a", strokeWidth: 1.4 },
    },
    ...["siren", "sprinkler", "fan", "isolate"].map((target) => ({
      id: "e-" + target,
      source: "logic",
      target,
      type: "smoothstep",
      animated: scene.level === "alarm",
      style: {
        stroke: scene.level === "alarm" ? "#c67c69" : "#354b3d",
        strokeWidth: 1.2,
      },
    })),
  ];
  return (
    <div className={`linkage-canvas ${full ? "linkage-full" : ""}`}>
      <ReactFlow
        key={full ? "full" : "mini"}
        nodes={flowNodes}
        edges={edges}
        onNodesChange={onNodesChange}
        fitView
        fitViewOptions={{ padding: full ? 0.25 : 0.12 }}
        nodesDraggable={full}
        nodesConnectable={false}
        elementsSelectable={full}
        zoomOnScroll={full}
        panOnDrag={full}
        preventScrolling={full}
        minZoom={0.3}
        maxZoom={1.8}
        proOptions={{ hideAttribution: true }}
        colorMode="dark"
      >
        <Background
          color="#344139"
          variant={BackgroundVariant.Dots}
          gap={18}
          size={1}
        />
        {full && <Controls showInteractive={false} />}
      </ReactFlow>
    </div>
  );
}
function AutomationPanel({ onFlow }: { onFlow: () => void }) {
  const { state, scene, dispatch } = useSim();
  return (
    <section className="panel automation-panel">
      <div className="panel-header">
        <h2>
          <Network size={15} />
          自动联动
        </h2>
        <button
          className={`toggle ${state.automatic ? "toggle-on" : ""}`}
          role="switch"
          aria-checked={state.automatic}
          aria-label="自动联动"
          onClick={() => dispatch({ type: "AUTO" })}
        >
          <span />
        </button>
      </div>
      <p className="panel-description">一个信号，串联完整响应。</p>
      <LinkageFlow />
      <div className="automation-steps">
        <div>
          <span className="step-dot">
            <Check size={9} />
          </span>
          <span>实时感知</span>
          <ChevronRight size={11} />
          <span
            className={`step-dot ${scene.level === "alarm" ? "step-alert" : ""}`}
          >
            2
          </span>
          <span>智能判断</span>
          <ChevronRight size={11} />
          <span
            className={`step-dot ${scene.sprinkler ? "step-done" : "step-pending"}`}
          >
            3
          </span>
          <span>设备响应</span>
        </div>
      </div>
      <button className="panel-link" onClick={onFlow}>
        查看完整联动流程
        <ArrowRight size={13} />
      </button>
    </section>
  );
}
function MetricCard({
  label,
  value,
  unit,
  icon: Icon,
  children,
  accent = "",
}: {
  label: string;
  value: string;
  unit?: string;
  icon: LucideIcon;
  children: ReactNode;
  accent?: string;
}) {
  return (
    <div className={`metric-card ${accent}`}>
      <div className="metric-top">
        <span>{label}</span>
        <Icon size={17} strokeWidth={1.5} />
      </div>
      <div className="metric-value tabular-nums">
        {value}
        <small>{unit}</small>
      </div>
      <div className="metric-foot">{children}</div>
    </div>
  );
}
function SettingsModal({ onClose }: { onClose: () => void }) {
  const { state, dispatch } = useSim();
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    document.getElementById("close-settings")?.focus();
    return () => before?.focus();
  }, []);
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="modal"
        initial={{ opacity: 0, y: 15, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 15 }}
        transition={spring}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Tab") {
            const controls = Array.from(
              e.currentTarget.querySelectorAll<HTMLElement>(
                'button,[href],input,select,textarea,[tabindex="0"]',
              ),
            );
            const first = controls[0],
              last = controls[controls.length - 1];
            if (e.shiftKey && document.activeElement === first) {
              e.preventDefault();
              last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
              e.preventDefault();
              first.focus();
            }
          }
        }}
      >
        <div className="detail-heading">
          <h2 id="settings-title">演练设置</h2>
          <button
            id="close-settings"
            className="icon-button"
            aria-label="关闭设置"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>
        <p className="detail-copy">当前场景与设备使用本地模拟数据。</p>
        <div className="setting-row">
          <div>
            <strong>自动消防联动</strong>
            <p>达到警报阈值后，执行设备联动</p>
          </div>
          <button
            className={`toggle ${state.automatic ? "toggle-on" : ""}`}
            role="switch"
            aria-checked={state.automatic}
            aria-label="设置自动联动"
            onClick={() => dispatch({ type: "AUTO" })}
          >
            <span />
          </button>
        </div>
        <div className="setting-row">
          <div>
            <strong>模拟警报声音</strong>
            <p>发生警报时播放声音，确认后静音</p>
          </div>
          <button
            className={`toggle ${state.sound ? "toggle-on" : ""}`}
            role="switch"
            aria-checked={state.sound}
            aria-label="设置警报声音"
            onClick={() => dispatch({ type: "SOUND" })}
          >
            <span />
          </button>
        </div>
        <div className="setting-info">
          <BookOpen size={17} />
          <p>
            点击主模块展开，再点击子卡片查看详情。传感器详情可以手动调节读数与阈值；点击「模拟火情」观察完整的自动响应过程。
          </p>
        </div>
        <button
          className="btn btn-primary w-full justify-center"
          onClick={onClose}
        >
          开始探索
          <ArrowRight size={15} />
        </button>
      </motion.div>
    </div>
  );
}
function AlarmSound() {
  const { state } = useSim();
  const active =
    state.sound &&
    Object.values(state.scenes).some(
      (scene) => scene.level === "alarm" && !scene.confirmed,
    );
  useEffect(() => {
    if (!active) return;
    const audio = new AudioContext(),
      oscillator = audio.createOscillator(),
      gain = audio.createGain();
    oscillator.type = "sine";
    gain.gain.value = 0.035;
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.frequency.setValueAtTime(620, audio.currentTime);
    oscillator.start();
    void audio.resume().catch(() => undefined);
    let high = false;
    const timer = setInterval(() => {
      high = !high;
      oscillator.frequency.linearRampToValueAtTime(
        high ? 820 : 620,
        audio.currentTime + 0.35,
      );
    }, 700);
    return () => {
      clearInterval(timer);
      oscillator.stop();
      void audio.close();
    };
  }, [active]);
  return null;
}
function Application() {
  const { state, scene, dispatch } = useSim();
  const [page, setPage] = useState<Page>("dashboard"),
    [open, setOpen] = useState<ModuleId | null>("scene");
  const [settings, setSettings] = useState(false),
    [filter, setFilter] = useState("all");
  const activeDevices = [
    scene.sprinkler,
    scene.fan,
    scene.doorClosed,
    scene.elevatorDown,
  ].filter(Boolean).length;
  const alertCount = Object.values(state.scenes).filter(
    (s) => s.level !== "normal",
  ).length;
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSettings(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
  const navigate = (next: Page) => {
    setPage(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div
      className={`app-shell ${scene.level === "alarm" && !scene.confirmed ? "app-alarm" : ""}`}
    >
      <AlarmSound />
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            navigate("dashboard");
          }}
          aria-label="FireGuard 首页"
        >
          <span className="brand-mark">
            <Flame size={23} fill="currentColor" strokeWidth={1} />
          </span>
          <span>
            FireGuard<small>SIMULATION PLATFORM</small>
          </span>
        </a>
        <div className="workspace-badge">
          <span className="workspace-avatar">F</span>
          <span>
            消防安全演练空间<small>本地模拟工作台</small>
          </span>
          <ShieldCheck size={14} />
        </div>
        <span className="nav-label">工作空间</span>
        <nav aria-label="主导航">
          {(
            [
              { id: "dashboard", icon: LayoutDashboard, name: "总览仪表盘" },
              { id: "flow", icon: Network, name: "联动流程" },
              { id: "logs", icon: FileText, name: "数据与日志" },
            ] as const
          ).map(({ id, icon: Icon, name }) => (
            <button
              aria-label={name}
              className={`nav-item ${page === id ? "nav-active" : ""}`}
              key={id}
              onClick={() => navigate(id)}
            >
              <Icon size={17} strokeWidth={1.6} />
              {name}
              {id === "dashboard" ? (
                <span className="nav-current" />
              ) : (
                id === "logs" && (
                  <span className="nav-count">{state.logs.length}</span>
                )
              )}
            </button>
          ))}
        </nav>
        <span className="nav-label nav-label-second">监控场景</span>
        <div className="scene-nav">
          {(Object.keys(sceneInfo) as SceneId[]).map((id) => (
            <button
              key={id}
              className={`scene-nav-item ${state.selected === id ? "scene-selected" : ""}`}
              onClick={() => dispatch({ type: "SELECT", id })}
            >
              <span
                className={`scene-bullet scene-bullet-${state.scenes[id].level}`}
              />
              <span>
                {id}
                <small>{sceneInfo[id].name}</small>
              </span>
              {state.selected === id && <ChevronRight size={13} />}
            </button>
          ))}
        </div>
        <div className="sidebar-bottom">
          <div className="demo-note">
            <FlaskConical size={17} />
            <span>
              安心演练，从容应对。<small>演练模式 · 模拟数据</small>
            </span>
          </div>
          <button
            aria-label="演练设置"
            className="nav-item"
            onClick={() => setSettings(true)}
          >
            <Settings2 size={17} />
            演练设置
            <CircleHelp size={14} className="ml-auto" />
          </button>
          <div className="sidebar-user">
            <span className="avatar">FG</span>
            <div>
              演练管理员<small>本地工作空间</small>
            </div>
            <span className="user-online" />
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <div className="breadcrumb">
            工作空间
            <ChevronRight size={13} />
            <span>
              {page === "dashboard"
                ? "总览仪表盘"
                : page === "flow"
                  ? "联动流程"
                  : "数据与日志"}
            </span>
          </div>
          <div className="topbar-end">
            <span className="system-online">
              <i />
              系统在线
            </span>
            <span className="topbar-divider" />
            <Clock />
            <button
              className="notification-button"
              aria-label="查看预警日志"
              onClick={() => {
                setFilter("alert");
                navigate("logs");
              }}
            >
              <Bell size={18} />
              {alertCount > 0 && <span>{alertCount}</span>}
            </button>
            <span className="avatar avatar-small">FG</span>
          </div>
        </header>
        <main>
          <div className="page-heading">
            <div>
              <div className="eyebrow page-eyebrow">
                <span />
                FIRE SAFETY, REIMAGINED
              </div>
              <h1>
                {page === "dashboard"
                  ? "消防预警模拟平台"
                  : page === "flow"
                    ? "让每一次预警，有序响应。"
                    : "每一次响应，都有迹可循。"}
              </h1>
              <p>
                {page === "dashboard"
                  ? "感知环境变化，探索预警逻辑，让安全响应尽在掌握。"
                  : page === "flow"
                    ? "实时查看传感器、预警策略与消防设备之间的联动关系。"
                    : "在时间轴中回溯演练过程，或导出事件记录进行分析。"}
              </p>
            </div>
            <span className="version-badge">
              <span />
              FireGuard Sim<small>v1.1</small>
            </span>
          </div>
          <section className="simulation-toolbar" aria-label="模拟控制">
            <div className="scenario-selector">
              <MapPin size={15} />
              <label className="sr-only" htmlFor="scene-selector">
                选择监控场景
              </label>
              <select
                id="scene-selector"
                value={state.selected}
                onChange={(e) =>
                  dispatch({ type: "SELECT", id: e.target.value as SceneId })
                }
              >
                {(Object.keys(sceneInfo) as SceneId[]).map((id) => (
                  <option key={id} value={id}>
                    {id} {sceneInfo[id].name}
                  </option>
                ))}
              </select>
              <ChevronDown size={13} />
            </div>
            <span className="toolbar-divider" />
            <Status level={state.running ? "normal" : "neutral"}>
              {state.running ? "实时模拟中" : "模拟已暂停"}
            </Status>
            <div className="toolbar-actions">
              <button
                className="btn btn-quiet"
                onClick={() => dispatch({ type: "RUN" })}
              >
                {state.running ? <Pause size={14} /> : <Play size={14} />}
                {state.running ? "暂停模拟" : "继续模拟"}
              </button>
              <button
                className="icon-button reset-button"
                aria-label="复位当前场景"
                title="复位当前场景"
                onClick={() => dispatch({ type: "RESET" })}
              >
                <RotateCcw size={15} />
              </button>
              <button
                className="btn btn-primary fire-button"
                disabled={scene.incident}
                onClick={() => dispatch({ type: "FIRE" })}
              >
                <Flame size={15} />
                {scene.incident ? "火情模拟中" : "模拟火情"}
              </button>
            </div>
          </section>
          {scene.level !== "normal" && (
            <div role="alert" className={`alert-banner banner-${scene.level}`}>
              <BellRing size={18} />
              <div>
                <strong>
                  {scene.level === "alarm" ? "模拟火情警报" : "环境预警"} ·{" "}
                  {scene.id} {scene.name}
                </strong>
                <span>
                  {scene.confirmed
                    ? "警报已确认，设备状态持续监测中。"
                    : state.automatic && scene.level === "alarm"
                      ? "自动联动策略已执行，请查看设备状态。"
                      : "环境读数达到预警条件，请查看传感器详情。"}
                </span>
              </div>
              <button
                className="btn btn-secondary"
                disabled={scene.confirmed}
                onClick={() => dispatch({ type: "ACK" })}
              >
                {scene.confirmed ? "已确认" : "确认警报"}
              </button>
              <button
                className="btn btn-quiet"
                onClick={() => dispatch({ type: "RESET" })}
              >
                复位场景
                <RotateCcw size={13} />
              </button>
            </div>
          )}
          {page === "dashboard" && (
            <>
              <div className="metrics-grid">
                <MetricCard
                  label="设备在线"
                  value="12"
                  unit="/ 12"
                  icon={ShieldCheck}
                >
                  <i className="live-dot" />
                  {!scene.mainPower && !scene.emergencyPower
                    ? "供电告警，请检查设备供电"
                    : "当前场景设备运行稳定"}
                </MetricCard>
                <MetricCard
                  label="环境温度"
                  value={scene.temp.toFixed(1)}
                  unit="°C"
                  icon={Thermometer}
                  accent="metric-temperature"
                >
                  <span className="metric-range">
                    {scene.temp >= scene.tempLimit
                      ? "已达到报警阈值"
                      : "环境实时采样"}
                  </span>
                  <span>阈值 {scene.tempLimit}°C</span>
                </MetricCard>
                <MetricCard
                  label="烟雾浓度"
                  value={scene.smoke.toFixed(1)}
                  unit="%"
                  icon={Smoke}
                >
                  <span className="metric-range">
                    {scene.smoke >= scene.smokeLimit
                      ? "已达到报警阈值"
                      : "环境实时采样"}
                  </span>
                  <span>阈值 {scene.smokeLimit}%</span>
                </MetricCard>
                <MetricCard
                  label="联动设备"
                  value={`0${activeDevices}`}
                  unit="/ 04"
                  icon={Zap}
                >
                  <i
                    className={`live-dot ${activeDevices ? "" : "dot-muted"}`}
                  />
                  {activeDevices ? "消防联动设备运行中" : "设备待命，随时响应"}
                </MetricCard>
              </div>
              <div className="workspace-grid">
                <div className="modules-column">
                  <div className="section-title">
                    <h2>
                      模块工作台<span>MODULE WORKSPACE</span>
                    </h2>
                    <span>
                      点击卡片，逐层探索
                      <SlidersHorizontal size={13} />
                    </span>
                  </div>
                  <ModuleGrid open={open} setOpen={setOpen} />
                  <div className="workspace-footnote">
                    <span>
                      <span className="keyboard-key">↵</span>选中卡片后按 Enter
                      展开
                    </span>
                    <span>
                      <span className="live-dot" />
                      所有模块状态实时同步
                    </span>
                  </div>
                </div>
                <aside className="context-column">
                  <AutomationPanel onFlow={() => navigate("flow")} />
                  <section className="panel recent-panel">
                    <div className="panel-header">
                      <h2>
                        <Activity size={15} />
                        实时动态
                      </h2>
                      <span className="live-label">
                        <i className="live-dot" />
                        LIVE
                      </span>
                    </div>
                    <LogList compact logs={state.logs.slice(0, 3)} />
                    <button
                      className="panel-link"
                      onClick={() => {
                        setFilter("all");
                        navigate("logs");
                      }}
                    >
                      查看全部事件
                      <span>
                        {state.logs.length}
                        <ArrowRight size={13} />
                      </span>
                    </button>
                  </section>
                </aside>
              </div>
            </>
          )}
          {page === "flow" && (
            <section className="panel full-flow-panel">
              <div className="panel-header">
                <h2>
                  <Network size={17} />
                  {scene.id} 实时联动拓扑
                </h2>
                <Status level={state.automatic ? "normal" : "neutral"}>
                  {state.automatic ? "自动联动已启用" : "手动响应模式"}
                </Status>
              </div>
              <LinkageFlow full />
              <div className="flow-footer">
                <span>
                  <i className="legend-dot" />
                  在线设备
                  <i className="legend-dot limit-dot" />
                  警报触发后执行联动
                </span>
                <span>拖动节点 · 滚轮缩放 · 左下角适应画布</span>
              </div>
              <div className="flow-action-row">
                <button
                  className="btn btn-secondary"
                  onClick={() => dispatch({ type: "AUTO" })}
                >
                  <Zap size={15} />
                  {state.automatic ? "切换手动控制" : "启用自动联动"}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    navigate("dashboard");
                    setOpen("control");
                  }}
                >
                  打开设备控制
                  <ArrowRight size={15} />
                </button>
              </div>
            </section>
          )}
          {page === "logs" && (
            <section className="panel log-page">
              <div className="panel-header">
                <h2>
                  <FileText size={17} />
                  演练事件记录
                  <span className="count-badge">{state.logs.length}</span>
                </h2>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    exportLogs(state.logs);
                    dispatch({ type: "NOTICE", text: "全部事件已导出为 CSV" });
                  }}
                >
                  <ArrowDownToLine size={14} />
                  导出全部 CSV
                </button>
              </div>
              <div className="log-tabs">
                <button
                  className={filter === "all" ? "tab-active" : ""}
                  onClick={() => setFilter("all")}
                >
                  全部事件
                </button>
                <button
                  className={filter === "alert" ? "tab-active" : ""}
                  onClick={() => setFilter("alert")}
                >
                  预警与警报
                </button>
                <button
                  className={filter === "csv" ? "tab-active" : ""}
                  onClick={() => setFilter("csv")}
                >
                  CSV 预览
                </button>
                <span>当前会话 · 最多保留 250 条</span>
              </div>
              <div className="log-page-body">
                {filter === "csv" ? (
                  <CsvPreview />
                ) : filter === "alert" &&
                  !state.logs.some(
                    (log) => log.level === "warning" || log.level === "danger",
                  ) ? (
                  <div className="empty-state">
                    <ShieldCheck size={36} />
                    <h3>一切平稳，暂无预警事件</h3>
                    <p>点击「模拟火情」开始一次完整演练。</p>
                  </div>
                ) : (
                  <LogList
                    logs={
                      filter === "alert"
                        ? state.logs.filter(
                            (log) =>
                              log.level === "warning" || log.level === "danger",
                          )
                        : state.logs
                    }
                  />
                )}
              </div>
            </section>
          )}
          <footer className="page-footer">
            <span>
              <ShieldCheck size={13} />
              FireGuard Sim<span className="footer-separator">/</span>
              让安全，在演练中发生。
            </span>
            <span>
              本地模拟环境<span className="footer-separator">·</span>
              无真实设备连接
            </span>
          </footer>
        </main>
      </div>
      <AnimatePresence>
        {state.toast && (
          <motion.div
            className="toast"
            role="status"
            key={state.toast.id}
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            transition={spring}
          >
            <span>
              <Check size={15} />
            </span>
            {state.toast.text}
            <button
              aria-label="关闭提示"
              onClick={() =>
                state.toast && dispatch({ type: "DISMISS", id: state.toast.id })
              }
            >
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {settings && <SettingsModal onClose={() => setSettings(false)} />}
      </AnimatePresence>
    </div>
  );
}
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <SimProvider>
        <Application />
      </SimProvider>
    </MotionConfig>
  );
}
