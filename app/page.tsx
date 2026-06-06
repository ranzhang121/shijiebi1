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
  Timer,
  ChevronDown,
  ChevronUp
} from "lucide-react";

// ==========================================
// 0. 全局配置（🔧 上线前请修改以下配置）
// ==========================================

/** 引流跳转目标 URL —— 微信/对账/赞赏/付费均使用该地址 */
const REDIRECT_URL = "https://your-domain.com";
/** 管理员数据终端 4 位数字 PIN 码 */
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
  value: number; 
}

export interface TacticalTag {
  label: string;
  value: number; 
}

export interface MetaphysicsStat {
  element: "金" | "木" | "水" | "火" | "土";
  bagua: string; 
  favorableHour: string; 
  clashZodiac: string; 
  upsetChance: number; 
  metaphysicsWinRate: number; 
}

export interface RecentMatch {
  id: string;
  opponent: string;
  opponentFlag: string;
  result: "W" | "D" | "L"; 
  score: string;          
  isHome: boolean;
}

export interface Injury {
  name: string;
  position: "GK" | "DF" | "MF" | "FW";
  reason: string;         
  severity: "轻微" | "中度" | "极高风险"; 
}

export interface OddsData {
  bookmaker: string;      
  homeWin: number;        
  draw: number;           
  awayWin: number;        
  payout: number;         
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
  name: string; 
  teams: Team[];
}

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
  minute: number | null;
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
// 2. 运势固化哈希算法：F5 刷新永不跳字 (当天绝对锁定)
// ==========================================

const getTodayDateString = (): string => {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const getDeterministicHash = (str: string): number => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
};

const getDeterministicFortune = (key: string, dateStr: string): "大吉" | "中吉" | "平" | "凶" => {
  const combined = `${key}-${dateStr}`;
  const hash = getDeterministicHash(combined);
  const options = ["大吉", "中吉", "平", "凶"] as const;
  return options[hash % options.length];
};

const getDeterministicMetaphysics = (key: string, dateStr: string, baseMetaWinRate: number) => {
  const hash = getDeterministicHash(`${key}-${dateStr}`);
  const elements = ["金", "木", "水", "火", "土"] as const;
  const baguas = ["乾为天", "坤为地", "震为雷", "巽为风", "坎为水", "离为火", "艮为山", "兑为泽"] as const;
  const hours = [
    "子时 (23:00-01:00)",
    "寅时 (03:00-05:00)",
    "辰时 (07:00-09:00)",
    "午时 (11:00-13:00)",
    "申时 (15:00-17:00)",
    "戌时 (19:00-21:00)"
  ] as const;
  const zodiacs = ["属鼠", "属牛", "属虎", "属兔", "属龙", "属蛇", "属马", "属羊", "属猴", "属鸡", "属狗", "属猪"] as const;

  const baguaMeanings: Record<string, string> = {
    "乾为天": "刚健中正",
    "坤为地": "厚德载物",
    "震为雷": "临危不乱",
    "巽为风": "顺雷震天",
    "坎为水": "行险守信",
    "离为火": "明照四方",
    "艮为山": "动静得时",
    "兑为泽": "刚内柔外"
  };

  const element = elements[hash % elements.length];
  const bagua = baguas[(hash + 1) % baguas.length];
  const favorableHour = hours[(hash + 2) % hours.length];
  const clashZodiac = zodiacs[(hash + 3) % zodiacs.length];
  const upsetChance = parseFloat((5 + (hash % 41)).toFixed(1));
  const drift = (hash % 15) - 7;
  const metaphysicsWinRate = parseFloat(Math.min(99, Math.max(1, baseMetaWinRate + drift)).toFixed(1));

  return {
    element,
    bagua: `${bagua} (${baguaMeanings[bagua]})`,
    favorableHour,
    clashZodiac,
    upsetChance,
    metaphysicsWinRate
  };
};

const getPlayerStats = (player: Player, dateStr: string) => {
  const hash = getDeterministicHash(`${player.name}-${dateStr}`);
  const condition = 85 + (hash % 15); 
  const tacticalFit = 78 + ((hash >> 2) % 20); 
  
  let speed = "Standard";
  if (player.value >= 30000000) {
    speed = "Premium";
  } else if (player.value >= 10000000) {
    speed = "Optimal";
  } else {
    speed = (hash % 3 === 0) ? "Optimal" : "Standard";
  }

  return {
    condition,
    tacticalFit,
    speed
  };
};

