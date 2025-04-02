import axios from 'axios';

// 使用 Map 来存储消息和时间戳
class MessageQueue {
  private messages: Map<string, number>;
  private expirationTime: number; // 消息过期时间（毫秒）
  private lastSentTime: number; // 上次发送时间
  private rateLimitMs: number; // 限流时间（毫秒）

  constructor(expirationTimeMs: number = 30 * 60 * 1000, rateLimitMs: number = 5000) {
    this.messages = new Map();
    this.expirationTime = expirationTimeMs;
    this.lastSentTime = 0;
    this.rateLimitMs = rateLimitMs;
  }

  // 检查是否可以发送（限流检查）
  private canSend(): boolean {
    const now = Date.now();
    if (now - this.lastSentTime >= this.rateLimitMs) {
      this.lastSentTime = now;
      return true;
    }
    return false;
  }

  // 清理过期消息
  private cleanExpiredMessages() {
    const now = Date.now();
    for (const [message, timestamp] of this.messages.entries()) {
      if (now - timestamp >= this.expirationTime) {
        this.messages.delete(message);
      }
    }
  }

  // 添加消息到队列
  add(message: string): { canSend: boolean; isNewMessage: boolean } {
    // 清理过期消息
    this.cleanExpiredMessages();

    const now = Date.now();
    const isNewMessage = !this.messages.has(message);
    
    if (!isNewMessage) {
      return { canSend: false, isNewMessage: false };
    }

    const canSendNow = this.canSend();
    
    if (canSendNow) {
      this.messages.set(message, now);
    }
    
    return { canSend: canSendNow, isNewMessage: true };
  }

  // 检查消息是否存在
  has(message: string): boolean {
    this.cleanExpiredMessages();
    return this.messages.has(message);
  }

  // 清空队列
  clear() {
    this.messages.clear();
    this.lastSentTime = 0;
  }
}

// 创建消息队列实例
const messageQueue = new MessageQueue();

// 修改发送消息的函数
export async function sendTelegramMessage(message: string) {
  console.log('==== Telegram 消息发送开始 ====');
  console.log('当前时间:', new Date().toISOString());
  console.log('环境:', process.env.NODE_ENV);
  console.log('Bot Token 是否存在:', !!process.env.TELEGRAM_BOT_TOKEN);
  console.log('Chat ID 是否存在:', !!process.env.TELEGRAM_CHAT_ID);
  
  try {
    // 检查环境变量
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      throw new Error('TELEGRAM_BOT_TOKEN 未设置');
    }
    if (!process.env.TELEGRAM_CHAT_ID) {
      throw new Error('TELEGRAM_CHAT_ID 未设置');
    }

    // 检查消息是否可以发送
    const { canSend, isNewMessage } = messageQueue.add(message);
    console.log('消息检查结果:', { canSend, isNewMessage });
    
    if (!isNewMessage) {
      console.log('消息已在队列中，跳过发送');
      return;
    }

    if (!canSend) {
      console.log('触发限流，5秒内只能发送一次消息');
      return;
    }

    // 准备发送请求
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    console.log('准备发送请求到 Telegram API');
    
    const requestBody = {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML'
    };
    console.log('请求体:', JSON.stringify(requestBody, null, 2));

    const response = await axios.post(url, requestBody, {
      headers: {
        'Content-Type': 'application/json',
      }
    });

    console.log('Telegram API 响应状态:', response.status);
    console.log('Telegram API 响应内容:', JSON.stringify(response.data, null, 2));

    console.log('Telegram 消息发送成功');
  } catch (error) {
    console.error('==== Telegram 消息发送失败 ====');
    console.error('错误类型:', error instanceof Error ? error.constructor.name : typeof error);
    if (error instanceof Error) {
      console.error('错误消息:', error.message);
      console.error('错误堆栈:', error.stack);
    } else {
      console.error('未知错误:', error);
    }
    
    // 如果是 axios 错误，输出更详细的信息
    if (axios.isAxiosError(error)) {
      console.error('请求配置:', error.config);
      console.error('响应数据:', error.response?.data);
    }
  } finally {
    console.log('==== Telegram 消息发送结束 ====');
  }
}
