/**
 * 将分钟数转换为易读的时间格式
 * @param minutes 总分钟数
 * @returns 形如 "1 年 2 月 3 日 4 小时 5 分钟" 的字符串
 */
export function formatInterval(minutes: number): string {
  const MINUTES_IN_HOUR = 60;
  const MINUTES_IN_DAY = 24 * MINUTES_IN_HOUR;
  const MINUTES_IN_MONTH = 30 * MINUTES_IN_DAY; // 简化为 30 天一个月
  const MINUTES_IN_YEAR = 12 * MINUTES_IN_MONTH;

  const years = Math.floor(minutes / MINUTES_IN_YEAR);
  const months = Math.floor((minutes % MINUTES_IN_YEAR) / MINUTES_IN_MONTH);
  const days = Math.floor((minutes % MINUTES_IN_MONTH) / MINUTES_IN_DAY);
  const hours = Math.floor((minutes % MINUTES_IN_DAY) / MINUTES_IN_HOUR);
  const mins = minutes % MINUTES_IN_HOUR;

  const parts: string[] = [];
  if (years) parts.push(`${years} 年`);
  if (months) parts.push(`${months} 月`);
  if (days) parts.push(`${days} 天`);
  if (hours) parts.push(`${hours} 小时`);
  if (mins || parts.length === 0) parts.push(`${mins} 分钟`);

  return parts.join(" ");
}
