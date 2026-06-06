"use client";

import React, { useState, useEffect } from "react";
import {
  TrendingUp,
  AlertTriangle,
  X,
  ExternalLink,
  Users,
  Activity,
  Cpu,
  Compass,
  Award,
  Shield,
  Zap,
  Edit3,
  Save,
  CheckCircle2,
  Lock,
  Globe,
  Settings,
  RefreshCw,
  Radio,
  CalendarDays,
  Timer
} from "lucide-react";

// ==========================================
// 0. 全局配置（🔧 上线前请修改以下配置）
// ==========================================

/** 引流跳转目标 URL —— 请替换为真实域名，所有 CTA 按钮均指向此地址 */
const REDIRECT_URL = "https://your-domain.com";
/** 管理员数据终端 4 位数字 PIN 码（默认 8888） */
const ADMIN_PIN = "8888";

// ==========================================
// 1. TypeScript 接口定义
// ==========================================

export interface Player {
  id: string;
  name: string;
  number: number;
  position: "GK" | "DF" | "MF" | "FW";
  age: number;
  club: string;
  fortune: "大吉" | "中吉" | "平" | "凶";
  isCaptain: boolean;
  value: number; // 身价 (欧元)
}

export interface TacticalTag {
  label: string;
  value: number; // 0-100
}

export interface MetaphysicsStat {
  element: "金" | "木" | "水" | "火" | "土";
  bagua: string; // 卦象，如乾卦、巽卦
  favorableHour: string; // 宜赛时辰
  clashZodiac: string; // 冲煞生肖
  upsetChance: number; // 爆冷指数 (%)
  metaphysicsWinRate: number; // 玄学胜率 (%)
}

export interface RecentMatch {
  id: string;
  opponent: string;
  opponentFlag: string;
  result: "W" | "D" | "L"; // 胜 / 平 / 负
  score: string;          // 比分如 "2-1"
  isHome: boolean;
}

export interface Injury {
  name: string;
  position: "GK" | "DF" | "MF" | "FW";
  reason: string;         // 伤病原因
  severity: "轻微" | "中度" | "极高风险"; 
}

export interface OddsData {
  bookmaker: string;      // 机构，如 "Bet365"
  homeWin: number;        // 主胜赔率
  draw: number;           // 平局赔率
  awayWin: number;        // 客胜赔率
  payout: number;         // 理论返还率 %
}

export interface Team {
  id: string;
  name: string;
  code: string;
  flag: string;
  aiWinRate: number;
  metaphysicsWinRate: number;
  fortuneText: "大吉" | "中吉" | "平" | "凶";
  dangerLevel: "低风险" | "中度警告" | "极高风控";
  roster: Player[];
  tacticalTags: TacticalTag[];
  metaphysics: MetaphysicsStat;
  coach: string;
  stadium: string;
  recentForm: RecentMatch[];
  injuries: Injury[];
  odds: OddsData;
  refereeInfo: {
    name: string;
    cardsPerMatch: number;
    strictness: "高" | "中" | "低";
  };
  weatherForecast: {
    temp: string;
    humidity: string;
    condition: string;
  };
}

export interface Group {
  id: string;
  name: string; // A-L
  teams: Team[];
}

// ==========================================
// API-Football 实时数据接口定义
// ==========================================

export interface LiveFixture {
  fixtureId: number;
  homeTeam: string;
  homeFlag: string;
  homeCode: string;
  homeScore: number | null;
  awayTeam: string;
  awayFlag: string;
  awayCode: string;
  awayScore: number | null;
  /** 比赛进行分钟数，halftime/未开赛时为 null */
  minute: number | null;
  /** 'NS' | '1H' | 'HT' | '2H' | 'ET' | 'PEN' | 'FT' 等 */
  statusShort: string;
  statusLong: string;
  venue: string;
}

export interface TeamFixture {
  fixtureId: number;
  date: string;
  homeTeam: string;
  homeFlag: string;
  homeScore: number | null;
  awayTeam: string;
  awayFlag: string;
  awayScore: number | null;
  league: string;
  round: string;
  statusShort: string;
  venue: string;
}

/**
 * API-Football 球队 ID 映射表（仅提供已知球队，其余降级为空）
 * 完整列表见: https://www.api-football.com/documentation-v3#tag/Teams
 */
const TEAM_API_ID_MAP: Record<string, number> = {
  usa: 2,
  mex: 262,
  can: 94,
  uru: 631,
  bra: 6,
  arg: 26,
  fra: 2,
  esp: 9,
  ger: 25,
  por: 27,
  eng: 10,
  ned: 1118,
  bel: 1,
  ita: 768,
  cro: 3,
  mar: 45,
  jpn: 28,
  kor: 732,
  aus: 26,
};

// ==========================================
// 2. 真实体验 Mock 数据 (A组) 及 B-L 组生成器
// ==========================================

