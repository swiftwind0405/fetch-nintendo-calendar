import { canApply } from '@/app/util';
import { CalendarDay } from '@/types/calendar';
import { NextResponse } from 'next/server';

export async function GET() {
  console.log('开始获取 Nintendo Museum 日历数据...');
  console.log('使用的 XSRF Token:', process.env.XSRF_TOKEN);
  console.log('使用的 Cookie:', process.env.COOKIE);

  try {
    const response = await fetch(
      "https://museum-tickets.nintendo.com/en/api/calendar?target_year=2025&target_month=6",
      {
        headers: {
          "accept": "application/json, text/plain, */*",
          "accept-language": "zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6",
          "priority": "u=1, i",
          "sec-ch-ua": "\"Chromium\";v=\"134\", \"Not:A-Brand\";v=\"24\", \"Microsoft Edge\";v=\"134\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-origin",
          "x-requested-with": "XMLHttpRequest",
          "x-xsrf-token": process.env.XSRF_TOKEN || "",
          "cookie": process.env.COOKIE || "",
          "Referer": "https://museum-tickets.nintendo.com/en/calendar",
          "Referrer-Policy": "strict-origin-when-cross-origin"
        },
        method: "GET"
      }
    );

    console.log('API 响应状态:', response.status);
    const {data} = await response.json();
    // console.log('原始数据:', JSON.stringify(data, null, 2));
    // 过滤出2025年5月29日的数据
    const targetDate = '2025-06-29';
    const filteredData: CalendarDay = data.calendar[targetDate];
    console.log('过滤后的数据:', JSON.stringify(filteredData, null, 2));
    const _canApply = canApply(filteredData);
    return NextResponse.json({ canApply: _canApply, message: _canApply ? '🎉🎊 快买! ✨' : '😔 暂时不可以买 ❌', data: filteredData });
  } catch (error) {
    console.error('获取日历数据时出错:', error);
    return NextResponse.json({ error: 'Failed to fetch calendar data' }, { status: 500 });
  }
} 