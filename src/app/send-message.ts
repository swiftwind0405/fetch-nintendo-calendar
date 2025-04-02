import TelegramBot from "node-telegram-bot-api";

// 创建一个消息队列类来管理消息
class MessageQueue {
  private messages: Set<string>;
  private expirationTime: number; // 消息过期时间（毫秒）
  private lastSentTime: number; // 上次发送时间
  private rateLimitMs: number; // 限流时间（毫秒）

  constructor(expirationTimeMs: number = 30 * 60 * 1000, rateLimitMs: number = 5000) {
    this.messages = new Set();
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

  // 添加消息到队列
  add(message: string): { canSend: boolean; isNewMessage: boolean } {
    const isNewMessage = !this.messages.has(message);
    
    if (!isNewMessage) {
      return { canSend: false, isNewMessage: false }; // 消息已存在
    }

    const canSendNow = this.canSend();
    
    if (canSendNow) {
      this.messages.add(message);
      
      // 设置过期时间后自动删除消息
      setTimeout(() => {
        this.messages.delete(message);
      }, this.expirationTime);
    }
    
    return { canSend: canSendNow, isNewMessage: true };
  }

  // 检查消息是否存在
  has(message: string): boolean {
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

// 创建 Telegram Bot 实例
const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN || '', { polling: false });

// 修改发送消息的函数
export async function sendTelegramMessage(message: string) {
    console.log('sendTelegramMessage', message);
  try {
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

    await bot.sendMessage(process.env.TELEGRAM_CHAT_ID || '', message);
    console.log('Telegram 消息已发送');
  } catch (error) {
    console.error('发送 Telegram 消息失败:', error);
  }
}