// ==========================================
// 3. 初始球队大名单及 A 组
// ==========================================

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
      { id: "usa-3", name: "泰勒·亚当斯", number: 4, position: "MF", age: 27, club: "防守硬汉", fortune: "平", isCaptain: false, value: 25000000 },
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
      { id: "usa-15", name: "迈尔斯·罗宾逊", number: 12, position: "DF", age: 29, club: "新英格兰", fortune: "平", isCaptain: false, value: 5000000 },
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
      bookmaker: "全球风控精算大盘A",
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
      { id: "mex-13", name: "赫苏斯·加利亚多", number: 23, position: "DF", age: 31, club: "蒙特雷", fortune: "平", isCaptain: false, value: 3000000 }
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
      bookmaker: "全球风控精算大盘A",
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
      { label: "阵阵地攻坚", value: 65 }
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
      { id: "can-3", name: "斯蒂芬·欧斯塔基奥", number: 7, position: "MF", age: 29, club: "波尔图", fortune: "大吉", isCaptain: false, value: 15000000 }
    ],
    recentForm: [
      { id: "can-r1", opponent: "巴拿马", opponentFlag: "🇵🇦", result: "W", score: "2-1", isHome: true },
      { id: "can-r2", opponent: "美国", opponentFlag: "🇺🇸", result: "D", score: "1-1", isHome: false }
    ],
    injuries: [],
    odds: {
      bookmaker: "全球风控精算大盘A",
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
      { id: "uru-3", name: "罗纳德·阿劳霍", number: 4, position: "DF", age: 27, club: "巴塞罗那", fortune: "中吉", isCaptain: false, value: 70000000 }
    ],
    recentForm: [
      { id: "uru-r1", opponent: "哥伦比亚", opponentFlag: "🇨🇴", result: "W", score: "3-2", isHome: true },
      { id: "uru-r2", opponent: "巴西", opponentFlag: "🇧🇷", result: "D", score: "1-1", isHome: false }
    ],
    injuries: [
      { name: "罗纳德·阿劳霍", position: "DF", reason: "肌肉拉伤恢复中", severity: "轻微" }
    ],
    odds: {
      bookmaker: "全球风控精算大盘A",
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

const otherGroupConfigs = [
  { name: "B", teams: ["英格兰", "克罗地亚", "尼日利亚", "韩国"], flags: ["🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇭🇷", "🇳🇬", "🇰🇷"], codes: ["ENG", "CRO", "NGA", "KOR"] },
  { name: "C", teams: ["阿根廷", "瑞典", "沙特阿拉伯", "喀麦隆"], flags: ["🇦🇷", "🇸🇪", "🇸🇦", "🇨🇲"], codes: ["ARG", "SWE", "KSA", "CMR"] },
  { name: "D", teams: ["法国", "丹麦", "澳大利亚", "突尼斯"], flags: ["🇫🇷", "🇩🇰", "🇦🇺", "🇹🇳"], codes: ["FRA", "DEN", "AUS", "TUN"] },
  { name: "E", teams: ["西班牙", "日本", "哥斯达黎加", "阿尔及利亚"], flags: ["🇪🇸", "🇯🇵", "🇨🇷", "🇩🇿"], codes: ["ESP", "JPN", "CRC", "ALG"] },
  { name: "F", teams: ["比利时", "摩洛哥", "新西兰", "科特迪瓦"], flags: ["🇧🇪", "🇲🇦", "🇳🇿", "🇨🇮"], codes: ["BEL", "MAR", "NZL", "CIV"] },
  { name: "G", teams: ["巴西", "瑞士", "塞尔维亚", "加纳"], flags: ["🇧🇷", "🇨🇭", "🇷🇸", "🇬🇭"], codes: ["BRA", "SUI", "SRB", "GHA"] },
  { name: "H", teams: ["葡萄牙", "玻利维亚", "马里", "巴拉圭"], flags: ["🇵🇹", "🇧🇴", "🇲🇱", "🇵🇾"], codes: ["POR", "BOL", "MLI", "PAR"] },
  { name: "I", teams: ["荷兰", "厄瓜多尔", "塞内加尔", "卡塔尔"], flags: ["🇳🇱", "🇪🇨", "🇸🇳", "🇶🇦"], codes: ["NED", "ECU", "SEN", "QAT"] },
  { name: "J", teams: ["意大利", "波兰", "伊朗", "巴拿马"], flags: ["🇮🇹", "🇵🇱", "🇮🇷", "🇵🇦"], codes: ["ITA", "POL", "IRN", "PAN"] },
  { name: "K", teams: ["德国", "智利", "伊拉克", "牙买加"], flags: ["🇩🇪", "🇨🇱", "🇮🇶", "🇯🇲"], codes: ["GER", "CHI", "IRQ", "JAM"] },
  { name: "L", teams: ["哥伦比亚", "秘鲁", "阿联酋", "埃及"], flags: ["🇨🇴", "🇵🇪", "🇦🇪", "🇪🇬"], codes: ["COL", "PER", "UAE", "EGY"] }
];

const generatePlayerName = (country: string, num: number): string => {
  const englishFirst = ["杰克", "哈里", "托马斯", "乔治", "詹姆斯", "威廉", "奥利弗", "查理", "阿尔菲", "约书亚", "丹尼尔", "路易斯", "麦克斯"];
  const englishLast = ["史密斯", "琼斯", "威廉姆斯", "布朗", "泰勒", "戴维斯", "威尔逊", "埃文斯", "托马斯", "约翰逊", "罗伯茨", "沃克"];
  const spanishFirst = ["卢卡斯", "马特奥", "马蒂亚斯", "圣地亚哥", "迭戈", "哈维尔", "安德烈斯", "亚历杭德罗", "卡洛斯", "曼努埃尔", "胡安"];
  const spanishLast = ["罗德里格斯", "冈萨雷斯", "戈麦斯", "费尔南德斯", "洛佩斯", "迪亚斯", "马丁内斯", "佩雷斯", "桑切斯", "罗梅罗"];
  const portugueseFirst = ["若昂", "加布里埃尔", "卢卡斯", "佩德罗", "马特乌斯", "古斯塔沃", "拉斐尔", "布鲁诺", "蒂亚戈", "迪奥戈"];
  const portugueseLast = ["席尔瓦", "桑托斯", "奥利维拉", "索萨", "佩雷拉", "科斯塔", "罗德里格斯", "阿尔梅达", "纳西门托", "卡瓦略"];
  const frenchFirst = ["皮埃尔", "雨果", "马蒂斯", "莱奥", "克莱芒", "安托万", "马克西姆", "阿瑟", "保罗", "托马斯"];
  const frenchLast = ["杜波依斯", "洛朗", "马丁", "西蒙", "米歇尔", "勒费弗尔", "勒鲁", "贝特朗", "加尼叶", "弗朗索瓦"];
  const arabFirst = ["阿卜杜拉", "艾哈迈德", "穆罕默德", "阿里", "哈桑", "侯赛因", "奥马尔", "哈立德", "优素福", "费萨尔"];
  const arabLast = ["哈尔比", "多萨里", "加姆迪", "奥泰比", "沙姆里", "卡塔尼", "谢赫里", "萨利赫", "马哈茂德"];
  const japaneseFirst = ["拓海", "大翔", "翔太", "悠斗", "陆", "莲", "飒太", "春希", "凑", "健太", "翼", "阳太"];
  const japaneseLast = ["佐藤", "铃木", "高桥", "田中", "渡边", "伊藤", "山本", "中村", "小林", "加藤", "吉田", "清水"];
  const koreanFirst = ["敏俊", "书俊", "睿俊", "宇彬", "道允", "贤宇", "俊熙", "志勋", "建宇", "宇贤", "东贤"];
  const koreanLast = ["金", "李", "朴", "崔", "郑", "姜", "赵", "尹", "张", "林", "韩", "吴"];

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
  } else if (country === "日本" || country === "韩国") {
    firsts = country === "日本" ? japaneseFirst : koreanFirst;
    lasts = country === "日本" ? japaneseLast : koreanLast;
    const f = firsts[(num * 3 + 7) % firsts.length];
    const l = lasts[(num * 7 + 13) % lasts.length];
    return `${l}${f}`;
  }

  const f = firsts[(num * 3 + 7) % firsts.length];
  const l = lasts[(num * 7 + 13) % lasts.length];
  return `${f}·${l}`;
};

const formatValueEuro = (value: number): string => {
  if (value >= 100000000) return `${(value / 100000000).toFixed(1).replace(/\.0$/, "")}亿€`;
  if (value >= 10000) return `${(value / 10000).toFixed(0)}万€`;
  return `${value}€`;
};

const getTacticalAnalysisFallback = (team: Team): string => {
  const mainTag = team.tacticalTags.reduce((prev, current) => (prev.value > current.value ? prev : current));
  const secondaryTag = team.tacticalTags.filter((t) => t.label !== mainTag.label).reduce((prev, current) => (prev.value > current.value ? prev : current), team.tacticalTags[0]);
  return `根据AI大数据复盘，${team.name}的核心战术是“${mainTag.label}”（量化指数:${mainTag.value}），并辅以“${secondaryTag.label}”（量化指数:${secondaryTag.value}）的结合对冲策略。该队在攻防两端具有较强的战术纪律性，但需防范在风控评级为[${team.dangerLevel}]时，因节奏失控而导致的流动性爆冷风险。`;
};

const getMetaphysicalAnalysisFallback = (team: Team): string => {
  return `该队今日命格属【${team.metaphysics.element}】，流年卦象显现为【${team.metaphysics.bagua}】。本场比赛宜赛吉时为【${team.metaphysics.favorableHour}】，但切记今日忌冲生肖【${team.metaphysics.clashZodiac}】的球员，首发名单应尽量规避。AI精算爆冷指数为 ${team.metaphysics.upsetChance}%，建议在化忌节点过后结合实时大盘对冲。`;
};

