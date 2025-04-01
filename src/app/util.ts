import { CalendarDay } from "@/types/calendar";

export function canApply(calendarDay: CalendarDay) {
  return calendarDay.sale_status === 1 && calendarDay.open_status === 1;
}
