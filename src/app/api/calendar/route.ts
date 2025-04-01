import { NextResponse } from 'next/server';
import { CalendarData, CalendarDay } from '@/types/calendar';
import { canApply } from '@/app/util';

export async function GET(request: Request) {
  try {
    // 从 URL 获取目标日期参数
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date');

    if (!date) {
      return NextResponse.json({ error: '请提供日期参数 (date)' }, { status: 400 });
    }

    // 验证日期格式
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return NextResponse.json({ error: '日期格式无效，请使用 YYYY-MM-DD 格式' }, { status: 400 });
    }

    // 从日期中提取年月，并确保月份是整数（去掉前导零）
    const [year, monthWithZero] = date.split('-');
    const month = parseInt(monthWithZero, 10);

    if (isNaN(month) || month < 1 || month > 12) {
      return NextResponse.json({ error: '月份无效，必须是 1-12 之间的数字' }, { status: 400 });
    }
    
    console.log('开始获取 Nintendo Museum 日历数据...');
    console.log('目标日期:', date);
    console.log('年份:', year);
    console.log('月份:', month);
    console.log('使用的 XSRF Token:', process.env.XSRF_TOKEN);
    console.log('使用的 Cookie:', process.env.COOKIE);
    
    const response = await fetch(
      `https://museum-tickets.nintendo.com/en/api/calendar?target_year=${year}&target_month=${month}`,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API响应错误:', errorText);
      throw new Error(`API请求失败: ${response.status} ${errorText}`);
    }

    const data: CalendarData = await response.json();
    const dayData: CalendarDay | undefined = data.data.calendar[date];

    if (!dayData) {
      return NextResponse.json({ 
        error: `未找到日期 ${date} 的数据`,
        availableDates: Object.keys(data.data.calendar)
      }, { status: 404 });
    }

    const _canApply = canApply(dayData);
    return NextResponse.json({ 
      message: _canApply ? '🎉🎊 快买! ✨' : '😔 暂时不可以买 ❌',
      date: date,
      canApply: _canApply,
      data: dayData,
    });

  } catch (error) {
    console.error('获取日历数据时出错:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch calendar data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 