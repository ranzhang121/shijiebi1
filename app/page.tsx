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
  RefreshCw
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
  value: string; // 身价
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
}

export interface Group {
  id: string;
  name: string; // A-L
  teams: Team[];
}

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
      { id: "usa-1", name: "克里斯蒂安·普利西奇", number: 10, position: "FW", age: 27, club: "AC米兰", fortune: "大吉", isCaptain: true, value: "4800万€" },
      { id: "usa-2", name: "韦斯顿·麦肯尼", number: 8, position: "MF", age: 27, club: "尤文图斯", fortune: "大吉", isCaptain: false, value: "2800万€" },
      { id: "usa-3", name: "泰勒·亚当斯", number: 4, position: "MF", age: 27, club: "伯恩茅斯", fortune: "平", isCaptain: false, value: "2500万€" },
      { id: "usa-4", name: "蒂莫西·维阿", number: 21, position: "FW", age: 26, club: "尤文图斯", fortune: "中吉", isCaptain: false, value: "1500万€" },
      { id: "usa-5", name: "尤纳斯·穆萨", number: 6, position: "MF", age: 23, club: "AC米兰", fortune: "平", isCaptain: false, value: "2200万€" },
      { id: "usa-6", name: "安东尼·罗宾逊", number: 5, position: "DF", age: 28, club: "富勒姆", fortune: "中吉", isCaptain: false, value: "2000万€" },
      { id: "usa-7", name: "克里斯·理查兹", number: 3, position: "DF", age: 26, club: "水晶宫", fortune: "平", isCaptain: false, value: "1200万€" },
      { id: "usa-8", name: "马特·特纳", number: 1, position: "GK", age: 31, club: "水晶宫", fortune: "大吉", isCaptain: false, value: "700万€" },
      { id: "usa-9", name: "弗拉林·巴洛贡", number: 20, position: "FW", age: 24, club: "摩纳哥", fortune: "平", isCaptain: false, value: "3000万€" },
      { id: "usa-10", name: "乔凡尼·雷纳", number: 7, position: "MF", age: 23, club: "多特蒙德", fortune: "中吉", isCaptain: false, value: "1800万€" },
      { id: "usa-11", name: "塞尔吉尼奥·德斯特", number: 2, position: "DF", age: 25, club: "埃因霍温", fortune: "平", isCaptain: false, value: "1800万€" },
      { id: "usa-12", name: "卡特-维克斯", number: 22, position: "DF", age: 28, club: "凯尔特人", fortune: "平", isCaptain: false, value: "1500万€" },
      { id: "usa-13", name: "马利克·蒂尔曼", number: 17, position: "MF", age: 23, club: "埃因霍温", fortune: "大吉", isCaptain: false, value: "2500万€" },
      { id: "usa-14", name: "里卡多·佩皮", number: 9, position: "FW", age: 23, club: "埃因霍温", fortune: "平", isCaptain: false, value: "1500万€" },
      { id: "usa-15", name: "迈尔斯·罗宾逊", number: 12, position: "DF", age: 29, club: "辛辛那提", fortune: "平", isCaptain: false, value: "500万€" },
      { id: "usa-16", name: "乔·斯卡利", number: 19, position: "DF", age: 23, club: "门兴", fortune: "平", isCaptain: false, value: "1200万€" },
      { id: "usa-17", name: "布兰登·阿伦森", number: 11, position: "MF", age: 25, club: "利兹联", fortune: "中吉", isCaptain: false, value: "1600万€" },
      { id: "usa-18", name: "马克·麦肯齐", number: 15, position: "DF", age: 27, club: "亨克", fortune: "平", isCaptain: false, value: "600万€" },
      { id: "usa-19", name: "卢卡·德拉托雷", number: 14, position: "MF", age: 28, club: "塞尔塔", fortune: "平", isCaptain: false, value: "350万€" },
      { id: "usa-20", name: "豪尔赫·坎波斯", number: 18, position: "DF", age: 24, club: "洛杉矶FC", fortune: "平", isCaptain: false, value: "250万€" },
      { id: "usa-21", name: "霍瓦特", number: 13, position: "GK", age: 30, club: "卡迪夫城", fortune: "平", isCaptain: false, value: "150万€" },
      { id: "usa-22", name: "肖恩·约翰逊", number: 25, position: "GK", age: 36, club: "多伦多", fortune: "平", isCaptain: false, value: "50万€" },
      { id: "usa-23", name: "卡勒尔", number: 16, position: "DF", age: 26, club: "卢顿", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "usa-24", name: "萨金特", number: 24, position: "FW", age: 26, club: "诺维奇", fortune: "平", isCaptain: false, value: "1200万€" },
      { id: "usa-25", name: "哈吉·赖特", number: 19, position: "FW", age: 28, club: "考文垂", fortune: "中吉", isCaptain: false, value: "800万€" },
      { id: "usa-26", name: "蒂莫西·蒂尔曼", number: 26, position: "MF", age: 27, club: "洛杉矶FC", fortune: "平", isCaptain: false, value: "300万€" }
    ]
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
      { id: "mex-1", name: "吉列尔莫·奥乔亚", number: 13, position: "GK", age: 40, club: "萨勒尼塔纳", fortune: "大吉", isCaptain: true, value: "100万€" },
      { id: "mex-2", name: "圣地亚哥·希门尼斯", number: 9, position: "FW", age: 25, club: "费耶诺德", fortune: "中吉", isCaptain: false, value: "4000万€" },
      { id: "mex-3", name: "埃德森·阿尔瓦雷斯", number: 4, position: "MF", age: 28, club: "西汉姆联", fortune: "大吉", isCaptain: false, value: "3500万€" },
      { id: "mex-4", name: "路易斯·查韦斯", number: 24, position: "MF", age: 30, club: "莫斯科迪纳摩", fortune: "平", isCaptain: false, value: "800万€" },
      { id: "mex-5", name: "塞萨尔·蒙特斯", number: 3, position: "DF", age: 29, club: "阿尔梅里亚", fortune: "平", isCaptain: false, value: "3000万€" },
      { id: "mex-6", name: "约翰·巴斯克斯", number: 5, position: "DF", age: 27, club: "热那亚", fortune: "平", isCaptain: false, value: "1000万€" },
      { id: "mex-7", name: "奥尔贝尔·皮内达", number: 17, position: "MF", age: 30, club: "雅典AEK", fortune: "中吉", isCaptain: false, value: "650万€" },
      { id: "mex-8", name: "乌列尔·安图尼亚", number: 15, position: "FW", age: 28, club: "蓝十字", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "mex-9", name: "亨利·马丁", number: 20, position: "FW", age: 33, club: "美洲队", fortune: "中吉", isCaptain: false, value: "500万€" },
      { id: "mex-10", name: "路易斯·罗莫", number: 7, position: "MF", age: 31, club: "蒙特雷", fortune: "平", isCaptain: false, value: "600万€" },
      { id: "mex-11", name: "朱利安·奎尼奥内斯", number: 18, position: "FW", age: 29, club: "美洲队", fortune: "平", isCaptain: false, value: "900万€" },
      { id: "mex-12", name: "豪尔赫·桑切斯", number: 19, position: "DF", age: 28, club: "波尔图", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "mex-13", name: "赫苏斯·加利亚多", number: 23, position: "DF", age: 31, club: "蒙特雷", fortune: "平", isCaptain: false, value: "300万€" },
      { id: "mex-14", name: "路易斯·马拉贡", number: 1, position: "GK", age: 29, club: "美洲队", fortune: "平", isCaptain: false, value: "450万€" },
      { id: "mex-15", name: "卡洛斯·罗德里格斯", number: 8, position: "MF", age: 29, club: "蓝十字", fortune: "平", isCaptain: false, value: "600万€" },
      { id: "mex-16", name: "埃里克·桑切斯", number: 14, position: "MF", age: 26, club: "帕丘卡", fortune: "平", isCaptain: false, value: "1000万€" },
      { id: "mex-17", name: "以色列·雷耶斯", number: 2, position: "DF", age: 25, club: "美洲队", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "mex-18", name: "布莱恩·冈萨雷斯", number: 16, position: "DF", age: 23, club: "帕丘卡", fortune: "平", isCaptain: false, value: "250万€" },
      { id: "mex-19", name: "维克托·古兹曼", number: 21, position: "DF", age: 24, club: "蒙特雷", fortune: "中吉", isCaptain: false, value: "600万€" },
      { id: "mex-20", name: "霍尔迪·科尔蒂索", number: 22, position: "MF", age: 29, club: "蒙特雷", fortune: "平", isCaptain: false, value: "300万€" },
      { id: "mex-21", name: "费尔南多·贝尔特兰", number: 25, position: "MF", age: 28, club: "瓜达拉哈拉", fortune: "平", isCaptain: false, value: "600万€" },
      { id: "mex-22", name: "马塞洛·弗洛雷斯", number: 11, position: "FW", age: 22, club: "老虎队", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "mex-23", name: "塞萨尔·韦尔塔", number: 26, position: "FW", age: 25, club: "国立自治大学", fortune: "中吉", isCaptain: false, value: "500万€" },
      { id: "mex-24", name: "胡里奥·冈萨雷斯", number: 12, position: "GK", age: 34, club: "国立自治大学", fortune: "平", isCaptain: false, value: "100万€" },
      { id: "mex-25", name: "奥罗纳", number: 6, position: "DF", age: 27, club: "瓜达拉哈拉", fortune: "平", isCaptain: false, value: "200万€" },
      { id: "mex-26", name: "皮耶罗斯", number: 10, position: "FW", age: 24, club: "瓜达拉哈拉", fortune: "平", isCaptain: false, value: "350万€" }
    ]
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
      { id: "can-1", name: "阿方索·戴维斯", number: 19, position: "DF", age: 25, club: "拜仁慕尼黑", fortune: "大吉", isCaptain: true, value: "5000万€" },
      { id: "can-2", name: "乔纳森·戴维", number: 20, position: "FW", age: 26, club: "里尔", fortune: "中吉", isCaptain: false, value: "4500万€" },
      { id: "can-3", name: "斯蒂芬·欧斯塔基奥", number: 7, position: "MF", age: 29, club: "波尔图", fortune: "大吉", isCaptain: false, value: "1500万€" },
      { id: "can-4", name: "泰江·布坎南", number: 11, position: "MF", age: 27, club: "国际米兰", fortune: "平", isCaptain: false, value: "800万€" },
      { id: "can-5", name: "凯·米勒", number: 15, position: "DF", age: 28, club: "波特兰伐木者", fortune: "平", isCaptain: false, value: "300万€" },
      { id: "can-6", name: "阿利斯泰尔·约翰斯顿", number: 2, position: "DF", age: 27, club: "凯尔特人", fortune: "中吉", isCaptain: false, value: "800万€" },
      { id: "can-7", name: "伊斯梅尔·科内", number: 8, position: "MF", age: 23, club: "沃特福德", fortune: "平", isCaptain: false, value: "1100万€" },
      { id: "can-8", name: "马克-安东尼·凯伊", number: 14, position: "MF", age: 31, club: "新英格兰革命", fortune: "平", isCaptain: false, value: "150万€" },
      { id: "can-9", name: "凯尔·拉林", number: 9, position: "FW", age: 31, club: "马洛卡", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "can-10", name: "马克西姆·克雷波", number: 16, position: "GK", age: 32, club: "波特兰伐木者", fortune: "平", isCaptain: false, value: "150万€" },
      { id: "can-11", name: "利安·米勒", number: 23, position: "FW", age: 26, club: "普雷斯顿", fortune: "平", isCaptain: false, value: "250万€" },
      { id: "can-12", name: "莫伊塞·邦比托", number: 13, position: "DF", age: 26, club: "科罗拉多急流", fortune: "中吉", isCaptain: false, value: "450万€" },
      { id: "can-13", name: "德里克·考内留斯", number: 5, position: "DF", age: 28, club: "马尔默", fortune: "平", isCaptain: false, value: "200万€" },
      { id: "can-14", name: "塞缪尔·皮耶特", number: 6, position: "MF", age: 31, club: "蒙特利尔CF", fortune: "平", isCaptain: false, value: "150万€" },
      { id: "can-15", name: "杰登·内尔森", number: 10, position: "MF", age: 23, club: "罗森博格", fortune: "平", isCaptain: false, value: "120万€" },
      { id: "can-16", name: "西奥·贝尔", number: 17, position: "FW", age: 24, club: "马瑟韦尔", fortune: "平", isCaptain: false, value: "100万€" },
      { id: "can-17", name: "卡林·罗斯", number: 12, position: "FW", age: 24, club: "明尼苏达联", fortune: "平", isCaptain: false, value: "80万€" },
      { id: "can-18", name: "萨沙·克里斯坦", number: 21, position: "DF", age: 21, club: "哥伦布机员", fortune: "平", isCaptain: false, value: "50万€" },
      { id: "can-19", name: "马修·乔伊尼尔", number: 22, position: "MF", age: 24, club: "蒙特利尔CF", fortune: "中吉", isCaptain: false, value: "200万€" },
      { id: "can-20", name: "里奇·拉里亚", number: 22, position: "DF", age: 31, club: "多伦多FC", fortune: "平", isCaptain: false, value: "200万€" },
      { id: "can-21", name: "戴恩·圣克莱尔", number: 1, position: "GK", age: 29, club: "明尼苏达联", fortune: "平", isCaptain: false, value: "250万€" },
      { id: "can-22", name: "汤姆·麦吉尔", number: 18, position: "GK", age: 26, club: "布莱顿", fortune: "平", isCaptain: false, value: "60万€" },
      { id: "can-23", name: "利亚姆·弗雷泽", number: 4, position: "MF", age: 28, club: "达拉斯", fortune: "平", isCaptain: false, value: "100万€" },
      { id: "can-24", name: "多米尼克·扎托尔", number: 3, position: "DF", age: 31, club: "凯尔茨科罗纳", fortune: "平", isCaptain: false, value: "50万€" },
      { id: "can-25", name: "罗素-罗", number: 25, position: "FW", age: 23, club: "温哥华白浪", fortune: "平", isCaptain: false, value: "80万€" },
      { id: "can-26", name: "阿希米·阿德库比", number: 26, position: "DF", age: 31, club: "温哥华白浪", fortune: "平", isCaptain: false, value: "100万€" }
    ]
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
      { id: "uru-1", name: "费德里科·巴尔韦德", number: 15, position: "MF", age: 27, club: "皇家马德里", fortune: "大吉", isCaptain: true, value: "1.2亿€" },
      { id: "uru-2", name: "达尔文·努涅斯", number: 19, position: "FW", age: 26, club: "利物浦", fortune: "大吉", isCaptain: false, value: "7000万€" },
      { id: "uru-3", name: "罗纳德·阿劳霍", number: 4, position: "DF", age: 27, club: "巴塞罗那", fortune: "中吉", isCaptain: false, value: "7000万€" },
      { id: "uru-4", name: "曼努埃尔·乌加特", number: 5, position: "MF", age: 25, club: "曼联", fortune: "中吉", isCaptain: false, value: "5000万€" },
      { id: "uru-5", name: "尼古拉斯·德拉克鲁斯", number: 7, position: "MF", age: 29, club: "弗拉门戈", fortune: "大吉", isCaptain: false, value: "1800万€" },
      { id: "uru-6", name: "马蒂亚斯·奥利维拉", number: 16, position: "DF", age: 28, club: "那不勒斯", fortune: "平", isCaptain: false, value: "1500万€" },
      { id: "uru-7", name: "法昆多·佩利斯特里", number: 11, position: "FW", age: 24, club: "帕纳辛奈科斯", fortune: "平", isCaptain: false, value: "1000万€" },
      { id: "uru-8", name: "塞尔希奥·罗切特", number: 1, position: "GK", age: 33, club: "国际体育会", fortune: "大吉", isCaptain: false, value: "300万€" },
      { id: "uru-9", name: "塞萨尔·阿劳霍", number: 6, position: "MF", age: 25, club: "奥兰多城", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "uru-10", name: "何塞·希门尼斯", number: 2, position: "DF", age: 31, club: "马德里竞技", fortune: "平", isCaptain: false, value: "800万€" },
      { id: "uru-11", name: "塞瓦斯蒂安·卡塞雷斯", number: 3, position: "DF", age: 26, club: "美洲队", fortune: "中吉", isCaptain: false, value: "700万€" },
      { id: "uru-12", name: "吉列尔莫·瓦雷拉", number: 13, position: "DF", age: 33, club: "弗拉门戈", fortune: "平", isCaptain: false, value: "200万€" },
      { id: "uru-13", name: "罗德里戈·本坦库尔", number: 6, position: "MF", age: 28, club: "托特纳姆热刺", fortune: "大吉", isCaptain: false, value: "3500万€" },
      { id: "uru-14", name: "法昆多·托雷斯", number: 10, position: "FW", age: 26, club: "奥兰多城", fortune: "平", isCaptain: false, value: "1400万€" },
      { id: "uru-15", name: "布里安·罗德里格斯", number: 20, position: "FW", age: 26, club: "美洲队", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "uru-16", name: "马克西米利亚诺·阿劳霍", number: 21, position: "FW", age: 26, club: "托卢卡", fortune: "中吉", isCaptain: false, value: "850万€" },
      { id: "uru-17", name: "克里斯蒂安·奥利维拉", number: 25, position: "FW", age: 24, club: "洛杉矶FC", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "uru-18", name: "卢卡斯·奥拉萨", number: 22, position: "DF", age: 31, club: "克拉斯诺达尔", fortune: "平", isCaptain: false, value: "300万€" },
      { id: "uru-19", name: "圣地亚哥·梅莱", number: 12, position: "GK", age: 28, club: "巴兰基亚青年", fortune: "平", isCaptain: false, value: "200万€" },
      { id: "uru-20", name: "弗朗哥·伊斯列尔", number: 23, position: "GK", age: 26, club: "葡萄牙体育", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "uru-21", name: "马蒂亚斯·比尼亚", number: 17, position: "DF", age: 28, club: "弗拉门戈", fortune: "中吉", isCaptain: false, value: "800万€" },
      { id: "uru-22", name: "尼古拉斯·马里查尔", number: 24, position: "DF", age: 25, club: "莫斯科迪纳摩", fortune: "平", isCaptain: false, value: "300万€" },
      { id: "uru-23", name: "埃米利亚诺·马丁内斯", number: 14, position: "MF", age: 26, club: "中日德兰", fortune: "平", isCaptain: false, value: "400万€" },
      { id: "uru-24", name: "卢西亚诺·罗德里格斯", number: 26, position: "FW", age: 22, club: "巴伊亚", fortune: "大吉", isCaptain: false, value: "1200万€" },
      { id: "uru-25", name: "阿古斯丁·卡诺比奥", number: 18, position: "FW", age: 27, club: "巴拉纳竞技", fortune: "平", isCaptain: false, value: "500万€" },
      { id: "uru-26", name: "吉安卡洛·冈萨雷斯", number: 8, position: "DF", age: 30, club: "佩纳罗尔", fortune: "平", isCaptain: false, value: "100万€" }
    ]
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
  { name: "L", teams: ["哥伦比亚", "秘鲁", "阿联酋", "埃及"], flags: ["🇨🇴", "🇵🇪", "🇦🇪", "🇪🇬"], codes: ["COL", "PER", "UAE", "EGY"] }
];

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
        const valueNum = (100 + Math.random() * 900) / 10;
        const value = valueNum > 50 ? `${(valueNum / 10).toFixed(1)}亿€` : `${valueNum.toFixed(0)}百万€`;

        return {
          id: `${id}-player-${num}`,
          name: `${name}主将_${num}号`,
          number: num,
          position: pos,
          age,
          club: clubList[Math.floor(Math.random() * clubList.length)],
          fortune: fortuneOptions[Math.floor(Math.random() * fortuneOptions.length)],
          isCaptain: num === 10 || num === 1, // 10号或1号担任队长
          value
        };
      });

      return {
        id,
        name,
        code,
        flag,
        aiWinRate: aiRate,
        metaphysicsWinRate: metaRate,
        fortuneText: fortune,
        dangerLevel: danger,
        coach: `阿尔伯特·${name}斯基`,
        stadium: `${name}皇家球场`,
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

// ==========================================
// 3. 核心客户端页面组件
// ==========================================

export default function WorldCupHome() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeDrawerTab, setActiveDrawerTab] = useState<"roster" | "tactics" | "meta">("roster");

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

  // 初始化数据
  useEffect(() => {
    const data = generateInitialGroups();
    setGroups(data);
  }, []);

  // 当选择国家队时打开抽屉
  const handleTeamClick = (team: Team) => {
    setSelectedTeam(team);
    setActiveDrawerTab("roster");
    setIsDrawerOpen(true);
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
            aiWinRate: editAiWinRate,
            metaphysicsWinRate: editMetaWinRate,
            fortuneText: editFortune,
            dangerLevel: editDangerLevel,
            coach: editCoach,
            metaphysics: {
              ...t.metaphysics,
              upsetChance: editUpsetChance,
              metaphysicsWinRate: editMetaWinRate
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
    <div className="min-h-screen bg-[#0D0D11] text-white flex flex-col relative select-none">
      
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
                今日 AI 平均胜率精算: <span className="text-[#00FF66] font-bold">78.54%</span> | 玄学大吉运势占比: <span className="text-[#00FF66] font-bold">42.8%</span> | 爆冷预警指数: <span className="text-[#FF3333] font-bold">14.6%</span>
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
                        <div className="font-semibold text-sm text-white flex items-center gap-1.5">
                          {team.name}
                          <span className="text-[10px] text-[#888899] font-mono">
                            {team.code}
                          </span>
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
                  {selectedTeam.aiWinRate}%
                </div>
              </div>
              <div className="bg-[#13131A]/60 p-3 rounded-lg border border-[#252535] text-center">
                <div className="text-xs text-[#888899] mb-1 flex items-center justify-center gap-1">
                  <Compass className="w-3.5 h-3.5 text-[#00FF66]" />
                  <span>玄学能量值</span>
                </div>
                <div className="text-2xl font-black text-[#00FF66] font-mono">
                  {selectedTeam.metaphysicsWinRate}%
                </div>
              </div>
              <div className="bg-[#13131A]/60 p-3 rounded-lg border border-[#252535] text-center">
                <div className="text-xs text-[#888899] mb-1 flex items-center justify-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>爆冷概率</span>
                </div>
                <div className="text-2xl font-black text-[#FF3333] font-mono">
                  {selectedTeam.metaphysics.upsetChance}%
                </div>
              </div>
            </div>

            {/* 抽屉导航选项卡 */}
            <div className="flex border-b border-[#1E1E2E] bg-[#171722] text-sm">
              <button
                onClick={() => setActiveDrawerTab("roster")}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all ${
                  activeDrawerTab === "roster"
                    ? "border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5"
                    : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                26人大名单
              </button>
              <button
                onClick={() => setActiveDrawerTab("tactics")}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all ${
                  activeDrawerTab === "tactics"
                    ? "border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5"
                    : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                战术数据分析
              </button>
              <button
                onClick={() => setActiveDrawerTab("meta")}
                className={`flex-1 py-3 text-center font-medium border-b-2 transition-all ${
                  activeDrawerTab === "meta"
                    ? "border-[#00FF66] text-[#00FF66] bg-[#00FF66]/5"
                    : "border-transparent text-[#888899] hover:text-white"
                }`}
              >
                五行八卦命格
              </button>
            </div>

            {/* 抽屉滚动内容区 */}
            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* TAB 1: 26人大名单 */}
              {activeDrawerTab === "roster" && (
                <div className="space-y-4">
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
                          <span className="text-xs text-white/90">{player.value}</span>
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

                  <div className="bg-[#1C1C26] p-4 rounded-lg border border-[#252535] space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                      <Award className="w-4 h-4 text-[#00FF66]" />
                      <span>AI 精选战术沙盘</span>
                    </h3>
                    <p className="text-xs text-[#888899] leading-relaxed">
                      基于 AI 大量复盘，{selectedTeam.name}主打前场宽度拉开与极速压迫。通过高频拦截与主帅精准换人，能实现快速进攻。需防范由于身价过高产生的节奏疲软以及大防空弱项被爆。
                    </p>
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
                          {selectedTeam.metaphysics.element}命格
                        </span>
                      </div>
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535]">
                        <span className="text-[#888899] block mb-1">今日流年卦象</span>
                        <span className="text-base font-bold text-[#00FF66]">
                          {selectedTeam.metaphysics.bagua}
                        </span>
                      </div>
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535]">
                        <span className="text-[#888899] block mb-1">宜赛吉利时辰</span>
                        <span className="text-xs font-bold text-white">
                          {selectedTeam.metaphysics.favorableHour}
                        </span>
                      </div>
                      <div className="p-3 bg-[#13131A] rounded-lg border border-[#252535]">
                        <span className="text-[#888899] block mb-1">今日忌冲生肖</span>
                        <span className="text-xs font-bold text-[#FF3333]">
                          {selectedTeam.metaphysics.clashZodiac}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#FF3333]/5 p-4 rounded-lg border border-[#FF3333]/20 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs text-[#FF3333] font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>流时化忌与大局解盘</span>
                    </div>
                    <p className="text-xs text-[#888899] leading-relaxed">
                      今日局势呈两卦交叠之相，凡犯忌生肖者需谨慎轮换。开局前15分钟大盘波诡云谲，机构诱盘严重。建议配合AI风控模型在下半场化忌节点过后进行指数对冲，规避大额爆冷。
                    </p>
                  </div>
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
                        onChange={(e) => setEditAiWinRate(parseFloat(e.target.value) || 0)}
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
                        onChange={(e) => setEditMetaWinRate(parseFloat(e.target.value) || 0)}
                        className="w-full bg-[#1C1C26] border border-[#252535] rounded p-2 text-sm text-white focus:border-[#00FF66] outline-none"
                      />
                    </div>

                    {/* 今日大运势 */}
                    <div className="space-y-1.5">
                      <label className="text-xs text-[#888899]">今日大运势</label>
                      <select
                        value={editFortune}
                        onChange={(e) => setEditFortune(e.target.value as any)}
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
                        onChange={(e) => setEditDangerLevel(e.target.value as any)}
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
                        onChange={(e) => setEditUpsetChance(parseFloat(e.target.value) || 0)}
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
