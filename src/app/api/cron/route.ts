import { NextResponse } from 'next/server';
import { sendTelegramMessage } from '@/app/send-message';

export async function GET(request: Request) {
  try {
    // 从 URL 获取参数
    const { searchParams } = new URL(request.url);
    const date = searchParams.get('date') || '2025-06-29';
    const forceSend = searchParams.get('forceSend') === 'true';

    // 调用 calendar API
    const calendarResponse = await fetch(`${request.url.split('/api/')[0]}/api/calendar?date=${date}`);

    if (!calendarResponse.ok) {
      throw new Error(`Calendar API 请求失败: ${calendarResponse.status}`);
    }

    const calendarData = await calendarResponse.json();
    
    // 根据返回结果发送消息
    if (calendarData.canApply || forceSend) {
      const status = calendarData.canApply ? '🎉 可以购买啦！' : '😔 暂时不可以买';
      const message = `${status}\n\n日期: ${date}\n\n详细信息:\n${JSON.stringify(calendarData.data, null, 2)}\n\n${calendarData.canApply ? '🎊 快去买票吧！✨' : '❌ 继续等待'}`;
      void sendTelegramMessage(message);
    }

    return NextResponse.json(calendarData);
  } catch (error) {
    console.error('执行定时任务时出错:', error);
    
    // 发送错误通知
    const errorMessage = `❌ 任务执行出错\n\n错误信息: ${error instanceof Error ? error.message : '未知错误'}\n\n时间: ${new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' })}`;
    void sendTelegramMessage(errorMessage);

    return NextResponse.json({ 
      error: 'Failed to fetch calendar data', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
} 