// A组美国、墨西哥、加拿大、乌拉圭的完整真实体验数据
const groupATeams: Team[] = [
  {
    id: "usa",
    name: "美国",
    code: "USA",
    flag: "🇺🇸",
    aiWinRate: 58.6,
    metaphysicsWinRate: 62.4,
    fortuneText: "大吉",
    dangerLevel: "低风险",
    coach: "毛里西奥·波切蒂诺 (Mauricio Pochettino)",
    stadium: "大都会体育场 (MetLife Stadium)",
    tacticalTags: [
      { label: "高位压迫", value: 88 },
      { label: "反击效率", value: 85 },
      { label: "阵型宽度", value: 82 },
      { label: "防空指数", value: 75 }
    ],
    metaphysics: {
      element: "金",
      bagua: "乾为天 (刚健中正)",
      favorableHour: "戌时 (19:00-21:00)",
      clashZodiac: "属鼠",
      upsetChance: 12.5,
      metaphysicsWinRate: 62.4
    },
    roster: [
      { id: "usa-1", name: "克里斯蒂安·普利西奇", number: 10, position: "FW", age: 27, club: "AC米兰", fortune: "大吉", isCaptain: true, value: 48000000 },
      { id: "usa-2", name: "韦斯顿·麦肯尼", number: 8, position: "MF", age: 27, club: "尤文图斯", fortune: "大吉", isCaptain: false, value: 28000000 },
      { id: "usa-3", name: "泰勒·亚当斯", number: 4, position: "MF", age: 27, club: "伯恩茅斯", fortune: "平", isCaptain: false, value: 25000000 },
      { id: "usa-4", name: "蒂莫西·维阿", number: 21, position: "FW", age: 26, club: "尤文图斯", fortune: "中吉", isCaptain: false, value: 15000000 },
      { id: "usa-5", name: "尤纳斯·穆萨", number: 6, position: "MF", age: 23, club: "AC米兰", fortune: "平", isCaptain: false, value: 22000000 },
      { id: "usa-6", name: "安东尼·罗宾逊", number: 5, position: "DF", age: 28, club: "富勒姆", fortune: "中吉", isCaptain: false, value: 20000000 },
      { id: "usa-7", name: "克里斯·理查兹", number: 3, position: "DF", age: 26, club: "水晶宫", fortune: "平", isCaptain: false, value: 12000000 },
      { id: "usa-8", name: "马特·特纳", number: 1, position: "GK", age: 31, club: "水晶宫", fortune: "大吉", isCaptain: false, value: 7000000 },
      { id: "usa-9", name: "弗拉林·巴洛贡", number: 20, position: "FW", age: 24, club: "摩纳哥", fortune: "平", isCaptain: false, value: 30000000 },
      { id: "usa-10", name: "乔凡尼·雷纳", number: 7, position: "MF", age: 23, club: "多特蒙德", fortune: "中吉", isCaptain: false, value: 18000000 },
      { id: "usa-11", name: "塞尔吉尼奥·德斯特", number: 2, position: "DF", age: 25, club: "埃因霍温", fortune: "平", isCaptain: false, value: 18000000 },
      { id: "usa-12", name: "卡特-维克斯", number: 22, position: "DF", age: 28, club: "凯尔特人", fortune: "平", isCaptain: false, value: 15000000 },
      { id: "usa-13", name: "马利克·蒂尔曼", number: 17, position: "MF", age: 23, club: "埃因霍温", fortune: "大吉", isCaptain: false, value: 25000000 },
      { id: "usa-14", name: "里卡多·佩皮", number: 9, position: "FW", age: 23, club: "埃因霍温", fortune: "平", isCaptain: false, value: 15000000 },
      { id: "usa-15", name: "迈尔斯·罗宾逊", number: 12, position: "DF", age: 29, club: "辛辛那提", fortune: "平", isCaptain: false, value: 5000000 },
      { id: "usa-16", name: "乔·斯卡利", number: 19, position: "DF", age: 23, club: "门兴", fortune: "平", isCaptain: false, value: 12000000 },
      { id: "usa-17", name: "布兰登·阿伦森", number: 11, position: "MF", age: 25, club: "利兹联", fortune: "中吉", isCaptain: false, value: 16000000 },
      { id: "usa-18", name: "马克·麦肯齐", number: 15, position: "DF", age: 27, club: "亨克", fortune: "平", isCaptain: false, value: 6000000 },
      { id: "usa-19", name: "卢卡·德拉托雷", number: 14, position: "MF", age: 28, club: "塞尔塔", fortune: "平", isCaptain: false, value: 3500000 },
      { id: "usa-20", name: "豪尔赫·坎波斯", number: 18, position: "DF", age: 24, club: "洛杉矶FC", fortune: "平", isCaptain: false, value: 2500000 },
      { id: "usa-21", name: "霍瓦特", number: 13, position: "GK", age: 30, club: "卡迪夫城", fortune: "平", isCaptain: false, value: 1500000 },
      { id: "usa-22", name: "肖恩·约翰逊", number: 25, position: "GK", age: 36, club: "多伦多", fortune: "平", isCaptain: false, value: 500000 },
      { id: "usa-23", name: "卡勒尔", number: 16, position: "DF", age: 26, club: "卢顿", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "usa-24", name: "萨金特", number: 24, position: "FW", age: 26, club: "诺维奇", fortune: "平", isCaptain: false, value: 12000000 },
      { id: "usa-25", name: "哈吉·赖特", number: 19, position: "FW", age: 28, club: "考文垂", fortune: "中吉", isCaptain: false, value: 8000000 },
      { id: "usa-26", name: "蒂莫西·蒂尔曼", number: 26, position: "MF", age: 27, club: "洛杉矶FC", fortune: "平", isCaptain: false, value: 3000000 }
    ],
    recentForm: [
      { id: "usa-r1", opponent: "牙买加", opponentFlag: "🇯🇲", result: "W", score: "4-2", isHome: true },
      { id: "usa-r2", opponent: "墨西哥", opponentFlag: "🇲🇽", result: "L", score: "0-2", isHome: false },
      { id: "usa-r3", opponent: "加拿大", opponentFlag: "🇨🇦", result: "D", score: "1-1", isHome: true },
      { id: "usa-r4", opponent: "巴拿马", opponentFlag: "🇵🇦", result: "W", score: "2-0", isHome: true },
      { id: "usa-r5", opponent: "哥斯达黎加", opponentFlag: "🇨🇷", result: "W", score: "3-1", isHome: false }
    ],
    injuries: [
      { name: "塞尔吉尼奥·德斯特", position: "DF", reason: "膝盖韧带撕裂", severity: "极高风险" },
      { name: "泰勒·亚当斯", position: "MF", reason: "腿筋拉伤", severity: "中度" }
    ],
    odds: {
      bookmaker: "Bet365",
      homeWin: 1.85,
      draw: 3.40,
      awayWin: 4.50,
      payout: 95.8
    },
    refereeInfo: {
      name: "克莱芒·图尔平 (Clément Turpin)",
      cardsPerMatch: 3.8,
      strictness: "中"
    },
    weatherForecast: {
      temp: "22°C",
      humidity: "58%",
      condition: "多云"
    }
  },
  {
    id: "mexico",
    name: "墨西哥",
    code: "MEX",
    flag: "🇲🇽",
    aiWinRate: 51.2,
    metaphysicsWinRate: 59.8,
    fortuneText: "中吉",
    dangerLevel: "中度警告",
    coach: "哈维尔·阿吉雷 (Javier Aguirre)",
    stadium: "阿兹特克体育场 (Estadio Azteca)",
    tacticalTags: [
      { label: "中场绞杀", value: 89 },
      { label: "边路突破", value: 82 },
      { label: "主场加成", value: 95 },
      { label: "纪律风控", value: 68 }
    ],
    metaphysics: {
      element: "土",
      bagua: "坤为地 (厚德载物)",
      favorableHour: "未时 (13:00-15:00)",
      clashZodiac: "属虎",
      upsetChance: 19.8,
      metaphysicsWinRate: 59.8
    },
    roster: [
      { id: "mex-1", name: "吉列尔莫·奥乔亚", number: 13, position: "GK", age: 40, club: "萨勒尼塔纳", fortune: "大吉", isCaptain: true, value: 1000000 },
      { id: "mex-2", name: "圣地亚哥·希门尼斯", number: 9, position: "FW", age: 25, club: "费耶诺德", fortune: "中吉", isCaptain: false, value: 40000000 },
      { id: "mex-3", name: "埃德森·阿尔瓦雷斯", number: 4, position: "MF", age: 28, club: "西汉姆联", fortune: "大吉", isCaptain: false, value: 35000000 },
      { id: "mex-4", name: "路易斯·查韦斯", number: 24, position: "MF", age: 30, club: "莫斯科迪纳摩", fortune: "平", isCaptain: false, value: 8000000 },
      { id: "mex-5", name: "塞萨尔·蒙特斯", number: 3, position: "DF", age: 29, club: "阿尔梅里亚", fortune: "平", isCaptain: false, value: 30000000 },
      { id: "mex-6", name: "约翰·巴斯克斯", number: 5, position: "DF", age: 27, club: "热那亚", fortune: "平", isCaptain: false, value: 10000000 },
      { id: "mex-7", name: "奥尔贝尔·皮内达", number: 17, position: "MF", age: 30, club: "雅典AEK", fortune: "中吉", isCaptain: false, value: 6500000 },
      { id: "mex-8", name: "乌列尔·安图尼亚", number: 15, position: "FW", age: 28, club: "蓝十字", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "mex-9", name: "亨利·马丁", number: 20, position: "FW", age: 33, club: "美洲队", fortune: "中吉", isCaptain: false, value: 5000000 },
      { id: "mex-10", name: "路易斯·罗莫", number: 7, position: "MF", age: 31, club: "蒙特雷", fortune: "平", isCaptain: false, value: 6000000 },
      { id: "mex-11", name: "朱利安·奎尼奥内斯", number: 18, position: "FW", age: 29, club: "美洲队", fortune: "平", isCaptain: false, value: 9000000 },
      { id: "mex-12", name: "豪尔赫·桑切斯", number: 19, position: "DF", age: 28, club: "波尔图", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "mex-13", name: "赫苏斯·加利亚多", number: 23, position: "DF", age: 31, club: "蒙特雷", fortune: "平", isCaptain: false, value: 3000000 },
      { id: "mex-14", name: "路易斯·马拉贡", number: 1, position: "GK", age: 29, club: "美洲队", fortune: "平", isCaptain: false, value: 4500000 },
      { id: "mex-15", name: "卡洛斯·罗德里格斯", number: 8, position: "MF", age: 29, club: "蓝十字", fortune: "平", isCaptain: false, value: 6000000 },
      { id: "mex-16", name: "埃里克·桑切斯", number: 14, position: "MF", age: 26, club: "帕丘卡", fortune: "平", isCaptain: false, value: 10000000 },
      { id: "mex-17", name: "以色列·雷耶斯", number: 2, position: "DF", age: 25, club: "美洲队", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "mex-18", name: "布莱恩·冈萨雷斯", number: 16, position: "DF", age: 23, club: "帕丘卡", fortune: "平", isCaptain: false, value: 2500000 },
      { id: "mex-19", name: "维克托·古兹曼", number: 21, position: "DF", age: 24, club: "蒙特雷", fortune: "中吉", isCaptain: false, value: 6000000 },
      { id: "mex-20", name: "霍尔迪·科尔蒂索", number: 22, position: "MF", age: 29, club: "蒙特雷", fortune: "平", isCaptain: false, value: 3000000 },
      { id: "mex-21", name: "费尔南多·贝尔特兰", number: 25, position: "MF", age: 28, club: "瓜达拉哈拉", fortune: "平", isCaptain: false, value: 6000000 },
      { id: "mex-22", name: "马塞洛·弗洛雷斯", number: 11, position: "FW", age: 22, club: "老虎队", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "mex-23", name: "塞萨尔·韦尔塔", number: 26, position: "FW", age: 25, club: "国立自治大学", fortune: "中吉", isCaptain: false, value: 5000000 },
      { id: "mex-24", name: "胡里奥·冈萨雷斯", number: 12, position: "GK", age: 34, club: "国立自治大学", fortune: "平", isCaptain: false, value: 1000000 },
      { id: "mex-25", name: "奥罗纳", number: 6, position: "DF", age: 27, club: "瓜达拉哈拉", fortune: "平", isCaptain: false, value: 2000000 },
      { id: "mex-26", name: "皮耶罗斯", number: 10, position: "FW", age: 24, club: "瓜达拉哈拉", fortune: "平", isCaptain: false, value: 3500000 }
    ],
    recentForm: [
      { id: "mex-r1", opponent: "美国", opponentFlag: "🇺🇸", result: "W", score: "2-0", isHome: true },
      { id: "mex-r2", opponent: "洪都拉斯", opponentFlag: "🇭🇳", result: "W", score: "2-1", isHome: false },
      { id: "mex-r3", opponent: "巴西", opponentFlag: "🇧🇷", result: "L", score: "2-3", isHome: true },
      { id: "mex-r4", opponent: "加拿大", opponentFlag: "🇨🇦", result: "D", score: "0-0", isHome: false },
      { id: "mex-r5", opponent: "乌拉圭", opponentFlag: "🇺🇾", result: "L", score: "0-4", isHome: true }
    ],
    injuries: [
      { name: "圣地亚哥·希门尼斯", position: "FW", reason: "大腿肌肉拉伤", severity: "中度" }
    ],
    odds: {
      bookmaker: "Bet365",
      homeWin: 2.15,
      draw: 3.20,
      awayWin: 3.50,
      payout: 94.6
    },
    refereeInfo: {
      name: "马尔科·奥利弗 (Michael Oliver)",
      cardsPerMatch: 4.2,
      strictness: "高"
    },
    weatherForecast: {
      temp: "26°C",
      humidity: "72%",
      condition: "闷热"
    }
  },
  {
    id: "canada",
    name: "加拿大",
    code: "CAN",
    flag: "🇨🇦",
    aiWinRate: 46.8,
    metaphysicsWinRate: 53.2,
    fortuneText: "平",
    dangerLevel: "中度警告",
    coach: "杰西·马什 (Jesse Marsch)",
    stadium: "BMO球场 (BMO Field)",
    tacticalTags: [
      { label: "前压纵深", value: 92 },
      { label: "两翼突袭", value: 90 },
      { label: "战术纪律", value: 72 },
      { label: "阵地攻坚", value: 65 }
    ],
    metaphysics: {
      element: "木",
      bagua: "巽为风 (顺雷震天)",
      favorableHour: "寅时 (03:00-05:00)",
      clashZodiac: "属猴",
      upsetChance: 25.4,
      metaphysicsWinRate: 53.2
    },
    roster: [
      { id: "can-1", name: "阿方索·戴维斯", number: 19, position: "DF", age: 25, club: "拜仁慕尼黑", fortune: "大吉", isCaptain: true, value: 50000000 },
      { id: "can-2", name: "乔纳森·戴维", number: 20, position: "FW", age: 26, club: "里尔", fortune: "中吉", isCaptain: false, value: 45000000 },
      { id: "can-3", name: "斯蒂芬·欧斯塔基奥", number: 7, position: "MF", age: 29, club: "波尔图", fortune: "大吉", isCaptain: false, value: 15000000 },
      { id: "can-4", name: "泰江·布坎南", number: 11, position: "MF", age: 27, club: "国际米兰", fortune: "平", isCaptain: false, value: 8000000 },
      { id: "can-5", name: "凯·米勒", number: 15, position: "DF", age: 28, club: "波特兰伐木者", fortune: "平", isCaptain: false, value: 3000000 },
      { id: "can-6", name: "阿利斯泰尔·约翰斯顿", number: 2, position: "DF", age: 27, club: "凯尔特人", fortune: "中吉", isCaptain: false, value: 8000000 },
      { id: "can-7", name: "伊斯梅尔·科内", number: 8, position: "MF", age: 23, club: "沃特福德", fortune: "平", isCaptain: false, value: 11000000 },
      { id: "can-8", name: "马克-安东尼·凯伊", number: 14, position: "MF", age: 31, club: "新英格兰革命", fortune: "平", isCaptain: false, value: 1500000 },
      { id: "can-9", name: "凯尔·拉林", number: 9, position: "FW", age: 31, club: "马洛卡", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "can-10", name: "马克西姆·克雷波", number: 16, position: "GK", age: 32, club: "波特兰伐木者", fortune: "平", isCaptain: false, value: 1500000 },
      { id: "can-11", name: "利安·米勒", number: 23, position: "FW", age: 26, club: "普雷斯顿", fortune: "平", isCaptain: false, value: 2500000 },
      { id: "can-12", name: "莫伊塞·邦比托", number: 13, position: "DF", age: 26, club: "科罗拉多急流", fortune: "中吉", isCaptain: false, value: 4500000 },
      { id: "can-13", name: "德里克·考内留斯", number: 5, position: "DF", age: 28, club: "马尔默", fortune: "平", isCaptain: false, value: 2000000 },
      { id: "can-14", name: "塞缪尔·皮耶特", number: 6, position: "MF", age: 31, club: "蒙特利尔CF", fortune: "平", isCaptain: false, value: 1500000 },
      { id: "can-15", name: "杰登·内尔森", number: 10, position: "MF", age: 23, club: "罗森博格", fortune: "平", isCaptain: false, value: 1200000 },
      { id: "can-16", name: "西奥·贝尔", number: 17, position: "FW", age: 24, club: "马瑟韦尔", fortune: "平", isCaptain: false, value: 1000000 },
      { id: "can-17", name: "卡林·罗斯", number: 12, position: "FW", age: 24, club: "明尼苏达联", fortune: "平", isCaptain: false, value: 800000 },
      { id: "can-18", name: "萨沙·克里斯坦", number: 21, position: "DF", age: 21, club: "哥伦布机员", fortune: "平", isCaptain: false, value: 500000 },
      { id: "can-19", name: "马修·乔伊尼尔", number: 22, position: "MF", age: 24, club: "蒙特利尔CF", fortune: "中吉", isCaptain: false, value: 2000000 },
      { id: "can-20", name: "里奇·拉里亚", number: 28, position: "DF", age: 31, club: "多伦多FC", fortune: "平", isCaptain: false, value: 2000000 },
      { id: "can-21", name: "戴恩·圣克莱尔", number: 1, position: "GK", age: 29, club: "明尼苏达联", fortune: "平", isCaptain: false, value: 2500000 },
      { id: "can-22", name: "汤姆·麦吉尔", number: 18, position: "GK", age: 26, club: "布莱顿", fortune: "平", isCaptain: false, value: 600000 },
      { id: "can-23", name: "利亚姆·弗雷泽", number: 4, position: "MF", age: 28, club: "达拉斯", fortune: "平", isCaptain: false, value: 1000000 },
      { id: "can-24", name: "多米尼克·扎托尔", number: 3, position: "DF", age: 31, club: "凯尔茨科罗纳", fortune: "平", isCaptain: false, value: 500000 },
      { id: "can-25", name: "罗素-罗", number: 25, position: "FW", age: 23, club: "温哥华白浪", fortune: "平", isCaptain: false, value: 800000 },
      { id: "can-26", name: "阿希米·阿德库比", number: 26, position: "DF", age: 31, club: "温哥华白浪", fortune: "平", isCaptain: false, value: 1000000 }
    ],
    recentForm: [
      { id: "can-r1", opponent: "巴拿马", opponentFlag: "🇵🇦", result: "W", score: "2-1", isHome: true },
      { id: "can-r2", opponent: "美国", opponentFlag: "🇺🇸", result: "D", score: "1-1", isHome: false },
      { id: "can-r3", opponent: "墨西哥", opponentFlag: "🇲🇽", result: "D", score: "0-0", isHome: true },
      { id: "can-r4", opponent: "苏里南", opponentFlag: "🇸🇷", result: "W", score: "3-0", isHome: false },
      { id: "can-r5", opponent: "阿根廷", opponentFlag: "🇦🇷", result: "L", score: "0-2", isHome: false }
    ],
    injuries: [],
    odds: {
      bookmaker: "Bet365",
      homeWin: 2.60,
      draw: 3.10,
      awayWin: 2.80,
      payout: 94.2
    },
    refereeInfo: {
      name: "西门·马齐尼亚克 (Szymon Marciniak)",
      cardsPerMatch: 4.8,
      strictness: "高"
    },
    weatherForecast: {
      temp: "15°C",
      humidity: "80%",
      condition: "小雨"
    }
  },
  {
    id: "uruguay",
    name: "乌拉圭",
    code: "URU",
    flag: "🇺🇾",
    aiWinRate: 74.3,
    metaphysicsWinRate: 78.6,
    fortuneText: "大吉",
    dangerLevel: "低风险",
    coach: "马塞洛·贝尔萨 (Marcelo Bielsa)",
    stadium: "世纪体育场 (Estadio Centenario)",
    tacticalTags: [
      { label: "全攻全守", value: 96 },
      { label: "无氧疯抢", value: 98 },
      { label: "反击纵深", value: 92 },
      { label: "中场硬度", value: 95 }
    ],
    metaphysics: {
      element: "水",
      bagua: "坎为水 (行险而不失其信)",
      favorableHour: "亥时 (21:00-23:00)",
      clashZodiac: "属羊",
      upsetChance: 8.4,
      metaphysicsWinRate: 78.6
    },
    roster: [
      { id: "uru-1", name: "费德里科·巴尔韦德", number: 15, position: "MF", age: 27, club: "皇家马德里", fortune: "大吉", isCaptain: true, value: 120000000 },
      { id: "uru-2", name: "达尔文·努涅斯", number: 19, position: "FW", age: 26, club: "利物浦", fortune: "大吉", isCaptain: false, value: 70000000 },
      { id: "uru-3", name: "罗纳德·阿劳霍", number: 4, position: "DF", age: 27, club: "巴塞罗那", fortune: "中吉", isCaptain: false, value: 70000000 },
      { id: "uru-4", name: "曼努埃尔·乌加特", number: 5, position: "MF", age: 25, club: "曼联", fortune: "中吉", isCaptain: false, value: 50000000 },
      { id: "uru-5", name: "尼古拉斯·德拉克鲁斯", number: 7, position: "MF", age: 29, club: "弗拉门戈", fortune: "大吉", isCaptain: false, value: 18000000 },
      { id: "uru-6", name: "马蒂亚斯·奥利维拉", number: 16, position: "DF", age: 28, club: "那不勒斯", fortune: "平", isCaptain: false, value: 15000000 },
      { id: "uru-7", name: "法昆多·佩利斯特里", number: 11, position: "FW", age: 24, club: "帕纳辛奈科斯", fortune: "平", isCaptain: false, value: 10000000 },
      { id: "uru-8", name: "塞尔希奥·罗切特", number: 1, position: "GK", age: 33, club: "国际体育会", fortune: "大吉", isCaptain: false, value: 3000000 },
      { id: "uru-9", name: "塞萨尔·阿劳霍", number: 6, position: "MF", age: 25, club: "奥兰多城", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "uru-10", name: "何塞·希门尼斯", number: 2, position: "DF", age: 31, club: "马德里竞技", fortune: "平", isCaptain: false, value: 8000000 },
      { id: "uru-11", name: "塞瓦斯蒂安·卡塞雷斯", number: 3, position: "DF", age: 26, club: "美洲队", fortune: "中吉", isCaptain: false, value: 7000000 },
      { id: "uru-12", name: "吉列尔莫·瓦雷拉", number: 13, position: "DF", age: 33, club: "弗拉门戈", fortune: "平", isCaptain: false, value: 2000000 },
      { id: "uru-13", name: "罗德里戈·本坦库尔", number: 6, position: "MF", age: 28, club: "托特纳姆热刺", fortune: "大吉", isCaptain: false, value: 35000000 },
      { id: "uru-14", name: "法昆多·托雷斯", number: 10, position: "FW", age: 26, club: "奥兰多城", fortune: "平", isCaptain: false, value: 14000000 },
      { id: "uru-15", name: "布里安·罗德里格斯", number: 20, position: "FW", age: 26, club: "美洲队", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "uru-16", name: "马克西米利亚诺·阿劳霍", number: 21, position: "FW", age: 26, club: "托卢卡", fortune: "中吉", isCaptain: false, value: 8500000 },
      { id: "uru-17", name: "克里斯蒂安·奥利维拉", number: 25, position: "FW", age: 24, club: "洛杉矶FC", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "uru-18", name: "卢卡斯·奥拉萨", number: 22, position: "DF", age: 31, club: "克拉斯诺达尔", fortune: "平", isCaptain: false, value: 3000000 },
      { id: "uru-19", name: "圣地亚哥·梅莱", number: 12, position: "GK", age: 28, club: "巴兰基亚青年", fortune: "平", isCaptain: false, value: 2000000 },
      { id: "uru-20", name: "弗朗哥·伊斯列尔", number: 23, position: "GK", age: 26, club: "葡萄牙体育", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "uru-21", name: "马蒂亚斯·比尼亚", number: 17, position: "DF", age: 28, club: "弗拉门戈", fortune: "中吉", isCaptain: false, value: 8000000 },
      { id: "uru-22", name: "尼古拉斯·马里查尔", number: 24, position: "DF", age: 25, club: "莫斯科迪纳摩", fortune: "平", isCaptain: false, value: 3000000 },
      { id: "uru-23", name: "埃米利亚诺·马丁内斯", number: 14, position: "MF", age: 26, club: "中日德兰", fortune: "平", isCaptain: false, value: 4000000 },
      { id: "uru-24", name: "卢西亚诺·罗德里格斯", number: 26, position: "FW", age: 22, club: "巴伊亚", fortune: "大吉", isCaptain: false, value: 12000000 },
      { id: "uru-25", name: "阿古斯丁·卡诺比奥", number: 18, position: "FW", age: 27, club: "巴拉纳竞技", fortune: "平", isCaptain: false, value: 5000000 },
      { id: "uru-26", name: "吉安卡洛·冈萨雷斯", number: 8, position: "DF", age: 30, club: "佩纳罗尔", fortune: "平", isCaptain: false, value: 1000000 }
    ],
    recentForm: [
      { id: "uru-r1", opponent: "哥伦比亚", opponentFlag: "🇨🇴", result: "W", score: "3-2", isHome: true },
      { id: "uru-r2", opponent: "巴西", opponentFlag: "🇧🇷", result: "D", score: "1-1", isHome: false },
      { id: "uru-r3", opponent: "秘鲁", opponentFlag: "🇵🇪", result: "L", score: "0-1", isHome: false },
      { id: "uru-r4", opponent: "厄瓜多尔", opponentFlag: "🇪🇨", result: "D", score: "0-0", isHome: true },
      { id: "uru-r5", opponent: "墨西哥", opponentFlag: "🇲🇽", result: "W", score: "4-0", isHome: false }
    ],
    injuries: [
      { name: "罗纳德·阿劳霍", position: "DF", reason: "肌肉拉伤恢复中", severity: "轻微" }
    ],
    odds: {
      bookmaker: "Bet365",
      homeWin: 1.55,
      draw: 3.80,
      awayWin: 6.50,
      payout: 96.2
    },
    refereeInfo: {
      name: "安东尼·泰勒 (Anthony Taylor)",
      cardsPerMatch: 3.5,
      strictness: "低"
    },
    weatherForecast: {
      temp: "19°C",
      humidity: "60%",
      condition: "晴朗"
    }
  }
];

