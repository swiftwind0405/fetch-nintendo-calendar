import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { CalendarDay } from '@/types/calendar';
import { canApply } from '@/app/util';    
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  console.log('收到的认证头:', authHeader);
  console.log('期望的认证头:', `Bearer ${process.env.CRON_SECRET_KEY}`);
  
  // 验证请求是否来自 Vercel Cron
  if (!authHeader?.includes(process.env.CRON_SECRET_KEY || '')) {
    console.log('认证失败');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('开始获取 Nintendo Museum 日历数据...');
    console.log('使用的 XSRF Token:', process.env.XSRF_TOKEN);
    console.log('使用的 Cookie:', process.env.COOKIE);
    
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

    console.log('API响应状态:', response.status);
    console.log('API响应头:', JSON.stringify(Object.fromEntries(response.headers.entries()), null, 2));
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API响应错误:', errorText);
      throw new Error(`API请求失败: ${response.status} ${errorText}`);
    }

    const {data} = await response.json();
    // console.log('原始数据:', JSON.stringify(data, null, 2));
    
    // 过滤出2025年5月29日的数据
    const targetDate = '2025-06-29';
    const filteredData: CalendarDay = data.calendar[targetDate];
    
    console.log('过滤后的数据:', JSON.stringify(filteredData, null, 2));

    // 发送 Telegram 消息
    console.log('准备发送 Telegram 消息...');
    console.log('Telegram Bot Token:', process.env.TELEGRAM_BOT_TOKEN);
    console.log('Telegram Chat ID:', process.env.TELEGRAM_CHAT_ID);
    
    const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || '', { polling: false });
    const message = `🎮 Nintendo Museum 日历更新 (${targetDate})\n\n${JSON.stringify(filteredData, null, 2)}`;
    
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID || '', message);
    console.log('Telegram 消息已发送');

    const _canApply = canApply(filteredData);
    return NextResponse.json({ success: true, data: filteredData, canApply: _canApply, message: _canApply ? '🎉🎊 快买! ✨' : '😔 暂时不可以买 ❌',});
  } catch (error) {
    console.error('执行定时任务时出错:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
    return NextResponse.json({ error: 'Failed to fetch calendar data', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
} 