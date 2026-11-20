import { motion } from "framer-motion";
import { ArrowRight, ChevronRight, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { useSim, type Level } from "./model";
export const spring = {
  type: "spring" as const,
  stiffness: 250,
  damping: 29,
  mass: 0.85,
};
export function Status({
  level = "normal",
  children,
}: {
  level?: Level | "neutral";
  children: ReactNode;
}) {
  return (
    <span className={`status status-${level}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}
export function Chart({
  values,
  color = "#83e7b3",
  large = false,
  limit,
}: {
  values: number[];
  color?: string;
  large?: boolean;
  limit?: number;
}) {
  const width = 560,
    height = large ? 165 : 68;
  const min = large ? 0 : Math.min(...values) - 1;
  const max = large
    ? Math.max(80, ...values, limit || 0) + 5
    : Math.max(...values) + 1;
  const y = (v: number) =>
    height - 8 - ((v - min) / (max - min)) * (height - 16);
  const points = values
    .map((v, i) => `${(i / (values.length - 1)) * width},${y(v)}`)
    .join(" ");
  return (
    <svg
      className={`sensor-chart ${large ? "large-chart" : ""}`}
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      role="img"
      aria-label="最近32次传感器采样趋势"
    >
      {large &&
        [0, 1, 2, 3].map((i) => (
          <line
            key={i}
            x1="0"
            x2={width}
            y1={(i * height) / 4 + 10}
            y2={(i * height) / 4 + 10}
            stroke="#283235"
            strokeDasharray="3 5"
          />
        ))}
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={color}
        opacity=".07"
      />
      {large && limit && (
        <line
          x1="0"
          x2={width}
          y1={y(limit)}
          y2={y(limit)}
          stroke="#eea16a"
          strokeDasharray="5 5"
          opacity=".65"
        />
      )}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={large ? 2 : 1.7}
        vectorEffect="non-scaling-stroke"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={width - 3}
        cy={y(values[values.length - 1])}
        r="3"
        fill={color}
      />
    </svg>
  );
}
export function SmokeGauge({ value }: { value: number }) {
  const color = value >= 40 ? "#fa7b79" : value >= 20 ? "#e7b975" : "#83e7b3";
  return (
    <div className="smoke-gauge">
      <svg
        viewBox="0 0 190 110"
        aria-label={`烟雾浓度 ${value.toFixed(1)}%`}
        role="img"
      >
        <path
          d="M22 93A73 73 0 0 1 168 93"
          pathLength="100"
          fill="none"
          stroke="#26312e"
          strokeWidth="9"
          strokeLinecap="round"
        />
        <path
          d="M22 93A73 73 0 0 1 168 93"
          pathLength="100"
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeDasharray={`${Math.max(2, Math.min(100, value))} 100`}
          strokeLinecap="round"
        />
        {Array.from({ length: 11 }, (_, i) => {
          const a = Math.PI + (i * Math.PI) / 10;
          return (
            <line
              key={i}
              x1={95 + Math.cos(a) * 56}
              y1={93 + Math.sin(a) * 56}
              x2={95 + Math.cos(a) * 61}
              y2={93 + Math.sin(a) * 61}
              stroke="#3d4946"
            />
          );
        })}
      </svg>
      <div className="gauge-value tabular-nums">
        {value.toFixed(1)}
        <small>%</small>
      </div>
      <span className="gauge-min">0</span>
      <span className="gauge-max">100</span>
    </div>
  );
}
export function ThermalMap({ large = false }: { large?: boolean }) {
  const { scene } = useSim();
  return (
    <div
      className={`thermal-map ${large ? "thermal-large" : ""}`}
      role="img"
      aria-label={`模拟热力图，最高温度 ${(scene.temp + 2.8).toFixed(1)} 摄氏度`}
    >
      <div
        className={`thermal-cloud ${scene.temp > 45 ? "thermal-hot" : ""}`}
      />
      <svg viewBox="0 0 300 150" preserveAspectRatio="none">
        <path
          d="M18 16H122V48H282V132H190V103H78V132H18Z M78 16V102 M190 48V132 M122 48V90 M18 75H78 M218 48V92H282"
          fill="none"
          stroke="#bce6cb"
          strokeOpacity=".2"
          strokeWidth="1.5"
        />
        <path d="M143 65v18m-9-9h18" stroke="#f4f4d7" />
        <circle
          cx="143"
          cy="74"
          r="15"
          fill="none"
          stroke="#e3efd3"
          strokeOpacity=".35"
        />
      </svg>
      <span className="thermal-label">
        MAX {(scene.temp + 2.8).toFixed(1)}°
      </span>
      <span className="thermal-live">
        <span />
        THERMAL LIVE
      </span>
      <div className="thermal-scale" />
    </div>
  );
}
export function SubCard({
  id,
  title,
  icon: Icon,
  children,
  open,
  onClick,
  footer,
  tone = "normal",
}: {
  id: string;
  title: string;
  icon: LucideIcon;
  children: ReactNode;
  open: boolean;
  onClick: () => void;
  footer?: string;
  tone?: Level | "neutral";
}) {
  return (
    <button
      id={`sub-${id}`}
      type="button"
      onClick={onClick}
      aria-expanded={open}
      aria-controls={`detail-${id}`}
      className={`sub-card group sub-tone-${tone} ${open ? "sub-open" : ""}`}
    >
      <div className="sub-card-title">
        <span>
          <Icon size={15} />
          {title}
        </span>
        <ChevronRight
          size={14}
          className={open ? "rotate-90" : "group-hover:translate-x-0.5"}
        />
      </div>
      {children}
      <div className="sub-card-footer">
        <span>
          <i />
          {footer || "设备在线"}
        </span>
        <span>
          {open ? "收起详情" : "查看详情"}
          <ArrowRight size={11} />
        </span>
      </div>
    </button>
  );
}
export function Reveal({ id, children }: { id: string; children: ReactNode }) {
  return (
    <motion.div
      id={`detail-${id}`}
      role="region"
      aria-labelledby={`sub-${id}`}
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={spring}
      className="reveal-overflow"
    >
      <motion.div
        initial={{ y: 8 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.2 }}
        className="detail-surface"
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
export function PipeDiagram({ active }: { active: boolean }) {
  return (
    <div className={`pipe-diagram ${active ? "pipe-active" : ""}`}>
      <svg
        viewBox="0 0 320 130"
        role="img"
        aria-label={active ? "喷淋管道已通水" : "喷淋管道待机"}
      >
        <path
          d="M20 15V48H290 M83 48V82 M160 48V82 M237 48V82"
          fill="none"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
        />
        <circle
          cx="20"
          cy="30"
          r="9"
          fill="#131b1c"
          stroke="currentColor"
          strokeWidth="3"
        />
        {[83, 160, 237].map((x) => (
          <g key={x}>
            <path d={`M${x - 10} 85h20l-5-6h-10Z`} fill="currentColor" />
            {active && (
              <path
                d={`M${x - 5} 94l-10 19m15-18v23m5-24l10 19`}
                stroke="#8be3d4"
                strokeWidth="2"
                strokeDasharray="3 5"
                className="water-drops"
              />
            )}
          </g>
        ))}
        <text x="34" y="25" fill="#91a49a" fontSize="10">
          供水阀门
        </text>
      </svg>
    </div>
  );
}