// B-L 组的代表国家及其配置
const otherGroupConfigs = [
  { name: "B", teams: ["英格兰", "克罗地亚", "尼日利亚", "韩国"], flags: ["🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇭🇷", "🇳🇬", "🇰🇷"], codes: ["ENG", "CRO", "NGA", "KOR"] },
  { name: "C", teams: ["阿根廷", "瑞典", "沙特阿拉伯", "喀麦隆"], flags: ["🇦🇷", "🇸🇪", "🇸🇦", "🇨🇲"], codes: ["ARG", "SWE", "KSA", "CMR"] },
  { name: "D", teams: ["法国", "丹麦", "澳大利亚", "突尼斯"], flags: ["🇫🇷", "🇩🇰", "🇦🇺", "🇹🇳"], codes: ["FRA", "DEN", "AUS", "TUN"] },
  { name: "E", teams: ["西班牙", "日本", "哥斯达黎加", "阿尔及利亚"], flags: ["🇪🇸", "🇯🇵", "🇨🇷", "🇩🇿"], codes: ["ESP", "JPN", "CRC", "ALG"] },
  { name: "F", teams: ["比利时", "摩洛哥", "新西兰", "科特迪瓦"], flags: ["🇧🇪", "🇲🇦", "🇳🇿", "🇨🇮"], codes: ["BEL", "MAR", "NZL", "CIV"] }, // ✅ 去除重复：加拿大→新西兰
  { name: "G", teams: ["巴西", "瑞士", "塞尔维亚", "加纳"], flags: ["🇧🇷", "🇨🇭", "🇷🇸", "🇬🇭"], codes: ["BRA", "SUI", "SRB", "GHA"] },
  { name: "H", teams: ["葡萄牙", "玻利维亚", "马里", "巴拉圭"], flags: ["🇵🇹", "🇧🇴", "🇲🇱", "🇵🇾"], codes: ["POR", "BOL", "MLI", "PAR"] }, // ✅ 去除重复：乌拉圭/加纳/韩国→玻利维亚/马里/巴拉圭
  { name: "I", teams: ["荷兰", "厄瓜多尔", "塞内加尔", "卡塔尔"], flags: ["🇳🇱", "🇪🇨", "🇸🇳", "🇶🇦"], codes: ["NED", "ECU", "SEN", "QAT"] },
  { name: "J", teams: ["意大利", "波兰", "伊朗", "巴拿马"], flags: ["🇮🇹", "🇵🇱", "🇮🇷", "🇵🇦"], codes: ["ITA", "POL", "IRN", "PAN"] },
  { name: "K", teams: ["德国", "智利", "伊拉克", "牙买加"], flags: ["🇩🇪", "🇨🇱", "🇮🇶", "🇯🇲"], codes: ["GER", "CHI", "IRQ", "JAM"] },
];

// ==========================================
// 2.1. 真实教练与球场映射字典
// ==========================================
const realCoaches: Record<string, string> = {
  "英格兰": "托马斯·图赫尔 (Thomas Tuchel)",
  "克罗地亚": "兹拉特科·达利奇 (Zlatko Dalić)",
  "尼日利亚": "布鲁诺·拉巴迪亚 (Bruno Labbadia)",
  "韩国": "洪明甫 (Hong Myung-bo)",
  "阿根廷": "莱昂内尔·斯卡洛尼 (Lionel Scaloni)",
  "瑞典": "容·达尔·托马森 (Jon Dahl Tomasson)",
  "沙特阿拉伯": "埃尔夫·勒纳尔 (Hervé Renard)",
  "喀麦隆": "马克·布里斯 (Marc Brys)",
  "法国": "迪迪埃·德尚 (Didier Deschamps)",
  "丹麦": "布莱恩·里默 (Brian Riemer)",
  "澳大利亚": "托尼·波波维奇 (Tony Popovic)",
  "突尼斯": "凯斯·雅库比 (Kais Yaâkoubi)",
  "西班牙": "路易斯·德拉富恩特 (Luis de la Fuente)",
  "日本": "森保一 (Hajime Moriyasu)",
  "哥斯达黎加": "克劳迪奥·维瓦斯 (Claudio Vivas)",
  "阿尔及利亚": "弗拉基米尔·佩特科维奇 (Vladimir Petković)",
  "比利时": "多梅尼科·特德斯科 (Domenico Tedesco)",
  "摩洛哥": "瓦利德·雷格拉吉 (Walid Regragui)",
  "新西兰": "达伦·巴泽利 (Darren Bazeley)",
  "科特迪瓦": "埃默斯·法埃 (Emerse Faé)",
  "巴西": "多里瓦尔·儒尼奥尔 (Dorival Júnior)",
  "瑞士": "穆拉特·雅金 (Murat Yakin)",
  "塞尔维亚": "德拉甘·斯托伊科维奇 (Dragan Stojković)",
  "加纳": "奥托·阿多 (Otto Addo)",
  "葡萄牙": "罗伯托·马丁内斯 (Roberto Martínez)",
  "玻利维亚": "奥斯卡·维列加斯 (Óscar Villegas)",
  "马里": "阿利乌·迪亚洛 (Aliou Diallo)",
  "巴拉圭": "古斯塔沃·阿尔法罗 (Gustavo Alfaro)",
  "荷兰": "罗纳德·科曼 (Ronald Koeman)",
  "厄瓜多尔": "塞巴斯蒂安·贝卡切切 (Sebastián Beccacece)",
  "塞内加尔": "佩普·蒂奥 (Pape Thiaw)",
  "卡塔尔": "廷廷·马克斯 (Tintín Márquez)",
  "意大利": "卢西亚诺·斯帕莱蒂 (Luciano Spalletti)",
  "波兰": "米哈乌·普罗比日 (Michał Probierz)",
  "伊朗": "阿米尔·加勒诺伊 (Amir Ghalenoei)",
  "巴拿马": "托马斯·克里斯蒂安森 (Thomas Christiansen)",
  "德国": "尤利安·纳格尔斯曼 (Julian Nagelsmann)",
  "智利": "里卡多·加雷卡 (Ricardo Gareca)",
  "伊拉克": "赫苏斯·卡萨斯 (Jesús Casas)",
  "牙买加": "史蒂夫·麦克拉伦 (Steve McClaren)",
  "哥伦比亚": "内斯托尔·洛伦佐 (Néstor Lorenzo)",
  "秘鲁": "豪尔赫·福萨蒂 (Jorge Fossati)",
  "阿联酋": "保罗·本托 (Paulo Bento)",
  "埃及": "霍萨姆·哈桑 (Hossam Hassan)"
};

