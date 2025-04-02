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
  console.log('开始发送 Telegram 消息...');
  console.log('Bot Token:', process.env.TELEGRAM_BOT_TOKEN?.slice(0, 10) + '...');
  console.log('Chat ID:', process.env.TELEGRAM_CHAT_ID);
  
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
    
    if (!isNewMessage) {
      console.log('消息已在队列中，跳过发送');
      return;
    }

    if (!canSend) {
      console.log('触发限流，5秒内只能发送一次消息');
      return;
    }

    // 使用 fetch 发送消息
    const url = `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: process.env.TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML'
      })
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Telegram API 错误: ${response.status} ${errorData}`);
    }

    console.log('Telegram 消息发送成功');
  } catch (error) {
    console.error('发送 Telegram 消息失败:', error);
    if (error instanceof Error) {
      console.error('错误详情:', error.message);
      console.error('错误堆栈:', error.stack);
    }
  }
}
