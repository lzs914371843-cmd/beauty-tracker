import React, { useState } from 'react';

export default function App() {
  const [reminderTime, setReminderTime] = useState('20:00');

  // 核心函数：导出并下载 .ics 日历文件
  const exportCalendarReminder = () => {
    const [hours, minutes] = reminderTime.split(':');
    
    // 获取当前时间构建事件
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');

    // 日历事件开始时间与结束时间
    const dtStart = `${year}${month}${day}T${hh}${mm}00`;
    const endDate = new Date(now.getTime() + 15 * 60000);
    const endHH = String(endDate.getHours()).padStart(2, '0');
    const endMM = String(endDate.getMinutes()).padStart(2, '0');
    const dtEnd = `${year}${month}${day}T${endHH}${endMM}00`;

    // 构建 ICS 文件标准格式
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Beauty Tracker//CN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      'SUMMARY:变好看日志打卡',
      'DESCRIPTION:记得打开 App，记录今天的变好看数据哦！',
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      'RRULE:FREQ=DAILY', // 每天重复
      'BEGIN:VALARM',     // 触发提醒
      'ACTION:DISPLAY',
      'DESCRIPTION:变好看日志打卡',
      'TRIGGER:-PT0M',    // 到点即提醒
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    // 下载文件
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', 'beauty_tracker_reminder.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h2>✨ 变好看日志</h2>
      
      {/* 提醒设置卡片 */}
      <div style={{
        padding: '16px',
        backgroundColor: '#f9f9f9',
        borderRadius: '12px',
        border: '1px solid #eee',
        marginTop: '20px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px' }}>⏰ 设置每日打卡提醒</h3>
        
        <div style={{ marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <label style={{ fontSize: '14px', color: '#666' }}>提醒时间：</label>
          <input 
            type="time" 
            value={reminderTime} 
            onChange={(e) => setReminderTime(e.target.value)}
            style={{
              padding: '6px 10px',
              fontSize: '16px',
              border: '1px solid #ccc',
              borderRadius: '6px'
            }}
          />
        </div>

        <button 
          onClick={exportCalendarReminder}
          style={{
            width: '100%',
            backgroundColor: '#FF6B81',
            color: '#fff',
            border: 'none',
            padding: '12px',
            borderRadius: '8px',
            fontSize: '15px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          📅 同步到手机日历设置提醒
        </button>
      </div>
    </div>
  );
}
