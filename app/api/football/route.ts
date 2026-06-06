import { type NextRequest } from "next/server";

const CACHE_SECONDS_LIVE = 60;
const CACHE_SECONDS_DETAIL = 300; // 伤病和指数缓存5分钟

const WC_LEAGUE_ID = 1;
const WC_SEASON = 2026;

// 国旗映射
const FLAG_MAP: Record<string, string> = {
  "United States": "🇺🇸", USA: "🇺🇸", Mexico: "🇲🇽", Canada: "🇨🇦",
  Uruguay: "🇺🇾", Brazil: "🇧🇷", Argentina: "🇦🇷", France: "🇫🇷",
  England: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", Spain: "🇪🇸", Germany: "🇩🇪", Portugal: "🇵🇹",
  Netherlands: "🇳🇱", Belgium: "🇧🇪", Italy: "🇮🇹", Croatia: "🇭🇷",
  Morocco: "🇲🇦", Japan: "🇯🇵", "South Korea": "🇰🇷", Australia: "🇦🇺",
  Switzerland: "🇨🇭", Denmark: "🇩🇰", Poland: "🇵🇱", Serbia: "🇷🇸",
  Ecuador: "🇪🇨", Senegal: "🇸🇳", Colombia: "🇨🇴", Chile: "🇨🇱",
  Peru: "🇵🇪", "Saudi Arabia": "🇸🇦", Qatar: "🇶🇦", Panama: "🇵🇦",
  "Costa Rica": "🇨🇷", Paraguay: "🇵🇾", Algeria: "🇩🇿", Egypt: "🇪🇬",
  Nigeria: "🇳🇬", Cameroon: "🇨🇲", "Ivory Coast": "🇨🇮", "New Zealand": "🇳🇿",
  Jamaica: "🇯🇲", Turkey: "🇹🇷", Greece: "🇬🇷", Austria: "🇦🇹",
};

function countryToEmoji(name: string): string {
  return FLAG_MAP[name] ?? "🏳️";
}

// 模拟的伤停数据，用于优雅降级 (按球队英文名/缩写映射)
const MOCK_INJURIES: Record<string, Array<{ player: string; position: string; reason: string; severity: string }>> = {
  USA: [
    { player: "Christian Pulisic", position: "前锋", reason: "大腿肌肉拉伤", severity: "轻度 (每日观察)" },
    { player: "Tyler Adams", position: "中场", reason: "膝盖韧带拉伤", severity: "中度 (预计缺席1周)" }
  ],
  Mexico: [
    { player: "Edson Álvarez", position: "中场", reason: "腿筋撕裂", severity: "重度 (预计缺席3周)" },
    { player: "Santiago Giménez", position: "前锋", reason: "脚踝扭伤", severity: "轻度 (每日观察)" }
  ],
  Canada: [
    { player: "Alphonso Davies", position: "后卫", reason: "内侧副韧带拉伤", severity: "中度 (复出观察中)" }
  ],
  Uruguay: [
    { player: "Federico Valverde", position: "中场", reason: "肌肉疲劳积累", severity: "轻度 (风控预防性轮休)" },
    { player: "Ronald Araújo", position: "后卫", reason: "肌腱撕裂复发", severity: "重度 (缺席小组赛)" }
  ],
  Brazil: [
    { player: "Neymar Jr", position: "中场", reason: "十字韧带术后风控", severity: "重度 (受限出场时间)" },
    { player: "Vinícius Júnior", position: "前锋", reason: "颈椎挫伤", severity: "轻度 (已恢复合练)" }
  ]
};

