// Global Application State
(function(window) {
  'use strict';
  
  window.AppState = {
    // Live routine dataset keyed by department->semester->section->day
    routineData: {},
    
    // Global state for departments and sections
    departments: [],
    departmentSections: {}, // { dept: { semester: [sections] } }
    
    // Live CR details loaded from DB (department->semester->section)
    crDetails: {},
    
    // Live version labels loaded from DB (department->semester)
    versionLabels: {},
    
    // Student page state
    currentDay: '',
    
    // Teacher page state
    allTeachers: {}, // { shortForm: { fullName, contact, mail, designation } }
    currentTeacherShort: '',
    currentTeacherDept: '',
    teacherRoutineData: {}, // { semester: { section: { day: [slots] } } }
    currentTeacherDay: '',
    activeTeacherDbRef: null,
    teacherDataLoaded: false, // Track if teacher data is already loaded
    loadedTeacherKey: '', // Track which teacher+dept combination is loaded
    
    // Empty Lottie animation instance
    emptyLottieInstance: null
  };
  
})(window);

