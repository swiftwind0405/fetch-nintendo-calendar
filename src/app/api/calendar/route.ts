import axios from 'axios';
import { NextResponse } from 'next/server';
import { CalendarDay } from '@/types/calendar';
import { canApply } from '@/app/util';
import { sendTelegramMessage } from '@/app/send-message';

export async function GET(request: Request) {
  try {
    // 从 URL 获取目标日期参数
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '2025-06-29';
    const forceSend = searchParams.get('forceSend') === 'true';

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
    
    const response = await axios.get(
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
        }
      }
    );

    console.log('API响应状态:', response.status);
    console.log('API响应头:', response.headers);
    
    const {data} = response.data;
    const filteredData: CalendarDay = data.calendar[date];
    
    if (!filteredData) {
      throw new Error(`未找到日期 ${date} 的数据`);
    }
    
    console.log('过滤后的数据:', JSON.stringify(filteredData, null, 2));

    const _canApply = canApply(filteredData);

    const result = {
      data: filteredData, 
      canApply: _canApply, 
      message: _canApply ? '🎉🎊 快去买票! ✨' : '😔 暂时不可以买 ❌',
    };

    if (_canApply || forceSend) {
      await sendTelegramMessage(result.message);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('获取日历数据时出错:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('Axios 错误详情:', {
        status: error.response?.status,
        data: error.response?.data,
        config: error.config
      });
    }

    const result = {
      error: 'Failed to fetch calendar data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    };

    await sendTelegramMessage(result.details);

    return NextResponse.json(result, { status: 500 });
  }
} 