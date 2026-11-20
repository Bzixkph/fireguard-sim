import {
  createContext,
  useContext,
  useEffect,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";

export type Level = "normal" | "warning" | "alarm";
export type SceneId = "A-101" | "B-202" | "C-301";
export type Device = "sprinkler" | "fan" | "doorClosed" | "elevatorDown";
export type ShutterMotion = "down" | "up" | "stopped";
export type ModuleId = "scene" | "alarm" | "control" | "logs";
export interface Scene {
  id: SceneId;
  name: string;
  location: string;
  temp: number;
  smoke: number;
  temps: number[];
  smokes: number[];
  manualAlarm: boolean;
  incident: boolean;
  sprinkler: boolean;
  fan: boolean;
  doorClosed: boolean;
  elevatorDown: boolean;
  shutterPosition: number;
  shutterMotion: ShutterMotion;
  emergencyPower: boolean;
  mainPower: boolean;
  level: Level;
  confirmed: boolean;
  tempLimit: number;
  smokeLimit: number;
}
export interface Log {
  id: number;
  time: string;
  scene: SceneId;
  level: "info" | "success" | "warning" | "danger";
  text: string;
  temp: number;
  smoke: number;
}
export interface SimState {
  scenes: Record<SceneId, Scene>;
  selected: SceneId;
  running: boolean;
  automatic: boolean;
  sound: boolean;
  logs: Log[];
  nextId: number;
  toast: { id: number; text: string } | null;
}
export type Action =
  | { type: "TICK" }
  | { type: "RUN" }
  | { type: "AUTO" }
  | { type: "SOUND" }
  | { type: "SELECT"; id: SceneId }
  | { type: "FIRE" }
  | { type: "RESET" }
  | { type: "SENSOR"; sensor: "temp" | "smoke"; value: number }
  | { type: "LIMIT"; sensor: "tempLimit" | "smokeLimit"; value: number }
  | { type: "ALARM" }
  | { type: "ACK" }
  | { type: "DEVICE"; device: Device }
  | { type: "SHUTTER"; direction: ShutterMotion }
  | { type: "SHUTTER_TICK" }
  | { type: "POWER_SOURCE"; emergency: boolean }
  | { type: "MAIN_POWER" }
  | { type: "BROADCAST"; text: string }
  | { type: "NOTICE"; text: string }
  | { type: "DISMISS"; id: number };
export const sceneInfo: Record<
  SceneId,
  { name: string; location: string; base: number }
> = {
  "A-101": { name: "实验室", location: "1F · 东翼 · 主实验区", base: 26.4 },
  "B-202": { name: "设备机房", location: "2F · 西翼 · 设备区", base: 28.1 },
  "C-301": { name: "办公区域", location: "3F · 南翼 · 开放办公区", base: 24.8 },
};
export const levelText: Record<Level, string> = {
  normal: "运行正常",
  warning: "环境预警",
  alarm: "火情警报",
};
const deviceText: Record<Device, [string, string]> = {
  sprinkler: ["喷淋阀门已开启", "喷淋阀门已关闭"],
  fan: ["排烟风机已启动", "排烟风机已停止"],
  doorClosed: ["防火门已关闭", "防火门已打开"],
  elevatorDown: ["消防电梯已迫降首层", "消防电梯已恢复待机"],
};
function createScene(id: SceneId): Scene {
  const base = sceneInfo[id].base;
  return {
    id,
    ...sceneInfo[id],
    temp: base,
    smoke: 3.2,
    temps: Array.from(
      { length: 32 },
      (_, i) =>
        +(base + Math.sin(i * 0.55) * 0.7 + Math.cos(i * 1.4) * 0.3).toFixed(1),
    ),
    smokes: Array.from(
      { length: 32 },
      (_, i) => +(3.2 + Math.sin(i * 0.3) * 0.5).toFixed(1),
    ),
    manualAlarm: false,
    incident: false,
    sprinkler: false,
    fan: false,
    doorClosed: false,
    elevatorDown: false,
    shutterPosition: 0,
    shutterMotion: "stopped",
    emergencyPower: false,
    mainPower: true,
    level: "normal",
    confirmed: false,
    tempLimit: 60,
    smokeLimit: 40,
  };
}
function addLog(
  state: SimState,
  scene: Scene,
  text: string,
  level: Log["level"] = "info",
): SimState {
  return {
    ...state,
    logs: [
      {
        id: state.nextId,
        time: new Date().toISOString(),
        scene: scene.id,
        level,
        text,
        temp: scene.temp,
        smoke: scene.smoke,
      },
      ...state.logs,
    ].slice(0, 250),
    nextId: state.nextId + 1,
  };
}
function notice(state: SimState, text: string): SimState {
  return { ...state, toast: { id: Date.now() + Math.random(), text } };
}
function evaluate(scene: Scene): Level {
  if (
    scene.manualAlarm ||
    scene.temp >= scene.tempLimit ||
    scene.smoke >= scene.smokeLimit
  )
    return "alarm";
  if (
    scene.temp >= scene.tempLimit * 0.75 ||
    scene.smoke >= scene.smokeLimit * 0.5
  )
    return "warning";
  return "normal";
}
function reconcile(state: SimState, scene: Scene): SimState {
  const previous = state.scenes[scene.id].level;
  scene.level = evaluate(scene);
  if (scene.level !== previous) {
    scene.confirmed = false;
    state = addLog(
      state,
      scene,
      scene.level === "alarm"
        ? "检测到警报条件，进入火情响应流程"
        : scene.level === "warning"
          ? "传感器接近警报阈值，进入预警状态"
          : "环境读数恢复正常，警报条件已解除",
      scene.level === "alarm"
        ? "danger"
        : scene.level === "warning"
          ? "warning"
          : "success",
    );
    if (scene.level === "alarm" && state.automatic) {
      scene = {
        ...scene,
        sprinkler: true,
        fan: true,
        doorClosed: true,
        elevatorDown: true,
      };
      state = addLog(
        state,
        scene,
        "自动联动已执行：喷淋、排烟、防火门、电梯迫降",
        "warning",
      );
    }
  }
  return { ...state, scenes: { ...state.scenes, [scene.id]: scene } };
}
function initialState(): SimState {
  const scenes = {
    "A-101": createScene("A-101"),
    "B-202": createScene("B-202"),
    "C-301": createScene("C-301"),
  };
  let state: SimState = {
    scenes,
    selected: "A-101",
    running: true,
    automatic: true,
    sound: false,
    logs: [],
    nextId: 1,
    toast: null,
  };
  state = addLog(
    state,
    scenes["A-101"],
    "模拟平台已就绪，12 台虚拟设备全部在线",
    "success",
  );
  return addLog(state, scenes["A-101"], "自动联动策略已启用");
}
export function reducer(state: SimState, action: Action): SimState {
  const current = state.scenes[state.selected];
  switch (action.type) {
    case "SHUTTER_TICK": {
      let changed = false;
      const scenes = { ...state.scenes };
      for (const scene of Object.values(state.scenes)) {
        if (scene.shutterMotion === "stopped") continue;
        const position = Math.min(
          100,
          Math.max(
            0,
            scene.shutterPosition +
              (scene.shutterMotion === "down" ? 2.5 : -2.5),
          ),
        );
        scenes[scene.id] = {
          ...scene,
          shutterPosition: position,
          shutterMotion:
            position === 0 || position === 100
              ? "stopped"
              : scene.shutterMotion,
        };
        changed = true;
      }
      return changed ? { ...state, scenes } : state;
    }
    case "SHUTTER": {
      const direction = action.direction;
      if (
        direction === current.shutterMotion ||
        (direction === "up" && current.shutterPosition === 0) ||
        (direction === "down" && current.shutterPosition === 100)
      )
        return state;
      const text =
        direction === "stopped"
          ? `防火卷帘已停止，当前位置 ${current.shutterPosition}%（${shutterLabel(current.shutterPosition)}）`
          : `防火卷帘开始${direction === "down" ? "下降" : "上升"}`;
      const next = {
        ...state,
        scenes: {
          ...state.scenes,
          [current.id]: { ...current, shutterMotion: direction },
        },
      };
      return notice(
        addLog(
          next,
          current,
          text,
          direction === "down" ? "warning" : "success",
        ),
        text,
      );
    }
    case "POWER_SOURCE": {
      if (action.emergency === current.emergencyPower) return state;
      if (!action.emergency && !current.mainPower)
        return notice(state, "常用电源已关闭，请先开启后恢复市电");
      const text = action.emergency
        ? "已切换应急电源，当前为应急供电"
        : "已恢复市电供电";
      const next = {
        ...state,
        scenes: {
          ...state.scenes,
          [current.id]: { ...current, emergencyPower: action.emergency },
        },
      };
      return notice(addLog(next, current, text, "success"), text);
    }
    case "MAIN_POWER": {
      const mainPower = !current.mainPower;
      const text = mainPower
        ? `常用电源已开启${current.emergencyPower ? "，当前仍使用应急供电" : "，市电供电已就绪"}`
        : `常用电源已关闭，相关消防设备可能受影响${current.emergencyPower ? "；应急电源正在供电" : "；请切换应急电源"}`;
      const next = {
        ...state,
        scenes: { ...state.scenes, [current.id]: { ...current, mainPower } },
      };
      return notice(
        addLog(next, current, text, mainPower ? "success" : "warning"),
        text,
      );
    }
    case "TICK": {
      if (!state.running) return state;
      let next = state;
      for (const id of Object.keys(state.scenes) as SceneId[]) {
        const old = state.scenes[id];
        const base = sceneInfo[id].base;
        const temp = Math.max(
          base - 1,
          Math.min(
            110,
            old.temp +
              (old.incident ? 3.8 : (base - old.temp) * 0.1) -
              (old.sprinkler ? 5.7 : 0) +
              (Math.random() - 0.5) * 0.4,
          ),
        );
        const smoke = Math.max(
          1,
          Math.min(
            100,
            old.smoke +
              (old.incident ? 5 : (3.2 - old.smoke) * 0.14) -
              (old.fan ? 7.6 : 0) +
              (Math.random() - 0.5) * 0.3,
          ),
        );
        const scene = {
          ...old,
          temp: +temp.toFixed(1),
          smoke: +smoke.toFixed(1),
          temps: [...old.temps.slice(-31), +temp.toFixed(1)],
          smokes: [...old.smokes.slice(-31), +smoke.toFixed(1)],
        };
        if (old.incident && old.sprinkler && temp < 38 && smoke < 12) {
          scene.incident = false;
          next = addLog(next, scene, "模拟火情已受控，环境正在恢复", "success");
        }
        next = reconcile(next, scene);
      }
      return next;
    }
    case "RUN":
      return notice(
        addLog(
          { ...state, running: !state.running },
          current,
          state.running ? "已暂停环境模拟" : "已继续环境模拟",
        ),
        state.running ? "模拟已暂停，可以手动调节传感器" : "实时模拟已继续",
      );
    case "SELECT":
      return notice(
        addLog(
          { ...state, selected: action.id },
          state.scenes[action.id],
          "已切换监测场景",
        ),
        `当前场景：${action.id} ${sceneInfo[action.id].name}`,
      );
    case "FIRE":
      return notice(
        addLog(
          {
            ...state,
            running: true,
            scenes: {
              ...state.scenes,
              [current.id]: { ...current, incident: true, confirmed: false },
            },
          },
          current,
          "已注入模拟火情，温度与烟雾将逐步上升",
          "warning",
        ),
        "模拟火情已开始，观察传感器与自动联动",
      );
    case "RESET":
      return notice(
        addLog(
          {
            ...state,
            scenes: {
              ...state.scenes,
              [current.id]: {
                ...createScene(current.id),
                tempLimit: current.tempLimit,
                smokeLimit: current.smokeLimit,
              },
            },
          },
          current,
          "当前场景已复位，设备恢复待机",
          "success",
        ),
        "当前场景已恢复初始状态",
      );
    case "SENSOR":
      return reconcile(state, {
        ...current,
        [action.sensor]: action.value,
        [action.sensor === "temp" ? "temps" : "smokes"]: [
          ...(action.sensor === "temp" ? current.temps : current.smokes).slice(
            -31,
          ),
          action.value,
        ],
      });
    case "LIMIT":
      return reconcile(
        addLog(
          state,
          current,
          `已调整${action.sensor === "tempLimit" ? "温度" : "烟雾"}报警阈值为 ${action.value}${action.sensor === "tempLimit" ? " °C" : " %"}`,
        ),
        { ...current, [action.sensor]: action.value },
      );
    case "ALARM":
      return notice(
        reconcile(addLog(state, current, "手动触发声光警报器", "danger"), {
          ...current,
          manualAlarm: true,
          confirmed: false,
        }),
        "声光警报已触发",
      );
    case "ACK":
      return notice(
        addLog(
          {
            ...state,
            scenes: {
              ...state.scenes,
              [current.id]: { ...current, confirmed: true },
            },
          },
          current,
          "值守人员已确认警报，响应记录已保存",
          "warning",
        ),
        "警报已确认，复位场景可解除模拟警报",
      );
    case "AUTO": {
      let next = addLog(
        { ...state, automatic: !state.automatic },
        current,
        state.automatic ? "自动联动已关闭，切换至手动控制" : "自动联动已启用",
      );
      if (next.automatic)
        for (const scene of Object.values(next.scenes))
          if (scene.level === "alarm") {
            next = {
              ...next,
              scenes: {
                ...next.scenes,
                [scene.id]: {
                  ...scene,
                  sprinkler: true,
                  fan: true,
                  doorClosed: true,
                  elevatorDown: true,
                },
              },
            };
            next = addLog(next, scene, "对现有警报执行自动设备联动", "warning");
          }
      return notice(
        next,
        state.automatic ? "已切换至手动控制模式" : "自动联动模式已启用",
      );
    }
    case "SOUND":
      return notice(
        { ...state, sound: !state.sound },
        state.sound ? "警报声音已关闭" : "警报声音已开启",
      );
    case "DEVICE":
      return notice(
        addLog(
          {
            ...state,
            scenes: {
              ...state.scenes,
              [current.id]: {
                ...current,
                [action.device]: !current[action.device],
              },
            },
          },
          current,
          deviceText[action.device][current[action.device] ? 1 : 0],
          "success",
        ),
        deviceText[action.device][current[action.device] ? 1 : 0],
      );
    case "BROADCAST":
      return notice(
        addLog(state, current, `模拟广播：${action.text}`, "warning"),
        "广播已发送至当前模拟区域",
      );
    case "NOTICE":
      return notice(state, action.text);
    case "DISMISS":
      return state.toast?.id === action.id ? { ...state, toast: null } : state;
    default:
      return state;
  }
}
const SimContext = createContext<{
  state: SimState;
  dispatch: Dispatch<Action>;
} | null>(null);
export function SimProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const shutterMoving = Object.values(state.scenes).some(
    (scene) => scene.shutterMotion !== "stopped",
  );
  useEffect(() => {
    if (!shutterMoving) return;
    const timer = window.setInterval(
      () => dispatch({ type: "SHUTTER_TICK" }),
      100,
    );
    return () => window.clearInterval(timer);
  }, [shutterMoving]);
  useEffect(() => {
    if (!state.running) return;
    const timer = window.setInterval(() => dispatch({ type: "TICK" }), 1500);
    return () => window.clearInterval(timer);
  }, [state.running]);
  useEffect(() => {
    if (!state.toast) return;
    const id = state.toast.id;
    const timer = window.setTimeout(
      () => dispatch({ type: "DISMISS", id }),
      4200,
    );
    return () => window.clearTimeout(timer);
  }, [state.toast]);
  return (
    <SimContext.Provider value={{ state, dispatch }}>
      {children}
    </SimContext.Provider>
  );
}
export function useSim() {
  const value = useContext(SimContext);
  if (!value) throw new Error("Simulation context is missing");
  return { ...value, scene: value.state.scenes[value.state.selected] };
}
export function shutterLabel(position: number) {
  return position <= 0 ? "开启" : position >= 100 ? "全降" : "半降";
}
export function csvFor(logs: Log[]) {
  const escape = (value: string | number) => {
    const text = String(value);
    return `"${(/^[=+\-@\t\r]/.test(text) ? "'" : "") + text.replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      ["时间", "区域", "级别", "事件", "温度(°C)", "烟雾浓度(%)"],
      ...logs.map((log) => [
        new Date(log.time).toLocaleString("zh-CN", { hour12: false }),
        log.scene,
        log.level,
        log.text,
        log.temp,
        log.smoke,
      ]),
    ]
      .map((row) => row.map(escape).join(","))
      .join("\r\n")
  );
}
export function exportLogs(logs: Log[]) {
  const url = URL.createObjectURL(
    new Blob([csvFor(logs)], { type: "text/csv;charset=utf-8;" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = `FireGuard-事件记录-${new Date().toISOString().slice(0, 10)}.csv`;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
