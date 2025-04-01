import { NextResponse } from 'next/server';
import TelegramBot from 'node-telegram-bot-api';
import { CalendarDay } from '@/types/calendar';
import { canApply } from '@/app/util';    

// 创建 Telegram Bot 实例
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || '', { polling: false });

// 发送 Telegram 消息的辅助函数
async function sendTelegramMessage(message: string) {
  try {
    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID || '', message);
    console.log('Telegram 消息已发送');
  } catch (error) {
    console.error('发送 Telegram 消息失败:', error);
  }
}

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
    
    const targetDate = '2025-06-29';
    const filteredData: CalendarDay = data.calendar[targetDate];
    
    console.log('过滤后的数据:', JSON.stringify(filteredData, null, 2));

    const _canApply = canApply(filteredData);
    
    // 只在可以购买时发送通知
    if (_canApply) {
      const message = `🎉 可以购买啦！\n\n日期: ${targetDate}\n\n详细信息:\n${JSON.stringify(filteredData, null, 2)}\n\n🎊 快去买票吧！✨`;
      await sendTelegramMessage(message);
    }

    return NextResponse.json({ 
      success: true, 
      data: filteredData, 
      canApply: _canApply, 
      message: _canApply ? '🎉🎊 快买! ✨' : '😔 暂时不可以买 ❌',
    });
  } catch (error) {
    console.error('执行定时任务时出错:', error);
    
    // 发送错误通知
    const errorMessage = `❌ 任务执行出错\n\n错误信息: ${error instanceof Error ? error.message : '未知错误'}\n\n时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
    await sendTelegramMessage(errorMessage);

    return NextResponse.json({ 
      error: 'Failed to fetch calendar data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 