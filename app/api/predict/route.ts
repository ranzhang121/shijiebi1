import { NextResponse } from "next/server";

// 后置敏感词严格过滤清洗
function cleanSensitiveWords(text: string): string {
  return text
    .replace(/博彩/g, "量化对冲")
    .replace(/赔率/g, "机构量化风险对冲概率指数")
    .replace(/下注/g, "配置风险头寸")
    .replace(/吃单/g, "流动性承接")
    .replace(/买球/g, "风险敞口管理")
    .replace(/Bet365/gi, "全球风控精算大盘A")
    .replace(/Bwin/gi, "全球风控精算大盘B");
}

export async function POST(req: Request) {
  try {
    const { team } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey || apiKey === "AIzaSy_YOUR_KEY_HERE" || apiKey.includes("YOUR_KEY")) {
      return NextResponse.json(
        { error: "API_KEY_NOT_CONFIGURED", message: "Gemini API key is not configured in .env.local" },
        { status: 400 }
      );
    }

    const systemPrompt = `你是一个精通中国传统易经八卦玄学与现代足球战术数据分析的量化对冲大师。
请针对给出的世界杯队伍，结合其近期战绩、伤病名单、即时大盘指数、裁判掏牌风格、天气状况等特征，生成一份今日对冲预测。
你必须将战术分析与玄学原理（卦象、五行相生相克、比赛时辰）有机结合。例如：
- 如果大盘指数异常或被低估，分析是否存在“机构诱盘”或诱多诱空流动性陷阱。
- 结合伤病对爆冷概率（upsetChance）的影响进行评估。
- 结合天气（例如下雨利水命格，高温利火命格）与裁判严格度（高严厉度对高位压迫、粗野打法队伍不利）来判定胜负。

你必须绝对避免使用“博彩、赔率、下注、买球、Bet365、Bwin”等高危博彩词汇。

必须严格以 JSON 格式返回以下字段，不要包含任何 markdown 格式标记 (如 \`\`\`json)，也不要包含任何额外的换行或解释：
{
  "aiWinRate": 50到95之间的数字(代表AI智能胜率),
  "metaphysicsWinRate": 50到95之间的数字(代表玄学运势胜率),
  "upsetChance": 5到45之间的数字(代表爆冷指数),
  "fortuneText": "大吉" | "中吉" | "平" | "凶" 之一(代表运势文字),
  "element": "金" | "木" | "水" | "火" | "土" 之一(代表五行),
  "bagua": "当前卦象，如乾为天、坤为地等" (代表易经八卦卦象),
  "favorableHour": "宜赛时辰，如戌时 19:00-21:00等" (代表宜赛时辰),
  "clashZodiac": "冲煞生肖，如属鼠、属虎等" (代表冲煞生肖),
  "tacticalAnalysis": "结合球队战术、伤病情况、天气与裁判尺度的深度战术分析点评（不超过80字）",
  "metaphysicalAnalysis": "结合大盘诱盘风险、比赛时辰、五行卦象的玄学星盘点评（不超过80字）"
}`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                {
                  text: `${systemPrompt}

当前队伍数据：
国家: ${team.name} (${team.code})
主教练: ${team.coach}
比赛场馆: ${team.stadium}

【近期五场战绩】：
${team.recentForm.map((f: any) => `对阵 ${f.opponentFlag}${f.opponent}，结果：${f.result === "W" ? "胜" : f.result === "D" ? "平" : "负"} (${f.score})，是否主场: ${f.isHome ? "是" : "否"}`).join("\n")}

【主力伤停名单】：
${team.injuries.length === 0 ? "暂无核心伤停" : team.injuries.map((i: any) => `- ${i.name} (${i.position})，原因：${i.reason}，影响级别：${i.severity}`).join("\n")}

【即时大盘配置 (${team.odds.bookmaker})】：
- 主场成功系数: ${team.odds.homeWin}
- 平局避险系数: ${team.odds.draw}
- 客场成功系数: ${team.odds.awayWin}
- 理论返还率: ${team.odds.payout}%

【主裁判与气象环境】：
- 主裁判: ${team.refereeInfo.name} (场均掏牌: ${team.refereeInfo.cardsPerMatch}张，严格度: ${team.refereeInfo.strictness})
- 气象: 气温 ${team.weatherForecast.temp}，湿度 ${team.weatherForecast.humidity}，状况 ${team.weatherForecast.condition}`
                }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: "application/json"
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const resData = await response.json();
    const responseText = resData.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!responseText) {
      throw new Error("Empty response from Gemini API");
    }

    // 清洗后返回
    const cleanedText = cleanSensitiveWords(responseText.trim());
    const prediction = JSON.parse(cleanedText);
    return NextResponse.json(prediction);
  } catch (error: any) {
    console.error("Predict API Route Error:", error);
    return NextResponse.json(
      { error: "PREDICT_API_ERROR", message: error.message || "Unknown error occurred" },
      { status: 500 }
    );
  }
}