const generateInitialGroups = (): Group[] => {
  const dateStr = getTodayDateString();
  const allGroups: Group[] = [];

  const fixedGroupATeams = groupATeams.map((team) => {
    const fortuneText = getDeterministicFortune(team.name, dateStr);
    const meta = getDeterministicMetaphysics(team.name, dateStr, team.metaphysicsWinRate);
    const roster = team.roster.map((p) => ({
      ...p,
      fortune: getDeterministicFortune(p.name, dateStr)
    }));
    return {
      ...team,
      fortuneText,
      metaphysics: { ...team.metaphysics, ...meta },
      roster
    };
  });

  allGroups.push({
    id: "group-A",
    name: "A",
    teams: fixedGroupATeams
  });

  otherGroupConfigs.forEach((config) => {
    const teams: Team[] = config.teams.map((name, index) => {
      const code = config.codes[index];
      const flag = config.flags[index];
      const id = `${config.name.toLowerCase()}-${name}`;

      const dummyHash = getDeterministicHash(`${name}-base`);
      const aiRate = parseFloat((50 + (dummyHash % 40)).toFixed(1));
      const metaRate = parseFloat((50 + ((dummyHash >> 2) % 40)).toFixed(1));
      const danger = (["低风险", "中度警告", "极高风控"] as const)[dummyHash % 3];

      const fortune = getDeterministicFortune(name, dateStr);
      const meta = getDeterministicMetaphysics(name, dateStr, metaRate);

      const roster: Player[] = Array.from({ length: 26 }, (_, i) => {
        const num = i + 1;
        const pos = (["GK", "DF", "MF", "FW"] as const)[i % 4];
        const age = 20 + ((dummyHash + num) % 16);
        const playerName = generatePlayerName(name, num);
        let value = i < 3 
          ? Math.floor((15 + ((dummyHash * num) % 65)) * 1000000)
          : Math.floor((0.5 + ((dummyHash * num) % 14)) * 1000000);

        return {
          id: `${id}-player-${num}`,
          name: playerName,
          number: num,
          position: pos,
          age,
          club: clubList[(dummyHash + num) % clubList.length],
          fortune: getDeterministicFortune(playerName, dateStr),
          isCaptain: num === 10 || num === 1,
          value
        };
      });

      const opponentNames = ["巴西", "阿根廷", "法国", "英格兰", "西班牙", "德国", "克罗地亚", "荷兰", "比利时", "意大利"];
      const opponentFlags = ["🇧🇷", "🇦🇷", "🇫🇷", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇪🇸", "🇩🇪", "🇭🇷", "🇳🇱", "🇧🇪", "🇮🇹"];
      const results: ("W" | "D" | "L")[] = ["W", "D", "L"];
      const recentForm: RecentMatch[] = Array.from({ length: 5 }, (_, idx) => {
        const opIdx = (dummyHash + idx) % opponentNames.length;
        const res = results[(dummyHash * idx) % results.length];
        let score = "1-1";
        if (res === "W") score = `${2 + ((dummyHash + idx) % 3)}-${(dummyHash + idx) % 2}`;
        if (res === "L") score = `${(dummyHash + idx) % 2}-${2 + ((dummyHash + idx) % 3)}`;
        return {
          id: `${id}-r-${idx}`,
          opponent: opponentNames[opIdx],
          opponentFlag: opponentFlags[opIdx],
          result: res,
          score,
          isHome: (dummyHash + idx) % 2 === 0
        };
      });

      const injuryReasons = ["大腿拉伤", "红牌停赛", "脚踝扭伤", "膝盖积水", "感冒发热"];
      const injuries: Injury[] = [];
      if (dummyHash % 10 > 4) {
        const numInjuries = 1 + (dummyHash % 2);
        for (let i = 0; i < numInjuries; i++) {
          const pIdx = (dummyHash * i) % roster.length;
          injuries.push({
            name: roster[pIdx].name,
            position: roster[pIdx].position,
            reason: injuryReasons[(dummyHash + i) % injuryReasons.length],
            severity: (["轻微", "中度", "极高风险"] as const)[(dummyHash + i) % 3]
          });
        }
      }

      const odds: OddsData = {
        bookmaker: "全球风控精算大盘A",
        homeWin: parseFloat((1.3 + ((dummyHash % 25) / 10)).toFixed(2)),
        draw: parseFloat((3.0 + ((dummyHash % 15) / 10)).toFixed(2)),
        awayWin: parseFloat((2.5 + ((dummyHash % 40) / 10)).toFixed(2)),
        payout: parseFloat((93 + (dummyHash % 4)).toFixed(1))
      };

      return {
        id, name, code, flag,
        aiWinRate: aiRate,
        metaphysicsWinRate: meta.metaphysicsWinRate,
        fortuneText: fortune,
        dangerLevel: danger,
        coach: realCoaches[name] || `阿尔伯特·${name}斯基`,
        stadium: realStadiums[name] || `${name}国家体育场`,
        roster,
        tacticalTags: [
          { label: "防守硬度", value: 70 + (dummyHash % 30) },
          { label: "前压拦截", value: 65 + ((dummyHash >> 1) % 35) },
          { label: "中路反击", value: 60 + ((dummyHash >> 2) % 40) },
          { label: "定位球对冲", value: 75 + ((dummyHash >> 3) % 25) }
        ],
        metaphysics: meta,
        recentForm, injuries, odds,
        refereeInfo: {
          name: ["西蒙·马齐尼亚克", "马尔科·奥利弗", "克莱芒·图尔平", "安东尼·泰勒"][(dummyHash) % 4],
          cardsPerMatch: parseFloat((3.2 + ((dummyHash % 20) / 10)).toFixed(1)),
          strictness: (["低", "中", "高"] as const)[dummyHash % 3]
        },
        weatherForecast: {
          temp: `${15 + (dummyHash % 18)}°C`,
          humidity: `${50 + (dummyHash % 40)}%`,
          condition: ["晴朗", "多云", "阴天", "小雨", "大雨"][dummyHash % 5]
        }
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

export default function WorldCupHome() {
  const [groups, setGroups] = useState<Group[]>(() => generateInitialGroups());
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"roster" | "tactics" | "meta" | "fixtures">("roster");
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // 顶置 Match Center 列表与加载状态
  const [matchCenterFixtures, setMatchCenterFixtures] = useState<LiveFixture[]>([]);
  const [isMatchCenterLoading, setIsMatchCenterLoading] = useState<boolean>(false);

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

  const [liveFixtures, setLiveFixtures] = useState<LiveFixture[]>([]);
  const [liveLastUpdated, setLiveLastUpdated] = useState<Date | null>(null);
  const [liveLoading, setLiveLoading] = useState<boolean>(false);
  
  const [teamFixtures, setTeamFixtures] = useState<TeamFixture[]>([]);
  const [isTeamFixturesLoading, setIsTeamFixturesLoading] = useState<boolean>(false);
  const [teamFixturesError, setTeamFixturesError] = useState<string | null>(null);

  const [apiInjuries, setApiInjuries] = useState<any[]>([]);
  const [isInjuriesLoading, setIsInjuriesLoading] = useState<boolean>(false);
  
  const [liveOdds, setLiveOdds] = useState<{
    data_source: string;
    main_success_factor: number;
    draw_factor: number;
    away_success_factor: number;
    theoretical_payout: number;
  } | null>(null);
  const [isOddsLoading, setIsOddsLoading] = useState<boolean>(false);

  const [geminiTactics, setGeminiTactics] = useState<Record<string, string>>({});
  const [isGeminiTacticsLoading, setIsGeminiTacticsLoading] = useState<boolean>(false);
  const [geminiTacticsCooldown, setGeminiTacticsCooldown] = useState<number>(0);

  const [geminiMeta, setGeminiMeta] = useState<Record<string, string>>({});
  const [isGeminiMetaLoading, setIsGeminiMetaLoading] = useState<boolean>(false);
  const [geminiMetaCooldown, setGeminiMetaCooldown] = useState<number>(0);

  // 渠道防覆盖拦截
  useEffect(() => {
    if (typeof window !== "undefined") {
      const searchParams = new URLSearchParams(window.location.search);
      const ref = searchParams.get("ref");
      if (ref && ref.trim() !== "") {
        localStorage.setItem("affiliate_agent", ref.trim());
      }
    }
  }, []);

  const getRedirectUrl = (baseUrl: string) => {
    if (typeof window !== "undefined") {
      const agent = localStorage.getItem("affiliate_agent");
      if (agent) {
        const separator = baseUrl.includes("?") ? "&" : "?";
        return `${baseUrl}${separator}from=${encodeURIComponent(agent)}`;
      }
    }
    return baseUrl;
  };

  // Cooldown timers
  useEffect(() => {
    if (geminiTacticsCooldown > 0) {
      const timer = setTimeout(() => setGeminiTacticsCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [geminiTacticsCooldown]);

  useEffect(() => {
    if (geminiMetaCooldown > 0) {
      const timer = setTimeout(() => setGeminiMetaCooldown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [geminiMetaCooldown]);

  // 拉取顶部 Match Center 数据 (交战对决大盘)
  useEffect(() => {
    const fetchMatchCenter = async () => {
      setIsMatchCenterLoading(true);
      try {
        const res = await fetch("/api/football?type=fixtures");
        if (res.ok) {
          const data = await res.json();
          setMatchCenterFixtures(data.fixtures ?? []);
        }
      } catch (e) {
        console.warn("Failed to fetch match center:", e);
      } finally {
        setIsMatchCenterLoading(false);
      }
    };
    fetchMatchCenter();
  }, []);

  // 轮询比分
  useEffect(() => {
    const fetchLive = async () => {
      try {
        setLiveLoading(true);
        const res = await fetch("/api/football?type=live");
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

    fetchLive();
    const getInterval = () => (liveFixtures.length > 0 ? 60_000 : 300_000);
    let timerId = setInterval(fetchLive, getInterval());
    return () => clearInterval(timerId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveFixtures.length]);

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
      setTeamFixtures(data.fixtures ?? []);
      setTeamFixturesError(null);
    } catch (e: unknown) {
      setTeamFixturesError(e instanceof Error ? e.message : "请求失败");
    } finally {
      setIsTeamFixturesLoading(false);
    }
  };

  const fetchLiveOdds = async (teamId: string, teamName: string) => {
    setIsOddsLoading(true);
    setLiveOdds(null);
    try {
      const lf = getTeamLiveFixture(teamName);
      const fixtureId = lf?.fixtureId || (TEAM_API_ID_MAP[teamId] ? 100000 + TEAM_API_ID_MAP[teamId] : 99999);
      const res = await fetch(`/api/football?type=odds&fixtureId=${fixtureId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.odds) setLiveOdds(data.odds);
      }
    } catch (e) {
      console.warn("Failed to fetch odds:", e);
    } finally {
      setIsOddsLoading(false);
    }
  };

  const fetchLiveInjuries = async (teamId: string, teamName: string) => {
    setIsInjuriesLoading(true);
    setApiInjuries([]);
    try {
      const apiId = TEAM_API_ID_MAP[teamId];
      let query = "";
      if (apiId) {
        query = `teamId=${apiId}`;
      } else {
        const lf = getTeamLiveFixture(teamName);
        if (lf) query = `fixtureId=${lf.fixtureId}`;
      }
      
      if (query) {
        const res = await fetch(`/api/football?type=injuries&${query}`);
        if (res.ok) {
          const data = await res.json();
          if (data.injuries) {
            setApiInjuries(data.injuries);
            return;
          }
        }
      }
      
      const t = groups.flatMap(g => g.teams).find(item => item.id === teamId);
      if (t) {
        setApiInjuries(t.injuries.map(i => ({
          player: i.name,
          position: i.position === "GK" ? "门将" : i.position === "DF" ? "后卫" : i.position === "MF" ? "中场" : "前锋",
          reason: i.reason,
          severity: i.severity
        })));
      }
    } catch (e) {
      console.warn("Failed to fetch injuries:", e);
    } finally {
      setIsInjuriesLoading(false);
    }
  };

  const handleTriggerTacticsAi = async (team: Team) => {
    if (geminiTacticsCooldown > 0 || isGeminiTacticsLoading) return;
    setIsGeminiTacticsLoading(true);
    setGeminiTacticsCooldown(3); 
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "tactics", teamData: team })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.text) setGeminiTactics(prev => ({ ...prev, [team.id]: data.text }));
    } catch (e) {
      console.warn("Tactics Gemini AI failed:", e);
      setGeminiTactics(prev => ({ ...prev, [team.id]: "系统网络拥堵，未能成功激活实时对冲精算。已启用本地高频算力方案。" }));
    } finally {
      setIsGeminiTacticsLoading(false);
    }
  };

  const handleTriggerMetaAi = async (team: Team) => {
    if (geminiMetaCooldown > 0 || isGeminiMetaLoading) return;
    setIsGeminiMetaLoading(true);
    setGeminiMetaCooldown(3); 
    try {
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "metaphysics", teamData: team })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.text) setGeminiMeta(prev => ({ ...prev, [team.id]: data.text }));
    } catch (e) {
      console.warn("Metaphysics Gemini AI failed:", e);
      setGeminiMeta(prev => ({ ...prev, [team.id]: "流年流月相冲，天机盘受阻，已启用九星命格离线精算。" }));
    } finally {
      setIsGeminiMetaLoading(false);
    }
  };

  const getTeamLiveFixture = (teamName: string): LiveFixture | undefined =>
    liveFixtures.find(
      (f) =>
        f.homeTeam.toLowerCase().includes(teamName.toLowerCase()) ||
        f.awayTeam.toLowerCase().includes(teamName.toLowerCase())
    );

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

  const handleTeamClick = async (team: Team) => {
    setSelectedTeam(team);
    setActiveDrawerTab("roster");
    setExpandedPlayerId(null); 
    setIsDrawerOpen(true);
    
    fetchTeamFixtures(team.id);
    fetchLiveOdds(team.id, team.name);
    fetchLiveInjuries(team.id, team.name);

    if (predictions[team.id]) return;

    setIsPredictLoading(true);
    try {
      const response = await fetch("/api/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ team }),
      });

      if (!response.ok) throw new Error("Failed to fetch prediction");
      const data = await response.json();
      if (data.error) throw new Error(data.message || "API error");

      setPredictions((prev) => ({ ...prev, [team.id]: data }));
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
      console.warn("Prediction API failed:", err);
    } finally {
      setIsPredictLoading(false);
    }
  };

  // 根据 Match Center 里的名称寻找本地队伍并滑出 Drawer
  const handleMatchCenterClick = (teamName: string) => {
    const foundTeam = groups.flatMap(g => g.teams).find(
      t => t.name.toLowerCase().includes(teamName.toLowerCase()) || teamName.toLowerCase().includes(t.name.toLowerCase())
    );
    if (foundTeam) {
      handleTeamClick(foundTeam);
      setActiveDrawerTab("tactics"); // 默认高亮 Tactics 盘口 Tab
    }
  };

  const isAdminPanelOpenState = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = isAdminPanelOpenState;
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [editAiWinRate, setEditAiWinRate] = useState<number>(50);
  const [editMetaWinRate, setEditMetaWinRate] = useState<number>(50);
  const [editFortune, setEditFortune] = useState<"大吉" | "中吉" | "平" | "凶">("平");
  const [editDangerLevel, setEditDangerLevel] = useState<"低风险" | "中度警告" | "极高风控">("低风险");
  const [editCoach, setEditCoach] = useState<string>("");
  const [editUpsetChance, setEditUpsetChance] = useState<number>(10);

  const [adminPinInput, setAdminPinInput] = useState<string>("");
  const [adminPinVerified, setAdminPinVerified] = useState<boolean>(false);
  const [adminPinError, setAdminPinError] = useState<boolean>(false);

  const handleSaveAdminData = () => {
    if (!editingTeam) return;
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
          if (selectedTeam && selectedTeam.id === t.id) setSelectedTeam(updated);
          return updated;
        }
        return t;
      });
      return { ...g, teams: updatedTeams };
    });
    setGroups(updatedGroups);
    closeAdminPanel();
  };

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

  const closeAdminPanel = () => {
    setIsAdminPanelOpen(false);
    setEditingTeam(null);
    setAdminPinVerified(false);
    setAdminPinInput("");
    setAdminPinError(false);
  };

  const getFortuneBadgeColor = (fortune: string) => {
    switch (fortune) {
      case "大吉": return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30";
      case "中吉": return "bg-teal-500/10 text-teal-400 border border-teal-500/20";
      case "平": return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
      case "凶": return "bg-red-500/10 text-red-400 border border-red-500/30";
      default: return "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20";
    }
  };

  const getDangerLevelColor = (level: string) => {
    switch (level) {
      case "极高风控": return "text-[#FF3333] bg-[#FF3333]/10 border border-[#FF3333]/20";
      case "中度警告": return "text-amber-400 bg-amber-500/10 border border-amber-500/20";
      case "低风险":
      default: return "text-[#00FF66] bg-[#00FF66]/10 border border-[#00FF66]/20";
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
          <div className="flex gap-12 whitespace-nowrap animate-[ticker-scroll_35s_linear_infinite]">
            <span>📈 [AI WIN INDEX] URU: 74.3% (+2.4%) | BRA: 81.2% | ARG: 79.5% | FRA: 78.9%</span>
            <span className="text-[#FF3333]">⚠️ [玄学反煞警告] 今日忌辰：属虎、属猴冲煞极强，防机构强力对冲波动</span>
            <span>⚽ [MATCHDAY] 2026 美加墨世界杯：48支铁骑会师北美，全球风控对冲系统实时接入</span>
            <span className="text-[#00FF66]">⚡ [流时化忌] 乾坤乾震，兑卦出格，首战警惕机构对冲数据翻盘风险</span>
          </div>
        </div>
      </div>

      {/* ── 📡 黄金 C 位：量化即时对决大盘 / Match Center ── */}
      <div className="w-full max-w-7xl mx-auto px-4 md:px-6 mt-6">
        <div className="bg-[#13131A] border border-[#1E1E2E] rounded-xl p-5 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-3 opacity-5">
            <Radio className="w-32 h-32 text-[#00FF66]" />
          </div>
          
          <div className="flex items-center justify-between border-b border-[#1E1E2E] pb-3 mb-4">
            <div className="flex items-center gap-2">
              <Radio className="w-4 h-4 text-[#FF3333] animate-pulse" />
              <h2 className="text-sm font-bold tracking-wider font-mono text-white">
                📊 [ 2026 世界杯 · 量化即时对决大盘 / MATCH CENTER ]
              </h2>
            </div>
            <span className="text-[10px] text-[#00FF66] font-mono animate-pulse">● API数据源实时通电</span>
          </div>

          {isMatchCenterLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-[#1C1C26] border border-[#252535] rounded-lg animate-pulse" />
              ))}
            </div>
          ) : matchCenterFixtures.length === 0 ? (
            <div className="text-center py-6 text-xs text-[#888899] font-mono">
              暂无 3 天内开打的世界杯交战赛程数据
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {matchCenterFixtures.map((f) => {
                const isLive = ["1H", "2H", "HT", "ET", "P", "PEN", "BT"].includes(f.statusShort);
                const startTime = new Date(f.date).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });
                const startDate = new Date(f.date).toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
                
                return (
                  <div
                    key={f.fixtureId}
                    onClick={() => handleMatchCenterClick(f.homeTeam)}
                    className="p-3 bg-[#1C1C26] border border-[#252535] hover:border-[#00FF66] cursor-pointer rounded-lg transition-all duration-300 flex flex-col justify-between"
                  >
                    <div className="flex justify-between items-center text-[10px] text-[#888899] font-mono mb-2">
                      <span>{startDate} {startTime}</span>
                      <span className={`px-1.5 py-0.5 rounded font-black border ${
                        isLive 
                          ? "text-[#FF3333] bg-[#FF3333]/10 border-[#FF3333]/30 animate-pulse" 
                          : "text-zinc-400 bg-[#13131A] border-[#252535]"
                      }`}>
                        {isLive ? `🔴 LIVE ${f.minute}'` : "⏳初盘未开赛"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between font-mono">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <span className="text-lg">{f.homeFlag}</span>
                        <span className="text-xs text-white font-bold truncate">{f.homeTeam}</span>
                      </div>
                      <div className="flex items-center gap-2 px-3 shrink-0">
                        <span className="text-sm font-black text-[#00FF66]">{f.homeScore ?? "-"}</span>
                        <span className="text-[#888899] text-xs">:</span>
                        <span className="text-sm font-black text-[#FF3333]">{f.awayScore ?? "-"}</span>
                      </div>
                      <div className="flex items-center gap-1.5 min-w-0 flex-1 justify-end">
                        <span className="text-xs text-white font-bold truncate">{f.awayTeam}</span>
                        <span className="text-lg">{f.awayFlag}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ── 顶部通栏：全局风控大盘 ── */}
      <header className="p-4 md:p-6 max-w-7xl mx-auto w-full relative z-10">
        <div className="bg-[#13131A] border border-[#1E1E2E] rounded-xl p-5 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{
            backgroundImage: "radial-gradient(#00FF66 1px, transparent 1px)",
            backgroundSize: "20px 20px"
          }} />

          <div className="flex items-center gap-4 relative z-10">
            <div className="w-12 h-12 rounded-lg bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center text-[#00FF66] shrink-0">
              <Cpu className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg md:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  2026 美加墨世界杯 <span className="text-xs bg-[#00FF66]/20 text-[#00FF66] px-2 py-0.5 rounded border border-[#00FF66]/30">AI+玄学量化对冲精算大盘</span>
                </h1>
              </div>
              <p className="text-xs md:text-sm text-[#888899] mt-1 font-mono">
                今日 AI 平均胜率精算: <span className="text-[#00FF66] font-bold">{avgAiWinRate}%</span> | 玄学大吉运势占比: <span className="text-[#00FF66] font-bold">{dajiRatio}%</span> | 爆冷预警指数: <span className="text-[#FF3333] font-bold">{avgUpsetChance}%</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 relative z-10 self-start md:self-auto">
            <button
              onClick={() => setIsAdminPanelOpen(true)}
              className="px-4 py-2.5 rounded-lg bg-[#1E1E2E] border border-[#2A2A3E] text-xs font-medium text-white hover:bg-[#2A2A3E] transition-all flex items-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-zinc-400" />
              <span>数据修改终端</span>
            </button>
            <a
              href={getRedirectUrl(REDIRECT_URL)}
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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {groups.map((group) => (
            <div
              key={group.id}
              className="bg-[#13131A] border border-[#1E1E2E] rounded-xl overflow-hidden hover:border-[#00FF66] transition-all duration-300 shadow-xl group/card flex flex-col justify-between"
            >
              <div className="p-3.5 border-b border-[#1E1E2E] bg-[#171722] flex justify-between items-center">
                <span className="font-mono text-xs text-[#888899]">GROUP</span>
                <span className="text-lg font-black text-white group-hover/card:text-[#00FF66] transition-colors">
                  {group.name} 组
                </span>
              </div>

              <div className="p-3 space-y-2.5 flex-grow">
                {group.teams.map((team) => (
                  <div
                    key={team.id}
                    onClick={() => handleTeamClick(team)}
                    className="p-2.5 bg-[#1C1C26] rounded-lg border border-[#252535] hover:bg-[#252535] hover:border-[#00FF66]/40 cursor-pointer transition-all duration-200 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl shrink-0">{team.flag}</span>
                      <div className="min-w-0">
                        <div className="font-semibold text-xs text-white flex items-center gap-1.5 flex-wrap">
                          <span className="truncate max-w-[80px]">{team.name}</span>
                          <span className="text-[9px] text-[#888899] font-mono shrink-0">
                            {team.code}
                          </span>
                          {/* 🔴 LIVE 实时角标 */}
                          {(() => {
                            const lf = getTeamLiveFixture(team.name);
                            const isLive = lf && ["1H","2H","HT","ET","P","PEN","BT"].includes(lf.statusShort);
                            if (!isLive || !lf) return null;
                            return (
                              <span className="inline-flex items-center gap-0.5 text-[8px] font-black font-mono px-1 py-0.2 bg-[#FF3333]/15 text-[#FF3333] rounded border border-[#FF3333]/30 animate-pulse">
                                🔴 LIVE{lf.minute ? ` ${lf.minute}'` : ""}
                              </span>
                            );
                          })()}
                        </div>
                        <div className="text-[9px] text-[#888899] mt-0.5 font-mono flex items-center gap-1.5">
                          <span>AI:<span className="text-[#00FF66] font-bold">{team.aiWinRate}%</span></span>
                          <span>玄学:<span className="text-[#00FF66] font-bold">{team.metaphysicsWinRate}%</span></span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1 font-mono shrink-0">
                      <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold scale-90 origin-right ${getFortuneBadgeColor(team.fortuneText)}`}>
                        {team.fortuneText}
                      </span>
                      <span className={`text-[8px] px-1 rounded scale-75 origin-right ${getDangerLevelColor(team.dangerLevel)}`}>
                        {team.dangerLevel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="px-3.5 py-1.5 bg-[#171722] border-t border-[#1E1E2E] text-[9px] text-[#888899] font-mono flex justify-between">
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsDrawerOpen(false)} />

          <div className="relative w-full max-w-md md:max-w-lg h-full bg-[#13131A] border-l border-[#1E1E2E] shadow-2xl flex flex-col z-10 animate-[slide-in-right_0.3s_ease-out]">
            
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
              <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 rounded-lg bg-[#252535] hover:bg-[#32324A] text-[#888899] hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex bg-[#171722] border-b border-[#1E1E2E] text-xs font-mono">
              <button
                onClick={() => { setActiveDrawerTab("roster"); setExpandedPlayerId(null); }}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all flex items-center justify-center gap-1 ${
                  activeDrawerTab === "roster" ? "border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5" : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                <Users className="w-3.5 h-3.5" />
                大名单
              </button>
              <button
                onClick={() => setActiveDrawerTab("tactics")}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all flex items-center justify-center gap-1 ${
                  activeDrawerTab === "tactics" ? "border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5" : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                对冲大盘
              </button>
              <button
                onClick={() => setActiveDrawerTab("meta")}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all flex items-center justify-center gap-1 ${
                  activeDrawerTab === "meta" ? "border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5" : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                八卦命格
              </button>
              <button
                onClick={() => setActiveDrawerTab("fixtures")}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all flex items-center justify-center gap-1 ${
                  activeDrawerTab === "fixtures" ? "border-[#FF3333] text-[#FF3333] bg-[#FF3333]/5" : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                <Radio className="w-3 h-3" />
                赛事
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* TAB 1: 26人大名单 + 折叠面板 (Bug 2 修复) */}
              {activeDrawerTab === "roster" && (
                <div className="space-y-4">
                  {isInjuriesLoading ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-2 relative overflow-hidden animate-pulse">
                      <div className="flex items-center gap-1.5 text-xs text-[#FF3333] font-bold">
                        <AlertTriangle className="w-4 h-4" />
                        <span>正在接入即时对冲伤退警报...</span>
                      </div>
                    </div>
                  ) : apiInjuries && apiInjuries.length > 0 ? (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 space-y-2 relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-1 opacity-10">
                        <AlertTriangle className="w-16 h-16 text-red-500" />
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-[#FF3333] font-bold">
                        <AlertTriangle className="w-4 h-4 animate-pulse" />
                        <span>⚠️ 机构主力伤病停赛警报</span>
                      </div>
                      <div className="space-y-1">
                        {apiInjuries.map((injury, idx) => (
                          <div key={idx} className="flex justify-between items-center text-[11px] font-mono">
                            <span className="text-white/90">{injury.player} ({injury.position})</span>
                            <div className="flex gap-2 items-center">
                              <span className="text-[#888899]">{injury.reason}</span>
                              <span className={`px-1 rounded text-[9px] ${
                                injury.severity.includes("重") || injury.severity.includes("极高") ? "bg-red-500/20 text-red-400 border border-red-500/20" : "bg-zinc-500/20 text-zinc-400 border border-zinc-500/20"
                              }`}>
                                {injury.severity}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  <div className="flex justify-between items-center text-xs text-[#888899] pb-2 border-b border-[#1E1E2E]">
                    <span>核心主将 (点击查看二级量化精算)</span>
                    <span>身价 (欧元)</span>
                  </div>
                  
                  <div className="space-y-2">
                    {selectedTeam.roster.map((player) => {
                      const isExpanded = expandedPlayerId === player.id;
                      return (
                        <div key={player.id} className="p-3 bg-[#1C1C26] rounded-lg border border-[#252535] hover:border-[#00FF66]/20 transition-all flex flex-col">
                          <div onClick={() => setExpandedPlayerId(isExpanded ? null : player.id)} className="flex items-center justify-between cursor-pointer">
                            <div className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-full bg-[#13131A] flex items-center justify-center text-xs font-mono font-bold text-[#888899] shrink-0">
                                {player.number}
                              </span>
                              <div>
                                <div className="text-sm font-semibold flex items-center gap-1.5 flex-wrap">
                                  <span>{player.name}</span>
                                  {player.isCaptain && <span className="text-[9px] bg-amber-500/20 text-amber-400 px-1 py-0.2 rounded border border-amber-500/20">C</span>}
                                  <span className="text-[10px] text-[#888899] bg-[#13131A] px-1 py-0.2 rounded font-mono">{player.position}</span>
                                </div>
                                <div className="text-[11px] text-[#888899] mt-0.5">{player.age}岁 · {player.club}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 font-mono shrink-0">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${getFortuneBadgeColor(player.fortune)}`}>🔮运势:{player.fortune}</span>
                              <span className="text-xs text-white/90 mr-1">{formatValueEuro(player.value)}</span>
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-zinc-400" /> : <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />}
                            </div>
                          </div>

                          {isExpanded && (() => {
                            const stats = getPlayerStats(player, getTodayDateString());
                            return (
                              <div className="mt-2.5 p-3 bg-[#0D0D11] border border-[#00FF66]/20 rounded-md font-mono text-[10px] space-y-1.5">
                                <div className="flex justify-between items-center text-[#888899]">
                                  <span>📊 赛前数据状态</span>
                                  <span className="text-[#00FF66] font-bold">[{stats.condition}%]</span>
                                </div>
                                <div className="flex justify-between items-center text-[#888899]">
                                  <span>🎯 核心战术执行力</span>
                                  <span className="text-[#00FF66] font-bold">[{stats.tacticalFit}%]</span>
                                </div>
                                <div className="flex justify-between items-center text-[#888899]">
                                  <span>⚡️ 场上流动性速率</span>
                                  <span className="text-amber-400 font-bold">[{stats.speed}]</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: 战术数据与「机构量化风险对冲概率指数」 */}
              {activeDrawerTab === "tactics" && (
                <div className="space-y-6">
                  {isOddsLoading ? (
                    <div className="bg-[#1C1C26] p-4 rounded-lg border border-[#252535] space-y-3 animate-pulse">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-[#00FF66]" />
                        <span>正在接入「机构量化风险对冲概率指数」...</span>
                      </h3>
                    </div>
                  ) : (
                    <div className="bg-[#1C1C26] p-4 rounded-lg border border-[#252535] space-y-3 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-[#00FF66]" />
                        <span>「即时指数对冲大盘」 ({liveOdds ? liveOdds.data_source : "全球风控精算大盘A"})</span>
                      </h3>
                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-2 bg-[#13131A] rounded border border-[#252535] font-mono">
                          <span className="text-[10px] text-[#888899] block mb-0.5">主场对冲成功系数</span>
                          <span className="text-sm font-black text-[#00FF66]">{liveOdds ? liveOdds.main_success_factor : selectedTeam.odds.homeWin}</span>
                        </div>
                        <div className="p-2 bg-[#13131A] rounded border border-[#252535] font-mono">
                          <span className="text-[10px] text-[#888899] block mb-0.5">平局避险系数</span>
                          <span className="text-sm font-black text-white">{liveOdds ? liveOdds.draw_factor : selectedTeam.odds.draw}</span>
                        </div>
                        <div className="p-2 bg-[#13131A] rounded border border-[#252535] font-mono">
                          <span className="text-[10px] text-[#888899] block mb-0.5">客场对冲成功系数</span>
                          <span className="text-sm font-black text-[#FF3333]">{liveOdds ? liveOdds.away_success_factor : selectedTeam.odds.awayWin}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-[#888899] font-mono mt-2 pt-2 border-t border-[#1E1E2E]">
                        <span>理论精算返还率: <span className="text-[#00FF66]">{liveOdds ? liveOdds.theoretical_payout : selectedTeam.odds.payout}%</span></span>
                        <span>风控大盘评级: <span className="text-white">{selectedTeam.dangerLevel}</span></span>
                      </div>
                    </div>
                  )}

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
                            <div className="bg-gradient-to-r from-teal-500 to-[#00FF66] h-full rounded-full transition-all duration-1000" style={{ width: `${tag.value}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-[#1C1C26] p-4 rounded-lg border border-[#252535] space-y-3 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="flex justify-between items-center relative z-10">
                      <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-[#00FF66]" />
                        <span>🤖 AI风控对冲头寸配置策略</span>
                      </h3>
                      {geminiTactics[selectedTeam.id] && (
                        <span className="text-[9px] bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 px-1.5 py-0.5 rounded font-mono">实时精算版</span>
                      )}
                    </div>

                    {isPredictLoading || isGeminiTacticsLoading ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-3 bg-[#13131A] rounded w-full" />
                        <div className="h-3 bg-[#13131A] rounded w-5/6" />
                      </div>
                    ) : (
                      <p className="text-xs text-[#888899] leading-relaxed font-mono">
                        {geminiTactics[selectedTeam.id] || predictions[selectedTeam.id]?.tacticalAnalysis || getTacticalAnalysisFallback(selectedTeam)}
                      </p>
                    )}

                    {!isPredictLoading && !isGeminiTacticsLoading && (
                      <button
                        onClick={() => handleTriggerTacticsAi(selectedTeam)}
                        disabled={geminiTacticsCooldown > 0}
                        className={`w-full mt-2 py-2 px-3 border text-xs font-mono rounded transition-all flex items-center justify-center gap-1.5 ${
                          geminiTacticsCooldown > 0
                            ? "bg-zinc-800/20 border-zinc-700/30 text-[#888899] cursor-not-allowed opacity-60"
                            : "bg-[#00FF66]/10 border-[#00FF66]/30 text-[#00FF66] hover:bg-[#00FF66]/20 active:scale-[0.98]"
                        }`}
                      >
                        <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" />
                        <span>{geminiTacticsCooldown > 0 ? `风控大盘降温中 (${geminiTacticsCooldown}s)` : "🔄 激活量化精算分析"}</span>
                      </button>
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
                        <span className="text-base font-bold text-[#00FF66]">{selectedTeam.metaphysics.element}命格</span>
                      </div>
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535]">
                        <span className="text-[#888899] block mb-1">今日流年卦象</span>
                        <span className="text-base font-bold text-[#00FF66]">{selectedTeam.metaphysics.bagua}</span>
                      </div>
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535]">
                        <span className="text-[#888899] block mb-1">宜赛吉利时辰</span>
                        <span className="text-xs font-bold text-white">{selectedTeam.metaphysics.favorableHour}</span>
                      </div>
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535]">
                        <span className="text-[#888899] block mb-1">今日忌冲生肖</span>
                        <span className="text-xs font-bold text-[#FF3333]">{selectedTeam.metaphysics.clashZodiac}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#00FF66]/5 p-4 rounded-lg border border-[#00FF66]/20 space-y-2 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-transparent pointer-events-none" />
                    <div className="flex justify-between items-center relative z-10">
                      <div className="flex items-center gap-1.5 text-xs text-[#00FF66] font-bold">
                        <Compass className="w-4 h-4 animate-[spin_6s_linear_infinite]" />
                        <span>🔮 AI 玄学星盘点评</span>
                      </div>
                      {geminiMeta[selectedTeam.id] && (
                        <span className="text-[9px] bg-[#00FF66]/15 text-[#00FF66] border border-[#00FF66]/30 px-1.5 py-0.5 rounded font-mono">流时天机版</span>
                      )}
                    </div>
                    
                    {isPredictLoading || isGeminiMetaLoading ? (
                      <div className="space-y-2 animate-pulse">
                        <div className="h-3 bg-[#13131A] rounded w-full" />
                        <div className="h-3 bg-[#13131A] rounded w-4/5" />
                      </div>
                    ) : (
                      <p className="text-xs text-[#888899] leading-relaxed font-mono">
                        {geminiMeta[selectedTeam.id] || predictions[selectedTeam.id]?.metaphysicalAnalysis || getMetaphysicalAnalysisFallback(selectedTeam)}
                      </p>
                    )}

                    {!isPredictLoading && !isGeminiMetaLoading && (
                      <button
                        onClick={() => handleTriggerMetaAi(selectedTeam)}
                        disabled={geminiMetaCooldown > 0}
                        className={`w-full mt-2 py-2 px-3 border text-xs font-mono rounded transition-all flex items-center justify-center gap-1.5 ${
                          geminiMetaCooldown > 0
                            ? "bg-zinc-800/20 border-zinc-700/30 text-[#888899] cursor-not-allowed opacity-60"
                            : "bg-[#00FF66]/10 border-[#00FF66]/30 text-[#00FF66] hover:bg-[#00FF66]/20 active:scale-[0.98]"
                        }`}
                      >
                        <Compass className="w-3.5 h-3.5 animate-spin-slow" />
                        <span>{geminiMetaCooldown > 0 ? `天机大盘冷却中 (${geminiMetaCooldown}s)` : "🔮 观星占卜流时化忌"}</span>
                      </button>
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
                      <span>世界杯历史赛事（API-Football 实时）</span>
                    </div>
                  </div>

                  {isTeamFixturesLoading ? (
                    <div className="space-y-3">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="h-16 bg-[#1C1C26] border border-[#252535] rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : teamFixturesError ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 text-[#FF3333] rounded-lg text-xs font-mono">
                      ⚠️ {teamFixturesError}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {teamFixtures.map((f) => {
                        const matchDate = new Date(f.date);
                        const isFinished = f.statusShort === "FT" || f.statusShort === "AET" || f.statusShort === "PEN";
                        const isLive = ["1H", "2H", "HT", "ET", "P", "PEN", "BT"].includes(f.statusShort);
                        return (
                          <div key={f.fixtureId} className={`p-3 rounded-lg border font-mono text-xs ${isLive ? "bg-[#FF3333]/10 border-[#FF3333]/30" : "bg-[#1C1C26] border-[#252535]"}`}>
                            <div className="flex items-center justify-between mb-1.5">
                              <span className="text-[#888899] text-[10px]">{matchDate.toLocaleDateString("zh-CN", { month: "short", day: "numeric" })}</span>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${isLive ? "text-[#FF3333] bg-[#FF3333]/10 border-[#FF3333]/30 animate-pulse" : isFinished ? "text-[#888899] bg-[#13131A] border-[#252535]" : "text-amber-400 bg-amber-500/10 border-amber-500/20"}`}>
                                {isLive ? `🔴 LIVE` : getStatusLabel(f.statusShort)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                <span>{f.homeFlag}</span>
                                <span className="text-white truncate">{f.homeTeam}</span>
                              </div>
                              <div className="flex items-center gap-2 px-3 shrink-0">
                                <span className={`text-base font-black ${isFinished || isLive ? "text-white" : "text-[#888899]"}`}>{f.homeScore ?? "-"}</span>
                                <span className="text-[#888899] text-xs">:</span>
                                <span className={`text-base font-black ${isFinished || isLive ? "text-white" : "text-[#888899]"}`}>{f.awayScore ?? "-"}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-1 min-w-0 justify-end">
                                <span className="text-white truncate">{f.awayTeam}</span>
                                <span>{f.awayFlag}</span>
                              </div>
                            </div>
                            {f.round && <div className="mt-1 text-[10px] text-[#888899] truncate">{f.round}</div>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-5 border-t border-[#1E1E2E] bg-[#171722] space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#888899]">🔮今日局势运势预测：</span>
                <span className="text-[#00FF66] font-bold">乾乾兑兑 · 大吉大利</span>
              </div>
              <a
                href={getRedirectUrl(REDIRECT_URL)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-[#00FF66] text-[#0D0D11] rounded-lg font-black text-xs md:text-sm text-center flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all animate-[breathe-glow_2s_infinite]"
              >
                <span>🔮 查看本场‘流时化忌’节点与机构诱盘对冲策略</span>
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
                <h2 className="text-lg font-bold">世界杯 AI + 玄学对冲数据更改终端</h2>
              </div>
              <button onClick={closeAdminPanel} className="p-1.5 rounded-lg bg-[#252535] hover:bg-[#32324A] text-[#888899] hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 md:p-6 overflow-y-auto max-h-[70vh]">
              {!adminPinVerified ? (
                <div className="py-10 flex flex-col items-center gap-6">
                  <div className="w-16 h-16 rounded-full bg-[#00FF66]/10 border border-[#00FF66]/30 flex items-center justify-center"><Lock className="w-8 h-8 text-[#00FF66]" /></div>
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
                        setAdminPinInput(e.target.value.replace(/\D/g, "").slice(0, 4));
                        setAdminPinError(false);
                      }}
                      onKeyDown={(e) => { if (e.key === "Enter" && adminPinInput.length === 4) handleVerifyPin(); }}
                      placeholder="••••"
                      className="text-center text-2xl tracking-[0.6em] w-44 bg-[#1C1C26] border border-[#252535] rounded-lg p-3 text-white focus:border-[#00FF66] outline-none font-mono"
                    />
                    {adminPinError && <p className="text-[#FF3333] text-xs font-mono animate-pulse">❌ 密码错误，请重新输入</p>}
                  </div>
                  <div className="flex gap-3">
                    <button onClick={closeAdminPanel} className="px-4 py-2 rounded text-xs text-[#888899] bg-[#1C1C26] hover:bg-[#252535] transition-colors">取消</button>
                    <button onClick={handleVerifyPin} disabled={adminPinInput.length !== 4} className="px-5 py-2 bg-[#00FF66] text-[#0D0D11] font-bold rounded text-xs flex items-center gap-1.5 disabled:opacity-40"><Lock className="w-4 h-4" />确认解锁</button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-xs text-[#888899] font-mono">STEP 1: 选择需要修改的国家队</label>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                      {groups.flatMap((g) => g.teams).map((team) => (
                        <button key={team.id} onClick={() => startEditing(team)} className={`p-2 text-xs rounded border truncate ${editingTeam?.id === team.id ? "border-[#00FF66] bg-[#00FF66]/10 text-white" : "border-[#252535] bg-[#1C1C26] text-[#888899]"}`}>
                          {team.flag} {team.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {editingTeam && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-[#1E1E2E] pt-4">
                      <div className="space-y-1.5">
                        <label className="text-xs text-[#888899]">AI 对冲胜率 (%)</label>
                        <input type="number" min="0" max="100" step="0.1" value={editAiWinRate} onChange={(e) => setEditAiWinRate(parseFloat(e.target.value) || 0)} className="w-full bg-[#1C1C26] border border-[#252535] rounded p-2 text-sm text-white" />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs text-[#888899]">玄学对冲胜率 (%)</label>
                        <input type="number" min="0" max="100" step="0.1" value={editMetaWinRate} onChange={(e) => setEditMetaWinRate(parseFloat(e.target.value) || 0)} className="w-full bg-[#1C1C26] border border-[#252535] rounded p-2 text-sm text-white" />
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {adminPinVerified && (
              <div className="p-5 border-t border-[#1E1E2E] bg-[#171722] flex justify-end gap-3">
                <button onClick={closeAdminPanel} className="px-4 py-2 rounded text-xs text-[#888899] bg-[#1C1C26] hover:bg-[#252535]">取消</button>
                <button onClick={handleSaveAdminData} disabled={!editingTeam} className="px-5 py-2 bg-[#00FF66] text-[#0D0D11] font-bold rounded text-xs flex items-center gap-1.5"><Save className="w-4 h-4" /><span>保存数据更改并实时广播</span></button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

const clubList = ["皇家马德里", "巴塞罗那", "曼城", "拜仁慕尼黑", "巴黎圣日耳曼", "阿森纳", "国际米兰", "AC米兰", "切尔西", "尤文图斯", "利物浦"];
const realCoaches: Record<string, string> = {
  "英格兰": "托马斯·图赫尔 (Thomas Tuchel)", "克罗地亚": "兹拉特科·达利奇 (Zlatko Dalić)", "尼日利亚": "布鲁诺·拉巴迪亚 (Bruno Labbadia)", "韩国": "洪明甫 (Hong Myung-bo)",
  "阿根廷": "莱昂内尔·斯卡洛尼 (Lionel Scaloni)", "瑞典": "容·达尔·托马森 (Jon Dahl Tomasson)", "沙特阿拉伯": "埃尔夫·勒纳尔 (Hervé Renard)", "喀麦隆": "马克·布里斯 (Marc Brys)",
  "法国": "迪迪埃·德尚 (Didier Deschamps)", "丹麦": "布莱恩·里默 (Brian Riemer)", "澳大利亚": "托尼·波波维奇 (Tony Popovic)", "突尼斯": "凯斯·雅库比 (Kais Yaâkoubi)",
  "西班牙": "路易斯·德拉富恩特 (Luis de la Fuente)", "日本": "森保一 (Hajime Moriyasu)", "哥斯达黎加": "克劳迪奥·维瓦斯 (Claudio Vivas)", "阿尔及利亚": "弗拉基米尔·佩特科维奇 (Vladimir Petković)",
  "比利时": "多梅尼科·特德斯科 (Domenico Tedesco)", "摩洛哥": "瓦利德·雷格拉吉 (Walid Regragui)", "新西兰": "达伦·巴泽利 (Darren Bazeley)", "科特迪瓦": "埃默斯·法埃 (Emerse Faé)",
  "巴西": "多里瓦尔·儒尼奥尔 (Dorival Júnior)", "瑞士": "穆拉特·雅金 (Murat Yakin)", "塞尔维亚": "德拉甘·斯托伊科维奇 (Dragan Stojković)", "加纳": "奥托·阿多 (Otto Addo)",
  "葡萄牙": "罗伯托·马丁内斯 (Roberto Martínez)", "玻利维亚": "奥斯卡·维列加斯 (Óscar Villegas)", "马里": "阿利乌·迪亚洛 (Aliou Diallo)", "巴拉圭": "古斯塔沃·阿尔法罗 (Gustavo Alfaro)",
  "荷兰": "罗纳德·科曼 (Ronald Koeman)", "厄瓜多尔": "塞巴斯蒂安·贝卡切切 (Sebastián Beccacece)", "塞内加尔": "佩普·蒂奥 (Pape Thiaw)", "卡塔尔": "廷廷·马克斯 (Tintín Márquez)",
  "意大利": "卢西亚诺·斯帕莱蒂 (Luciano Spalletti)", "波兰": "米哈乌·普罗比日 (Michał Probierz)", "伊朗": "阿米尔·加勒诺伊 (Amir Ghalenoei)", "巴拿马": "托马斯·克里斯蒂安森 (Thomas Christiansen)",
  "德国": "尤利安·纳格尔斯曼 (Julian Nagelsmann)", "智利": "里卡多·加雷卡 (Ricardo Gareca)", "伊拉克": "赫苏斯·卡萨斯 (Jesús Casas)", "牙买加": "史蒂夫·麦克拉伦 (Steve McClaren)",
  "哥伦比亚": "内斯托尔·洛伦佐 (Néstor Lorenzo)", "秘鲁": "豪尔赫·福萨蒂 (Jorge Fossati)", "阿联酋": "保罗·本托 (Paulo Bento)", "埃及": "霍萨姆·哈桑 (Hossam Hassan)"
};
const realStadiums: Record<string, string> = {
  "英格兰": "温布利球场", "克罗地亚": "马克西米尔球场", "尼日利亚": "阿布贾国家体育场", "韩国": "首尔世界杯体育场", "阿根廷": "纪念碑球场", "瑞典": "友谊竞技场",
  "沙特阿拉伯": "法赫国王国际体育场", "喀麦隆": " Olembe 体育场", "法国": "法兰西体育场", "丹麦": "公园球场", "澳大利亚": "雅高体育场", "突尼斯": "哈马迪·阿格尔比体育场",
  "西班牙": "伯纳乌球场", "日本": "东京国立竞技场", "哥斯达黎加": "国家体育场", "阿尔及利亚": "纳尔逊·曼德拉体育场", "比利时": "博杜安国王体育场", "摩洛哥": "阿德拉尔体育场",
  "新西兰": "天空体育场", "科特迪瓦": "阿拉萨内·瓦塔拉体育场", "巴西": "马拉卡纳体育场", "瑞士": "万克多夫球场", "塞尔维亚": "红星体育场", "加纳": "巴巴亚拉体育场",
  "葡萄牙": "光明球场", "玻利维亚": "埃尔南多·西莱斯体育场", "马里": "三月二十六日体育场", "巴拉圭": "大查科保卫者体育场", "荷兰": "阿姆斯特丹竞技场", "厄瓜多尔": "阿塔瓦尔帕体育场",
  "塞内加尔": "阿卜杜拉耶·瓦德体育场", "卡塔尔": "卢塞尔体育场", "意大利": "罗马奥林匹克体育场", "波兰": "国家体育场", "伊朗": "阿扎迪体育场", "巴拿马": "罗梅尔·费尔南德斯体育场",
  "德国": "柏林奥林匹克体育场", "智利": "国家体育场", "伊拉克": "巴士拉国际体育场", "牙买加": "国家体育场", "哥伦比亚": "大都会体育场", "秘鲁": "国家体育场",
  "阿联酋": "扎耶德体育城体育场", "埃及": "开罗国际体育场"
};