const realStadiums: Record<string, string> = {
  "英格兰": "温布利球场 (Wembley Stadium)",
  "克罗地亚": "马克西米尔球场 (Stadion Maksimir)",
  "尼日利亚": "阿布贾国家体育场 (Abuja Stadium)",
  "韩国": "首尔世界杯体育场 (Seoul World Cup Stadium)",
  "阿根廷": "纪念碑球场 (Estadio Monumental)",
  "瑞典": "友谊竞技场 (Friends Arena)",
  "沙特阿拉伯": "法赫国王国际体育场 (King Fahd Stadium)",
  "喀麦隆": "保罗·比亚体育场 (Olembe Stadium)",
  "法国": "法兰西体育场 (Stade de France)",
  "丹麦": "公园球场 (Parken Stadium)",
  "澳大利亚": "雅高体育场 (Accor Stadium)",
  "突尼斯": "哈马迪·阿格尔比体育场 (Stade Hammadi Agrebi)",
  "西班牙": "伯纳乌球场 (Estadio Santiago Bernabéu)",
  "日本": "东京国立竞技场 (Japan National Stadium)",
  "哥斯达黎加": "国家体育场 (Estadio Nacional)",
  "阿尔及利亚": "纳尔逊·曼德拉体育场 (Nelson Mandela Stadium)",
  "比利时": "博杜安国王体育场 (King Baudouin Stadium)",
  "摩洛哥": "阿德拉尔体育场 (Stade Adrar)",
  "新西兰": "天空体育场 (Sky Stadium)",
  "科特迪瓦": "阿拉萨内·瓦塔拉体育场 (Alassane Ouattara Stadium)",
  "巴西": "马拉卡纳体育场 (Maracanã Stadium)",
  "瑞士": "万克多夫球场 (Wankdorf Stadium)",
  "塞尔维亚": "红星体育场 (Rajko Mitić Stadium)",
  "加纳": "巴巴亚拉体育场 (Baba Yara Stadium)",
  "葡萄牙": "光明球场 (Estádio da Luz)",
  "玻利维亚": "埃尔南多·西莱斯体育场 (Estadio Hernando Siles)",
  "马里": "巴马科三月二十六日体育场 (Stade du 26 Mars)",
  "巴拉圭": "大查科保卫者体育场 (Defensores del Chaco)",
  "荷兰": "阿姆斯特丹竞技场 (Johan Cruyff ArenA)",
  "厄瓜多尔": "阿塔瓦尔帕奥林匹克体育场 (Estadio Olímpico Atahualpa)",
  "塞内加尔": "阿卜杜拉耶·瓦德体育场 (Abdoulaye Wade Stadium)",
  "卡塔尔": "卢塞尔体育场 (Lusail Stadium)",
  "意大利": "罗马奥林匹克体育场 (Stadio Olimpico)",
  "波兰": "国家体育场 (PGE Narodowy)",
  "伊朗": "阿扎迪体育场 (Azadi Stadium)",
  "巴拿马": "罗梅尔·费尔南德斯体育场 (Estadio Rommel Fernández)",
  "德国": "柏林奥林匹克体育场 (Olympiastadion Berlin)",
  "智利": "国家体育场 (Estadio Nacional)",
  "伊拉克": "巴士拉国际体育场 (Basra International Stadium)",
  "牙买加": "国家体育场 (National Stadium)",
  "哥伦比亚": "大都会体育场 (Estadio Metropolitano)",
  "秘鲁": "国家体育场 (Estadio Nacional)",
  "阿联酋": "扎耶德体育城体育场 (Zayed Sports City Stadium)",
  "埃及": "开罗国际体育场 (Cairo International Stadium)"
};

// ==========================================
// 2.2. 本地化球员姓名生成算法
// ==========================================
const generatePlayerName = (country: string, num: number): string => {
  const englishFirst = ["杰克", "哈里", "托马斯", "乔治", "詹姆斯", "威廉", "奥利弗", "查理", "阿尔菲", "约书亚", "丹尼尔", "路易斯", "麦克斯"];
  const englishLast = ["史密斯", "琼斯", "威廉姆斯", "布朗", "泰勒", "戴维斯", "威尔逊", "埃文斯", "托马斯", "约翰逊", "罗伯茨", "沃克"];
  const spanishFirst = ["卢卡斯", "马特奥", "马蒂亚斯", "圣地亚哥", "迭戈", "哈维尔", "安德烈斯", "亚历杭德罗", "卡洛斯", "曼努延尔", "胡安"];
  const spanishLast = ["罗德里格斯", "冈萨雷斯", "戈麦斯", "费尔南德斯", "洛佩斯", "迪亚斯", "马丁内斯", "佩雷斯", "桑切斯", "罗梅罗"];
  const portugueseFirst = ["若昂", "加布里埃尔", "卢卡斯", "佩德罗", "马特乌斯", "古斯塔沃", "拉斐尔", "布鲁诺", "蒂亚戈", "迪奥戈"];
  const portugueseLast = ["席尔瓦", "桑托斯", "奥利维拉", "索萨", "佩雷拉", "科斯塔", "罗德里格斯", "阿尔梅达", "纳西门托", "卡瓦略"];
  const frenchFirst = ["皮埃尔", "卢卡", "雨果", "马蒂斯", "莱奥", "克莱芒", "安托万", "马克西姆", "阿瑟", "保罗", "托马斯"];
  const frenchLast = ["杜波依斯", "洛朗", "马丁", "西蒙", "米歇尔", "勒费弗尔", "勒鲁", "贝特朗", "加尼叶", "弗朗索瓦"];
  const arabFirst = ["阿卜杜拉", "艾哈迈德", "穆罕默德", "阿里", "哈桑", "侯赛因", "奥马尔", "哈立德", "优素福", "费萨尔"];
  const arabLast = ["哈尔比", "多萨里", "加姆迪", "奥泰比", "沙姆里", "卡塔尼", "谢赫里", "萨利赫", "马哈茂德"];
  const japaneseFirst = ["拓海", "大翔", "翔太", "悠斗", "陆", "莲", "飒太", "春希", "凑", "健太", "翼", "阳太"];
  const japaneseLast = ["佐藤", "铃木", "高桥", "田中", "渡边", "伊藤", "山本", "中村", "小林", "加藤", "吉田", "清水"];
  const koreanFirst = ["敏俊", "书俊", "睿俊", "宇彬", "道允", "贤宇", "俊熙", "志勋", "建宇", "宇贤", "东贤"];
  const koreanLast = ["金", "李", "朴", "崔", "郑", "姜", "赵", "尹", "张", "林", "韩", "吴"];
  const italianFirst = ["弗朗切斯科", "亚历山德罗", "洛伦佐", "马蒂亚", "加布里埃尔", "里卡多", "马特奥", "莱昂纳多", "达维德", "朱塞佩"];
  const italianLast = ["罗西", "鲁索", "法拉利", "埃斯波西托", "比安奇", "罗马诺", "科隆博", "里奇", "马里尼", "格列柯"];
  const croatianFirst = ["卢卡", "伊万", "马尔科", "大卫", "菲利普", "佩塔尔", "马特奥", "约瑟普", "安特", "布尔科"];
  const croatianLast = ["霍瓦特", "科瓦切维奇", "巴比奇", "马里奇", "科瓦契奇", "莫德里奇", "布罗佐维奇", "佩里西奇"];
  const germanFirst = ["卢卡斯", "班杰明", "约纳斯", "莱昂", "芬恩", "诺亚", "保罗", "路易斯", "马克斯", "费利克斯"];
  const germanLast = ["米勒", "施密特", "施奈德", "费舍尔", "迈尔", "韦伯", "瓦格纳", "贝克", "舒尔茨", "霍夫曼"];
  const africanFirst = ["马马杜", "易卜拉欣", "奥斯曼", "塞杜", "阿马杜", "布巴卡尔", "穆萨", "拉明", "阿布巴卡尔"];
  const africanLast = ["迪亚洛", "迪亚拉", "特拉奥雷", "索乌", "凯塔", "科内", "卡马拉", "西塞", "库利巴利", "图雷"];

  let firsts = englishFirst;
  let lasts = englishLast;

  if (["英格兰", "澳大利亚", "新西兰", "牙买加"].includes(country)) {
    firsts = englishFirst;
    lasts = englishLast;
  } else if (["西班牙", "阿根廷", "哥伦比亚", "秘鲁", "巴拉圭", "玻利维亚", "哥斯达黎加", "巴拿马"].includes(country)) {
    firsts = spanishFirst;
    lasts = spanishLast;
  } else if (["巴西", "葡萄牙"].includes(country)) {
    firsts = portugueseFirst;
    lasts = portugueseLast;
  } else if (["法国", "比利时"].includes(country)) {
    firsts = frenchFirst;
    lasts = frenchLast;
  } else if (["沙特阿拉伯", "阿联酋", "卡塔尔", "埃及", "伊拉克", "伊朗", "突尼斯"].includes(country)) {
    firsts = arabFirst;
    lasts = arabLast;
  } else if (country === "日本") {
    firsts = japaneseFirst;
    lasts = japaneseLast;
    const f = firsts[(num * 3 + 7) % firsts.length];
    const l = lasts[(num * 7 + 13) % lasts.length];
    return `${l}${f}`;
  } else if (country === "韩国") {
    firsts = koreanFirst;
    lasts = koreanLast;
    const f = firsts[(num * 3 + 7) % firsts.length];
    const l = lasts[(num * 7 + 13) % lasts.length];
    return `${l}${f}`;
  } else if (country === "意大利") {
    firsts = italianFirst;
    lasts = italianLast;
  } else if (country === "克罗地亚") {
    firsts = croatianFirst;
    lasts = croatianLast;
  } else if (["德国", "瑞士", "瑞典", "丹麦", "荷兰", "波兰"].includes(country)) {
    firsts = germanFirst;
    lasts = germanLast;
  } else if (["尼日利亚", "喀麦隆", "科特迪瓦", "马里", "塞内加尔", "阿尔及利亚", "加纳"].includes(country)) {
    firsts = africanFirst;
    lasts = africanLast;
  }

  const f = firsts[(num * 3 + 7) % firsts.length];
  const l = lasts[(num * 7 + 13) % lasts.length];
  return `${f}·${l}`;
};

// ==========================================
// 2.3. 身价格式化辅助函数 (转换为百万/亿)
// ==========================================
const formatValueEuro = (value: number): string => {
  if (value >= 100000000) {
    return `${(value / 100000000).toFixed(1).replace(/\.0$/, "")}亿€`;
  }
  if (value >= 10000) {
    return `${(value / 10000).toFixed(0)}万€`;
  }
  return `${value}€`;
};

// ==========================================
// 2.4. 动态战术与玄学分析落底兜底生成器
// ==========================================
const getTacticalAnalysisFallback = (team: Team): string => {
  const mainTag = team.tacticalTags.reduce((prev, current) => (prev.value > current.value ? prev : current));
  const secondaryTag = team.tacticalTags.filter((t) => t.label !== mainTag.label).reduce((prev, current) => (prev.value > current.value ? prev : current), team.tacticalTags[0]);
  return `根据AI大数据复盘，${team.name}的核心战术是“${mainTag.label}”（量化指数:${mainTag.value}），并辅以“${secondaryTag.label}”（量化指数:${secondaryTag.value}）的边中结合策略。该队在攻防两端具有较强的战术纪律性，但需防范在大盘风控评级为[${team.dangerLevel}]时，因节奏失控而导致的意外爆冷风险。`;
};

const getMetaphysicalAnalysisFallback = (team: Team): string => {
  return `该队今日命格属【${team.metaphysics.element}】，流年卦象显现为【${team.metaphysics.bagua}】。本场比赛宜赛吉时为【${team.metaphysics.favorableHour}】，但切记今日忌冲生肖【${team.metaphysics.clashZodiac}】的球员，首发名单应尽量规避。AI精算爆冷指数为 ${team.metaphysics.upsetChance}%，建议彩民在化忌节点过后结合实时大盘对冲。`;
};

const elements = ["金", "木", "水", "火", "土"] as const;
const baguas = ["乾为天", "坤为地", "震为雷", "巽为风", "坎为水", "离为火", "艮为山", "兑为泽"];
const hours = [
  "子时 (23:00-01:00)",
  "寅时 (03:00-05:00)",
  "辰时 (07:00-09:00)",
  "午时 (11:00-13:00)",
  "申时 (15:00-17:00)",
  "戌时 (19:00-21:00)"
];
const zodiacs = ["属鼠", "属牛", "属虎", "属兔", "属龙", "属蛇", "属马", "属羊", "属猴", "属鸡", "属狗", "属猪"];
const fortuneOptions = ["大吉", "中吉", "平", "凶"] as const;
const riskLevels = ["低风险", "中度警告", "极高风控"] as const;
const positionList = ["GK", "DF", "MF", "FW"] as const;
const clubList = [
  "皇家马德里",
  "巴塞罗那",
  "曼城",
  "拜仁慕尼黑",
  "巴黎圣日耳曼",
  "阿森纳",
  "国际米兰",
  "AC米兰",
  "切尔西",
  "尤文图斯",
  "利物浦"
];

