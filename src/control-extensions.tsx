import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  BatteryCharging,
  CircleAlert,
  DoorClosed,
  Pause,
  PlugZap,
  Power,
  Zap,
} from "lucide-react";
import { shutterLabel, useSim } from "./model";
import { Status, SubCard, spring } from "./ui";

function ShutterVisual({ large = false }: { large?: boolean }) {
  const { scene } = useSim();
  const tone =
    scene.shutterPosition === 100
      ? "alarm"
      : scene.shutterPosition > 0
        ? "warning"
        : "normal";
  return (
    <div
      className={`shutter-visual ${large ? "shutter-large" : ""} shutter-${tone}`}
    >
      <div
        className="shutter-frame"
        role="img"
        aria-label={`防火卷帘${shutterLabel(scene.shutterPosition)}，下降 ${scene.shutterPosition}%`}
      >
        <div className="shutter-guide" />
        <motion.div
          className="shutter-slats"
          initial={false}
          animate={{ height: `${scene.shutterPosition}%` }}
          transition={{ type: "spring", stiffness: 420, damping: 38 }}
        />
        <div className="shutter-baseline" />
      </div>
      {large && (
        <div className="shutter-scale">
          <span>0%</span>
          <span>50%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}
function PowerVisual({
  emergency,
  available,
  large = false,
}: {
  emergency: boolean;
  available: boolean;
  large?: boolean;
}) {
  return (
    <div className={`power-visual ${large ? "power-large" : ""}`}>
      <motion.div
        className="power-device-icon"
        initial={false}
        animate={{
          backgroundColor: available ? "#203d2b" : "#402621",
          borderColor: available ? "#557b60" : "#a85f51",
          color: available ? "#a3e8b6" : "#f0a293",
        }}
        transition={spring}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.span
            key={emergency ? "backup" : "mains"}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.15 }}
          >
            {emergency ? (
              <BatteryCharging size={large ? 42 : 31} strokeWidth={1.4} />
            ) : (
              <PlugZap size={large ? 42 : 31} strokeWidth={1.4} />
            )}
          </motion.span>
        </AnimatePresence>
      </motion.div>
      <div className="power-source-lights">
        <span>
          <motion.i
            data-testid="mains-light"
            initial={false}
            animate={{
              backgroundColor: available && !emergency ? "#9ce9b2" : "#46554b",
              boxShadow:
                available && !emergency
                  ? "0 0 9px #8fddb766"
                  : "0 0 0px #8fddb700",
            }}
            transition={spring}
          />
          市电
        </span>
        <span>
          <motion.i
            data-testid="emergency-light"
            initial={false}
            animate={{
              backgroundColor: available && emergency ? "#9ce9b2" : "#46554b",
              boxShadow:
                available && emergency
                  ? "0 0 9px #8fddb766"
                  : "0 0 0px #8fddb700",
            }}
            transition={spring}
          />
          应急
        </span>
      </div>
    </div>
  );
}
export function ControlExtensionCards({
  open,
  toggle,
}: {
  open: string | null;
  toggle: (id: string) => void;
}) {
  const { scene } = useSim();
  const shutterState = shutterLabel(scene.shutterPosition);
  const available = scene.mainPower || scene.emergencyPower;
  return (
    <>
      <SubCard
        id="shutter"
        title="防火卷帘"
        icon={DoorClosed}
        open={open === "shutter"}
        onClick={() => toggle("shutter")}
        footer={`卷帘${shutterState} · ${scene.shutterPosition}%`}
        tone={
          scene.shutterPosition === 100
            ? "alarm"
            : scene.shutterPosition > 0
              ? "warning"
              : "normal"
        }
      >
        <div className="extension-card-body">
          <ShutterVisual />
          <Status
            level={
              scene.shutterPosition === 100
                ? "alarm"
                : scene.shutterPosition > 0
                  ? "warning"
                  : "normal"
            }
          >
            {shutterState}
            {scene.shutterMotion !== "stopped"
              ? ` · ${scene.shutterMotion === "down" ? "下降中" : "上升中"}`
              : ""}
          </Status>
        </div>
      </SubCard>
      <SubCard
        id="emergency-power"
        title="应急电源"
        icon={BatteryCharging}
        open={open === "emergency-power"}
        onClick={() => toggle("emergency-power")}
        footer={available ? "双路电源 · 状态监测" : "供电中断 · 待切换"}
        tone={available ? "normal" : "alarm"}
      >
        <div className="extension-card-body">
          <PowerVisual emergency={scene.emergencyPower} available={available} />
          <Status level={available ? "normal" : "alarm"}>
            {scene.emergencyPower
              ? "应急供电"
              : scene.mainPower
                ? "市电供电"
                : "供电中断"}
          </Status>
        </div>
      </SubCard>
      <SubCard
        id="main-power"
        title="常用电源"
        icon={Power}
        open={open === "main-power"}
        onClick={() => toggle("main-power")}
        footer={scene.mainPower ? "常用电源 · 已开启" : "常用电源 · 已关闭"}
        tone={scene.mainPower ? "normal" : "alarm"}
      >
        <div className="extension-card-body">
          <motion.div
            className="main-power-symbol"
            initial={false}
            animate={{
              color: scene.mainPower ? "#a3e8b6" : "#ef9b8c",
              backgroundColor: scene.mainPower ? "#1c3324" : "#3c251f",
              borderColor: scene.mainPower ? "#42684c" : "#945b4c",
            }}
            transition={spring}
          >
            <Power size={35} strokeWidth={1.3} />
          </motion.div>
          <Status level={scene.mainPower ? "normal" : "alarm"}>
            {scene.mainPower ? "开启" : "关闭"}
          </Status>
        </div>
      </SubCard>
    </>
  );
}
export function ControlExtensionDetails({ open }: { open: string }) {
  const { scene, dispatch } = useSim();
  if (open === "shutter") {
    const label = shutterLabel(scene.shutterPosition);
    return (
      <>
        <div className="extension-detail-layout">
          <ShutterVisual large />
          <div className="extension-detail-copy">
            <span className="eyebrow">FIRE SHUTTER</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h4
                key={label}
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -7 }}
                transition={{ duration: 0.16 }}
              >
                {label}
                <span className="tabular-nums">{scene.shutterPosition}%</span>
              </motion.h4>
            </AnimatePresence>
            <p className="detail-copy">
              {scene.shutterMotion === "stopped"
                ? scene.shutterPosition === 0
                  ? "卷帘保持开启，可以开始下降演练。"
                  : scene.shutterPosition === 100
                    ? "卷帘已全降，区域隔离完成。"
                    : "卷帘已暂停在中间位置，可继续下降或上升。"
                : scene.shutterMotion === "down"
                  ? "卷帘正在下降，点击停止可保持半降位置。"
                  : "卷帘正在上升，点击停止可保持当前位置。"}
            </p>
            <div
              className="shutter-progress"
              role="progressbar"
              aria-label="卷帘下降位置"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={scene.shutterPosition}
            >
              <motion.span
                initial={false}
                animate={{
                  width: `${scene.shutterPosition}%`,
                  backgroundColor:
                    scene.shutterPosition === 100 ? "#e59a86" : "#9cdbb1",
                }}
                transition={{ duration: 0.12 }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 extension-actions">
          <button
            className="btn btn-primary"
            disabled={
              scene.shutterPosition >= 100 || scene.shutterMotion === "down"
            }
            onClick={() => dispatch({ type: "SHUTTER", direction: "down" })}
          >
            <ArrowDown size={15} />
            下降
          </button>
          <button
            className="btn btn-secondary"
            disabled={
              scene.shutterPosition <= 0 || scene.shutterMotion === "up"
            }
            onClick={() => dispatch({ type: "SHUTTER", direction: "up" })}
          >
            <ArrowUp size={15} />
            上升
          </button>
          <button
            className="btn btn-secondary"
            disabled={scene.shutterMotion === "stopped"}
            onClick={() => dispatch({ type: "SHUTTER", direction: "stopped" })}
          >
            <Pause size={15} />
            停止
          </button>
          <span className="extension-motion-label">
            {scene.shutterMotion === "stopped"
              ? "电机已停止"
              : scene.shutterMotion === "down"
                ? "正在下降"
                : "正在上升"}
          </span>
        </div>
      </>
    );
  }
  if (open === "emergency-power") {
    const available = scene.mainPower || scene.emergencyPower;
    return (
      <>
        <div className="extension-detail-layout">
          <PowerVisual
            emergency={scene.emergencyPower}
            available={available}
            large
          />
          <div className="extension-detail-copy">
            <span className="eyebrow">POWER SUPPLY</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h4
                key={
                  scene.emergencyPower ? "backup" : available ? "mains" : "off"
                }
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -7 }}
                transition={{ duration: 0.16 }}
              >
                {scene.emergencyPower
                  ? "应急供电"
                  : available
                    ? "市电供电"
                    : "供电中断"}
              </motion.h4>
            </AnimatePresence>
            <p className="detail-copy">
              {scene.emergencyPower
                ? "应急电源已接管，绿色指示灯显示当前供电来源。"
                : available
                  ? "当前由市电供电，可切换应急电源进行演练。"
                  : "常用电源已关闭，切换应急电源可恢复模拟供电。"}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 extension-actions">
          <button
            className="btn btn-primary"
            disabled={scene.emergencyPower}
            onClick={() => dispatch({ type: "POWER_SOURCE", emergency: true })}
          >
            <BatteryCharging size={15} />
            切换应急电源
          </button>
          <button
            className="btn btn-secondary"
            disabled={!scene.emergencyPower || !scene.mainPower}
            onClick={() => dispatch({ type: "POWER_SOURCE", emergency: false })}
          >
            <PlugZap size={15} />
            恢复市电
          </button>
        </div>
        {!scene.mainPower && (
          <p className="extension-inline-hint">
            <CircleAlert size={13} />
            常用电源已关闭，请先开启后恢复市电。
          </p>
        )}
      </>
    );
  }
  if (open === "main-power")
    return (
      <>
        <div className="extension-detail-layout">
          <motion.div
            className="main-power-symbol main-power-large"
            initial={false}
            animate={{
              color: scene.mainPower ? "#a3e8b6" : "#ef9b8c",
              backgroundColor: scene.mainPower ? "#1c3324" : "#3c251f",
              borderColor: scene.mainPower ? "#42684c" : "#945b4c",
            }}
            transition={spring}
          >
            <Power size={48} strokeWidth={1.3} />
          </motion.div>
          <div className="extension-detail-copy">
            <span className="eyebrow">MAIN POWER</span>
            <AnimatePresence mode="wait" initial={false}>
              <motion.h4
                key={String(scene.mainPower)}
                initial={{ opacity: 0, y: 7 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -7 }}
                transition={{ duration: 0.16 }}
              >
                常用电源{scene.mainPower ? "开启" : "关闭"}
              </motion.h4>
            </AnimatePresence>
            <p className="detail-copy">
              {scene.mainPower
                ? "常用电源运行正常，绿色指示灯亮起。"
                : "常用电源已断开，红色指示灯亮起。"}
            </p>
          </div>
        </div>
        <button
          className={`btn ${scene.mainPower ? "btn-danger" : "btn-primary"}`}
          role="switch"
          aria-label="常用电源开关"
          aria-checked={scene.mainPower}
          onClick={() => dispatch({ type: "MAIN_POWER" })}
        >
          <Power size={15} />
          {scene.mainPower ? "关闭常用电源" : "开启常用电源"}
        </button>
        <AnimatePresence>
          {!scene.mainPower && (
            <motion.div
              role="alert"
              className={`power-warning ${scene.emergencyPower ? "power-warning-backup" : ""}`}
              initial={{ opacity: 0, height: 0, y: 5 }}
              animate={{ opacity: 1, height: "auto", y: 0 }}
              exit={{ opacity: 0, height: 0, y: 5 }}
              transition={spring}
            >
              <CircleAlert size={17} />
              <div>
                <strong>相关消防设备可能受影响</strong>
                <p>
                  {scene.emergencyPower
                    ? "应急电源正在供电，可开启常用电源后恢复市电。"
                    : "当前未启用应急电源，请留意设备供电并切换至应急供电。"}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  return null;
}
