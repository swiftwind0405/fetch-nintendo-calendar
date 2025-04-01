/**
 * 日期标签信息
 */
export interface DayLabel {
  /** 颜色代码 */
  color_code: number;
  /** 标签消息 */
  message: string;
}

/**
 * 日历每天的数据
 */
export interface CalendarDay {
  /** 申请类型 */
  apply_type?: number;
  /** 销售状态：1-可售，2-抽签*/
  sale_status?: number;
  /** 开放状态：1-开放，2-关闭 */
  open_status?: number;
  /** 节假日信息 */
  holiday?: string | null;
  /** 日期标签信息 */
  day_label?: DayLabel | null;
  /** 是否临时关闭 */
  is_temporary_closure?: boolean;
  /** 临时关闭时间 */
  temporary_closure_time?: string | null;
  /** 是否举办活动 */
  is_holding?: boolean;
}

/**
 * 日历数据结构
 */
export interface CalendarData {
  data: {
    calendar: {
      /** 日期作为键，对应的日历数据作为值 */
      [date: string]: CalendarDay;
    };
  };
} 