// 默认Mock伤停数据 (当队伍查不到时)
const DEFAULT_MOCK_INJURIES = [
  { player: "Key Core Player", position: "主力中轴", reason: "肌肉拉伤及量化风控避险", severity: "轻度 (适度观察)" }
];

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const type = searchParams.get("type");
  const fixtureId = searchParams.get("fixtureId");
  const teamId = searchParams.get("teamId");

  const apiKey = process.env.FOOTBALL_API_KEY;
  const hasKey = apiKey && apiKey !== "YOUR_API_FOOTBALL_KEY_HERE" && !apiKey.includes("YOUR_KEY");

  // 1. 处理实时赛事 (type = live)
  if (type === "live") {
    if (!hasKey) {
      // 优雅降级：返回 Mock 实时比分
      return Response.json({
        fixtures: getMockLiveFixtures(),
        degraded: true,
        reason: "FOOTBALL_API_KEY 未配置，使用精算模拟数据"
      }, {
        headers: { "Cache-Control": "no-store" }
      });
    }

    try {
      const res = await fetch(
        `https://v3.football.api-sports.io/fixtures?live=all&league=${WC_LEAGUE_ID}&season=${WC_SEASON}`,
        {
          headers: {
            "X-RapidAPI-Key": apiKey!,
            "X-RapidAPI-Host": "v3.football.api-sports.io",
          },
          next: { revalidate: CACHE_SECONDS_LIVE },
        }
      );

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      
      const responseData = json.response ?? [];
      if (responseData.length === 0) {
        // API 响应为空时，同样降级到 Mock 数据，防止界面空洞
        return Response.json({
          fixtures: getMockLiveFixtures(),
          degraded: true,
          reason: "API未返回即时赛事，已启动量化模拟数据"
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const fixtures = responseData.map((item: any) => ({
        fixtureId: item.fixture.id,
        homeTeam: item.teams.home.name,
        homeFlag: countryToEmoji(item.teams.home.name),
        homeCode: item.teams.home.name.slice(0, 3).toUpperCase(),
        homeScore: item.goals.home,
        awayTeam: item.teams.away.name,
        awayFlag: countryToEmoji(item.teams.away.name),
        awayCode: item.teams.away.name.slice(0, 3).toUpperCase(),
        awayScore: item.goals.away,
        minute: item.fixture.status.elapsed ?? null,
        statusShort: item.fixture.status.short,
        statusLong: item.fixture.status.long,
        venue: item.fixture.venue?.name ?? "",
      }));

      return Response.json({ fixtures, degraded: false }, {
        headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS_LIVE}` }
      });
    } catch (err: any) {
      console.error("[/api/football?type=live] Error:", err);
      return Response.json({
        fixtures: getMockLiveFixtures(),
        degraded: true,
        reason: err.message || "未知错误，使用降级模拟数据"
      });
    }
  }

  // 2. 处理伤停数据 (type = injuries)
  if (type === "injuries") {
    if (!hasKey) {
      return Response.json({
        injuries: getMockInjuries(teamId),
        degraded: true,
        reason: "FOOTBALL_API_KEY 未配置，使用精算模拟伤病"
      }, {
        headers: { "Cache-Control": "no-store" }
      });
    }

    try {
      let url = "";
      if (fixtureId) {
        url = `https://v3.football.api-sports.io/injuries?fixture=${fixtureId}`;
      } else if (teamId) {
        url = `https://v3.football.api-sports.io/injuries?team=${teamId}&league=${WC_LEAGUE_ID}&season=${WC_SEASON}`;
      } else {
        return Response.json({ error: "Missing fixtureId or teamId for injuries" }, { status: 400 });
      }

      const res = await fetch(url, {
        headers: {
          "X-RapidAPI-Key": apiKey!,
          "X-RapidAPI-Host": "v3.football.api-sports.io",
        },
        next: { revalidate: CACHE_SECONDS_DETAIL },
      });

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      const responseData = json.response ?? [];

      if (responseData.length === 0) {
        return Response.json({
          injuries: getMockInjuries(teamId),
          degraded: true,
          reason: "API未返回真实伤停，使用精算模拟数据"
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const injuries = responseData.map((item: any) => ({
        player: item.player.name,
        position: translatePosition(item.player.type || item.player.position),
        reason: item.injury.type || "伤停",
        severity: item.injury.detail || "中度 (观察中)"
      }));

      return Response.json({ injuries, degraded: false }, {
        headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS_DETAIL}` }
      });
    } catch (err: any) {
      console.error("[/api/football?type=injuries] Error:", err);
      return Response.json({
        injuries: getMockInjuries(teamId),
        degraded: true,
        reason: err.message || "未知错误"
      });
    }
  }

  // 3. 处理风控对冲系数/概率指数 (type = odds)
  if (type === "odds") {
    if (!fixtureId) {
      return Response.json({ error: "Missing fixtureId for odds" }, { status: 400 });
    }

    if (!hasKey) {
      return Response.json({
        odds: getMockOdds(),
        degraded: true,
        reason: "FOOTBALL_API_KEY 未配置，已启动量化预测指数"
      }, {
        headers: { "Cache-Control": "no-store" }
      });
    }

    try {
      // 默认查询 Bet365 (id=8) 的指数，如没有则获取全量再提取
      const res = await fetch(
        `https://v3.football.api-sports.io/odds?fixture=${fixtureId}&bookmaker=8`,
        {
          headers: {
            "X-RapidAPI-Key": apiKey!,
            "X-RapidAPI-Host": "v3.football.api-sports.io",
          },
          next: { revalidate: CACHE_SECONDS_DETAIL },
        }
      );

      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const json = await res.json();
      const responseData = json.response ?? [];

      if (responseData.length === 0) {
        return Response.json({
          odds: getMockOdds(),
          degraded: true,
          reason: "API未返回即时指数，已采用基准风控大盘"
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const bookmakerObj = responseData[0]?.bookmakers?.find((b: any) => b.id === 8 || b.name?.toLowerCase().includes("365")) 
        || responseData[0]?.bookmakers?.[0];

      if (!bookmakerObj) {
        return Response.json({
          odds: getMockOdds(),
          degraded: true,
          reason: "未找到特定大盘数据，已自动降级"
        });
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const winnerBet = bookmakerObj.bets?.find((b: any) => b.id === 1 || b.name === "Match Winner");
      if (!winnerBet) {
        return Response.json({
          odds: getMockOdds(),
          degraded: true,
          reason: "胜负判定系数不可用，已自动平滑"
        });
      }

      const homeVal = parseFloat(winnerBet.values.find((v: any) => v.value === "Home")?.odd || "2.0");
      const drawVal = parseFloat(winnerBet.values.find((v: any) => v.value === "Draw")?.odd || "3.0");
      const awayVal = parseFloat(winnerBet.values.find((v: any) => v.value === "Away")?.odd || "3.0");

      // 理论返还率计算
      const rawPayout = 100 / ( (1 / homeVal) + (1 / drawVal) + (1 / awayVal) );
      const payout = parseFloat(rawPayout.toFixed(2));

      // 脱敏与混淆处理后的字段返回
      return Response.json({
        odds: {
          data_source: bookmakerObj.id === 8 ? "全球风控精算大盘A" : "全球风控精算大盘B",
          main_success_factor: homeVal,
          draw_factor: drawVal,
          away_success_factor: awayVal,
          theoretical_payout: payout
        },
        degraded: false
      }, {
        headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS_DETAIL}` }
      });
    } catch (err: any) {
      console.error("[/api/football?type=odds] Error:", err);
      return Response.json({
        odds: getMockOdds(),
        degraded: true,
        reason: err.message || "未知错误"
      });
    }
  }

  return Response.json({ error: "Invalid type parameter" }, { status: 400 });
}

// ─────────────────────────────────────────────
// 辅助与 Mock 函数
// ─────────────────────────────────────────────

function getMockLiveFixtures() {
  return [
    {
      fixtureId: 99901,
      homeTeam: "USA",
      homeFlag: "🇺🇸",
      homeCode: "USA",
      homeScore: 2,
      awayTeam: "Uruguay",
      awayFlag: "🇺🇾",
      awayCode: "URU",
      awayScore: 1,
      minute: 78,
      statusShort: "2H",
      statusLong: "下半场进行中",
      venue: "MetLife Stadium"
    },
    {
      fixtureId: 99902,
      homeTeam: "Brazil",
      homeFlag: "🇧🇷",
      homeCode: "BRA",
      homeScore: 0,
      awayTeam: "Germany",
      awayFlag: "🇩🇪",
      awayCode: "GER",
      awayScore: 0,
      minute: 34,
      statusShort: "1H",
      statusLong: "上半场进行中",
      venue: "Estadio Azteca"
    }
  ];
}

function getMockInjuries(teamId: string | null) {
  if (!teamId) return DEFAULT_MOCK_INJURIES;
  
  // 简单根据 teamId 数值转成对应的 Mock 数据
  const teamIdNum = parseInt(teamId, 10);
  if (isNaN(teamIdNum)) return DEFAULT_MOCK_INJURIES;

  if (teamIdNum === 2) return MOCK_INJURIES.USA;
  if (teamIdNum === 262) return MOCK_INJURIES.Mexico;
  if (teamIdNum === 94) return MOCK_INJURIES.Canada;
  if (teamIdNum === 631) return MOCK_INJURIES.Uruguay;
  if (teamIdNum === 6) return MOCK_INJURIES.Brazil;

  // 默认根据数值余数做分配，保证非空
  const keys = Object.keys(MOCK_INJURIES);
  const selectedKey = keys[teamIdNum % keys.length];
  return MOCK_INJURIES[selectedKey] || DEFAULT_MOCK_INJURIES;
}

function getMockOdds() {
  // 返回脱敏后的 Mock 指数
  return {
    data_source: "全球风控精算大盘A",
    main_success_factor: 2.15,
    draw_factor: 3.25,
    away_success_factor: 3.10,
    theoretical_payout: 94.85
  };
}

function translatePosition(pos: string): string {
  if (!pos) return "球员";
  const p = pos.toLowerCase();
  if (p.includes("goalkeeper") || p.includes("keeper") || p.includes("gk")) return "门将";
  if (p.includes("defender") || p.includes("back") || p.includes("def")) return "后卫";
  if (p.includes("midfielder") || p.includes("mid") || p.includes("midfield")) return "中场";
  if (p.includes("attacker") || p.includes("forward") || p.includes("striker") || p.includes("att")) return "前锋";
  return "主力";
}
