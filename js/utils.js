// Utility Functions
(function(window) {
  'use strict';
  
  if (!window.AppUtils) {
    window.AppUtils = {};
  }
  
  const Utils = window.AppUtils;
  const Config = window.AppConfig;
  const State = window.AppState;
  
  // Date and time utilities
  Utils.getTodayInfo = function() {
    const now = new Date();
    const wd = now.getDay(); // 0 Sun .. 6 Sat
    const map = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
    const dayName = map[wd];
    const dd = String(now.getDate()).padStart(2, '0');
    const short = now.toLocaleString(undefined, { weekday: 'short' });
    return { dayName, label: `${short} ${dd}` };
  };
  
  Utils.getDateForDay = function(dayName) {
    const now = new Date();
    const currentDay = now.getDay();
    const dayMap = { 'Sunday': 0, 'Monday': 1, 'Tuesday': 2, 'Wednesday': 3, 'Thursday': 4, 'Saturday': 6 };
    const targetDay = dayMap[dayName];
    let daysToAdd = targetDay - currentDay;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }
    const targetDate = new Date(now);
    targetDate.setDate(now.getDate() + daysToAdd);
    return String(targetDate.getDate()).padStart(2, '0');
  };
  
  Utils.parseTime = function(timeStr) {
    const m = timeStr.match(/(\d{1,2}):(\d{2})/);
    if (!m) return 0;
    return parseInt(m[1],10) * 60 + parseInt(m[2],10);
  };
  
  // Semester label mapping
  Utils.semLabel = function(code) {
    const map = {
      '1-1': '1st', '1-2': '2nd',
      '2-1': '3rd', '2-2': '4th',
      '3-1': '5th', '3-2': '6th',
      '4-1': '7th', '4-2': '8th'
    };
    return map[code] || code || '';
  };
  
  // Cache helpers
  Utils.getCacheKey = function(department, semester, section) {
    return `cse.routine.${department}.${semester}.${section}`;
  };
  
  Utils.saveRoutineToCache = function(department, semester, section, data) {
    try {
      localStorage.setItem(Utils.getCacheKey(department, semester, section), JSON.stringify(data || {}));
    } catch (_) {}
  };
  
  Utils.loadRoutineFromCache = function(department, semester, section) {
    try {
      const raw = localStorage.getItem(Utils.getCacheKey(department, semester, section));
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  };
  
  // Persistence helpers
  Utils.persistSelection = function(department, semester, section) {
    localStorage.setItem('cse.department', department);
    localStorage.setItem('cse.semester', semester);
    localStorage.setItem('cse.section', section);
    localStorage.setItem('cse.hasVisited', '1');
  };
  
  Utils.getPersistedSelection = function() {
    const department = localStorage.getItem('cse.department');
    const semester = localStorage.getItem('cse.semester');
    const section = localStorage.getItem('cse.section');
    return department && semester && section ? { department, semester, section } : null;
  };
  
  // Nested object helper
  Utils.ensureNested = function(obj, k1, k2, k3) {
    if (!obj[k1]) obj[k1] = {};
    if (!obj[k1][k2]) obj[k1][k2] = {};
    if (!obj[k1][k2][k3]) obj[k1][k2][k3] = { Saturday: [], Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [] };
    return obj[k1][k2][k3];
  };
  
})(window);