// 构建全部 12 个小组的初始数据
const generateInitialGroups = (): Group[] => {
  const allGroups: Group[] = [];

  // 1. 放入 A 组
  allGroups.push({
    id: "group-A",
    name: "A",
    teams: groupATeams
  });

  // 2. 循环生成 B-L 组
  otherGroupConfigs.forEach((config) => {
    const teams: Team[] = config.teams.map((name, index) => {
      const code = config.codes[index];
      const flag = config.flags[index];
      const id = `${config.name.toLowerCase()}-${name}`;

      // 概率与数值生成
      const aiRate = parseFloat((50 + Math.random() * 40).toFixed(1));
      const metaRate = parseFloat((50 + Math.random() * 40).toFixed(1));
      const danger = riskLevels[Math.floor(Math.random() * riskLevels.length)];
      const fortune = fortuneOptions[Math.floor(Math.random() * fortuneOptions.length)];

      // 生成 26 人完整大名单
      const roster: Player[] = Array.from({ length: 26 }, (_, i) => {
        const num = i + 1;
        const pos = positionList[i % 4];
        const age = 20 + Math.floor(Math.random() * 16);

        // 生成合理的以欧元为单位的身价数字
        let value: number;
        if (i < 3) {
          // 明星球员身价较高 (1500万至8000万欧元)
          value = Math.floor((15 + Math.random() * 65) * 1000000);
        } else {
          // 普通球员身价 (50万至1500万欧元)
          value = Math.floor((0.5 + Math.random() * 14.5) * 1000000);
        }

        return {
          id: `${id}-player-${num}`,
          name: generatePlayerName(name, num),
          number: num,
          position: pos,
          age,
          club: clubList[Math.floor(Math.random() * clubList.length)],
          fortune: fortuneOptions[Math.floor(Math.random() * fortuneOptions.length)],
          isCaptain: num === 10 || num === 1, // 10号或1号担任队长
          value
        };
      });

      // 随机生成近5场战绩
      const opponentNames = ["巴西", "阿根廷", "法国", "英格兰", "西班牙", "德国", "克罗地亚", "荷兰", "比利时", "意大利"];
      const opponentFlags = ["🇧🇷", "🇦🇷", "🇫🇷", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇪🇸", "🇩🇪", "🇭🇷", "🇳🇱", "🇧🇪", "🇮🇹"];
      const results: ("W" | "D" | "L")[] = ["W", "D", "L"];
      const recentForm: RecentMatch[] = Array.from({ length: 5 }, (_, idx) => {
        const opIdx = Math.floor(Math.random() * opponentNames.length);
        const res = results[Math.floor(Math.random() * results.length)];
        let score = "1-1";
        if (res === "W") score = `${2 + Math.floor(Math.random() * 3)}-${Math.floor(Math.random() * 2)}`;
        if (res === "L") score = `${Math.floor(Math.random() * 2)}-${2 + Math.floor(Math.random() * 3)}`;
        return {
          id: `${id}-r-${idx}`,
          opponent: opponentNames[opIdx],
          opponentFlag: opponentFlags[opIdx],
          result: res,
          score,
          isHome: Math.random() > 0.5
        };
      });

      // 随机伤病
      const injuryReasons = ["大腿拉伤", "红牌停赛", "脚踝扭伤", "膝盖积水", "感冒发热"];
      const injuries: Injury[] = [];
      if (Math.random() > 0.4) {
        const numInjuries = 1 + Math.floor(Math.random() * 2);
        for (let i = 0; i < numInjuries; i++) {
          const pIdx = Math.floor(Math.random() * roster.length);
          injuries.push({
            name: roster[pIdx].name,
            position: roster[pIdx].position,
            reason: injuryReasons[Math.floor(Math.random() * injuryReasons.length)],
            severity: (["轻微", "中度", "极高风险"] as const)[Math.floor(Math.random() * 3)]
          });
        }
      }

      // 赔率
      const homeOdds = parseFloat((1.3 + Math.random() * 2.5).toFixed(2));
      const drawOdds = parseFloat((3.0 + Math.random() * 1.5).toFixed(2));
      const awayOdds = parseFloat((2.5 + Math.random() * 5.0).toFixed(2));
      const odds: OddsData = {
        bookmaker: "Bet365",
        homeWin: homeOdds,
        draw: drawOdds,
        awayWin: awayOdds,
        payout: parseFloat((93 + Math.random() * 4).toFixed(1))
      };

      // 裁判与气象
      const referees = ["西蒙·马齐尼亚克", "马尔科·奥利弗", "克莱芒·图尔平", "安东尼·泰勒", "达尼埃莱·奥萨托"];
      const refereeInfo = {
        name: referees[Math.floor(Math.random() * referees.length)],
        cardsPerMatch: parseFloat((3.2 + Math.random() * 2.0).toFixed(1)),
        strictness: (["低", "中", "高"] as const)[Math.floor(Math.random() * 3)]
      };

      const weathers = ["晴朗", "多云", "阴天", "小雨", "大雨", "雷阵雨"];
      const weatherForecast = {
        temp: `${15 + Math.floor(Math.random() * 18)}°C`,
        humidity: `${50 + Math.floor(Math.random() * 40)}%`,
        condition: weathers[Math.floor(Math.random() * weathers.length)]
      };

      return {
        id,
        name,
        code,
        flag,
        aiWinRate: aiRate,
        metaphysicsWinRate: metaRate,
        fortuneText: fortune,
        dangerLevel: danger,
        coach: realCoaches[name] || `阿尔伯特·${name}斯基`,
        stadium: realStadiums[name] || `${name}国家体育场`,
        roster,
        tacticalTags: [
          { label: "防守硬度", value: 70 + Math.floor(Math.random() * 30) },
          { label: "前压拦截", value: 65 + Math.floor(Math.random() * 35) },
          { label: "中路反击", value: 60 + Math.floor(Math.random() * 40) },
          { label: "定位球攻防", value: 75 + Math.floor(Math.random() * 25) }
        ],
        metaphysics: {
          element: elements[Math.floor(Math.random() * elements.length)],
          bagua: baguas[Math.floor(Math.random() * baguas.length)],
          favorableHour: hours[Math.floor(Math.random() * hours.length)],
          clashZodiac: zodiacs[Math.floor(Math.random() * zodiacs.length)],
          upsetChance: parseFloat((5 + Math.random() * 45).toFixed(1)),
          metaphysicsWinRate: metaRate
        },
        recentForm,
        injuries,
        odds,
        refereeInfo,
        weatherForecast
      };
    });

    allGroups.push({
      id: `group-${config.name}`,
      name: config.name,
      teams
    });
  });

  return allGroups;
};

// ==========================================
// 3. 核心客户端页面组件
// ==========================================

export default function WorldCupHome() {
  const [groups, setGroups] = useState<Group[]>(() => generateInitialGroups());
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"roster" | "tactics" | "meta" | "fixtures">("roster");

  // 新增：Gemini 预测数据的缓存与加载状态
  interface PredictionData {
    aiWinRate: number;
    metaphysicsWinRate: number;
    upsetChance: number;
    fortuneText: "大吉" | "中吉" | "平" | "凶";
    element: "金" | "木" | "水" | "火" | "土";
    bagua: string;
    favorableHour: string;
    clashZodiac: string;
    tacticalAnalysis?: string;
    metaphysicalAnalysis?: string;
  }
  const [predictions, setPredictions] = useState<Record<string, PredictionData>>({});
  const [isPredictLoading, setIsPredictLoading] = useState<boolean>(false);

  // ── API-Football 实时比分 State ──
  const [liveFixtures, setLiveFixtures] = useState<LiveFixture[]>([]);
  const [liveLastUpdated, setLiveLastUpdated] = useState<Date | null>(null);
  const [liveLoading, setLiveLoading] = useState<boolean>(false);
  // 球队历史赛事 State
  const [teamFixtures, setTeamFixtures] = useState<TeamFixture[]>([]);
  const [isTeamFixturesLoading, setIsTeamFixturesLoading] = useState<boolean>(false);
  const [teamFixturesError, setTeamFixturesError] = useState<string | null>(null);

  // 数据后台修改面板 State (直接在网页上模拟管理员修改)
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editAiWinRate, setEditAiWinRate] = useState<number>(50);
  const [editMetaWinRate, setEditMetaWinRate] = useState<number>(50);
  const [editFortune, setEditFortune] = useState<"大吉" | "中吉" | "平" | "凶">("平");
  const [editDangerLevel, setEditDangerLevel] = useState<"低风险" | "中度警告" | "极高风控">("低风险");
  const [editCoach, setEditCoach] = useState<string>("");
  const [editUpsetChance, setEditUpsetChance] = useState<number>(10);

  // 管理员 PIN 码验证状态
  const [adminPinInput, setAdminPinInput] = useState<string>("");
  const [adminPinVerified, setAdminPinVerified] = useState<boolean>(false);
  const [adminPinError, setAdminPinError] = useState<boolean>(false);

  // 动态计算顶部大盘指标
  const allTeams = groups.flatMap((g) => g.teams);
  const avgAiWinRate = allTeams.length > 0
    ? (allTeams.reduce((sum, t) => sum + t.aiWinRate, 0) / allTeams.length).toFixed(2)
    : "0.00";
  const dajiRatio = allTeams.length > 0
    ? ((allTeams.filter((t) => t.fortuneText === "大吉").length / allTeams.length) * 100).toFixed(1)
    : "0.0";
  const avgUpsetChance = allTeams.length > 0
    ? (allTeams.reduce((sum, t) => sum + t.metaphysics.upsetChance, 0) / allTeams.length).toFixed(1)
    : "0.0";

  // ── API-Football：自动轮询滚球比分 ──
  // 服务端已缓存 CACHE_SECONDS 秒，此处前端每 60 秒轮询一次
  // 若无直播比赛则自动降速至 5 分钟，节省配额
  useEffect(() => {
    const fetchLive = async () => {
      try {
        setLiveLoading(true);
        const res = await fetch("/api/football/live");
        if (!res.ok) return;
        const data = await res.json();
        setLiveFixtures(data.fixtures ?? []);
        setLiveLastUpdated(new Date());
      } catch (e) {
        console.warn("[Live Poll] Failed:", e);
      } finally {
        setLiveLoading(false);
      }
    };

    // 立即拉一次
    fetchLive();

    // 根据是否有比赛动态决定轮询间隔
    // 有直播比赛: 60 秒，无直播: 5 分钟
    const getInterval = () => (liveFixtures.length > 0 ? 60_000 : 300_000);
    let timerId = setInterval(fetchLive, getInterval());

    // 每次 liveFixtures 变化时重设 interval
    return () => clearInterval(timerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveFixtures.length]);

  // ── API-Football：拉取指定球队历史赛事 ──
  const fetchTeamFixtures = async (teamId: string) => {
    const apiId = TEAM_API_ID_MAP[teamId];
    if (!apiId) {
      setTeamFixtures([]);
      setTeamFixturesError("暂无该队 API-Football 映射，实时赛事数据不可用");
      return;
    }
    setIsTeamFixturesLoading(true);
    setTeamFixturesError(null);
    try {
      const res = await fetch(`/api/football/team-fixtures?teamId=${apiId}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.degraded) {
        setTeamFixturesError(data.reason ?? "API 降级，请配置 FOOTBALL_API_KEY");
        setTeamFixtures([]);
      } else {
        setTeamFixtures(data.fixtures ?? []);
      }
    } catch (e: unknown) {
      setTeamFixturesError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setIsTeamFixturesLoading(false);
    }
  };

  // ── 辅助：根据队名英文匹配 Live 比赛 ──
  const getTeamLiveFixture = (teamName: string): LiveFixture | undefined =>
    liveFixtures.find(
      (f) =>
        f.homeTeam.toLowerCase().includes(teamName.toLowerCase()) ||
        f.awayTeam.toLowerCase().includes(teamName.toLowerCase())
    );

  // ── 辅助：比赛状态标签中文化 ──
  const getStatusLabel = (statusShort: string): string => {
    const map: Record<string, string> = {
      NS: "未开赛", "1H": "上半场", HT: "中场休息",
      "2H": "下半场", ET: "加时", BT: "加时休息",
      P: "点球", PEN: "点球", FT: "全场结束",
      AET: "加时结束", ABD: "已中止", CANC: "取消",
      PST: "推迟", SUSP: "暂停",
    };
    return map[statusShort] ?? statusShort;
  };


  // 当选择国家队时打开抽屉并调用 Gemini 接口
  const handleTeamClick = async (team: Team) => {
    setSelectedTeam(team);
    setActiveDrawerTab("roster");
    setIsDrawerOpen(true);
    // 同时拉取该队真实赛事记录
    fetchTeamFixtures(team.id);

    if (predictions[team.id]) {
      return;
    }

    setIsPredictLoading(true);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ team }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch prediction");
      }

      const data = await response.json();
      if (data.error) {
        throw new Error(data.message || "API error");
      }

      // 缓存数据
      setPredictions((prev) => ({
        ...prev,
        [team.id]: data,
      }));

      // 动态更新主列表球队数据
      setGroups((prevGroups) =>
        prevGroups.map((g) => ({
          ...g,
          teams: g.teams.map((t) => {
            if (t.id === team.id) {
              return {
                ...t,
                aiWinRate: data.aiWinRate,
                metaphysicsWinRate: data.metaphysicsWinRate,
                fortuneText: data.fortuneText,
                metaphysics: {
                  ...t.metaphysics,
                  element: data.element,
                  bagua: data.bagua,
                  favorableHour: data.favorableHour,
                  clashZodiac: data.clashZodiac,
                  upsetChance: data.upsetChance,
                  metaphysicsWinRate: data.metaphysicsWinRate,
                },
              };
            }
            return t;
          }),
        }))
      );

      // 同步更新当前选中展示的球队数据
      setSelectedTeam((prev) => {
        if (!prev || prev.id !== team.id) return prev;
        return {
          ...prev,
          aiWinRate: data.aiWinRate,
          metaphysicsWinRate: data.metaphysicsWinRate,
          fortuneText: data.fortuneText,
          metaphysics: {
            ...prev.metaphysics,
            element: data.element,
            bagua: data.bagua,
            favorableHour: data.favorableHour,
            clashZodiac: data.clashZodiac,
            upsetChance: data.upsetChance,
            metaphysicsWinRate: data.metaphysicsWinRate,
          },
        };
      });
    } catch (err) {
      console.warn("Prediction API failed, using local fallback data:", err);
    } finally {
      setIsPredictLoading(false);
    }
  };

  // 管理员保存修改
  const handleSaveAdminData = () => {
    if (!editingTeam) return;

    // 更新本地 groups 数据
    const updatedGroups = groups.map((g) => {
      const updatedTeams = g.teams.map((t) => {
        if (t.id === editingTeam.id) {
          const updated = {
            ...t,
            aiWinRate: Math.min(100, Math.max(0, editAiWinRate)),
            metaphysicsWinRate: Math.min(100, Math.max(0, editMetaWinRate)),
            fortuneText: editFortune,
            dangerLevel: editDangerLevel,
            coach: editCoach,
            metaphysics: {
              ...t.metaphysics,
              upsetChance: Math.min(100, Math.max(0, editUpsetChance)),
              metaphysicsWinRate: Math.min(100, Math.max(0, editMetaWinRate))
            }
          };
          // 同步更新当前选中显示的数据
          if (selectedTeam && selectedTeam.id === t.id) {
            setSelectedTeam(updated);
          }
          return updated;
        }
        return t;
      });
      return { ...g, teams: updatedTeams };
    });

    setGroups(updatedGroups);
    closeAdminPanel();
  };

  // 进入编辑状态
  const startEditing = (team: Team) => {
    setEditingTeam(team);
    setEditAiWinRate(team.aiWinRate);
    setEditMetaWinRate(team.metaphysicsWinRate);
    setEditFortune(team.fortuneText);
    setEditDangerLevel(team.dangerLevel);
    setEditCoach(team.coach);
    setEditUpsetChance(team.metaphysics.upsetChance);
    setIsAdminPanelOpen(true);
  };

  // PIN 码验证
  const handleVerifyPin = () => {
    if (adminPinInput === ADMIN_PIN) {
      setAdminPinVerified(true);
      setAdminPinError(false);
      setAdminPinInput("");
    } else {
      setAdminPinError(true);
      setAdminPinInput("");
    }
  };

  // 关闭管理面板并完全重置所有状态
  const closeAdminPanel = () => {
    setIsAdminPanelOpen(false);
    setEditingTeam(null);
    setAdminPinVerified(false);
    setAdminPinInput("");
    setAdminPinError(false);
  };

  // 辅助样式类
  const getFortuneBadgeColor = (fortune: string) => {
    switch (fortune) {
      case "大吉":
        return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "中吉":
        return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
      case "平":
        return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
      case "凶":
        return "bg-red-500/10 text-red-400 border border-red-500/30";
      default:
        return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
    }
  };

  const getDangerLevelColor = (level: string) => {
    switch (level) {
      case "极高风控":
        return "text-[#FF3333] bg-[#FF3333]/10 border border-[#FF3333]/20";
      case "中度警告":
        return "text-amber-400 bg-amber-500/10 border border-amber-500/20";
      case "低风险":
      default:
        return "text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/20";
    }
  };

  return (
    <div className="min-h-screen bg-[#0D0D11] text-white flex flex-col relative">
      
      {/* ── 头部实时滚动横幅 (金融对冲终端风格) ── */}
      <div className="w-full bg-[#08080C] border-b border-[#1E1E2E] py-2 overflow-hidden text-xs text-[#888899] font-mono flex items-center relative z-20">
        <div className="px-4 flex items-center gap-1.5 shrink-0 bg-[#08080C] text-[#00FF66] border-r border-[#1E1E2E] font-bold">
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span>DATA STREAM</span>
        </div>
        <div className="flex-1 overflow-hidden">
          {/* 双份内容 + animation 0→-50% = 无缝滚动循环 */}
          <div className="flex gap-12 whitespace-nowrap animate-[ticker-scroll_35s_linear_infinite]">
            <span>📈 [AI WIN INDEX] URU: 74.3% (+2.4%) | BRA: 81.2% | ARG: 79.5% | FRA: 78.9%</span>
            <span className="text-[#FF3333]">⚠️ [玄学反煞警告] 今日忌辰：属虎、属猴冲煞极强，防机构强力诱盘</span>
            <span>⚽ [MATCHDAY] 2026 美加墨世界杯：48支铁骑会师北美，大盘概率对冲系统实时接入</span>
            <span className="text-[#00FF66]">⚡ [流时化忌] 乾坤乾震，兑卦出格，首战警惕大盘数据翻盘风险</span>
            <span>📈 [AI WIN INDEX] URU: 74.3% (+2.4%) | BRA: 81.2% | ARG: 79.5% | FRA: 78.9%</span>
            <span className="text-[#FF3333]">⚠️ [玄学反煞警告] 今日忌辰：属虎、属猴冲煞极强，防机构强力诱盘</span>
            <span>⚽ [MATCHDAY] 2026 美加墨世界杯：48支铁骑会师北美，大盘概率对冲系统实时接入</span>
            <span className="text-[#00FF66]">⚡ [流时化忌] 乾坤乾震，兑卦出格，首战警惕大盘数据翻盘风险</span>
          </div>
        </div>
      </div>

      {/* ── 📡 API-Football 今日直播赛事横幅 ── */}
      {(liveFixtures.length > 0 || liveLoading) && (
        <div className="w-full bg-[#0A0A10] border-b border-[#FF3333]/20 py-2 px-4 relative z-20">
          <div className="max-w-7xl mx-auto flex items-center gap-3 overflow-x-auto scrollbar-none">
            {/* 左侧标识 */}
            <div className="flex items-center gap-1.5 shrink-0 text-[#FF3333] font-bold text-[11px] font-mono pr-3 border-r border-[#FF3333]/20">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>LIVE</span>
            </div>

            {liveLoading && liveFixtures.length === 0 ? (
              /* 骨架屏 */
              <div className="flex gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-2 bg-[#13131A] border border-[#252535] rounded-lg px-3 py-1.5 animate-pulse">
                    <div className="w-16 h-3 bg-[#252535] rounded" />
                    <div className="w-8 h-4 bg-[#252535] rounded" />
                    <div className="w-16 h-3 bg-[#252535] rounded" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-0.5">
                {liveFixtures.map((f) => {
                  const isLive = ["1H", "2H", "HT", "ET", "P", "PEN", "BT"].includes(f.statusShort);
                  return (
                    <div
                      key={f.fixtureId}
                      className={`flex items-center gap-2 rounded-lg px-3 py-1.5 border text-xs font-mono whitespace-nowrap shrink-0 ${
                        isLive
                          ? "bg-[#FF3333]/10 border-[#FF3333]/30"
                          : "bg-[#13131A] border-[#252535]"
                      }`}
                    >
                      <span>{f.homeFlag}</span>
                      <span className="text-[#888899] text-[10px]">{f.homeCode}</span>
                      <span className={`font-black text-sm ${
                        isLive ? "text-white" : "text-[#888899]"
                      }`}>
                        {f.homeScore ?? "-"}
                      </span>
                      <div className="flex flex-col items-center gap-0">
                        <span className={`text-[8px] font-bold ${
                          isLive ? "text-[#FF3333] animate-pulse" : "text-[#888899]"
                        }`}>
                          {isLive && f.minute ? `${f.minute}'` : getStatusLabel(f.statusShort)}
                        </span>
                      </div>
                      <span className={`font-black text-sm ${
                        isLive ? "text-white" : "text-[#888899]"
                      }`}>
                        {f.awayScore ?? "-"}
                      </span>
                      <span className="text-[#888899] text-[10px]">{f.awayCode}</span>
                      <span>{f.awayFlag}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 右侧最后更新时间 */}
            {liveLastUpdated && (
              <div className="ml-auto shrink-0 text-[9px] text-[#888899] font-mono flex items-center gap-1">
                <Timer className="w-2.5 h-2.5" />
                <span>更新 {liveLastUpdated.toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── 顶部通栏：全局风控大盘 ── */}
      <header className="p-4 md:p-6 max-w-7xl mx-auto w-full relative z-10">
        <div className="bg-[#13131A] border border-[#1E1E2E] rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          
          {/* 背景极客点阵微光特效 */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: "radial-gradient(#00FF66 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }} />

          {/* 大盘指标与动画 */}
          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66] shrink-0">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  2026 美加墨世界杯 <span className="text-xs bg-[#00FF66]/20 text-[#00FF66] px-2 py-0.5 rounded border border-[#00FF66]/30">AI+玄学智能量化对冲大盘</span>
                </h1>
              </div>
              <p className="text-xs md:text-sm text-[#888899] mt-1 font-mono">
                今日 AI 平均胜率精算: <span className="text-[#00FF66] font-bold">{avgAiWinRate}%</span> | 玄学大吉运势占比: <span className="text-[#00FF66] font-bold">{dajiRatio}%</span> | 爆冷预警指数: <span className="text-[#FF3333] font-bold">{avgUpsetChance}%</span>
              </p>
            </div>
          </div>

          {/* 实时对冲按钮与网页管理端入口 */}
          <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-[#1E1E2E] border border-[#2A2A3E] text-xs font-medium text-white hover:bg-[#2A2A3E] transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span>数据修改终端</span>
            </button>
            <a
              href={REDIRECT_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="px-5 py-2.5 bg-[#00FF66] text-[#0D0D11] rounded-lg font-bold text-xs md:text-sm hover:scale-110 active:scale-95 transition-all duration-300 shadow-[0_0_15px_rgba(0,255,102,0.3)] flex items-center gap-2 shrink-0 animate-[breathe-glow_2s_infinite]"
            >
              <span>📊 实时AI对冲指数终端</span>
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>
      </header>

      {/* ── 中间主体：12小组 Bento Grid ── */}
      <main className="flex-grow p-4 md:p-6 max-w-7xl mx-auto w-full pb-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-[#13131A] border border-[#1E1E2E] rounded-xl overflow-hidden hover:border-[#00FF66] transition-all duration-300 shadow-xl group/card flex flex-col justify-between"
            >
              {/* 小组标题栏 */}
              <div className="p-4 border-b border-[#1E1E2E] bg-[#171722] flex justify-between items-center">
                <span className="font-mono text-sm text-[#888899]">GROUP</span>
                <span className="text-xl font-black text-white group-hover/card:text-[#00FF66] transition-colors">
                  {group.name} 组
                </span>
              </div>

              {/* 球队列表 */}
              <div className="p-4 space-y-3 flex-grow">
                {group.teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => handleTeamClick(team)}
                    className="p-3 bg-[#1C1C26] rounded-lg border border-[#252535] hover:bg-[#252535] hover:border-[#00FF66]/40 cursor-pointer transition-all duration-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{team.flag}</span>
                      <div>
                        <div className="font-semibold text-sm text-white flex items-center gap-1.5 flex-wrap">
                          {team.name}
                          <span className="text-[10px] text-[#888899] font-mono">
                            {team.code}
                          </span>
                          {/* 🔴 LIVE 实时角标 */}
                          {(() => {
                            const lf = getTeamLiveFixture(team.name);
                            const isLive = lf && ["1H","2H","HT","ET","P","PEN","BT"].includes(lf.statusShort);
                            if (!isLive || !lf) return null;
                            return (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-black font-mono px-1.5 py-0.5 bg-[#FF3333]/10 text-[#FF3333] rounded border border-[#FF3333]/30 animate-pulse">
                                🔴 LIVE{lf.minute ? ` ${lf.minute}'` : ""}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-[10px] text-[#888899] mt-0.5 font-mono flex items-center gap-2">
                          <span>AI: <span className="text-[#00FF66]">{team.aiWinRate}%</span></span>
                          <span>玄学: <span className="text-[#00FF66]">{team.metaphysicsWinRate}%</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 font-mono">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getFortuneBadgeColor(team.fortuneText)}`}>
                        {team.fortuneText}
                      </span>
                      <span className={`text-[8px] px-1 rounded scale-90 ${getDangerLevelColor(team.dangerLevel)}`}>
                        {team.dangerLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* 小组快速底栏 */}
              <div className="px-4 py-2 bg-[#171722] border-t border-[#1E1E2E] text-[10px] text-[#888899] font-mono flex justify-between">
                <span>4支铁骑对决</span>
                <span className="text-[#00FF66] animate-pulse">● 数据源已校准</span>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* ── 核心交互：抽屉 (Drawer) ── */}
      {isDrawerOpen && selectedTeam && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* 暗色遮罩背景 */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* 抽屉面板主体 */}
          <div className="relative w-full max-w-md md:max-w-lg h-full bg-[#13131A] border-l border-[#1E1E2E] shadow-2xl flex flex-col z-10 animate-[slide-in-right_0.3s_ease-out]">
            
            {/* 抽屉头部 */}
            <div className="p-5 border-b border-[#1E1E2E] bg-[#171722] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{selectedTeam.flag}</span>
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    {selectedTeam.name}
                    <span className="text-xs bg-[#00FF66]/10 text-[#00FF66] px-1.5 py-0.5 rounded font-mono">
                      {selectedTeam.code}
                    </span>
                  </h2>
                  <p className="text-xs text-[#888899] mt-0.5 font-mono">
                    主教练: {selectedTeam.coach}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDrawerOpen(false)}
                className="p-1.5 rounded-lg bg-[#252535] hover:bg-[#32324A] text-[#888899] hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 快捷对冲雷盘 & 今日宏观玄学指标 */}
            <div className="p-5 bg-gradient-to-br from-[#1C1C26] to-[#13131A] border-b border-[#1E1E2E] grid grid-cols-3 gap-4">
              <div className="bg-[#13131A]/60 p-3 rounded-lg border border-[#252535] text-center">
                <div className="text-xs text-[#888899] mb-1 flex items-center justify-center gap-1">
                  <Cpu className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>AI 胜率预测</span>
                </div>
                <div className="text-2xl font-black text-[#00FF66] font-mono">
                  {isPredictLoading ? (
                    <span className="text-xs font-normal text-[#888899] animate-pulse">精算中...</span>
                  ) : (
                    `${selectedTeam.aiWinRate}%`
                  )}
                </div>
              </div>
              <div className="bg-[#13131A]/60 p-3 rounded-lg border border-[#252535] text-center">
                <div className="text-xs text-[#888899] mb-1 flex items-center justify-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>玄学能量值</span>
                </div>
                <div className="text-2xl font-black text-[#00FF66] font-mono">
                  {isPredictLoading ? (
                    <span className="text-xs font-normal text-[#888899] animate-pulse">推演中...</span>
                  ) : (
                    `${selectedTeam.metaphysicsWinRate}%`
                  )}
                </div>
              </div>
              <div className="bg-[#13131A]/60 p-3 rounded-lg border border-[#252535] text-center">
                <div className="text-xs text-[#888899] mb-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>爆冷概率</span>
                </div>
                <div className="text-2xl font-black text-[#FF3333] font-mono">
                  {isPredictLoading ? (
                    <span className="text-xs font-normal text-[#888899] animate-pulse">排煞中...</span>
                  ) : (
                    `${selectedTeam.metaphysics.upsetChance}%`
                  )}
                </div>
              </div>
            </div>

            {/* 抽屉导航选项卡 */}
            <div className="flex border-b border-[#1E1E2E] bg-[#171722] text-xs">
              <button
                onClick={() => setActiveDrawerTab("roster")}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all ${
                  activeDrawerTab === "roster"
                    ? "border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5"
                    : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                26人名单
              </button>
              <button
                onClick={() => setActiveDrawerTab("tactics")}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all ${
                  activeDrawerTab === "tactics"
                    ? "border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5"
                    : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                战术分析
              </button>
              <button
                onClick={() => setActiveDrawerTab("meta")}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all ${
                  activeDrawerTab === "meta"
                    ? "border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5"
                    : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                八卦命格
              </button>
              <button
                onClick={() => setActiveDrawerTab("fixtures")}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all flex items-center justify-center gap-1 ${
                  activeDrawerTab === "fixtures"
                    ? "border-[#FF3333] text-[#FF3333] bg-[#FF3333]/5"
                    : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                <Radio className="w-3 h-3" />
                赛事
              </button>
            </div>

            {/* 抽屉滚动内容区 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* TAB 1: 26人大名单 */}
              {activeDrawerTab === "roster" && (
                <div className="space-y-4">
                  {/* 红色伤病停赛警报栏 */}
                  {selectedTeam.injuries && selectedTeam.injuries.length > 0 && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1 opacity-10">
                        <AlertTriangle className="w-16 h-16 text-red-500" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#FF3333] font-bold">
                        <AlertTriangle className="w-4 h-4 animate-pulse" />
                        <span>⚠️ 主力核心伤病停赛警报</span>
                      </div>
                      <div className="space-y-1">
                        {selectedTeam.injuries.map((injury, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-white/90">{injury.name} ({injury.position})</span>
                            <div className="flex gap-2 items-center">
                              <span className="text-[#888899]">{injury.reason}</span>
                              <span className={`px-1 rounded text-[9px] ${
                                injury.severity === "极高风险" ? "bg-red-500/20 text-red-400 border border-red-500/20" :
                                injury.severity === "中度" ? "bg-amber-500/20 text-amber-400 border border-amber-500/20" :
                                "bg-zinc-500/20 text-zinc-400 border border-zinc-500/20"
                              }`}>
                                {injury.severity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-between items-center text-xs text-[#888899] pb-2 border-b border-[#1E1E2E]">
                    <span>核心主将 (含今日运势)</span>
                    <span>身价 (欧元)</span>
                  </div>
                  <div className="space-y-2">
                    {selectedTeam.roster.map((player) => (
                      <div
                        key={player.id}
                        className="p-3 bg-[#1C1C26] rounded-lg border border-[#252535] flex items-center justify-between hover:border-[#00FF66]/20 transition-all"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-[#13131A] flex items-center justify-center text-xs font-mono font-bold text-[#888899]">
                            {player.number}
                          </span>
                          <div>
                            <div className="text-sm font-semibold flex items-center gap-1.5">
                              {player.name}
                              {player.isCaptain && (
                                <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded border border-amber-500/20">
                                  C
                                </span>
                              )}
                              <span className="text-[10px] text-[#888899] bg-[#13131A] px-1 py-0.2 rounded font-mono">
                                {player.position}
                              </span>
                            </div>
                            <div className="text-[11px] text-[#888899] mt-0.5">
                              {player.age}岁 · {player.club}
                            </div>
                          </div>
                        </div>

                        {/* 运势标鉴及身价 */}
                        <div className="flex items-center gap-3 font-mono">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getFortuneBadgeColor(player.fortune)}`}>
                            🔮运势:{player.fortune}
                          </span>
                          <span className="text-xs text-white/90">{formatValueEuro(player.value)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: 战术数据分析 */}
              {activeDrawerTab === "tactics" && (
                <div className="space-y-6">
                  <div className="bg-[#1C1C26] p-4 rounded-lg border border-[#252535] space-y-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-[#00FF66]" />
                      <span>战术量化指标分布</span>
                    </h3>
                    <div className="space-y-4">
                      {selectedTeam.tacticalTags.map((tag, idx) => (
                        <div key={idx} className="space-y-1.5">
                          <div className="flex justify-between text-xs font-mono">
                            <span className="text-[#888899]">{tag.label}</span>
                            <span className="text-[#00FF66] font-bold">{tag.value} / 100</span>
                          </div>
                          <div className="w-full bg-[#13131A] h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-teal-500 to-[#00FF66] h-full rounded-full transition-all duration-1000"
                              style={{ width: `${tag.value}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 近期战绩 5 场 */}
                  <div className="bg-[#1C1C26] p-4 rounded-lg border border-[#252535] space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-[#00FF66]" />
                      <span>近期赛事大盘走向 (Form)</span>
                    </h3>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2">
                        {selectedTeam.recentForm.map((match) => (
                          <div
                            key={match.id}
                            title={`${match.isHome ? "主场" : "客场"} 对阵 ${match.opponent} (${match.score})`}
                            className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border ${
                              match.result === "W" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" :
                              match.result === "D" ? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" :
                              "bg-red-500/10 text-red-400 border-red-500/30"
                            }`}
                          >
                            {match.result}
                          </div>
                        ))}
                      </div>
                      {selectedTeam.recentForm && selectedTeam.recentForm[0] && (
                        <span className="text-[10px] text-[#888899] font-mono">
                          (最新战局：{selectedTeam.recentForm[0].opponentFlag}对阵{selectedTeam.recentForm[0].opponent} {selectedTeam.recentForm[0].score})
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 即时赔率大盘 */}
                  <div className="bg-[#1C1C26] p-4 rounded-lg border border-[#252535] space-y-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Activity className="w-4 h-4 text-[#00FF66]" />
                      <span>即时指数对冲大盘 ({selectedTeam.odds.bookmaker})</span>
                    </h3>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="p-2 bg-[#13131A] rounded border border-[#252535] font-mono">
                        <span className="text-[10px] text-[#888899] block mb-0.5">主胜</span>
                        <span className="text-sm font-black text-[#00FF66]">{selectedTeam.odds.homeWin}</span>
                      </div>
                      <div className="p-2 bg-[#13131A] rounded border border-[#252535] font-mono">
                        <span className="text-[10px] text-[#888899] block mb-0.5">平局</span>
                        <span className="text-sm font-black text-white">{selectedTeam.odds.draw}</span>
                      </div>
                      <div className="p-2 bg-[#13131A] rounded border border-[#252535] font-mono">
                        <span className="text-[10px] text-[#888899] block mb-0.5">客胜</span>
                        <span className="text-sm font-black text-[#FF3333]">{selectedTeam.odds.awayWin}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center text-[10px] text-[#888899] font-mono mt-2 pt-2 border-t border-[#1E1E2E]">
                      <span>返还率: <span className="text-[#00FF66]">{selectedTeam.odds.payout}%</span></span>
                      <span>对冲风控评级: <span className="text-white">中度风控区</span></span>
                    </div>
                  </div>

                  {/* 物理环境与主裁判 */}
                  <div className="bg-[#1C1C26] p-4 rounded-lg border border-[#252535] space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Globe className="w-4 h-4 text-[#00FF66]" />
                      <span>物理赛场与裁判对冲因子</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535] space-y-1">
                        <span className="text-[#888899] block text-[10px]">⚖️ 主裁判执法尺度</span>
                        <div className="text-white font-semibold">{selectedTeam.refereeInfo.name}</div>
                        <div className="text-[10px] text-[#888899]">
                          场均牌数: <span className="text-white font-bold">{selectedTeam.refereeInfo.cardsPerMatch}</span> 张 | 严格度: <span className={`font-bold ${selectedTeam.refereeInfo.strictness === "高" ? "text-[#FF3333]" : "text-amber-400"}`}>{selectedTeam.refereeInfo.strictness}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535] space-y-1">
                        <span className="text-[#888899] block text-[10px]">🌤️ 赛场气象指征</span>
                        <div className="text-white font-semibold">{selectedTeam.weatherForecast.temp} · {selectedTeam.weatherForecast.condition}</div>
                        <div className="text-[10px] text-[#888899]">
                          环境湿度: <span className="text-white font-bold">{selectedTeam.weatherForecast.humidity}</span> | 气候影响: <span className="text-[#00FF66]">适宜水命格</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#1C1C26] p-4 rounded-lg border border-[#252535] space-y-3 relative overflow-hidden">
                    {/* 微光风效 */}
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5 relative z-10">
                      <Award className="w-4 h-4 text-[#00FF66]" />
                      <span>🤖 AI 战术深度剖析</span>
                    </h3>
                    {isPredictLoading ? (
                      <div className="space-y-2 relative z-10 animate-pulse">
                        <div className="h-3 bg-[#13131A] rounded w-full" />
                        <div className="h-3 bg-[#13131A] rounded w-5/6" />
                      </div>
                    ) : (
                      <p className="text-xs text-[#888899] leading-relaxed relative z-10 font-mono">
                        {predictions[selectedTeam.id]?.tacticalAnalysis || getTacticalAnalysisFallback(selectedTeam)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: 五行八卦命格 */}
              {activeDrawerTab === "meta" && (
                <div className="space-y-6">
                  <div className="bg-[#1C1C26] p-4 rounded-lg border border-[#252535] space-y-3.5">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#00FF66]" />
                      <span>今日五行八卦大盘</span>
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs font-mono">
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535]">
                        <span className="text-[#888899] block mb-1">本队五行格属性</span>
                        <span className="text-base font-bold text-[#00FF66]">
                          {isPredictLoading ? "..." : `${selectedTeam.metaphysics.element}命格`}
                        </span>
                      </div>
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535]">
                        <span className="text-[#888899] block mb-1">今日流年卦象</span>
                        <span className="text-base font-bold text-[#00FF66]">
                          {isPredictLoading ? "..." : selectedTeam.metaphysics.bagua}
                        </span>
                      </div>
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535]">
                        <span className="text-[#888899] block mb-1">宜赛吉利时辰</span>
                        <span className="text-xs font-bold text-white">
                          {isPredictLoading ? "..." : selectedTeam.metaphysics.favorableHour}
                        </span>
                      </div>
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535]">
                        <span className="text-[#888899] block mb-1">今日忌冲生肖</span>
                        <span className="text-xs font-bold text-[#FF3333]">
                          {isPredictLoading ? "..." : selectedTeam.metaphysics.clashZodiac}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#00FF66]/5 p-4 rounded-lg border border-[#00FF66]/20 space-y-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="flex items-center gap-1.5 text-xs text-[#00FF66] font-bold relative z-10">
                      <Compass className="w-4 h-4 animate-[spin_6s_linear_infinite]" />
                      <span>🔮 AI 玄学星盘点评</span>
                    </div>
                    {isPredictLoading ? (
                      <div className="space-y-2 relative z-10 animate-pulse">
                        <div className="h-3 bg-[#13131A] rounded w-full" />
                        <div className="h-3 bg-[#13131A] rounded w-4/5" />
                      </div>
                    ) : (
                      <p className="text-xs text-[#888899] leading-relaxed relative z-10 font-mono">
                        {predictions[selectedTeam.id]?.metaphysicalAnalysis || getMetaphysicalAnalysisFallback(selectedTeam)}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 4: 📡 真实赛事数据 */}
              {activeDrawerTab === "fixtures" && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-[#888899]">
                      <CalendarDays className="w-3.5 h-3.5 text-[#FF3333]" />
                      <span>世界杯赛事记录（API-Football 实时）</span>
                    </div>
                    {/* 重新拉取按钮 */}
                    <button
                      onClick={() => selectedTeam && fetchTeamFixtures(selectedTeam.id)}
                      disabled={isTeamFixturesLoading}
                      className="p-1.5 rounded bg-[#1C1C26] border border-[#252535] hover:border-[#00FF66]/30 text-[#888899] hover:text-[#00FF66] transition-all disabled:opacity-40"
                    >
                      <RefreshCw className={`w-3 h-3 ${isTeamFixturesLoading ? "animate-spin" : ""}`} />
                    </button>
                  </div>

                  {/* 错误提示 */}
                  {teamFixturesError && (
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-xs text-amber-400 font-mono">
                      ⚠️ {teamFixturesError}
                    </div>
                  )}

                  {/* 加载骨架屏 */}
                  {isTeamFixturesLoading && (
                    <div className="space-y-2">
                      {[1,2,3,4,5].map((i) => (
                        <div key={i} className="h-14 bg-[#1C1C26] rounded-lg border border-[#252535] animate-pulse" />
                      ))}
                    </div>
                  )}

                  {/* 赛事列表 */}
                  {!isTeamFixturesLoading && teamFixtures.length > 0 && (
                    <div className="space-y-2">
                      {teamFixtures.map((f) => {
                        const isFinished = f.statusShort === "FT" || f.statusShort === "AET";
                        const isLive = ["1H","2H","HT","ET","P","PEN","BT"].includes(f.statusShort);
                        const matchDate = new Date(f.date);
                        return (
                          <div
                            key={f.fixtureId}
                            className={`p-3 rounded-lg border font-mono text-xs ${
                              isLive
                                ? "bg-[#FF3333]/10 border-[#FF3333]/30"
                                : "bg-[#1C1C26] border-[#252535]"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[#888899] text-[10px]">
                                {matchDate.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}
                              </span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                                isLive
                                  ? "text-[#FF3333] bg-[#FF3333]/10 border-[#FF3333]/30 animate-pulse"
                                  : isFinished
                                    ? "text-[#888899] bg-[#13131A] border-[#252535]"
                                    : "text-amber-400 bg-amber-500/10 border-amber-500/20"
                              }`}>
                                {isLive ? `🔴 LIVE` : getStatusLabel(f.statusShort)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span>{f.homeFlag}</span>
                                <span className="text-white truncate">{f.homeTeam}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0">
                                <span className={`text-base font-black ${
                                  isFinished || isLive ? "text-white" : "text-[#888899]"
                                }`}>
                                  {f.homeScore ?? "-"}
                                </span>
                                <span className="text-[#888899] text-xs">:</span>
                                <span className={`text-base font-black ${
                                  isFinished || isLive ? "text-white" : "text-[#888899]"
                                }`}>
                                  {f.awayScore ?? "-"}
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                                <span className="text-white truncate">{f.awayTeam}</span>
                                <span>{f.awayFlag}</span>
                              </div>
                            </div>
                            {f.round && (
                              <div className="mt-1 text-[10px] text-[#888899] truncate">{f.round}</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* 空状态（无数据且无错误） */}
                  {!isTeamFixturesLoading && teamFixtures.length === 0 && !teamFixturesError && (
                    <div className="py-12 text-center text-[#888899] text-xs font-mono">
                      <CalendarDays className="w-8 h-8 mx-auto mb-3 opacity-30" />
                      <p>暂无世界杯赛事数据</p>
                      <p className="mt-1 text-[10px] opacity-60">请确认 FOOTBALL_API_KEY 已配置</p>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* 抽屉底部广告埋点与引流闪烁按钮 */}
            <div className="p-5 border-t border-[#1E1E2E] bg-[#171722] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#888899]">🔮今日局势运势预测：</span>
                <span className="text-[#00FF66] font-bold">乾乾兑兑 · 大吉大利</span>
              </div>
              <a
                href={REDIRECT_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#00FF66] text-[#0D0D11] rounded-lg font-black text-xs md:text-sm text-center flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all animate-[breathe-glow_2s_infinite]"
              >
                <span>🔮 查看本场‘流时化忌’节点与机构诱盘破解方案</span>
                <Zap className="w-4 h-4 fill-current" />
              </a>
            </div>

          </div>
        </div>
      )}

      {/* ── 数据后台修改终端 (Admin Panel) ── */}
      {isAdminPanelOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsAdminPanelOpen(false)} />
          
          <div className="relative w-full max-w-2xl bg-[#13131A] border border-[#1E1E2E] rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col">
            <div className="p-5 border-b border-[#1E1E2E] bg-[#171722] flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-[#00FF66]" />
                <h2 className="text-lg font-bold">世界杯 AI + 玄学数据更改终端</h2>
              </div>
              <button
                onClick={closeAdminPanel}
                className="p-1.5 rounded-lg bg-[#252535] hover:bg-[#32324A] text-[#888899] hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto max-h-[70vh]">
              {!adminPinVerified ? (
                /* ── 🔒 PIN 权限认证界面 ── */
                <div className="py-10 flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-[#00FF66]" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-base font-bold text-white">权限认证终端</h3>
                    <p className="text-xs text-[#888899] mt-1 font-mono">请输入 4 位管理员授权密码</p>
                  </div>
                  <div className="flex flex-col items-center gap-3">
                    <input
                      type="password"
                      inputMode="numeric"
                      maxLength={4}
                      value={adminPinInput}
                      autoFocus
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                        setAdminPinInput(val);
                        setAdminPinError(false);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && adminPinInput.length === 4) handleVerifyPin();
                      }}
                      placeholder="••••"
                      className="text-center text-2xl tracking-[0.6em] w-44 bg-[#1C1C26] border border-[#252535] rounded-lg p-3 text-white focus:border-[#00FF66] outline-none font-mono transition-colors"
                    />
                    {adminPinError && (
                      <p className="text-[#FF3333] text-xs font-mono animate-pulse">
                        ❌ 密码错误，请重新输入
                      </p>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={closeAdminPanel}
                      className="px-4 py-2 rounded text-xs text-[#888899] bg-[#1C1C26] hover:bg-[#252535] transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={handleVerifyPin}
                      disabled={adminPinInput.length !== 4}
                      className="px-5 py-2 bg-[#00FF66] text-[#0D0D11] font-bold rounded text-xs flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
                    >
                      <Lock className="w-4 h-4" />
                      确认解锁
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
              {/* 选择需要修改的球队 */}
              <div className="space-y-2">
                <label className="text-xs text-[#888899] font-mono">STEP 1: 选择需要修改的国家队</label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                  {groups.flatMap((g) => g.teams).map((team) => (
                    <button
                      key={team.id}
                      onClick={() => startEditing(team)}
                      className={`p-2 text-xs rounded border transition-all truncate ${
                        editingTeam?.id === team.id
                          ? "border-[#00FF66] bg-[#00FF66]/10 text-white"
                          : "border-[#252535] bg-[#1C1C26] text-[#888899] hover:text-white"
                      }`}
                    >
                      {team.flag} {team.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* 修改具体表单字段 */}
              {editingTeam ? (
                <div className="space-y-4 border-t border-[#1E1E2E] pt-4">
                  <div className="text-xs text-[#888899] font-mono">
                    STEP 2: 修改 [{editingTeam.flag} {editingTeam.name}] 的实时数据及玄学参数
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* AI 胜率 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#888899]">AI 胜率预测 (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editAiWinRate}
                        onChange={(e) => setEditAiWinRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                        className="w-full bg-[#1C1C26] border border-[#252535] rounded p-2 text-sm text-white focus:border-[#00FF66] outline-none"
                      />
                    </div>

                    {/* 玄学胜率 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#888899]">玄学胜率 (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editMetaWinRate}
                        onChange={(e) => setEditMetaWinRate(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                        className="w-full bg-[#1C1C26] border border-[#252535] rounded p-2 text-sm text-white focus:border-[#00FF66] outline-none"
                      />
                    </div>

                    {/* 今日大运势 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#888899]">今日大运势</label>
                      <select
                        value={editFortune}
                        onChange={(e) => setEditFortune(e.target.value as Team["fortuneText"])}
                        className="w-full bg-[#1C1C26] border border-[#252535] rounded p-2 text-sm text-white focus:border-[#00FF66] outline-none"
                      >
                        <option value="大吉">大吉</option>
                        <option value="中吉">中吉</option>
                        <option value="平">平</option>
                        <option value="凶">凶</option>
                      </select>
                    </div>

                    {/* 风控等级 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#888899]">大盘风控评级</label>
                      <select
                        value={editDangerLevel}
                        onChange={(e) => setEditDangerLevel(e.target.value as Team["dangerLevel"])}
                        className="w-full bg-[#1C1C26] border border-[#252535] rounded p-2 text-sm text-white focus:border-[#00FF66] outline-none"
                      >
                        <option value="低风险">低风险</option>
                        <option value="中度警告">中度警告</option>
                        <option value="极高风控">极高风控</option>
                      </select>
                    </div>

                    {/* 爆冷指数 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#888899]">爆冷几率指数 (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={editUpsetChance}
                        onChange={(e) => setEditUpsetChance(Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)))}
                        className="w-full bg-[#1C1C26] border border-[#252535] rounded p-2 text-sm text-white focus:border-[#00FF66] outline-none"
                      />
                    </div>

                    {/* 主教练 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#888899]">主教练名字</label>
                      <input
                        type="text"
                        value={editCoach}
                        onChange={(e) => setEditCoach(e.target.value)}
                        className="w-full bg-[#1C1C26] border border-[#252535] rounded p-2 text-sm text-white focus:border-[#00FF66] outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-8 border border-dashed border-[#252535] text-center text-xs text-[#888899] rounded">
                  请在上面点击想要修改的国家队，随后可在此编辑实时大盘数据
                </div>
              )}
                </div>
              )}
            </div>

            {/* 编辑保存底栏（PIN 验证通过后才显示）*/}
            {adminPinVerified && (
              <div className="p-5 border-t border-[#1E1E2E] bg-[#171722] flex justify-end gap-3">
                <button
                  onClick={closeAdminPanel}
                  className="px-4 py-2 rounded text-xs text-[#888899] bg-[#1C1C26] hover:bg-[#252535]"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveAdminData}
                  disabled={!editingTeam}
                  className="px-5 py-2 bg-[#00FF66] text-[#0D0D11] font-bold rounded text-xs flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105 active:scale-95 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>保存数据更改并实时广播</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
