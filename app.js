(function () {
  // Use modules if available, otherwise fallback to local definitions
  const PRIMARY_COLOR = window.AppConfig?.PRIMARY_COLOR || '#6C63FF';
  const DAYS_ORDER = window.AppConfig?.DAYS_ORDER || ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'];
  const DEPARTMENT_LOCK_MODE = window.AppConfig?.DEPARTMENT_LOCK_MODE || 'yes';
  const db = window.AppConfig?.db || (window.firebase ? window.firebase.database() : null);

  // Use state from module if available, otherwise create local
  const routineData = window.AppState?.routineData || {};
  const crDetails = window.AppState?.crDetails || {};
  const versionLabels = window.AppState?.versionLabels || {};
  let departments = window.AppState?.departments || [];
  let departmentSections = window.AppState?.departmentSections || {};
  let departmentAvailability = {}; // { 'EEE': true, 'CSE': false, ... }

  // Sync with AppState if it exists
  if (window.AppState) {
    window.AppState.routineData = routineData;
    window.AppState.crDetails = crDetails;
    window.AppState.versionLabels = versionLabels;
    window.AppState.departments = departments;
    window.AppState.departmentSections = departmentSections;
  }

  const els = {
    screens: {
      landing: document.getElementById('landing'),
      student: document.getElementById('student'),
      teacher: document.getElementById('teacher'),
      empty: document.getElementById('empty'), // "Empty" was the old placeholder for "More"
      more: document.getElementById('more'),   // Add "more" explicitly
      query: document.getElementById('query'),
      booking: document.getElementById('booking'),
      privacy: document.getElementById('privacy'),
      support: document.getElementById('support'),
      information: document.getElementById('information')
    },
    landingOverlay: document.getElementById('landingOverlay'),
    // Query screen elements
    roomQueryTab: document.getElementById('roomQueryTab'),

    crInfoTab: document.getElementById('crInfoTab'),
    roomQueryInterface: document.getElementById('roomQueryInterface'),
    crInfoInterface: document.getElementById('crInfoInterface'),
    roomQueryDepartment: document.getElementById('roomQueryDepartment'),
    roomQuerySearchBy: document.getElementById('roomQuerySearchBy'),
    roomQueryThirdSelect: document.getElementById('roomQueryThirdSelect'),
    roomQueryThirdLabel: document.getElementById('roomQueryThirdLabel'),
    roomQueryDaySelectorWrapper: document.getElementById('roomQueryDaySelectorWrapper'),
    roomQueryDayTitle: document.getElementById('roomQueryDayTitle'),
    roomQueryDayScroller: document.getElementById('roomQueryDayScroller'),
    roomQueryDateToday: document.getElementById('roomQueryDateToday'),
    roomQueryLottie: document.getElementById('roomQueryLottie'),
    roomQueryResults: document.getElementById('roomQueryResults'),
    crInfoDepartment: document.getElementById('crInfoDepartment'),
    crInfoSemester: document.getElementById('crInfoSemester'),
    crInfoSection: document.getElementById('crInfoSection'),
    crInfoLottie: document.getElementById('crInfoLottie'),
    crInfoResults: document.getElementById('crInfoResults'),
    department: document.getElementById('department'),
    lottie: document.getElementById('lottie'),
    getSchedule: document.getElementById('getSchedule'),
    landingError: document.getElementById('landingError'),
    semester: document.getElementById('semester'),
    section: document.getElementById('section'),
    // student screen
    departmentDisplay: document.getElementById('departmentDisplay'),
    semesterDisplay: document.getElementById('semesterDisplay'),
    sectionDisplay: document.getElementById('sectionDisplay'),
    // removed edit/apply buttons; direct editing instead
    detailsSemester: document.getElementById('detailsSemester'),
    detailsSection: document.getElementById('detailsSection'),
    detailsTotal: document.getElementById('detailsTotal'),
    detailsVersion: document.getElementById('detailsVersion'),
    detailsCR1: document.getElementById('detailsCR1'),
    detailsCR2: document.getElementById('detailsCR2'),
    dayScroller: document.getElementById('dayScroller'),
    dateToday: document.getElementById('dateToday'),
    scheduleContainer: document.getElementById('scheduleContainer'),
    emptyMessage: document.getElementById('emptyMessage'),
    emptyLottie: document.getElementById('emptyLottie'),
    networkMessage: document.getElementById('networkMessage'),
    tabs: Array.from(document.querySelectorAll('.tabbar .tab')),
    // teacher screen
    teacherSearch: document.getElementById('teacherSearch'),
    teacherSuggestions: document.getElementById('teacherSuggestions'),
    teacherDepartment: document.getElementById('teacherDepartment'),
    teacherDetailsName: document.getElementById('teacherDetailsName'),
    teacherDetailsBatch: document.getElementById('teacherDetailsBatch'),
    teacherDetailsTotal: document.getElementById('teacherDetailsTotal'),
    teacherDetailsVersion: document.getElementById('teacherDetailsVersion'),
    teacherDayScroller: document.getElementById('teacherDayScroller'),
    teacherDateToday: document.getElementById('teacherDateToday'),
    teacherLottie: document.getElementById('teacherLottie'),
    teacherScheduleContainer: document.getElementById('teacherScheduleContainer'),
    teacherEmptyMessage: document.getElementById('teacherEmptyMessage'),
    teacherNetworkMessage: document.getElementById('teacherNetworkMessage'),
    teacherContactBtn: document.getElementById('teacherContactBtn'),
    teacherContactPopup: document.getElementById('teacherContactPopup'),
    teacherContactClose: document.getElementById('teacherContactClose'),
    teacherContactTitle: document.getElementById('teacherContactTitle'),
    teacherContactDesignation: document.getElementById('teacherContactDesignation'),
    teacherContactPhone: document.getElementById('teacherContactPhone'),
    teacherContactEmail: document.getElementById('teacherContactEmail'),
    teacherContactDepartment: document.getElementById('teacherContactDepartment'),
    // Student loading overlay
    appRoot: document.getElementById('app'),
    studentLoadingOverlay: document.getElementById('studentLoadingOverlay'),
    // Auth elements
    authView: document.getElementById('authView'),
    menuView: document.getElementById('menuView'),
    profileIcon: document.getElementById('profileIcon'),
    // Booking elements
    bookingMenuOption: document.getElementById('bookingMenuOption'),
    bookingModal: document.getElementById('bookingModal'),
    bookingModalClose: document.getElementById('bookingModalClose'),
    // bookingForm removed, replaced by new UI flow elements:
    bookingQueryDepartment: document.getElementById('bookingQueryDepartment'),
    bookingQuerySearchBy: document.getElementById('bookingQuerySearchBy'),
    bookingQueryThirdSelect: document.getElementById('bookingQueryThirdSelect'),
    bookingQueryThirdLabel: document.getElementById('bookingQueryThirdLabel'),
    bookingQueryDay: document.getElementById('bookingQueryDay'),
    bookingQuerySearchBtn: document.getElementById('bookingQuerySearchBtn'),
    bookingQueryResults: document.getElementById('bookingQueryResults'),
    bookingConfirmPopup: document.getElementById('bookingConfirmPopup'),
    bookingConfirmClose: document.getElementById('bookingConfirmClose'),
    bookingConfirmForm: document.getElementById('bookingConfirmForm'),
    bookingConfirmDate: document.getElementById('bookingConfirmDate'),
    bookingConfirmReason: document.getElementById('bookingConfirmReason'),
    bookingConfirmRoom: document.getElementById('bookingConfirmRoom'),
    bookingConfirmTime: document.getElementById('bookingConfirmTime'),
    bookingConfirmDetails: document.getElementById('bookingConfirmDetails'),
    // Booking Tab Elements
    bookingTab: document.getElementById('bookingTab'),
    historyTab: document.getElementById('historyTab'),
    bookingInterface: document.getElementById('bookingInterface'),
    historyInterface: document.getElementById('historyInterface')
  };

  function enableRipple(node) {
    if (!node || node.dataset.ripple === 'true') return;
    node.dataset.ripple = 'true';

    // Add multiple event listeners for better browser/webview compatibility
    node.addEventListener('click', handleRipple);
    node.addEventListener('touchstart', handleRipple, { passive: true });
    node.addEventListener('pointerdown', handleRipple);
  }

  function handleRipple(event) {
    const target = event.currentTarget;
    if (!target) return;

    // Prevent multiple ripples from same event sequence
    if (target.querySelector('.touch-ripple')) {
      return;
    }

    const rect = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'touch-ripple';
    const maxDimension = Math.max(rect.width, rect.height);
    const baseSize = Math.min(Math.max(maxDimension * 1.35, 80), 140);

    // For tab buttons, start ripple from icon center (middle of button)
    // For other elements, use click/touch position
    const isTab = target.classList.contains('tab');
    let originX, originY;

    if (isTab) {
      // Start from center of tab button (where icon is positioned)
      originX = rect.width / 2;
      originY = rect.height / 2;
    } else {
      // Use click/touch position for other elements
      const clientX = event.clientX ?? (event.touches && event.touches[0]?.clientX) ?? (event.changedTouches && event.changedTouches[0]?.clientX);
      const clientY = event.clientY ?? (event.touches && event.touches[0]?.clientY) ?? (event.changedTouches && event.changedTouches[0]?.clientY);
      originX = (clientX ?? rect.left + rect.width / 2) - rect.left;
      originY = (clientY ?? rect.top + rect.height / 2) - rect.top;
    }

    ripple.style.width = ripple.style.height = `${baseSize}px`;
    ripple.style.left = `${originX - baseSize / 2}px`;
    ripple.style.top = `${originY - baseSize / 2}px`;
    ripple.style.animationDuration = '400ms';
    target.appendChild(ripple);
    ripple.addEventListener('animationend', () => ripple.remove());
  }

  // Init Teacher Lottie animation
  let teacherLottieInstance = null;
  function initTeacherLottie() {
    if (!window.lottie || !els.teacherLottie) return;
    // Don't reinitialize if already loaded
    if (teacherLottieInstance) return;
    try {
      teacherLottieInstance = window.lottie.loadAnimation({
        container: els.teacherLottie,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'animation_file/Loading_initial.json'
      });
    } catch (e) {
      console.warn('Failed to load teacher lottie:', e);
    }
  }

  // Show/hide teacher lottie based on data availability
  function updateTeacherLottieVisibility() {
    if (!els.teacherLottie) return;
    const hasTeacherName = els.teacherDetailsName && els.teacherDetailsName.textContent.trim() !== '';
    const hasScheduleData = els.teacherScheduleContainer && els.teacherScheduleContainer.children.length > 0;

    if (hasTeacherName || hasScheduleData) {
      // Hide lottie when data is shown
      els.teacherLottie.classList.add('hidden');
      if (teacherLottieInstance) {
        teacherLottieInstance.pause();
      }
    } else {
      // Show lottie when no data
      els.teacherLottie.classList.remove('hidden');
      if (teacherLottieInstance) {
        teacherLottieInstance.play();
      } else {
        initTeacherLottie();
      }
    }
  }

  // Init Lottie animation (first visit landing screen)
  function initLottie() {
    if (!window.lottie || !els.lottie) return;
    try {
      // Use cached animation data if available (instant load)
      if (window.__landingAnimationData) {
        window.lottie.loadAnimation({
          container: els.lottie,
          renderer: 'svg',
          loop: true,
          autoplay: true,
          animationData: window.__landingAnimationData
        });
        return;
      }

      // Fallback: try to get from localStorage cache
      try {
        const cached = localStorage.getItem('cse.landingAnimationData');
        const cachedVersion = localStorage.getItem('cse.landingAnimationData.version');
        if (cached && cachedVersion === '1') {
          const animationData = JSON.parse(cached);
          window.__landingAnimationData = animationData;
          window.lottie.loadAnimation({
            container: els.lottie,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData
          });
          return;
        }
      } catch (e) {
        // Cache invalid, use path fallback
      }

      // Final fallback: load from path (slower but works)
      window.lottie.loadAnimation({
        container: els.lottie,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: 'animation_file/loading.json'
      });
    } catch (_) { }
  }

  // Track empty Lottie animation instance
  let emptyLottieInstance = null;
  let emptyLottieLoading = false;

  // Track query page Lottie animation instances
  let roomQueryLottieInstance = null;
  let roomQueryLottieLoading = false;
  let crInfoLottieInstance = null;
  let crInfoLottieLoading = false;


  // Init empty Lottie animation (panda sleeping)
  function initEmptyLottie() {
    if (emptyLottieInstance || emptyLottieLoading) return;
    emptyLottieLoading = true;
    // Wait for Lottie library to be available
    if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
      emptyLottieLoading = false;
      return;
    }
    if (!els.emptyLottie) {
      emptyLottieLoading = false;
      return;
    }
    // Check if container is visible
    if (els.emptyMessage.classList.contains('hidden')) {
      emptyLottieLoading = false;
      return;
    }
    // Clear container before loading new animation
    els.emptyLottie.innerHTML = '';

    // Fetch the JSON file and load it
    fetch('animation_file/Panda sleeping waiting lottie animation.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(animationData => {
        // Double-check container is still visible and Lottie is available
        if (els.emptyMessage.classList.contains('hidden')) {
          return;
        }
        if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
          emptyLottieLoading = false;
          return;
        }
        try {
          emptyLottieInstance = window.lottie.loadAnimation({
            container: els.emptyLottie,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData
          });
          emptyLottieLoading = false;
        } catch (e) {
          console.error('Failed to initialize Lottie animation:', e);
          emptyLottieLoading = false;
        }
      })
      .catch(error => {
        console.error('Failed to load empty Lottie animation file:', error);
        emptyLottieLoading = false;
      });
  }

  // Init room query Lottie animation (waiting cat)
  function initRoomQueryLottie() {
    if (roomQueryLottieInstance || roomQueryLottieLoading) return;
    roomQueryLottieLoading = true;
    if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
      roomQueryLottieLoading = false;
      return;
    }
    if (!els.roomQueryLottie) {
      roomQueryLottieLoading = false;
      return;
    }
    // Check if container should be visible
    if (!els.roomQueryLottie.classList.contains('showing')) {
      roomQueryLottieLoading = false;
      return;
    }
    // Clear container before loading new animation
    els.roomQueryLottie.innerHTML = '';

    // Fetch the JSON file and load it
    fetch('animation_file/Waiting cat.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(animationData => {
        // Double-check container is still visible and Lottie is available
        if (!els.roomQueryLottie.classList.contains('showing')) {
          return;
        }
        if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
          roomQueryLottieLoading = false;
          return;
        }
        try {
          roomQueryLottieInstance = window.lottie.loadAnimation({
            container: els.roomQueryLottie,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData
          });
          roomQueryLottieLoading = false;
        } catch (e) {
          console.error('Failed to initialize room query Lottie animation:', e);
          roomQueryLottieLoading = false;
        }
      })
      .catch(error => {
        console.error('Failed to load room query Lottie animation file:', error);
        roomQueryLottieLoading = false;
      });
  }

  // Init CR info Lottie animation (lovely cats)
  function initCRInfoLottie() {
    if (crInfoLottieInstance || crInfoLottieLoading) return;
    crInfoLottieLoading = true;
    if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
      crInfoLottieLoading = false;
      return;
    }
    if (!els.crInfoLottie) {
      crInfoLottieLoading = false;
      return;
    }
    // Check if container should be visible
    if (!els.crInfoLottie.classList.contains('showing')) {
      crInfoLottieLoading = false;
      return;
    }
    // Clear container before loading new animation
    els.crInfoLottie.innerHTML = '';

    // Fetch the JSON file and load it
    fetch('animation_file/Lovely cats.json')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then(animationData => {
        // Double-check container is still visible and Lottie is available
        if (!els.crInfoLottie.classList.contains('showing')) {
          return;
        }
        if (!window.lottie || typeof window.lottie.loadAnimation !== 'function') {
          crInfoLottieLoading = false;
          return;
        }
        try {
          crInfoLottieInstance = window.lottie.loadAnimation({
            container: els.crInfoLottie,
            renderer: 'svg',
            loop: true,
            autoplay: true,
            animationData: animationData
          });
          crInfoLottieLoading = false;
        } catch (e) {
          console.error('Failed to initialize CR info Lottie animation:', e);
          crInfoLottieLoading = false;
        }
      })
      .catch(error => {
        console.error('Failed to load CR info Lottie animation file:', error);
        crInfoLottieLoading = false;
      });
  }

  // Show room query lottie
  function showRoomQueryLottie() {
    if (!els.roomQueryLottie) return;
    els.roomQueryLottie.classList.add('showing');
    // Initialize lottie if not already loaded
    if (!roomQueryLottieInstance && !roomQueryLottieLoading) {
      setTimeout(() => {
        if (els.roomQueryLottie.classList.contains('showing')) {
          initRoomQueryLottie();
        }
      }, 150);
    }
  }

  // Hide room query lottie
  function hideRoomQueryLottie() {
    if (els.roomQueryLottie) {
      els.roomQueryLottie.classList.remove('showing');
      // Destroy lottie instance when hiding
      if (roomQueryLottieInstance) {
        roomQueryLottieInstance.destroy();
        roomQueryLottieInstance = null;
      }
    }
  }

  // Show CR info lottie
  function showCRInfoLottie() {
    if (!els.crInfoLottie) return;
    els.crInfoLottie.classList.add('showing');
    // Initialize lottie if not already loaded
    if (!crInfoLottieInstance && !crInfoLottieLoading) {
      setTimeout(() => {
        if (els.crInfoLottie.classList.contains('showing')) {
          initCRInfoLottie();
        }
      }, 150);
    }
  }

  // Hide CR info lottie
  function hideCRInfoLottie() {
    if (els.crInfoLottie) {
      els.crInfoLottie.classList.remove('showing');
      // Destroy lottie instance when hiding
      if (crInfoLottieInstance) {
        crInfoLottieInstance.destroy();
        crInfoLottieInstance = null;
      }
    }
  }

  function showStudentLoading() {
    if (!els.studentLoadingOverlay) return;
    document.body.classList.add('student-loading-lock');
    // Show overlay immediately - CSS animation handles the loader
    els.studentLoadingOverlay.classList.remove('hidden');
  }

  function hideStudentLoading() {
    if (els.studentLoadingOverlay) {
      els.studentLoadingOverlay.classList.add('hidden');
    }
    document.body.classList.remove('student-loading-lock');
  }


  // Utilities
  function setScreen(name) {
    // Scroll to top when switching screens
    // Because body has height:100% and overflow-y:auto, we must scroll the body element
    window.scrollTo(0, 0);
    document.body.scrollTop = 0;
    document.documentElement.scrollTop = 0;
    setTimeout(() => {
      window.scrollTo(0, 0);
      document.body.scrollTop = 0;
      document.documentElement.scrollTop = 0;
    }, 10);

    // Prevent screen switching when landing screen is visible (except when going to student after selection)
    if (els.landingOverlay && !els.landingOverlay.classList.contains('hidden') && name !== 'student') {
      return;
    }

    // Auth Check for More Screen - Force UI refresh
    // Use fallback to legacy 'empty' map if needed
    if (name === 'more' || name === 'empty') {
      name = 'more'; // Ensure we use canonical name internally

      // Simple check: if firebase not ready, check localStorage 'user' key as fallback hint
      // or just default to Auth View if unknown.
      const isAuth = (window.firebase && window.firebase.auth().currentUser);

      if (isAuth) {
        // Logged in
        if (els.authView) els.authView.classList.add('hidden');
        if (els.menuView) els.menuView.classList.remove('hidden');
        if (els.profileIcon) els.profileIcon.classList.remove('hidden');
      } else {
        // Logged out
        if (els.authView) els.authView.classList.remove('hidden');
        if (els.menuView) els.menuView.classList.add('hidden');
        if (els.profileIcon) els.profileIcon.classList.add('hidden');
      }
    }

    Object.entries(els.screens).forEach(([key, node]) => {
      if (!node) return;
      if (key === name) {
        node.classList.remove('hidden');
      } else {
        node.classList.add('hidden');
      }
    });

    // Update active tab state
    els.tabs.forEach(btn => {
      // Check data-tab attribute match
      const isMore = (['more', 'booking', 'privacy', 'support', 'information'].includes(name) && (btn.dataset.tab === 'more' || btn.dataset.tab === 'empty'));
      const isMatch = btn.dataset.tab === name;
      btn.classList.toggle('active', isMatch || isMore);
    });

    // Update icons based on active page
    updateTabIcons(name);

    // Convert landing screen selects to custom dropdowns (same as student page)
    if (name === 'landing') {
      setTimeout(() => {
        if (els.department && !els.department.dataset.converted) convertSelectToCustomDropdown(els.department);
        if (els.semester && !els.semester.dataset.converted) convertSelectToCustomDropdown(els.semester);
        if (els.section && !els.section.dataset.converted) convertSelectToCustomDropdown(els.section);
      }, 200);
    }

    // Convert selects to custom dropdowns when student screen is shown
    if (name === 'student') {
      setTimeout(() => {
        if (els.departmentDisplay && !els.departmentDisplay.dataset.converted) convertSelectToCustomDropdown(els.departmentDisplay);
        if (els.semesterDisplay && !els.semesterDisplay.dataset.converted) convertSelectToCustomDropdown(els.semesterDisplay);
        if (els.sectionDisplay && !els.sectionDisplay.dataset.converted) convertSelectToCustomDropdown(els.sectionDisplay);
      }, 50);
    }

    if (name === 'teacher') {
      setTimeout(() => {
        if (els.teacherDepartment && !els.teacherDepartment.dataset.converted) convertSelectToCustomDropdown(els.teacherDepartment);
      }, 50);
    }

    if (name === 'query') {
      setTimeout(() => {
        if (els.roomQueryDaySelectorWrapper) els.roomQueryDaySelectorWrapper.classList.add('hidden');

        if (els.roomQueryDepartment && !els.roomQueryDepartment.dataset.converted) convertSelectToCustomDropdown(els.roomQueryDepartment);
        if (els.roomQuerySearchBy && !els.roomQuerySearchBy.dataset.converted) convertSelectToCustomDropdown(els.roomQuerySearchBy);
        if (els.roomQueryThirdSelect && !els.roomQueryThirdSelect.dataset.converted) convertSelectToCustomDropdown(els.roomQueryThirdSelect);

        if (els.crInfoDepartment && !els.crInfoDepartment.dataset.converted) convertSelectToCustomDropdown(els.crInfoDepartment);
        if (els.crInfoSemester && !els.crInfoSemester.dataset.converted) convertSelectToCustomDropdown(els.crInfoSemester);
        if (els.crInfoSection && !els.crInfoSection.dataset.converted) convertSelectToCustomDropdown(els.crInfoSection);

        checkRoomQueryDropdowns();
        checkCRInfoDropdowns();
      }, 50);
    }
  }

  // Dropdown animation helpers
  function showDropdown(dropdown) {
    if (!dropdown) return;
    // Remove hidden class first to make element visible
    dropdown.classList.remove('hidden', 'hiding');
    // Force reflow to ensure display change is applied
    dropdown.offsetHeight;
    // Add showing class to trigger animation
    dropdown.classList.add('showing');
  }

  function hideDropdown(dropdown) {
    if (!dropdown) return;
    // Remove showing class and add hiding class to trigger close animation
    dropdown.classList.remove('showing');
    dropdown.classList.add('hiding');
    // Wait for animation to complete before hiding
    setTimeout(() => {
      dropdown.classList.remove('hiding');
      dropdown.classList.add('hidden');
    }, 200); // Match CSS transition duration
  }

  // Helper function to check if an option is a placeholder
  function isPlaceholderOption(option) {
    if (!option) return false;
    const value = option.value || '';
    const text = option.textContent.trim() || '';
    // Check if it's a placeholder: empty value OR text starts with "Select" or is empty
    return value === '' || text === '' || /^select\s/i.test(text);
  }

  // Helper function to get button display text
  function getButtonText(selectElement) {
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    if (!selectedOption) return '';

    // Check if this is a placeholder option
    if (isPlaceholderOption(selectedOption)) {
      // For specific selects, show just "Select" instead of full placeholder text
      const selectId = selectElement.id;
      if (
        selectId === 'crInfoSemester' ||
        selectId === 'crInfoSection') {
        return 'Select';
      }
    }

    // Always show the selected option's text (whether placeholder or real option)
    return selectedOption.textContent;
  }

  // Convert native select to custom animated dropdown
  function convertSelectToCustomDropdown(selectElement) {
    if (!selectElement || selectElement.dataset.converted === 'true') return null;

    const wrapper = document.createElement('div');
    wrapper.className = 'custom-dropdown';

    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'custom-dropdown-button';
    if (selectElement.disabled) button.classList.add('disabled');

    const menu = document.createElement('div');
    menu.className = 'custom-dropdown-menu hidden';

    // Get current selected option and set button text
    button.textContent = getButtonText(selectElement);

    // Populate menu with options (excluding placeholder options)
    function updateMenu() {
      menu.innerHTML = '';
      Array.from(selectElement.options).forEach((option, index) => {
        // Skip placeholder options from the menu
        if (isPlaceholderOption(option)) {
          return;
        }

        const item = document.createElement('div');
        item.className = 'custom-dropdown-item';
        if (option.selected && !isPlaceholderOption(option)) {
          item.classList.add('selected');
        }
        if (option.disabled) item.classList.add('disabled');
        item.textContent = option.textContent;
        item.dataset.value = option.value;
        item.dataset.index = index;

        item.addEventListener('click', (e) => {
          if (option.disabled) return;
          e.stopPropagation();
          selectElement.selectedIndex = index;
          selectElement.dispatchEvent(new Event('change', { bubbles: true }));
          button.textContent = option.textContent;
          hideDropdown(menu);
          button.classList.remove('open');
          // Update selected state
          menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
          item.classList.add('selected');
        });

        menu.appendChild(item);
      });
    }

    updateMenu();

    // Toggle dropdown
    button.addEventListener('click', (e) => {
      e.stopPropagation();
      if (selectElement.disabled) return;

      const isOpen = menu.classList.contains('showing');

      // Close all other dropdowns
      document.querySelectorAll('.custom-dropdown-menu.showing').forEach(dd => {
        if (dd !== menu) {
          hideDropdown(dd);
          dd.closest('.custom-dropdown')?.querySelector('.custom-dropdown-button')?.classList.remove('open');
        }
      });

      if (isOpen) {
        hideDropdown(menu);
        button.classList.remove('open');
      } else {
        showDropdown(menu);
        button.classList.add('open');
      }
    });

    // Close dropdown when clicking outside - handled by global listener

    // Update button when select changes programmatically
    const observer = new MutationObserver(() => {
      button.textContent = getButtonText(selectElement);
      updateMenu();
    });
    observer.observe(selectElement, { childList: true, attributes: true, attributeFilter: ['selected'] });

    // Also listen to change events to update button text
    selectElement.addEventListener('change', () => {
      button.textContent = getButtonText(selectElement);
      updateMenu();
    });

    // Handle disabled state changes
    const disabledObserver = new MutationObserver(() => {
      if (selectElement.disabled) {
        button.classList.add('disabled');
        hideDropdown(menu);
        button.classList.remove('open');
      } else {
        button.classList.remove('disabled');
      }
    });
    disabledObserver.observe(selectElement, { attributes: true, attributeFilter: ['disabled'] });

    wrapper.appendChild(button);
    wrapper.appendChild(menu);

    // Replace select with custom dropdown
    selectElement.style.display = 'none';
    selectElement.dataset.converted = 'true';
    selectElement.parentNode.insertBefore(wrapper, selectElement);
    wrapper.appendChild(selectElement); // Keep select for form submission

    return wrapper;
  }

  function refreshCustomDropdown(selectElement) {
    if (!selectElement) return;
    const customWrapper = selectElement.closest('.custom-dropdown');
    if (!customWrapper) return;
    const button = customWrapper.querySelector('.custom-dropdown-button');
    const menu = customWrapper.querySelector('.custom-dropdown-menu');
    if (!button || !menu) return;

    button.textContent = getButtonText(selectElement);
    if (selectElement.disabled) {
      button.classList.add('disabled');
    } else {
      button.classList.remove('disabled');
    }

    menu.innerHTML = '';
    Array.from(selectElement.options).forEach((option, index) => {
      if (isPlaceholderOption(option)) return;

      const item = document.createElement('div');
      item.className = 'custom-dropdown-item';
      if (option.selected && !isPlaceholderOption(option)) {
        item.classList.add('selected');
      }
      if (option.disabled) item.classList.add('disabled');
      item.textContent = option.textContent;
      item.dataset.value = option.value;
      item.dataset.index = index;

      item.addEventListener('click', (e) => {
        if (option.disabled) return;
        e.stopPropagation();
        selectElement.selectedIndex = index;
        selectElement.dispatchEvent(new Event('change', { bubbles: true }));
        button.textContent = option.textContent;
        hideDropdown(menu);
        button.classList.remove('open');
        menu.querySelectorAll('.custom-dropdown-item').forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
      });

      menu.appendChild(item);
    });
  }

  function lockDepartmentSelect(selectElement) {
    if (!selectElement) return;

    // Department availability is now handled in updateAllDepartmentDropdowns
    // Unavailable departments are shown but disabled (cursor blocked)
    // This function is kept for backward compatibility
  }

  // Update tab icons based on active page
  function updateTabIcons(activeTab) {
    const studentIcon = document.getElementById('student-icon');
    const teacherIcon = document.getElementById('teacher-icon');
    const queryIcon = document.getElementById('query-icon');
    const moreIcon = document.getElementById('more-icon');

    if (!studentIcon || !teacherIcon || !queryIcon || !moreIcon) return;

    // Reset all icons to inactive state
    if (activeTab === 'student') {
      studentIcon.src = 'attachment/student.png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history (1).png';
      moreIcon.src = 'attachment/application (1).png';
    } else if (activeTab === 'teacher') {
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card.png';
      queryIcon.src = 'attachment/history (1).png';
      moreIcon.src = 'attachment/application (1).png';
    } else if (activeTab === 'query') {
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history.png';
      moreIcon.src = 'attachment/application (1).png';
    } else if (activeTab === 'more' || activeTab === 'empty' || activeTab === 'booking' || activeTab === 'privacy' || activeTab === 'support' || activeTab === 'information') {
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history (1).png';
      moreIcon.src = 'attachment/application.png';
    } else {
      // For landing or other pages, use inactive icons
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history (1).png';
      moreIcon.src = 'attachment/application (1).png';
    }
  }

  // Cache helpers for offline support
  function getCacheKey(department, semester, section) {
    return `cse.routine.${department}.${semester}.${section}`;
  }

  function saveRoutineToCache(department, semester, section, data) {
    try {
      localStorage.setItem(getCacheKey(department, semester, section), JSON.stringify(data || {}));
    } catch (_) { }
  }

  function loadRoutineFromCache(department, semester, section) {
    try {
      const raw = localStorage.getItem(getCacheKey(department, semester, section));
      return raw ? JSON.parse(raw) : null;
    } catch (_) { return null; }
  }

  function ensureNested(obj, k1, k2, k3) {
    if (!obj[k1]) obj[k1] = {};
    if (!obj[k1][k2]) obj[k1][k2] = {};
    if (!obj[k1][k2][k3]) obj[k1][k2][k3] = { Saturday: [], Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [] };
    return obj[k1][k2][k3];
  }

  let currentDepartment = '';
  let currentSemester = '';
  let currentSection = '';
  let currentDay = '';

  // Teacher page state
  let allTeachers = {}; // { shortForm: { fullName, contact, mail, designation } }
  let departmentTeachers = new Set(); // Lowercased teacher short forms for current department
  let currentTeacherShort = '';
  let currentTeacherDept = '';
  let teacherRoutineData = {}; // { semester: { section: { day: [slots] } } }
  let currentTeacherDay = '';
  let activeTeacherDbRef = null;
  let teacherDataLoaded = false; // Track if teacher data is already loaded
  let loadedTeacherKey = ''; // Track which teacher+dept combination is loaded

  // Load department availability from Firebase
  async function loadDepartmentAvailability() {
    if (!db) return;
    try {
      const snap = await db.ref('departmentAvailability').once('value');
      const data = snap.val();
      if (data) {
        departmentAvailability = data;
      } else {
        // Initialize: all departments enabled by default
        departments.forEach(dept => {
          if (departmentAvailability[dept.name] === undefined) {
            departmentAvailability[dept.name] = true;
          }
        });
      }
      updateAllDepartmentDropdowns();
    } catch (e) {
      console.error('Failed to load department availability:', e);
      // Initialize defaults
      departments.forEach(dept => {
        if (departmentAvailability[dept.name] === undefined) {
          departmentAvailability[dept.name] = true;
        }
      });
      updateAllDepartmentDropdowns();
    }
  }

  // Load departments from Firebase
  async function loadDepartments() {
    if (!db) return;
    try {
      const snap = await db.ref('departments').once('value');
      const deptData = snap.val();
      if (deptData && Array.isArray(deptData)) {
        departments = deptData.sort((a, b) => (a.order || 0) - (b.order || 0));
      } else if (deptData) {
        departments = Object.values(deptData).sort((a, b) => (a.order || 0) - (b.order || 0));
      } else {
        // Default to EEE if no departments exist
        departments = [{ name: 'EEE', order: 0 }];
      }
      await loadDepartmentAvailability();
      updateAllDepartmentDropdowns();
    } catch (e) {
      console.error('Failed to load departments:', e);
      departments = [{ name: 'EEE', order: 0 }];
      await loadDepartmentAvailability();
      updateAllDepartmentDropdowns();
    }
  }

  // Load sections for a department and semester
  async function loadDepartmentSections(dept, semester) {
    if (!db || !dept || !semester) return [];
    try {
      const snap = await db.ref(`departmentSections/${dept}/${semester}`).once('value');
      return snap.val() || [];
    } catch (e) {
      console.error('Failed to load sections:', e);
      return [];
    }
  }

  // Update all department dropdowns across all pages
  function updateAllDepartmentDropdowns() {
    const deptSelects = [
      els.department, els.departmentDisplay, els.teacherDepartment,
      els.roomQueryDepartment, els.crInfoDepartment, els.bookingQueryDepartment,
      document.getElementById('s_dept') // Signup department dropdown
    ].filter(el => el);

    deptSelects.forEach(select => {
      const currentVal = select.value || '';
      select.innerHTML = '';
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = 'Select Department';
      select.appendChild(ph);

      // Show all departments but disable unavailable ones (like before)
      departments.forEach(dept => {
        const opt = document.createElement('option');
        opt.value = dept.name;
        opt.textContent = dept.name;

        // Disable if department is not available (cursor will be blocked)
        const isAvailable = departmentAvailability[dept.name] !== false; // Default to true if not set
        if (!isAvailable) {
          opt.disabled = true;
        }

        if (dept.name === currentVal || (currentVal === '' && dept.name === 'EEE' && isAvailable)) {
          opt.selected = true;
        }
        select.appendChild(opt);
      });

      // Apply department lock after populating options (if needed)
      lockDepartmentSelect(select);
    });
  }

  // Attach real-time listener to RTDB path routines/{department}/{semester}/{section}
  let activeDbRef = null;
  function attachRoutineListener(department, semester, section) {
    if (!db) return;
    if (activeDbRef) activeDbRef.off();
    const ref = db.ref(`routines/${department}/${semester}/${section}`);
    activeDbRef = ref;
    ref.on('value', (snap) => {
      const value = snap.val() || { Saturday: [], Sunday: [], Monday: [], Tuesday: [], Wednesday: [], Thursday: [] };
      if (!routineData[department]) routineData[department] = {};
      if (!routineData[department][semester]) routineData[department][semester] = {};
      routineData[department][semester][section] = value;
      saveRoutineToCache(department, semester, section, value);
      // If user is viewing this dept/sem/sec, refresh current day
      if (department === currentDepartment && semester === currentSemester && section === currentSection) {
        const dayToRender = currentDay || getTodayInfo().dayName || 'Saturday';
        renderDay(dayToRender);
      }
    }, () => {
      // On error, fallback silently; UI shows last cached
    });

    // Also listen to CRs for this department, semester and section
    try {
      db.ref(`cr/${department}/${semester}/${section}`).on('value', (snap) => {
        if (!crDetails[department]) crDetails[department] = {};
        if (!crDetails[department][semester]) crDetails[department][semester] = {};
        crDetails[department][semester][section] = snap.val() || null;
        updateCRUI(department, semester, section);
      });
      // Also listen to version for this department and semester
      db.ref(`versions/${department}/${semester}`).on('value', (snap) => {
        if (!versionLabels[department]) versionLabels[department] = {};
        versionLabels[department][semester] = snap.val() || '';
        updateVersionUI(department, semester);
        // Update teacher version if on teacher page
        if (currentTeacherShort) {
          updateTeacherVersionInfo();
        }
      });
    } catch (_) { }
  }

  const persistSelection = window.AppUtils?.persistSelection || function (department, semester, section) {
    localStorage.setItem('cse.department', department);
    localStorage.setItem('cse.semester', semester);
    localStorage.setItem('cse.section', section);
    localStorage.setItem('cse.hasVisited', '1');
  };

  const getPersistedSelection = window.AppUtils?.getPersistedSelection || function () {
    const department = localStorage.getItem('cse.department');
    const semester = localStorage.getItem('cse.semester');
    const section = localStorage.getItem('cse.section');
    return department && semester && section ? { department, semester, section } : null;
  };

  // Use utility functions from module if available
  const getTodayInfo = window.AppUtils?.getTodayInfo || function () {
    const now = new Date();
    const wd = now.getDay();
    const map = { 0: 'Sunday', 1: 'Monday', 2: 'Tuesday', 3: 'Wednesday', 4: 'Thursday', 5: 'Friday', 6: 'Saturday' };
    const dayName = map[wd];
    const dd = String(now.getDate()).padStart(2, '0');
    const short = now.toLocaleString(undefined, { weekday: 'short' });
    return { dayName, label: `${short} ${dd}` };
  };

  const getDateForDay = window.AppUtils?.getDateForDay || function (dayName) {
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

  const semLabel = window.AppUtils?.semLabel || function (code) {
    const map = {
      '1-1': '1st', '1-2': '2nd',
      '2-1': '3rd', '2-2': '4th',
      '3-1': '5th', '3-2': '6th',
      '4-1': '7th', '4-2': '8th'
    };
    return map[code] || code || '';
  };

  // Predefined time slot order (same as admin page dropdown menu)
  // This ensures serial-wise sorting without clock conversion
  const TIME_SLOT_ORDER = [
    '9:00 - 10:25',
    '10:25 - 11:50',
    '11:50 - 1:15',
    '1:45 - 3:10',
    '3:10 - 4:35',
    '4:35 - 6:00'
  ];

  // Get time slot index for sorting (serial wise)
  const getTimeSlotIndex = window.AppUtils?.getTimeSlotIndex || function (timeStr) {
    if (!timeStr || typeof timeStr !== 'string') return 999; // Put unknown times at end

    // Clean the time string (remove extra spaces, normalize format)
    timeStr = timeStr.trim();

    // Try exact match first
    const exactIndex = TIME_SLOT_ORDER.indexOf(timeStr);
    if (exactIndex !== -1) return exactIndex;

    // Try matching with different separators (handle variations)
    for (let i = 0; i < TIME_SLOT_ORDER.length; i++) {
      const slot = TIME_SLOT_ORDER[i];
      // Normalize both strings for comparison (remove spaces, handle different separators)
      const normalizedSlot = slot.replace(/\s+/g, ' ').trim();
      const normalizedTime = timeStr.replace(/\s+/g, ' ').trim();

      // Check if time string matches or starts with slot pattern
      if (normalizedTime === normalizedSlot ||
        normalizedTime.startsWith(normalizedSlot.split(' - ')[0]) ||
        normalizedTime.includes(normalizedSlot.split(' - ')[0].replace(':', ''))) {
        return i;
      }
    }

    // If no match found, return large number to put at end
    return 999;
  };

  // Landing: Get Schedule
  els.getSchedule.addEventListener('click', async () => {
    const dept = els.department.value.trim();
    const sem = els.semester.value.trim();
    const sec = els.section.value.trim();
    if (!dept || !sem || !sec) {
      els.landingError.textContent = 'Please select Department, Semester and Section.';
      return;
    }
    els.landingError.textContent = '';
    persistSelection(dept, sem, sec);
    // Hide landing overlay before switching to student screen
    if (els.landingOverlay) {
      els.landingOverlay.classList.add('hidden');
      document.body.classList.remove('landing-lock');
    }
    setScreen('student');
    await loadStudent(dept, sem, sec);
  });

  // Bottom tabs - enable ripple effect for all tabs
  els.tabs.forEach(btn => {
    enableRipple(btn);
    btn.addEventListener('click', () => {
      // Prevent tab switching when landing screen is visible
      if (els.landingOverlay && !els.landingOverlay.classList.contains('hidden')) {
        return;
      }
      let tab = btn.dataset.tab;
      // Handle legacy 'empty' as 'more'
      if (tab === 'empty') tab = 'more';
      setScreen(tab);
      // Teacher data is already preloaded on page load, just show the UI
      // No need to reload when switching tabs
    });
  });

  async function loadUserBookingHistory(uid) {
    const container = document.getElementById('bookingHistoryContainer');
    if (!container) return;
    container.innerHTML = '<div style="font-size:12px;color:var(--muted);">Loading history...</div>';

    try {
      // Create a query for bookings by this user
      // Note: This requires index on 'userId' in Firebase rules for best performance
      const snap = await db.ref('booking_requests').orderByChild('userId').equalTo(uid).once('value');
      const data = snap.val() || {};
      const requests = Object.values(data).sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));

      container.innerHTML = '';
      if (requests.length === 0) {
        container.innerHTML = '<div style="font-size:12px;color:var(--muted);">No booking history.</div>';
        return;
      }

      requests.forEach(req => {
        const item = document.createElement('div');
        item.className = `history-card status-${req.status}`;

        const dateStr = req.date ? new Date(req.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '';
        const reqTimeStr = req.timestamp ? new Date(req.timestamp).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';

        item.innerHTML = `
            <div class="history-header">
                <div class="history-reason">${req.reason || 'No Reason'}</div>
                <div class="history-status">${req.status}</div>
            </div>
            <div class="history-body">
                <div class="history-row">
                    <span class="history-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg></span>
                    <span>${req.room}</span>
                </div>
                <div class="history-row">
                    <span class="history-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg></span>
                    <span>${req.time}</span>
                </div>
                <div class="history-row">
                    <span class="history-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg></span>
                    <span>${dateStr}</span>
                </div>
            </div>
            <div class="history-footer">
                Requested on ${reqTimeStr}
            </div>
        `;
        container.appendChild(item);
      });
    } catch (e) {
      console.error(e);
      container.innerHTML = '<div style="font-size:12px;color:var(--error);">Failed to load history.</div>';
    }
  }

  // Booking Management - Global Handler
  // Booking Management - Global Handler
  window.handleBookingClick = function () {
    const btn = document.getElementById('bookingMenuOption');
    if (btn) {
      // Visual feedback
      btn.style.opacity = '0.7';
      setTimeout(() => btn.style.opacity = '1', 150);
    }

    // Verify Firebase
    if (!window.firebase || !window.firebase.auth) {
      alert('Firebase not initialized. Please refresh.');
      return;
    }

    const user = window.firebase.auth().currentUser;
    if (!user) {
      // If not logged in, ensure we are on 'more' screen (login view)
      setScreen('more');
      return;
    }

    // Priority 1: Check Local Storage (User explicitly requested "local theke check hobe")
    let role = localStorage.getItem('user_role');

    // Priority 2: Check UI Text (User mentioned "name er nic a profile role show kortese")
    if (!role) {
      const roleEl = document.getElementById('userRole');
      if (roleEl && roleEl.textContent) {
        role = roleEl.textContent.trim();
      }
    }

    // Priority 3: Check Memory
    if (!role && userProfile && userProfile.role) {
      role = userProfile.role;
    }

    // Normalization
    role = (role || 'student').toLowerCase();

    // Fail-safe: if role is clearly student, deny access.
    if (role === 'student') {
      // Show access denied message
      const msg = document.createElement('div');
      msg.textContent = 'Access Denied: Restricted to CRs & Teachers';
      msg.style.position = 'fixed';
      msg.style.bottom = '80px';
      msg.style.left = '50%';
      msg.style.transform = 'translateX(-50%)';
      msg.style.background = '#e74c3c';
      msg.style.color = '#fff';
      msg.style.padding = '12px 24px';
      msg.style.borderRadius = '24px';
      msg.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      msg.style.zIndex = '9999';
      msg.style.animation = 'fadeInOut 3s ease forwards';
      document.body.appendChild(msg);
      setTimeout(() => msg.remove(), 3000);
      return;
    }

    // Allow access for CR and Teacher
    // Switch to dedicated Booking Screen instead of Modal
    if (els.screens && els.screens.booking) {
      setScreen('booking');

      // Initialize Booking Query UI
      initBookingQueryUI();

      // Load History
      if (typeof loadUserBookingHistory === 'function') {
        loadUserBookingHistory(user.uid);
      }
    } else {
      console.error('Booking screen not found');
      alert('Internal Error: Booking screen missing.');
    }
  };

  // Booking Back Button (New Screen)
  const bookingBackBtn = document.getElementById('bookingBackBtn');
  if (bookingBackBtn) {
    bookingBackBtn.addEventListener('click', () => {
      setScreen('more');
    });
  }

  // Support Back Button
  const supportBackBtn = document.getElementById('supportBackBtn');
  if (supportBackBtn) {
    supportBackBtn.addEventListener('click', () => {
      setScreen('more');
    });
  }

  // Support Menu Option Handler
  const supportOption = document.getElementById('supportOption');
  if (supportOption) {
    supportOption.addEventListener('click', () => {
      setScreen('support');
    });
  }

  // Support Form Handler
  const supportForm = document.getElementById('supportForm');
  if (supportForm) {
    supportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      // In a real app, send to database
      alert("Message sent! We'll get back to you soon.");
      supportForm.reset();
      setScreen('more');
    });
  }

  // Privacy Policy Global Handler (Accessible to all users)
  const privacyOption = document.getElementById('privacyOption');
  if (privacyOption) {
    privacyOption.addEventListener('click', () => {
      setScreen('privacy');
    });
  }

  // Privacy Back Button
  const privacyBackBtn = document.getElementById('privacyBackBtn');
  if (privacyBackBtn) {
    privacyBackBtn.addEventListener('click', () => {
      setScreen('more');
    });
  }

  // User Profile Card - Hover Effects
  const userProfileCard = document.getElementById('userProfileCard');
  if (userProfileCard) {
    userProfileCard.addEventListener('mouseenter', () => {
      userProfileCard.style.transform = 'translateY(-2px)';
      userProfileCard.style.boxShadow = '0 4px 12px rgba(108, 99, 255, 0.2)';
    });
    userProfileCard.addEventListener('mouseleave', () => {
      userProfileCard.style.transform = 'translateY(0)';
      userProfileCard.style.boxShadow = '';
    });
  }

  // Profile Edit Modal Functions
  window.openProfileEditModal = function () {
    const modal = document.getElementById('profileEditModal');
    const user = window.firebase?.auth()?.currentUser;

    if (!user) {
      alert('Please login first');
      return;
    }

    if (!modal) {
      console.error('Profile edit modal not found');
      return;
    }

    // Load user data from Firebase
    if (db) {
      db.ref(`users/${user.uid}`).once('value').then((snapshot) => {
        const userData = snapshot.val();
        if (userData) {
          loadUserDataToForm(userData, user.email);
          modal.classList.remove('hidden');
          setTimeout(() => modal.classList.add('showing'), 10);
        } else {
          alert('No user data found');
        }
      }).catch((error) => {
        console.error('Error loading user data:', error);
        alert('Failed to load profile data');
      });
    }
  };

  function loadUserDataToForm(userData, email) {
    // Set common fields
    document.getElementById('editName').value = userData.name || '';
    document.getElementById('editEmail').value = email || '';
    document.getElementById('editRole').value = userData.role || '';
    document.getElementById('editUserInitials').textContent = (userData.name || 'U').charAt(0).toUpperCase();

    // Show/hide role-specific fields
    const studentFields = document.getElementById('studentEditFields');
    const teacherFields = document.getElementById('teacherEditFields');

    if (userData.role === 'student') {
      studentFields.classList.remove('hidden');
      teacherFields.classList.add('hidden');

      document.getElementById('editStudentId').value = userData.studentId || '';
      document.getElementById('editDepartment').value = userData.department || '';
      document.getElementById('editSemester').value = userData.semester || '';
      document.getElementById('editSection').value = userData.section || '';
    } else if (userData.role === 'teacher') {
      teacherFields.classList.remove('hidden');
      studentFields.classList.add('hidden');

      document.getElementById('editTeacherId').value = userData.teacherId || '';
      document.getElementById('editTeacherDepartment').value = userData.department || '';
      document.getElementById('editShortForm').value = userData.shortForm || '';
      document.getElementById('editDesignation').value = userData.designation || '';
    }
  }

  function closeProfileEditModal() {
    const modal = document.getElementById('profileEditModal');
    if (modal) {
      modal.classList.remove('showing');
      setTimeout(() => modal.classList.add('hidden'), 200);
    }
  }

  // Profile Edit Modal Close Handlers
  const profileEditClose = document.getElementById('profileEditClose');
  const cancelEditBtn = document.getElementById('cancelEditBtn');

  if (profileEditClose) {
    profileEditClose.addEventListener('click', closeProfileEditModal);
  }

  if (cancelEditBtn) {
    cancelEditBtn.addEventListener('click', closeProfileEditModal);
  }

  // Profile Edit Form Submission
  const profileEditForm = document.getElementById('profileEditForm');
  if (profileEditForm) {
    profileEditForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const user = window.firebase?.auth()?.currentUser;
      if (!user || !db) return;

      const messageDiv = document.getElementById('profileEditMessage');
      const submitBtn = profileEditForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving...';

      try {
        // Get current user data to check role
        const snapshot = await db.ref(`users/${user.uid}`).once('value');
        const currentData = snapshot.val();

        if (!currentData) {
          throw new Error('User data not found');
        }

        // Prepare updated data
        // Prepare updated data - ONLY NAME is editable now
        const updatedData = {
          name: document.getElementById('editName').value.trim()
        };

        // We do not update other fields as they are read-only
        // Role, ID, Department, etc. are preserved in Firebase automatically
        // as we will use .update() with only the fields that changed.

        // Update in Firebase
        await db.ref(`users/${user.uid}`).update(updatedData);


        // Update UI
        document.getElementById('userName').textContent = updatedData.name;
        document.getElementById('userInitials').textContent = updatedData.name.charAt(0).toUpperCase();

        // Update localStorage
        localStorage.setItem('user_role', currentData.role);

        // Show success message
        messageDiv.textContent = '✓ Profile updated successfully!';
        messageDiv.style.background = 'rgba(46, 204, 113, 0.1)';
        messageDiv.style.color = '#2ecc71';
        messageDiv.style.border = '1px solid rgba(46, 204, 113, 0.2)';
        messageDiv.style.display = 'block';

        setTimeout(() => {
          closeProfileEditModal();
          messageDiv.style.display = 'none';
        }, 2000);

      } catch (error) {
        console.error('Error updating profile:', error);
        messageDiv.textContent = '✗ Failed to update profile: ' + error.message;
        messageDiv.style.background = 'rgba(231, 76, 60, 0.1)';
        messageDiv.style.color = '#e74c3c';
        messageDiv.style.border = '1px solid rgba(231, 76, 60, 0.2)';
        messageDiv.style.display = 'block';
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // --- Booking Query Logic ---

  function initBookingQueryUI() {
    // Auto-load departments
    populateBookingDepartments();

    // Booking Tab Switching
    if (els.bookingTab && els.historyTab) {
      els.bookingTab.addEventListener('click', () => {
        els.bookingTab.classList.add('active');
        els.historyTab.classList.remove('active');
        els.bookingInterface.classList.remove('hidden');
        els.historyInterface.classList.add('hidden');
        // Validate dropdowns when switching back
        checkBookingQueryDropdowns();
      });

      els.historyTab.addEventListener('click', () => {
        els.historyTab.classList.add('active');
        els.bookingTab.classList.remove('active');
        els.historyInterface.classList.remove('hidden');
        els.bookingInterface.classList.add('hidden');
      });
    }

    // Initialize Dropdowns if needed
    setTimeout(() => {
      if (els.bookingQueryDepartment && !els.bookingQueryDepartment.dataset.converted) convertSelectToCustomDropdown(els.bookingQueryDepartment);
      if (els.bookingQuerySearchBy && !els.bookingQuerySearchBy.dataset.converted) convertSelectToCustomDropdown(els.bookingQuerySearchBy);
      if (els.bookingQueryThirdSelect && !els.bookingQueryThirdSelect.dataset.converted) convertSelectToCustomDropdown(els.bookingQueryThirdSelect);
      if (els.bookingQueryDay && !els.bookingQueryDay.dataset.converted) convertSelectToCustomDropdown(els.bookingQueryDay);

      checkBookingQueryDropdowns();
      populateBookingQueryDays();
    }, 50);
  }

  function populateBookingDepartments() {
    if (!els.bookingQueryDepartment) return;

    // Leverage the global updater to ensure consistency with other screens
    updateAllDepartmentDropdowns();

    // Refresh custom dropdown UI if initialized
    if (els.bookingQueryDepartment.nextElementSibling && els.bookingQueryDepartment.nextElementSibling.classList.contains('custom-select-container')) {
      refreshCustomDropdown(els.bookingQueryDepartment);
    }
  }

  function populateBookingQueryDays() {
    if (!els.bookingQueryDay) return;
    els.bookingQueryDay.innerHTML = '';

    const today = new Date();
    let count = 0;
    let d = new Date(today);

    // Generate next 5 valid working days
    // Limit loop to avoid infinite if something is wrong with DAYS_ORDER
    for (let i = 0; i < 30 && count < 5; i++) {
      const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });

      // Check if this day is in our defined working days
      if (DAYS_ORDER.includes(dayName)) {
        const dateStr = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' });

        const opt = document.createElement('option');
        opt.value = dayName; // Keep value as Day Name (e.g., Saturday) for routine lookup
        opt.textContent = `${dayName} (${dateStr})`; // Display: Saturday (12 Oct)

        if (count === 0) opt.selected = true; // Select today/next working day

        els.bookingQueryDay.appendChild(opt);
        count++;
      }

      // Next day
      d.setDate(d.getDate() + 1);
    }
    refreshCustomDropdown(els.bookingQueryDay);
  }

  function checkBookingQueryDropdowns() {
    if (!els.bookingQueryDepartment || !els.bookingQuerySearchBy || !els.bookingQueryThirdSelect) return;

    const department = els.bookingQueryDepartment.value;
    const searchBy = els.bookingQuerySearchBy.value;

    if (searchBy === 'room') {
      if (els.bookingQueryThirdLabel) els.bookingQueryThirdLabel.textContent = 'Room Number';
      // Load Room Numbers for dept
      populateBookingRoomNumbers(department);
    } else {
      if (els.bookingQueryThirdLabel) els.bookingQueryThirdLabel.textContent = 'Time Slot';
      // Load Time Slots
      populateBookingTimeSlots();
    }
  }

  function populateBookingRoomNumbers(department) {
    if (!els.bookingQueryThirdSelect) return;
    const dept = department || 'EEE';

    // Use the cache from query tab logic if available, or fetch
    ensureRoomQueryData(dept);

    const rooms = roomQueryDataCache.roomsByDept[dept] || [];

    // Sort logic
    rooms.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    els.bookingQueryThirdSelect.innerHTML = '<option value="">Select Room</option>';
    if (rooms.length > 0) {
      rooms.forEach(room => {
        const opt = document.createElement('option');
        opt.value = room;
        opt.textContent = room;
        els.bookingQueryThirdSelect.appendChild(opt);
      });
      els.bookingQueryThirdSelect.disabled = false;
    } else {
      els.bookingQueryThirdSelect.disabled = true;
    }
    refreshCustomDropdown(els.bookingQueryThirdSelect);
  }

  function populateBookingTimeSlots() {
    if (!els.bookingQueryThirdSelect) return;
    const timeSlots = [
      '9:00 - 10:25',
      '10:25 - 11:50',
      '11:50 - 1:15',
      '1:45 - 3:10',
      '3:10 - 4:35',
      '4:35 - 6:00'
    ];
    els.bookingQueryThirdSelect.innerHTML = '<option value="">Select Time Slot</option>';
    timeSlots.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot;
      opt.textContent = slot;
      els.bookingQueryThirdSelect.appendChild(opt);
    });
    els.bookingQueryThirdSelect.disabled = false;
    refreshCustomDropdown(els.bookingQueryThirdSelect);
  }

  // Event Listeners for Booking Query
  if (els.bookingQueryDepartment) {
    els.bookingQueryDepartment.addEventListener('change', checkBookingQueryDropdowns);
  }
  if (els.bookingQuerySearchBy) {
    els.bookingQuerySearchBy.addEventListener('change', checkBookingQueryDropdowns);
  }

  if (els.bookingQuerySearchBtn) {
    els.bookingQuerySearchBtn.addEventListener('click', () => {
      const dept = els.bookingQueryDepartment.value;
      const searchBy = els.bookingQuerySearchBy.value;
      const thirdVal = els.bookingQueryThirdSelect.value;
      const day = els.bookingQueryDay.value;

      if (!dept || !searchBy || !thirdVal || !day) {
        alert("Please select all options first.");
        return;
      }

      // Show loading
      if (els.bookingQueryResults) els.bookingQueryResults.innerHTML = '<div class="muted" style="text-align:center;">Searching...</div>';

      // Similar logic to queryRoom logic, but renders buttons to book
      if (searchBy === 'room') {
        queryBookingRoomByNumber(thirdVal, dept, day);
      } else {
        queryBookingRoomByTimeSlot(thirdVal, dept, day);
      }
    });
  }

  function renderBookingQueryResults(data) {
    if (!els.bookingQueryResults) return;
    els.bookingQueryResults.innerHTML = '';
    if (data.length === 0) {
      els.bookingQueryResults.innerHTML = '<div class="empty">No available slots found.</div>';
      return;
    }

    data.forEach(item => {
      const block = document.createElement('div');
      block.className = 'class-card clickable-slot';
      block.style.cssText = 'padding: 14px; background: rgba(158, 140, 255, 0.1); border: 1px solid var(--outline); border-radius: 12px; margin-bottom: 10px; cursor: pointer;';

      block.innerHTML = `
             <div style="font-weight:600; color:var(--text);">Room: ${item.room}</div>
             <div style="color:var(--muted); font-size:13px;">${item.timeSlot}</div>
             <div style="color:var(--accent); font-size:12px; margin-top:4px;">Tap to Book</div>
          `;

      enableRipple(block);
      block.addEventListener('click', () => {
        openBookingConfirmPopup(item.room, item.timeSlot);
      });

      els.bookingQueryResults.appendChild(block);
    });
  }

  function queryBookingRoomByNumber(roomNumber, department, selectedDay) {
    // Reuse query logic logic
    const routines = roomQueryDataCache.routinesByDept[department];
    if (!routines) {
      ensureRoomQueryData(department);
      setTimeout(() => queryBookingRoomByNumber(roomNumber, department, selectedDay), 500); // Retry logic
      return;
    }

    const dayToUse = selectedDay;
    const allTimeSlots = [
      '9:00 - 10:25', '10:25 - 11:50', '11:50 - 1:15',
      '1:45 - 3:10', '3:10 - 4:35', '4:35 - 6:00'
    ];
    const occupiedSlots = new Set();

    Object.values(routines).forEach(sem => {
      Object.values(sem || {}).forEach(section => {
        const slots = (section?.[dayToUse]) || [];
        slots.forEach(slot => {
          if (slot && slot.room === roomNumber && slot.time) {
            occupiedSlots.add(slot.time);
          }
        });
      });
    });

    const freeSlots = allTimeSlots.filter(slot => !occupiedSlots.has(slot));
    renderBookingQueryResults(freeSlots.map(slot => ({ room: roomNumber, timeSlot: slot })));
  }

  function queryBookingRoomByTimeSlot(timeSlot, department, selectedDay) {
    const routines = roomQueryDataCache.routinesByDept[department];
    if (!routines) {
      ensureRoomQueryData(department);
      setTimeout(() => queryBookingRoomByTimeSlot(timeSlot, department, selectedDay), 500);
      return;
    }
    const dayToUse = selectedDay;
    const allRooms = new Set(roomQueryDataCache.roomsByDept[department] || []);
    const occupiedRooms = new Set();

    Object.values(routines).forEach(sem => {
      Object.values(sem || {}).forEach(section => {
        const slots = (section?.[dayToUse]) || [];
        slots.forEach(slot => {
          if (!slot || !slot.room) return;
          allRooms.add(slot.room);
          if (slot.time === timeSlot) {
            occupiedRooms.add(slot.room);
          }
        });
      });
    });

    const freeRooms = Array.from(allRooms).filter(room => !occupiedRooms.has(room));
    renderBookingQueryResults(freeRooms.map(room => ({ room, timeSlot: timeSlot })));
  }

  // --- Booking Confirmation Popup Logic ---

  function openBookingConfirmPopup(room, time) {
    const popup = els.bookingConfirmPopup;
    if (!popup) return;

    // Populate Details
    if (els.bookingConfirmDetails) {
      els.bookingConfirmDetails.innerHTML = `
             <div class="booking-confirm-label">Requesting Booking for</div>
             <div class="booking-confirm-room">Room ${room}</div>
             <div class="booking-confirm-time">${time}</div>
          `;
    }

    // Hidden inputs
    if (els.bookingConfirmRoom) els.bookingConfirmRoom.value = room;
    if (els.bookingConfirmTime) els.bookingConfirmTime.value = time;

    // Populate Dates (Next 5 Days)
    if (els.bookingConfirmDate) {
      els.bookingConfirmDate.innerHTML = '';
      const today = new Date();
      for (let i = 0; i < 5; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() + i);

        const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        const valStr = d.toISOString().split('T')[0]; // YYYY-MM-DD

        const opt = document.createElement('option');
        opt.value = valStr;
        opt.textContent = dateStr + (i === 0 ? ' (Today)' : '');
        els.bookingConfirmDate.appendChild(opt);
      }
      refreshCustomDropdown(els.bookingConfirmDate);

      // Re-apply custom dropdown UI
      setTimeout(() => {
        if (!els.bookingConfirmDate.dataset.converted) convertSelectToCustomDropdown(els.bookingConfirmDate);
      }, 50);
    }

    // Show Popup
    popup.classList.remove('hidden');
    requestAnimationFrame(() => popup.classList.add('showing'));
  }

  if (els.bookingConfirmClose) {
    els.bookingConfirmClose.addEventListener('click', () => {
      els.bookingConfirmPopup.classList.remove('showing');
      setTimeout(() => els.bookingConfirmPopup.classList.add('hidden'), 200);
    });
  }

  if (els.bookingConfirmForm) {
    els.bookingConfirmForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const user = window.firebase.auth().currentUser;
      if (!user) return;

      const room = els.bookingConfirmRoom.value;
      const time = els.bookingConfirmTime.value;
      const date = els.bookingConfirmDate.value;
      const reason = els.bookingConfirmReason.value;

      const submitBtn = els.bookingConfirmForm.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending Request...';

      try {
        // get info
        const userSnap = await db.ref(`users/${user.uid}`).once('value');
        const userData = userSnap.val() || {};

        const request = {
          userId: user.uid,
          userName: userData.name || 'Unknown',
          userRole: userData.role || 'unknown',
          room, time, date, reason,
          status: 'pending',
          timestamp: firebase.database.ServerValue.TIMESTAMP
        };

        await db.ref('booking_requests').push(request);

        alert('Request Sent! Waiting for Admin Approval.');
        // Close popup
        els.bookingConfirmPopup.classList.remove('showing');
        setTimeout(() => els.bookingConfirmPopup.classList.add('hidden'), 200);

        // Clear reason
        els.bookingConfirmReason.value = '';

        // Refresh history
        if (typeof loadUserBookingHistory === 'function') {
          loadUserBookingHistory(user.uid);
        }
      } catch (err) {
        console.error(err);
        alert("Failed to send request: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  }

  // Landing: dependent section options
  els.department.addEventListener('change', async () => {
    const dept = els.department.value.trim();
    const sem = els.semester.value.trim();
    if (dept && sem) {
      await populateSections(els.section, sem, '', dept);
    }
  });
  els.semester.addEventListener('change', async () => {
    const dept = els.department.value.trim();
    const sem = els.semester.value.trim();
    if (dept && sem) {
      await populateSections(els.section, sem, '', dept);
    }
  });

  // Student screen: direct change handlers
  async function onStudentDepartmentChange() {
    const dept = els.departmentDisplay.value.trim();
    const sem = els.semesterDisplay.value.trim();
    if (dept && sem) {
      await populateSections(els.sectionDisplay, sem, '', dept);
    }
  }

  async function onStudentSemesterChange() {
    const dept = els.departmentDisplay.value.trim();
    const sem = els.semesterDisplay.value.trim();
    if (dept && sem) {
      await populateSections(els.sectionDisplay, sem, '', dept);
      const sec = els.sectionDisplay.value.trim();
      if (sec) {
        persistSelection(dept, sem, sec);
        await loadStudent(dept, sem, sec);
      }
    }
  }

  async function onStudentSectionChange() {
    const dept = els.departmentDisplay.value.trim();
    const sem = els.semesterDisplay.value.trim();
    const sec = els.sectionDisplay.value.trim();
    if (dept && sem && sec) {
      persistSelection(dept, sem, sec);
      await loadStudent(dept, sem, sec);
    }
  }

  // Days scroller build
  function buildDays(activeDay) {
    els.dayScroller.innerHTML = '';
    DAYS_ORDER.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day' + (day === activeDay ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.title = day;

      const dayLabel = document.createElement('span');
      dayLabel.className = 'day-name';
      dayLabel.textContent = day.slice(0, 3);

      const dateLabel = document.createElement('span');
      dateLabel.className = 'day-date';
      dateLabel.textContent = getDateForDay(day);

      btn.appendChild(dayLabel);
      btn.appendChild(dateLabel);
      btn.addEventListener('click', () => renderDay(day));
      enableRipple(btn);
      els.dayScroller.appendChild(btn);
    });
  }

  function renderDay(day) {
    const dept = els.departmentDisplay.value;
    const sem = els.semesterDisplay.value;
    const sec = els.sectionDisplay.value;
    currentDay = day;
    // Update day active UI
    Array.from(els.dayScroller.children).forEach(btn => {
      if (btn.classList.contains('day')) {
        btn.classList.toggle('active', btn.title === day);
      }
    });
    // Update date hint for chosen day if it's today
    const today = getTodayInfo();
    els.dateToday.textContent = day === today.dayName ? today.label : '';

    try {
      const items = ((((routineData || {})[dept] || {})[sem] || {})[sec] || {})[day] || [];
      renderSchedule(items);
    } catch (e) {
      showNetworkError();
    }
  }

  function renderSchedule(items) {
    els.scheduleContainer.innerHTML = '';
    els.emptyMessage.classList.add('hidden');
    els.networkMessage.classList.add('hidden');
    // Destroy empty Lottie animation when there are items
    if (emptyLottieInstance) {
      emptyLottieInstance.destroy();
      emptyLottieInstance = null;
    }
    if (!items || items.length === 0) {
      els.detailsTotal.textContent = '0';
      els.emptyMessage.classList.remove('hidden');
      if (!emptyLottieInstance && !emptyLottieLoading) {
        setTimeout(() => {
          if (!els.emptyMessage.classList.contains('hidden')) {
            initEmptyLottie();
          }
        }, 150);
      }
      return;
    }

    // Sort items by time slot order (serial wise - same as admin page dropdown)
    // Uses predefined time slot order instead of clock conversion
    const sortedItems = [...items].sort((a, b) => {
      const indexA = getTimeSlotIndex(a.time || '');
      const indexB = getTimeSlotIndex(b.time || '');
      // Sort by predefined order index (0 = first slot, 1 = second slot, etc.)
      return indexA - indexB;
    });

    els.detailsTotal.textContent = String(sortedItems.length);
    for (const it of sortedItems) {
      const card = document.createElement('div');
      card.className = 'slot-card';

      const time = document.createElement('div');
      time.className = 'slot-time';
      time.textContent = it.time.replace('-', '→');

      const main = document.createElement('div');
      main.className = 'slot-main';

      const title = document.createElement('div');
      title.className = 'slot-title';
      title.textContent = it.course;

      const grid = document.createElement('div');
      grid.className = 'grid';

      grid.appendChild(kv('Course', it.code));
      grid.appendChild(kv('Section', (it.section || els.sectionDisplay.value)));
      grid.appendChild(kv('Semester', semLabel(els.semesterDisplay.value)));
      grid.appendChild(kv('Room', it.room));

      const teacher = document.createElement('div');
      teacher.className = 'kv';
      const k = document.createElement('span'); k.textContent = 'Teacher:';
      const v = document.createElement('b'); v.textContent = it.teacher;
      teacher.appendChild(k); teacher.appendChild(v);

      main.appendChild(title);
      main.appendChild(grid);
      main.appendChild(teacher);

      card.appendChild(time);
      card.appendChild(main);
      els.scheduleContainer.appendChild(card);
    }


  }

  function kv(label, value) {
    const el = document.createElement('div');
    el.className = 'kv';
    const k = document.createElement('span'); k.textContent = label + ':';
    const v = document.createElement('b'); v.textContent = value;
    el.appendChild(k); el.appendChild(v);
    return el;
  }

  function showNetworkError() {
    els.scheduleContainer.innerHTML = '';
    els.emptyMessage.classList.add('hidden');
    els.networkMessage.classList.remove('hidden');
  }

  async function loadStudent(department, semester, section) {
    showStudentLoading();
    // Fill displays
    fillSemesterSelect(els.semesterDisplay, semester);
    await populateSections(els.sectionDisplay, semester, section, department);
    els.detailsSemester.textContent = semLabel(semester);
    els.detailsSection.textContent = section;

    updateCRUI(department, semester, section);

    // Track current selection
    currentDepartment = department;
    currentSemester = semester;
    currentSection = section;

    // Load from cache immediately for offline/first paint
    const cached = loadRoutineFromCache(department, semester, section);
    if (cached) {
      ensureNested(routineData, department, semester, section);
      routineData[department][semester][section] = cached;
    } else {
      // ensure path exists to avoid errors before data arrives
      ensureNested(routineData, department, semester, section);
    }

    // Subscribe to live updates
    attachRoutineListener(department, semester, section);

    // Build day scroller and select default (today if present)
    const today = getTodayInfo();
    buildDays(today.dayName);

    // Render today or first day from cache; live listener will refresh
    const startDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
    renderDay(startDay);

    // Show version label if loaded
    updateVersionUI(department, semester);
    hideStudentLoading();
  }

  function fillSemesterSelect(select, selected) {
    const semesters = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = 'Select Semester';
    select.appendChild(placeholder);
    semesters.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = semLabel(s); if (s === selected) opt.selected = true;
      select.appendChild(opt);
    });
    // wire listeners once
    if (!select.__wired) {
      select.addEventListener('change', onStudentSemesterChange);
      select.__wired = true;
    }

    // Wire department change handler
    if (els.departmentDisplay && !els.departmentDisplay.__wired) {
      els.departmentDisplay.addEventListener('change', onStudentDepartmentChange);
      els.departmentDisplay.__wired = true;
    }
    refreshCustomDropdown(select);
  }

  async function populateSections(select, semester, selectedSection, department) {
    if (!select || !semester || !department) {
      if (select) {
        select.innerHTML = '<option value="">Select Department and Semester first</option>';
        select.disabled = true;
      }
      return;
    }

    // Load sections from Firebase
    const sections = await loadDepartmentSections(department, semester);
    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = sections.length ? 'Select Section' : 'No sections available';
    select.appendChild(placeholder);
    sections.forEach(sec => {
      const opt = document.createElement('option');
      opt.value = sec;
      opt.textContent = sec;
      if (sec === selectedSection) opt.selected = true;
      select.appendChild(opt);
    });
    select.disabled = sections.length === 0;
    // attach handler if student select
    if (select.id === 'sectionDisplay' && !select.__wired) {
      select.addEventListener('change', onStudentSectionChange);
      select.__wired = true;
    }
    refreshCustomDropdown(select);
  }

  function updateCRUI(department, semester, section) {
    const node1 = document.getElementById('detailsCR1');
    const node2 = document.getElementById('detailsCR2');
    if (!node1 || !node2) return;
    const info = (((crDetails[department] || {})[semester] || {})[section]) || null;

    // Helper function to create clickable phone number
    function createClickablePhone(node, name, phone) {
      // Clear previous content and event listeners
      node.innerHTML = '';
      node.onclick = null;

      if (name && phone) {
        // Set text content normally (no special styling)
        node.textContent = `${name} (${phone})`;
        // Make entire node clickable
        node.style.cursor = 'pointer';
        node.addEventListener('click', (e) => {
          e.stopPropagation();
          // Clean phone number: remove spaces and keep only digits and +
          const phoneNumber = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
          if (phoneNumber) {
            window.location.href = `tel:${phoneNumber}`;
          }
        });
      } else if (name) {
        node.textContent = name;
      } else {
        node.textContent = 'Not assigned';
      }
    }

    if (info && (info.cr1 || info.cr2)) {
      const cr1 = info.cr1 || {};
      const cr2 = info.cr2 || {};
      createClickablePhone(node1, cr1.name, cr1.phone);
      createClickablePhone(node2, cr2.name, cr2.phone);
    } else {
      node1.textContent = 'Not assigned';
      node2.textContent = 'Not assigned';
    }
  }

  function updateVersionUI(department, semester) {
    const node = document.getElementById('detailsVersion');
    if (!node) return;
    const label = ((versionLabels[department] || {})[semester]) || '';
    node.textContent = label || '—';
  }

  // ========== TEACHER PAGE FUNCTIONALITY ==========

  // Cache keys for teacher data
  const TEACHER_CACHE_VERSION = '1';
  const TEACHER_LIST_CACHE_KEY = 'cse.teachersByDept';
  const TEACHER_ROUTINE_CACHE_KEY = 'cse.teacherRoutineCache';

  // Load all teachers from database and cache them
  function loadAllTeachers() {
    if (!db) return;
    db.ref('teachers').on('value', (snap) => {
      const teachers = snap.val() || {};
      allTeachers = teachers;
      // Cache all teachers data for offline access
      try {
        localStorage.setItem('cse.allTeachers', JSON.stringify(teachers));
        localStorage.setItem('cse.allTeachers.version', TEACHER_CACHE_VERSION);
      } catch (e) {
        console.warn('Failed to cache teachers:', e);
      }
    });

    // Try to load from cache immediately for instant display
    try {
      const cached = localStorage.getItem('cse.allTeachers');
      const version = localStorage.getItem('cse.allTeachers.version');
      if (cached && version === TEACHER_CACHE_VERSION) {
        allTeachers = JSON.parse(cached);
      }
    } catch (e) {
      console.warn('Failed to load cached teachers:', e);
    }
  }

  // Load teachers for a specific department by scanning routines
  async function loadDepartmentTeachers(department) {
    if (!db || !department) {
      departmentTeachers.clear();
      return;
    }

    // Try to load from cache first for instant display
    try {
      const cached = localStorage.getItem(`${TEACHER_LIST_CACHE_KEY}.${department}`);
      const version = localStorage.getItem(`${TEACHER_LIST_CACHE_KEY}.${department}.version`);
      if (cached && version === TEACHER_CACHE_VERSION) {
        const cachedTeachers = JSON.parse(cached);
        departmentTeachers = new Set(cachedTeachers);
        // Continue loading from database in background to update cache
      }
    } catch (e) {
      console.warn('Failed to load cached department teachers:', e);
    }

    const teachersSet = new Set();
    const semesters = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];

    // Load all routines for this department and extract unique teachers
    for (const sem of semesters) {
      const sections = await loadDepartmentSections(department, sem);
      for (const sec of sections) {
        try {
          const snap = await db.ref(`routines/${department}/${sem}/${sec}`).once('value');
          const dayData = snap.val() || {};
          DAYS_ORDER.forEach(day => {
            const slots = dayData[day] || [];
            slots.forEach(slot => {
              if (slot.teacher && slot.teacher.trim()) {
                teachersSet.add(slot.teacher.trim().toLowerCase());
              }
            });
          });
        } catch (e) {
          console.error('Error loading routine for teacher extraction:', e);
        }
      }
    }

    departmentTeachers = teachersSet;

    // Cache the teachers list for this department
    try {
      localStorage.setItem(`${TEACHER_LIST_CACHE_KEY}.${department}`, JSON.stringify(Array.from(teachersSet)));
      localStorage.setItem(`${TEACHER_LIST_CACHE_KEY}.${department}.version`, TEACHER_CACHE_VERSION);
    } catch (e) {
      console.warn('Failed to cache department teachers:', e);
    }
  }

  // Teacher search autocomplete
  function showTeacherSuggestions(query) {
    if (!els.teacherSuggestions) return;
    const queryLower = query.toLowerCase().trim();
    if (!queryLower) {
      hideDropdown(els.teacherSuggestions);
      return;
    }

    const matches = [];
    const currentDept = els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept;

    // Filter teachers: if department is selected, only show teachers from that department
    Object.entries(allTeachers).forEach(([shortForm, data]) => {
      // If department is selected, only include teachers from that department
      if (currentDept && departmentTeachers.size > 0) {
        const shortFormLower = shortForm.toLowerCase();
        if (!departmentTeachers.has(shortFormLower)) {
          return; // Skip teachers not in this department
        }
      }

      const fullName = (data.fullName || '').toLowerCase();
      const shortFormLower = shortForm.toLowerCase();

      if (fullName.includes(queryLower) || shortFormLower.includes(queryLower)) {
        matches.push({ shortForm, fullName: data.fullName || shortForm });
      }
    });

    els.teacherSuggestions.innerHTML = '';
    if (matches.length === 0) {
      hideDropdown(els.teacherSuggestions);
      return;
    }

    matches.forEach(({ shortForm, fullName }) => {
      const item = document.createElement('div');
      item.className = 'autocomplete-item';
      item.innerHTML = `
        <div class="autocomplete-item-name">${fullName} (${shortForm})</div>
      `;
      // Use mousedown instead of click for better trackpad support
      const handleSelect = (e) => {
        e.preventDefault();
        e.stopPropagation();
        els.teacherSearch.value = shortForm;
        hideDropdown(els.teacherSuggestions);
        // Immediately blur the input to complete the search
        if (els.teacherSearch) {
          els.teacherSearch.blur();
        }
        currentTeacherShort = shortForm;
        // Save last searched teacher
        localStorage.setItem('cse.lastTeacher', shortForm);
        localStorage.setItem('cse.lastTeacherDept', els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept);
        // Update teacher details
        const teacherInfo = allTeachers[shortForm] || {};
        if (els.teacherDetailsName) {
          els.teacherDetailsName.textContent = shortForm;
        }
        // Update lottie visibility when teacher is selected
        updateTeacherLottieVisibility();
        // Load routine if department is already selected
        const dept = els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept;
        if (dept) {
          currentTeacherDept = dept;
          loadTeacherRoutine(shortForm, dept);
        }
      };
      item.addEventListener('mousedown', handleSelect);
      item.addEventListener('touchstart', handleSelect);
      els.teacherSuggestions.appendChild(item);
    });
    showDropdown(els.teacherSuggestions);
  }

  // Teacher search input handler
  if (els.teacherSearch) {
    els.teacherSearch.addEventListener('input', (e) => {
      showTeacherSuggestions(e.target.value);
    });

    els.teacherSearch.addEventListener('blur', () => {
      // Hide suggestions after a delay to allow clicks
      setTimeout(() => {
        if (els.teacherSuggestions) hideDropdown(els.teacherSuggestions);
      }, 200);
    });
  }

  // Teacher department change handler
  if (els.teacherDepartment) {
    els.teacherDepartment.addEventListener('change', async () => {
      const newDept = els.teacherDepartment.value;
      const previousDept = currentTeacherDept;
      currentTeacherDept = newDept;

      // Load teachers for this department (from cache first)
      await loadDepartmentTeachers(currentTeacherDept);

      // Check if current teacher exists in the new department
      if (currentTeacherShort && departmentTeachers.size > 0) {
        const teacherInNewDept = departmentTeachers.has(currentTeacherShort.toLowerCase());

        if (!teacherInNewDept) {
          // Teacher is not in this department, clear the display
          if (els.teacherSearch) {
            els.teacherSearch.value = '';
          }
          currentTeacherShort = '';
          if (els.teacherDetailsName) {
            els.teacherDetailsName.textContent = '';
          }
          // Clear the routine display
          if (els.teacherScheduleContainer) {
            els.teacherScheduleContainer.innerHTML = '';
          }
          if (els.teacherDetailsTotal) {
            els.teacherDetailsTotal.textContent = '0';
          }
          if (els.teacherDetailsBatch) {
            els.teacherDetailsBatch.textContent = '—';
          }
          updateTeacherLottieVisibility();
        } else {
          // Teacher exists in new department
          // Keep the current display, just update the department reference
          // Don't reload routine - it will be reloaded only when user selects a teacher
          localStorage.setItem('cse.lastTeacherDept', currentTeacherDept);

          // If user is actively typing in search, refresh suggestions
          if (els.teacherSearch && els.teacherSearch.value.trim()) {
            showTeacherSuggestions(els.teacherSearch.value);
          }
        }
      } else if (els.teacherSearch && els.teacherSearch.value.trim()) {
        // No current teacher selected, but user is typing - refresh suggestions
        showTeacherSuggestions(els.teacherSearch.value);
      }
    });

    // Initialize department value
    currentTeacherDept = els.teacherDepartment.value;
    // Load teachers for initial department
    if (currentTeacherDept) {
      loadDepartmentTeachers(currentTeacherDept);
    }
  }

  // Teacher Contact Popup handlers
  function showTeacherContactPopup() {
    if (!currentTeacherShort || !els.teacherContactPopup) return;

    const teacherInfo = allTeachers[currentTeacherShort] || {};
    const fullName = teacherInfo.fullName || currentTeacherShort;
    const designation = teacherInfo.designation || '—';
    const phone = teacherInfo.contact || '—';
    const email = teacherInfo.mail || '—';
    const department = els.teacherDepartment ? els.teacherDepartment.value : currentTeacherDept || '—';

    // Set popup content
    if (els.teacherContactTitle) {
      els.teacherContactTitle.textContent = `${fullName} (${currentTeacherShort})`;
    }
    if (els.teacherContactDesignation) {
      els.teacherContactDesignation.textContent = designation;
    }
    if (els.teacherContactPhone) {
      els.teacherContactPhone.textContent = phone;
      // Make phone clickable if it's not a placeholder (normal appearance, no special styling)
      if (phone && phone !== '—') {
        els.teacherContactPhone.style.cursor = 'pointer';
        els.teacherContactPhone.onclick = (e) => {
          e.stopPropagation();
          const phoneNumber = phone.replace(/\s+/g, '').replace(/[^\d+]/g, '');
          if (phoneNumber) {
            window.location.href = `tel:${phoneNumber}`;
          }
        };
      } else {
        els.teacherContactPhone.style.cursor = 'default';
        els.teacherContactPhone.onclick = null;
      }
    }
    if (els.teacherContactEmail) {
      els.teacherContactEmail.textContent = email;
      // Make email clickable if it's not a placeholder (normal appearance, no special styling)
      if (email && email !== '—') {
        els.teacherContactEmail.style.cursor = 'pointer';
        els.teacherContactEmail.onclick = (e) => {
          e.stopPropagation();
          window.location.href = `mailto:${email}`;
        };
      } else {
        els.teacherContactEmail.style.cursor = 'default';
        els.teacherContactEmail.onclick = null;
      }
    }
    if (els.teacherContactDepartment) {
      els.teacherContactDepartment.textContent = department;
    }

    // Show popup with animation
    els.teacherContactPopup.classList.remove('hidden');
    setTimeout(() => {
      els.teacherContactPopup.classList.add('showing');
    }, 10);
  }

  function hideTeacherContactPopup() {
    if (!els.teacherContactPopup) return;
    els.teacherContactPopup.classList.remove('showing');
    setTimeout(() => {
      els.teacherContactPopup.classList.add('hidden');
    }, 200);
  }

  if (els.teacherContactBtn) {
    els.teacherContactBtn.addEventListener('click', () => {
      if (currentTeacherShort) {
        showTeacherContactPopup();
      }
    });
  }

  if (els.teacherContactClose) {
    els.teacherContactClose.addEventListener('click', hideTeacherContactPopup);
  }

  // Close popup when clicking outside
  if (els.teacherContactPopup) {
    els.teacherContactPopup.addEventListener('click', (e) => {
      if (e.target === els.teacherContactPopup) {
        hideTeacherContactPopup();
      }
    });
  }

  // Close popup with Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && els.teacherContactPopup && els.teacherContactPopup.classList.contains('showing')) {
      hideTeacherContactPopup();
    }
  });

  // Load teacher routine for selected teacher and department
  async function loadTeacherRoutine(teacherShort, department, forceReload = false) {
    if (!db || !teacherShort || !department) {
      updateTeacherLottieVisibility();
      return;
    }

    teacherDataLoaded = false;
    loadedTeacherKey = '';

    // Check if data is already loaded for this teacher+department combination
    const teacherKey = `${teacherShort.toLowerCase().trim()}_${department}`;

    // Try to load from cache first for instant display
    let cacheLoaded = false;
    try {
      const cacheKey = `${TEACHER_ROUTINE_CACHE_KEY}.${teacherKey}`;
      const cached = localStorage.getItem(cacheKey);
      const version = localStorage.getItem(`${cacheKey}.version`);
      if (cached && version === TEACHER_CACHE_VERSION) {
        const cachedData = JSON.parse(cached);
        teacherRoutineData = cachedData;
        teacherDataLoaded = true;
        loadedTeacherKey = teacherKey;
        cacheLoaded = true;

        // Render from cache immediately
        const today = getTodayInfo();
        const dayToShow = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
        buildTeacherDays(dayToShow);
        renderTeacherDay(dayToShow);
        updateTeacherBatchInfo();
        updateTeacherVersionInfo();
        updateTeacherLottieVisibility();

        // Continue loading from database in background to update cache
        if (!forceReload) {
          // Return early if we don't need to force reload
          // Database will still update in background via listeners
        }
      }
    } catch (e) {
      console.warn('Failed to load cached teacher routine:', e);
    }

    if (!forceReload && teacherDataLoaded && loadedTeacherKey === teacherKey && Object.keys(teacherRoutineData).length > 0 && !cacheLoaded) {
      // Data already loaded in memory, just render it
      const today = getTodayInfo();
      const dayToShow = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
      buildTeacherDays(dayToShow);
      renderTeacherDay(dayToShow);
      updateTeacherBatchInfo();
      updateTeacherVersionInfo();
      updateTeacherLottieVisibility();
      return;
    }

    // Clear previous listener
    if (activeTeacherDbRef) {
      activeTeacherDbRef.off();
      activeTeacherDbRef = null;
      if (window.AppState) {
        window.AppState.activeTeacherDbRef = null;
      }
    }

    // Update UI
    if (els.teacherDetailsName) {
      els.teacherDetailsName.textContent = teacherShort;
    }

    // Load all routines for this department and filter by teacher
    const freshRoutineData = {};
    let freshDataLoaded = false;

    // Sync with AppState
    if (window.AppState) {
      window.AppState.teacherRoutineData = teacherRoutineData;
      window.AppState.teacherDataLoaded = teacherDataLoaded;
      window.AppState.loadedTeacherKey = loadedTeacherKey;
      window.AppState.activeTeacherDbRef = activeTeacherDbRef;
    }
    const semesters = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
    let totalSections = 0;
    let loadedCount = 0;

    // First, count total sections for this department
    for (const sem of semesters) {
      const sections = await loadDepartmentSections(department, sem);
      totalSections += sections.length;
    }

    // If no sections, return early
    if (totalSections === 0) {
      updateTeacherLottieVisibility();
      return;
    }

    // Then load routines
    for (const sem of semesters) {
      const sections = await loadDepartmentSections(department, sem);
      for (const sec of sections) {
        const ref = db.ref(`routines/${department}/${sem}/${sec}`);
        ref.once('value', (snap) => {
          const dayData = snap.val() || {};
          DAYS_ORDER.forEach(day => {
            const slots = dayData[day] || [];
            const teacherSlots = slots.filter(slot =>
              slot.teacher && slot.teacher.toLowerCase().trim() === teacherShort.toLowerCase().trim()
            );

            if (teacherSlots.length > 0) {
              if (!freshRoutineData[sem]) freshRoutineData[sem] = {};
              if (!freshRoutineData[sem][sec]) freshRoutineData[sem][sec] = {};
              freshRoutineData[sem][sec][day] = teacherSlots;
            }
          });

          loadedCount++;
          // When all data is loaded, show today's day (don't shift to other days)
          if (loadedCount === totalSections) {
            // Mark data as loaded
            teacherRoutineData = freshRoutineData;
            teacherDataLoaded = true;
            loadedTeacherKey = teacherKey;
            freshDataLoaded = true;

            // Cache the routine data
            try {
              const cacheKey = `${TEACHER_ROUTINE_CACHE_KEY}.${teacherKey}`;
              localStorage.setItem(cacheKey, JSON.stringify(freshRoutineData));
              localStorage.setItem(`${cacheKey}.version`, TEACHER_CACHE_VERSION);

              // Also update last teacher cache with priority
              localStorage.setItem('cse.lastTeacher', teacherShort);
              localStorage.setItem('cse.lastTeacherDept', department);
            } catch (e) {
              console.warn('Failed to cache teacher routine:', e);
            }

            // Always use today's day, don't shift to days with classes
            const today = getTodayInfo();
            const dayToShow = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];

            // Update state
            if (window.AppState) {
              window.AppState.teacherRoutineData = teacherRoutineData;
              window.AppState.teacherDataLoaded = teacherDataLoaded;
              window.AppState.loadedTeacherKey = loadedTeacherKey;
            }

            // Build day scroller and render (only if cache wasn't already shown)
            if (!cacheLoaded) {
              buildTeacherDays(dayToShow);
              renderTeacherDay(dayToShow);

              // Update batch info (show all semesters that have classes)
              updateTeacherBatchInfo();
              updateTeacherVersionInfo();

              // Hide lottie when data is loaded
              updateTeacherLottieVisibility();
            } else {
              // Just update the display with fresh data
              renderTeacherDay(currentTeacherDay || dayToShow);
              updateTeacherBatchInfo();
              updateTeacherVersionInfo();
            }
          }
        });
      }
    }

    // Build day scroller initially (will be updated when data loads) - only if cache wasn't loaded
    if (!cacheLoaded) {
      const today = getTodayInfo();
      buildTeacherDays(today.dayName);
    }
  }

  // Update teacher batch info
  function updateTeacherBatchInfo() {
    if (!els.teacherDetailsBatch) return;
    const semesters = new Set();
    Object.keys(teacherRoutineData).forEach(sem => {
      semesters.add(sem);
    });
    const batchLabels = Array.from(semesters).map(sem => semLabel(sem)).join(', ');
    els.teacherDetailsBatch.textContent = batchLabels || '—';
  }

  // Update teacher version info
  function updateTeacherVersionInfo() {
    if (!els.teacherDetailsVersion) return;
    // Get version from first semester that has classes
    const firstSem = Object.keys(teacherRoutineData)[0];
    const dept = els.teacherDepartment?.value || currentTeacherDept || '';
    if (firstSem && dept && versionLabels[dept] && versionLabels[dept][firstSem]) {
      els.teacherDetailsVersion.textContent = versionLabels[dept][firstSem];
    } else {
      els.teacherDetailsVersion.textContent = '—';
    }
  }

  // Build teacher days scroller
  function buildTeacherDays(activeDay) {
    if (!els.teacherDayScroller) return;
    els.teacherDayScroller.innerHTML = '';
    DAYS_ORDER.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day' + (day === activeDay ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.title = day;

      const dayLabel = document.createElement('span');
      dayLabel.className = 'day-name';
      dayLabel.textContent = day.slice(0, 3);

      const dateLabel = document.createElement('span');
      dateLabel.className = 'day-date';
      dateLabel.textContent = getDateForDay(day);

      btn.appendChild(dayLabel);
      btn.appendChild(dateLabel);
      btn.addEventListener('click', () => renderTeacherDay(day));
      enableRipple(btn);
      els.teacherDayScroller.appendChild(btn);
    });
  }

  // Render teacher day schedule
  function renderTeacherDay(day) {
    if (!els.teacherScheduleContainer) return;
    currentTeacherDay = day;

    // Update day active UI
    if (els.teacherDayScroller) {
      Array.from(els.teacherDayScroller.children).forEach(btn => {
        if (btn.classList.contains('day')) {
          btn.classList.toggle('active', btn.title === day);
        }
      });
    }

    // Update date hint
    const today = getTodayInfo();
    if (els.teacherDateToday) {
      els.teacherDateToday.textContent = day === today.dayName ? today.label : '';
    }

    // Collect all classes for this day across all semesters/sections
    const allClasses = [];
    Object.entries(teacherRoutineData).forEach(([sem, sections]) => {
      Object.entries(sections).forEach(([sec, days]) => {
        const daySlots = days[day] || [];
        daySlots.forEach(slot => {
          allClasses.push({
            ...slot,
            semester: sem,
            section: sec
          });
        });
      });
    });

    // Sort by time
    allClasses.sort((a, b) => {
      const timeA = parseTime(a.time || '0:00');
      const timeB = parseTime(b.time || '0:00');
      return timeA - timeB;
    });

    // Update state
    if (window.AppState) {
      window.AppState.currentTeacherDay = currentTeacherDay;
    }

    // Render
    els.teacherScheduleContainer.innerHTML = '';
    els.teacherEmptyMessage?.classList.add('hidden');
    els.teacherNetworkMessage?.classList.add('hidden');

    if (allClasses.length === 0) {
      els.teacherEmptyMessage?.classList.remove('hidden');
      if (els.teacherDetailsTotal) els.teacherDetailsTotal.textContent = '0';
      // Hide lottie when data is shown (even if empty)
      updateTeacherLottieVisibility();
      return;
    }

    if (els.teacherDetailsTotal) {
      els.teacherDetailsTotal.textContent = String(allClasses.length);
    }

    allClasses.forEach(slot => {
      const card = document.createElement('div');
      card.className = 'slot-card';

      const time = document.createElement('div');
      time.className = 'slot-time';
      time.textContent = (slot.time || '').replace('-', '→');

      const main = document.createElement('div');
      main.className = 'slot-main';

      const title = document.createElement('div');
      title.className = 'slot-title';
      title.textContent = slot.course || '';

      const grid = document.createElement('div');
      grid.className = 'grid';

      grid.appendChild(kv('Course', slot.code || ''));
      grid.appendChild(kv('Section', slot.section || ''));
      grid.appendChild(kv('Semester', semLabel(slot.semester || '')));
      grid.appendChild(kv('Room', slot.room || ''));

      main.appendChild(title);
      main.appendChild(grid);

      card.appendChild(time);
      card.appendChild(main);
      els.teacherScheduleContainer.appendChild(card);
    });

    // Hide lottie when data is shown
    updateTeacherLottieVisibility();
  }

  // Load last searched teacher when teacher tab is clicked
  async function loadLastTeacher() {
    const lastTeacher = localStorage.getItem('cse.lastTeacher');
    const lastDept = localStorage.getItem('cse.lastTeacherDept') || 'EEE';

    // Set department dropdown value first
    if (lastDept && els.teacherDepartment) {
      els.teacherDepartment.value = lastDept;
      currentTeacherDept = lastDept;
      // Refresh custom dropdown to show selected value
      refreshCustomDropdown(els.teacherDepartment);
    }

    // Load teachers for the department (from cache first, then database)
    if (lastDept) {
      await loadDepartmentTeachers(lastDept);
    } else if (els.teacherDepartment && els.teacherDepartment.value) {
      await loadDepartmentTeachers(els.teacherDepartment.value);
    }

    if (lastTeacher && els.teacherSearch && els.teacherDepartment) {
      els.teacherSearch.value = lastTeacher;
      currentTeacherShort = lastTeacher;
      currentTeacherDept = lastDept;
      if (els.teacherDetailsName) {
        els.teacherDetailsName.textContent = lastTeacher;
      }
      // Update lottie visibility when last teacher is loaded
      updateTeacherLottieVisibility();
      // Load version labels for all semesters for this department
      const semesters = ['1-1', '1-2', '2-1', '2-2', '3-1', '3-2', '4-1', '4-2'];
      semesters.forEach(sem => {
        if (db) {
          db.ref(`versions/${lastDept}/${sem}`).once('value', (snap) => {
            if (!versionLabels[lastDept]) versionLabels[lastDept] = {};
            versionLabels[lastDept][sem] = snap.val() || '';
          });
        }
      });
      // Load routine - this will use cache first for instant display
      loadTeacherRoutine(lastTeacher, lastDept);
    } else {
      // No last teacher, show lottie
      updateTeacherLottieVisibility();
    }
  }

  async function initEntry() {
    // Initialize Auth
    initAuth();

    // Try to init landing Lottie immediately if library is ready
    initLottie();

    // Also check periodically if Lottie library loads asynchronously
    let lottieCheckCount = 0;
    const lottieCheckInterval = setInterval(() => {
      lottieCheckCount++;
      if (window.lottie && els.lottie && !els.lottie.querySelector('svg')) {
        initLottie();
        clearInterval(lottieCheckInterval);
      } else if (lottieCheckCount >= 20) {
        clearInterval(lottieCheckInterval);
      }
    }, 50);

    // Load departments first
    await loadDepartments();

    // Set up real-time listener for department availability changes
    if (db) {
      db.ref('departmentAvailability').on('value', (snap) => {
        const data = snap.val();
        if (data) {
          departmentAvailability = data;
          updateAllDepartmentDropdowns();
        }
      });
    }

    const defaultQueryDept = (departments[0] && departments[0].name) || 'EEE';
    ensureRoomQueryData(defaultQueryDept);

    // Set up global click handler for closing dropdowns
    if (!document.__dropdownCloseHandler) {
      document.__dropdownCloseHandler = true;
      document.addEventListener('click', (e) => {
        document.querySelectorAll('.custom-dropdown-menu.showing').forEach(openMenu => {
          const openWrapper = openMenu.closest('.custom-dropdown');
          if (openWrapper && !openWrapper.contains(e.target)) {
            hideDropdown(openMenu);
            openWrapper.querySelector('.custom-dropdown-button')?.classList.remove('open');
          }
        });
      }, true);
    }

    // Convert student page selects to custom animated dropdowns (if student screen is shown)
    // This will be handled by setScreen when student screen is displayed

    // Load teachers
    loadAllTeachers();

    // Preload and display teacher data immediately on page load
    // This ensures teacher page is ready when user clicks the tab
    const lastTeacher = localStorage.getItem('cse.lastTeacher');
    const lastDept = localStorage.getItem('cse.lastTeacherDept') || 'EEE';
    if (lastTeacher && lastDept) {
      // Load teacher data immediately (uses cache for instant display)
      loadLastTeacher().catch(err => {
        console.warn('Failed to preload teacher data:', err);
      });
    } else {
      // No last teacher, just preload department teachers for first department
      const defaultDept = (departments[0] && departments[0].name) || 'EEE';
      loadDepartmentTeachers(defaultDept).catch(err => {
        console.warn('Failed to preload department teachers:', err);
      });
    }

    // Initialize sections when department and semester are selected
    if (els.department && els.semester) {
      const dept = els.department.value || (departments[0] ? departments[0].name : 'EEE');
      const sem = els.semester.value.trim();
      if (dept && sem) {
        await populateSections(els.section, sem, '', dept);
      }
    }

    const persisted = getPersistedSelection();
    const hasVisited = localStorage.getItem('cse.hasVisited') === '1';
    if (persisted && hasVisited) {
      // Skip landing, go straight to student
      if (els.landingOverlay) {
        els.landingOverlay.classList.add('hidden');
        document.body.classList.remove('landing-lock');
      }
      setScreen('student');
      await loadStudent(persisted.department, persisted.semester, persisted.section);
    } else {
      // Show landing with overlay
      if (els.landingOverlay) {
        els.landingOverlay.classList.remove('hidden');
        document.body.classList.add('landing-lock');
      }

      // Hide default student loader if going to landing
      if (els.studentLoadingOverlay) {
        els.studentLoadingOverlay.classList.add('hidden');
      }
      document.body.classList.remove('student-loading-lock');

      setScreen('landing');

      // Force convert dropdowns after landing screen is shown (multiple attempts to ensure it works)
      const convertLandingDropdowns = () => {
        if (els.department && !els.department.dataset.converted) {
          convertSelectToCustomDropdown(els.department);
        }
        if (els.semester && !els.semester.dataset.converted) {
          convertSelectToCustomDropdown(els.semester);
        }
        if (els.section && !els.section.dataset.converted) {
          convertSelectToCustomDropdown(els.section);
        }
      };

      // Try multiple times to ensure conversion happens
      setTimeout(convertLandingDropdowns, 100);
      setTimeout(convertLandingDropdowns, 300);
      setTimeout(convertLandingDropdowns, 500);
    }

    // Lock body when landing is visible
    if (els.landingOverlay && !els.landingOverlay.classList.contains('hidden')) {
      document.body.classList.add('landing-lock');
    }
  }

  // ========== QUERY PAGE FUNCTIONALITY ==========

  // Tab switching for Room Query / CR Info
  if (els.roomQueryTab && els.crInfoTab) {
    els.roomQueryTab.addEventListener('click', () => {
      els.roomQueryTab.classList.add('active');
      els.crInfoTab.classList.remove('active');
      els.roomQueryInterface.classList.remove('hidden');
      els.crInfoInterface.classList.add('hidden');
      // Check dropdowns and show/hide lottie
      checkRoomQueryDropdowns();
    });

    els.crInfoTab.addEventListener('click', () => {
      els.crInfoTab.classList.add('active');
      els.roomQueryTab.classList.remove('active');
      els.crInfoInterface.classList.remove('hidden');
      els.roomQueryInterface.classList.add('hidden');
      // Check dropdowns and show/hide lottie
      checkCRInfoDropdowns();
    });
  }

  // Booking / History Tab Switching
  if (els.bookingTab && els.historyTab) {
    els.bookingTab.addEventListener('click', () => {
      els.bookingTab.classList.add('active');
      els.historyTab.classList.remove('active');
      els.bookingInterface.classList.remove('hidden');
      els.historyInterface.classList.add('hidden');
    });

    els.historyTab.addEventListener('click', () => {
      els.historyTab.classList.add('active');
      els.bookingTab.classList.remove('active');
      els.historyInterface.classList.remove('hidden');
      els.bookingInterface.classList.add('hidden');

      const user = window.firebase?.auth()?.currentUser;
      if (user && typeof loadUserBookingHistory === 'function') {
        loadUserBookingHistory(user.uid);
      }
    });
  }

  // Room Query functionality
  let roomQueryCurrentDay = null;
  let roomQuerySelectedTimeSlot = null;
  const roomQueryDataCache = {
    routinesByDept: {},
    roomsByDept: {},
    listeners: {}
  };

  // Format time slot to AM/PM format
  function formatTimeSlot(timeSlot) {
    if (!timeSlot) return '';
    return timeSlot.split(' - ').map(time => {
      const [hours, minutes] = time.split(':');
      const h = parseInt(hours);
      const m = minutes || '00';
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h > 12 ? h - 12 : (h === 0 ? 12 : h);
      return `${displayHour}:${m} ${period}`;
    }).join(' - ');
  }

  // Build day scroller for room query
  function buildRoomQueryDays(activeDay) {
    if (!els.roomQueryDayScroller) return;
    els.roomQueryDayScroller.innerHTML = '';
    DAYS_ORDER.forEach(day => {
      const btn = document.createElement('button');
      btn.className = 'day' + (day === activeDay ? ' active' : '');
      btn.setAttribute('role', 'tab');
      btn.title = day;

      const dayLabel = document.createElement('span');
      dayLabel.className = 'day-name';
      dayLabel.textContent = day.slice(0, 3);

      const dateLabel = document.createElement('span');
      dateLabel.className = 'day-date';
      dateLabel.textContent = getDateForDay(day);

      btn.appendChild(dayLabel);
      btn.appendChild(dateLabel);
      btn.addEventListener('click', () => {
        roomQueryCurrentDay = day;
        // Update active state
        Array.from(els.roomQueryDayScroller.children).forEach(b => {
          if (b.classList.contains('day')) {
            b.classList.toggle('active', b.title === day);
          }
        });
        // Update date hint
        const today = getTodayInfo();
        if (els.roomQueryDateToday) {
          els.roomQueryDateToday.textContent = day === today.dayName ? today.label : '';
        }
        // Re-run query if we have selections
        const searchBy = els.roomQuerySearchBy?.value;
        const value = els.roomQueryThirdSelect?.value;
        const department = els.roomQueryDepartment?.value || 'EEE';
        if (searchBy === 'room' && value) {
          queryRoomByNumber(value, department, day);
        } else if (searchBy === 'timeslot' && value) {
          queryRoomByTimeSlot(value, department, day);
        }
      });
      enableRipple(btn);
      els.roomQueryDayScroller.appendChild(btn);
    });

    // Set initial day to today
    const today = getTodayInfo();
    roomQueryCurrentDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
    if (els.roomQueryDateToday) {
      els.roomQueryDateToday.textContent = roomQueryCurrentDay === today.dayName ? today.label : '';
    }
  }

  function extractRoomsFromRoutineTree(routineTree) {
    const rooms = new Set();
    Object.values(routineTree || {}).forEach(sem => {
      Object.values(sem || {}).forEach(section => {
        Object.values(section || {}).forEach(daySlots => {
          (daySlots || []).forEach(slot => {
            if (slot && slot.room) rooms.add(slot.room);
          });
        });
      });
    });
    return Array.from(rooms).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }

  function ensureRoomQueryData(department) {
    if (!db || !department) return;
    if (roomQueryDataCache.listeners[department]) return;

    const ref = db.ref(`routines/${department}`);
    roomQueryDataCache.listeners[department] = ref;
    ref.on('value', (snap) => {
      const data = snap.val() || {};
      roomQueryDataCache.routinesByDept[department] = data;
      roomQueryDataCache.roomsByDept[department] = extractRoomsFromRoutineTree(data);

      if (els.roomQuerySearchBy?.value === 'room') {
        const currentDept = els.roomQueryDepartment?.value || 'EEE';
        if (currentDept === department) {
          refreshRoomNumberDropdown(department);
        }
      }
    }, (error) => {
      console.error('Failed to watch room query data:', error);
    });
  }

  function refreshRoomNumberDropdown(department) {
    if (!els.roomQueryThirdSelect) return;
    const select = els.roomQueryThirdSelect;
    const previousValue = select.value;
    const rooms = roomQueryDataCache.roomsByDept[department] || [];

    select.innerHTML = '';
    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.textContent = rooms.length ? 'Select Room' : 'Loading rooms...';
    select.appendChild(placeholder);

    rooms.forEach(room => {
      const opt = document.createElement('option');
      opt.value = room;
      opt.textContent = room;
      select.appendChild(opt);
    });

    if (rooms.includes(previousValue)) {
      select.value = previousValue;
    } else {
      select.value = '';
    }

    select.disabled = rooms.length === 0;
    refreshCustomDropdown(select);
  }

  function showRoomQueryLoading(message = 'Loading latest room data...') {
    if (els.roomQueryResults) {
      els.roomQueryResults.innerHTML = `<div class="empty">${message}</div>`;
    }
    // Hide lottie when showing loading message
    hideRoomQueryLottie();
  }

  function populateRoomNumbers(department) {
    if (!els.roomQueryThirdSelect) return;
    const dept = department || 'EEE';
    ensureRoomQueryData(dept);
    refreshRoomNumberDropdown(dept);
  }

  function populateTimeSlots() {
    if (!els.roomQueryThirdSelect) return;
    const timeSlots = [
      '9:00 - 10:25',
      '10:25 - 11:50',
      '11:50 - 1:15',
      '1:45 - 3:10',
      '3:10 - 4:35',
      '4:35 - 6:00'
    ];

    els.roomQueryThirdSelect.innerHTML = '<option value="">Select Time Slot</option>';
    timeSlots.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot;
      opt.textContent = slot;
      els.roomQueryThirdSelect.appendChild(opt);
    });
    els.roomQueryThirdSelect.disabled = false;
  }

  function queryRoomByNumber(roomNumber, department, selectedDay) {
    if (!roomNumber || !department) return;
    const routines = roomQueryDataCache.routinesByDept[department];
    if (!routines) {
      showRoomQueryLoading();
      ensureRoomQueryData(department);
      return;
    }

    // Use selected day or current day, default to first day
    const dayToUse = selectedDay || roomQueryCurrentDay || DAYS_ORDER[0];

    const allTimeSlots = [
      '9:00 - 10:25',
      '10:25 - 11:50',
      '11:50 - 1:15',
      '1:45 - 3:10',
      '3:10 - 4:35',
      '4:35 - 6:00'
    ];
    const occupiedSlots = new Set();

    // Only check the selected day for free slots
    Object.values(routines).forEach(sem => {
      Object.values(sem || {}).forEach(section => {
        const slots = (section?.[dayToUse]) || [];
        slots.forEach(slot => {
          if (slot && slot.room === roomNumber && slot.time) {
            occupiedSlots.add(slot.time);
          }
        });
      });
    });

    const freeSlots = allTimeSlots.filter(slot => !occupiedSlots.has(slot));
    renderRoomQueryResults(freeSlots.map(slot => ({ room: roomNumber, timeSlot: slot })), 'room', roomNumber);
  }

  function queryRoomByTimeSlot(timeSlot, department, selectedDay) {
    if (!timeSlot || !department) return;
    const routines = roomQueryDataCache.routinesByDept[department];
    if (!routines) {
      showRoomQueryLoading();
      ensureRoomQueryData(department);
      return;
    }
    const dayToUse = selectedDay || roomQueryCurrentDay || DAYS_ORDER[0];
    const allRooms = new Set(roomQueryDataCache.roomsByDept[department] || []);
    const occupiedRooms = new Set();

    Object.values(routines).forEach(sem => {
      Object.values(sem || {}).forEach(section => {
        const slots = (section?.[dayToUse]) || [];
        slots.forEach(slot => {
          if (!slot || !slot.room) return;
          allRooms.add(slot.room);
          if (slot.time === timeSlot) {
            occupiedRooms.add(slot.room);
          }
        });
      });
    });

    const freeRooms = Array.from(allRooms).filter(room => !occupiedRooms.has(room));
    renderRoomQueryResults(freeRooms.map(room => ({ room, timeSlot })), 'timeslot', timeSlot, dayToUse);
  }

  function renderRoomQueryResults(data, type, queryValue, selectedDay) {
    if (!els.roomQueryResults) return;
    els.roomQueryResults.innerHTML = '';

    // Hide lottie when showing results
    hideRoomQueryLottie();

    if (data.length === 0) {
      if (type === 'room') {
        els.roomQueryResults.innerHTML = '<div class="empty">No free time slots available for this room.</div>';
      } else {
        els.roomQueryResults.innerHTML = '<div class="empty">No empty rooms available for this time slot on the selected day.</div>';
      }
      return;
    }

    // Common container style
    const container = document.createElement('div');
    container.className = 'room-query-free-slots';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '12px';
    container.style.marginTop = '16px';

    data.forEach(item => {
      const block = document.createElement('div');
      block.className = 'room-query-free-slot-block class-card clickable-slot'; // Added clickable classes
      block.style.cssText = 'padding: 14px; background: rgba(158, 140, 255, 0.1); border: 1px solid var(--outline); border-radius: 12px; width: 100%; cursor: pointer; position: relative;';

      // Add ripple effect
      enableRipple(block);

      const title = document.createElement('div');
      title.className = 'room-query-free-slot-title';
      title.style.cssText = 'color: var(--text); margin-bottom: 6px; font-weight: 600;';
      title.textContent = `Room: ${item.room}`;

      const subtitle = document.createElement('div');
      subtitle.className = 'room-query-free-slot-time';
      subtitle.style.cssText = 'color: var(--muted);';
      subtitle.textContent = item.timeSlot;

      block.appendChild(title);
      block.appendChild(subtitle);

      // Click handler for booking
      block.addEventListener('click', (e) => {
        if (window.handleSlotClick) {
          window.handleSlotClick(item.room, item.timeSlot);
        }
      });

      container.appendChild(block);
    });

    els.roomQueryResults.appendChild(container);
  }

  // Helper function to check if all room query dropdowns are selected
  function checkRoomQueryDropdowns() {
    const dept = els.roomQueryDepartment?.value || '';
    const searchBy = els.roomQuerySearchBy?.value || '';
    const thirdSelect = els.roomQueryThirdSelect?.value || '';

    // Show lottie if not all dropdowns are selected
    if (!dept || !searchBy || !thirdSelect) {
      showRoomQueryLottie();
    } else {
      hideRoomQueryLottie();
    }
  }

  // Helper function to check if all CR info dropdowns are selected
  function checkCRInfoDropdowns() {
    const dept = els.crInfoDepartment?.value || '';
    const sem = els.crInfoSemester?.value || '';
    const sec = els.crInfoSection?.value || '';

    // Show lottie if not all dropdowns are selected
    if (!dept || !sem || !sec) {
      showCRInfoLottie();
    } else {
      hideCRInfoLottie();
    }
  }

  // Room Query event handlers
  if (els.roomQuerySearchBy) {
    els.roomQuerySearchBy.addEventListener('change', () => {
      const searchBy = els.roomQuerySearchBy.value;

      // Clear previous selections and results when changing search type
      if (els.roomQueryThirdSelect) {
        els.roomQueryThirdSelect.value = '';
        els.roomQueryThirdSelect.innerHTML = '<option value="">Select Option</option>';
      }
      if (els.roomQueryResults) {
        els.roomQueryResults.innerHTML = '';
      }
      // Hide and clear day selector when search type changes (will show after selecting value)
      if (els.roomQueryDaySelectorWrapper) els.roomQueryDaySelectorWrapper.classList.add('hidden');
      if (els.roomQueryDayScroller) els.roomQueryDayScroller.innerHTML = '';
      if (els.roomQueryDateToday) els.roomQueryDateToday.textContent = '';
      roomQuerySelectedTimeSlot = null;
      roomQueryCurrentDay = null;

      // Check dropdowns and show/hide lottie
      checkRoomQueryDropdowns();

      if (searchBy === 'room') {
        els.roomQueryThirdLabel.textContent = 'Room Number';
        populateRoomNumbers(els.roomQueryDepartment?.value || 'EEE');
      } else if (searchBy === 'timeslot') {
        els.roomQueryThirdLabel.textContent = 'Time Slot';
        populateTimeSlots();
      } else {
        els.roomQueryThirdSelect.disabled = true;
        els.roomQueryThirdSelect.innerHTML = '<option value="">Select type</option>';
        els.roomQueryResults.innerHTML = '';
      }
    });
  }

  if (els.roomQueryThirdSelect) {
    els.roomQueryThirdSelect.addEventListener('change', () => {
      const searchBy = els.roomQuerySearchBy?.value;
      const value = els.roomQueryThirdSelect.value;
      const department = els.roomQueryDepartment?.value || 'EEE';

      // Check dropdowns and show/hide lottie
      checkRoomQueryDropdowns();

      if (searchBy === 'room' && value) {
        // Show day selector for room number search
        if (els.roomQueryDaySelectorWrapper) {
          els.roomQueryDaySelectorWrapper.classList.remove('hidden');
          if (els.roomQueryDayTitle) {
            els.roomQueryDayTitle.textContent = `Free slots for Room ${value}`;
          }
        }
        // Initialize day scroller if not already built
        if (els.roomQueryDayScroller && els.roomQueryDayScroller.children.length === 0) {
          if (!roomQueryCurrentDay) {
            const today = getTodayInfo();
            roomQueryCurrentDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
          }
          buildRoomQueryDays(roomQueryCurrentDay);
        }
        queryRoomByNumber(value, department, roomQueryCurrentDay);
      } else if (searchBy === 'timeslot' && value) {
        roomQuerySelectedTimeSlot = value;
        // Show day selector for time slot search (empty rooms)
        if (els.roomQueryDaySelectorWrapper) {
          els.roomQueryDaySelectorWrapper.classList.remove('hidden');
          if (els.roomQueryDayTitle) {
            const formattedTime = formatTimeSlot(value);
            els.roomQueryDayTitle.textContent = `Free slots for this time (${formattedTime})`;
          }
        }
        // Initialize day scroller if not already built
        if (els.roomQueryDayScroller && els.roomQueryDayScroller.children.length === 0) {
          if (!roomQueryCurrentDay) {
            const today = getTodayInfo();
            roomQueryCurrentDay = DAYS_ORDER.includes(today.dayName) ? today.dayName : DAYS_ORDER[0];
          }
          buildRoomQueryDays(roomQueryCurrentDay);
        }
        const selectedDay = roomQueryCurrentDay || DAYS_ORDER[0];
        queryRoomByTimeSlot(value, department, selectedDay).catch(() => { });
      } else {
        // Hide day selector when no value selected
        if (els.roomQueryDaySelectorWrapper) els.roomQueryDaySelectorWrapper.classList.add('hidden');
        roomQuerySelectedTimeSlot = null;
      }
    });
  }

  if (els.roomQueryDepartment) {
    els.roomQueryDepartment.addEventListener('change', () => {
      const searchBy = els.roomQuerySearchBy?.value;
      ensureRoomQueryData(els.roomQueryDepartment.value || 'EEE');
      if (searchBy === 'room') {
        populateRoomNumbers(els.roomQueryDepartment.value);
      }
      els.roomQueryResults.innerHTML = '';
      // Check dropdowns and show/hide lottie
      checkRoomQueryDropdowns();
    });
  }

  // CR Info functionality
  function loadCRInfo(department, semester, section) {
    if (!db || !department || !semester || !section) return;

    // Load CR data
    db.ref(`cr/${department}/${semester}/${section}`).once('value', (snap) => {
      const crData = snap.val() || {};

      // Load section info (batch, coordinator, total students)
      db.ref(`sectionInfo/${department}/${semester}/${section}`).once('value', (sectionSnap) => {
        const sectionInfo = sectionSnap.val() || {};

        renderCRInfo({
          department,
          semester,
          section,
          crData,
          sectionInfo
        });
      });
    });
  }

  function renderCRInfo(data) {
    if (!els.crInfoResults) return;
    els.crInfoResults.innerHTML = '';

    // Hide lottie when showing results
    hideCRInfoLottie();

    const { department, semester, section, crData, sectionInfo } = data;

    // Block 1: Basic Info
    const block1 = document.createElement('div');
    block1.className = 'cr-info-block';
    block1.innerHTML = `
      <div class="cr-info-block-title">Basic Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Department</span>
        <span class="cr-info-value">${department || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Batch</span>
        <span class="cr-info-value">${sectionInfo.batch || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Semester</span>
        <span class="cr-info-value">${semLabel(semester)}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Section</span>
        <span class="cr-info-value">${section}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Total Students</span>
        <span class="cr-info-value">${sectionInfo.totalStudents || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block1);

    // Block 2: Coordinator Info
    const block2 = document.createElement('div');
    block2.className = 'cr-info-block';
    block2.innerHTML = `
      <div class="cr-info-block-title">Coordinator Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Name</span>
        <span class="cr-info-value">${sectionInfo.coordinatorName || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Phone</span>
        <span class="cr-info-value">${sectionInfo.coordinatorPhone || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Email</span>
        <span class="cr-info-value">${sectionInfo.coordinatorEmail || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block2);

    // Block 3: First CR Info
    const block3 = document.createElement('div');
    block3.className = 'cr-info-block';
    const cr1 = crData.cr1 || {};
    block3.innerHTML = `
      <div class="cr-info-block-title">First CR Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Name</span>
        <span class="cr-info-value">${cr1.name || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">ID</span>
        <span class="cr-info-value">${cr1.id || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Phone Number</span>
        <span class="cr-info-value">${cr1.phone || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block3);

    // Block 4: Second CR Info
    const block4 = document.createElement('div');
    block4.className = 'cr-info-block';
    const cr2 = crData.cr2 || {};
    block4.innerHTML = `
      <div class="cr-info-block-title">Second CR Information</div>
      <div class="cr-info-item">
        <span class="cr-info-label">Name</span>
        <span class="cr-info-value">${cr2.name || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">ID</span>
        <span class="cr-info-value">${cr2.id || '—'}</span>
      </div>
      <div class="cr-info-item">
        <span class="cr-info-label">Phone Number</span>
        <span class="cr-info-value">${cr2.phone || '—'}</span>
      </div>
    `;
    els.crInfoResults.appendChild(block4);
  }

  // CR Info event handlers
  if (els.crInfoDepartment) {
    els.crInfoDepartment.addEventListener('change', async () => {
      const dept = els.crInfoDepartment.value;
      const sem = els.crInfoSemester?.value;
      if (dept && sem) {
        await populateSections(els.crInfoSection, sem, '', dept);
      }
      // Check dropdowns and show/hide lottie
      checkCRInfoDropdowns();
    });
  }

  if (els.crInfoSemester) {
    els.crInfoSemester.addEventListener('change', async () => {
      const dept = els.crInfoDepartment?.value;
      const sem = els.crInfoSemester.value;
      if (dept && sem) {
        await populateSections(els.crInfoSection, sem, '', dept);
      } else {
        els.crInfoSection.disabled = true;
        els.crInfoSection.innerHTML = '<option value="">Select Department and Semester first</option>';
        els.crInfoResults.innerHTML = '';
      }
      // Check dropdowns and show/hide lottie
      checkCRInfoDropdowns();
    });
  }

  if (els.crInfoSection) {
    els.crInfoSection.addEventListener('change', () => {
      const dept = els.crInfoDepartment?.value;
      const sem = els.crInfoSemester?.value;
      const sec = els.crInfoSection.value;
      if (dept && sem && sec) {
        loadCRInfo(dept, sem, sec);
      } else {
        els.crInfoResults.innerHTML = '';
      }
      // Check dropdowns and show/hide lottie
      checkCRInfoDropdowns();
    });
  }

  // Boot
  document.addEventListener('DOMContentLoaded', initEntry);
  // --- Auth & Booking System ---

  let currentUser = null;
  let userProfile = {};

  async function initAuth() {
    console.log("Initializing Auth...");
    const authEls = {
      loginForm: document.getElementById('loginForm'),
      signupForm: document.getElementById('signupForm'),
      loginContainer: document.getElementById('loginContainer'),
      signupContainer: document.getElementById('signupContainer'),
      showSignup: document.getElementById('showSignup'),
      showLogin: document.getElementById('showLogin'),
      showForgotPassword: document.getElementById('showForgotPassword'),
      backToLoginFromForgot: document.getElementById('backToLoginFromForgot'),
      forgotPasswordForm: document.getElementById('forgotPasswordForm'),
      forgotPasswordContainer: document.getElementById('forgotPasswordContainer'),
      signupTypeStudent: document.getElementById('signupTypeStudent'),
      signupTypeTeacher: document.getElementById('signupTypeTeacher'),
      signupFields: document.getElementById('signupFields'),
      authView: document.getElementById('authView'),
      menuView: document.getElementById('menuView'),
      profileIcon: document.getElementById('profileIcon'),
      logoutBtn: document.getElementById('logoutBtn'),
      userName: document.getElementById('userName'),
      userRole: document.getElementById('userRole'),
      userInitials: document.getElementById('userInitials'),
      cardUserId: document.getElementById('cardUserId'),
      bookingMenuOption: document.getElementById('bookingMenuOption'),
      bookingModal: document.getElementById('bookingModal'),
      bookingForm: document.getElementById('bookingForm'),
      bookingModalClose: document.getElementById('bookingModalClose'),
      profileModal: document.getElementById('profileModal'),
      profileForm: document.getElementById('profileForm'),
      profileModalClose: document.getElementById('profileModalClose'),
      privacyOption: document.getElementById('privacyOption'),
      privacyModal: document.getElementById('privacyModal'),
      privacyModalClose: document.getElementById('privacyModalClose'),
      bookingBackBtn: document.getElementById('bookingBackBtn')
    };

    // Booking Back Button
    if (authEls.bookingBackBtn) {
      authEls.bookingBackBtn.onclick = () => {
        setScreen('more');
      };
    }

    // Privacy & Policy Navigation (for logged-in users)
    const privacyOption = document.getElementById('privacyOption');
    if (privacyOption) {
      privacyOption.onclick = () => {
        setScreen('privacy');
      };
    }

    // Privacy Back Button
    const privacyBackBtn = document.getElementById('privacyBackBtn');
    if (privacyBackBtn) {
      privacyBackBtn.onclick = () => {
        setScreen('more');
      };
    }

    // Support Navigation (for logged-in users)
    const supportOption = document.getElementById('supportOption');
    if (supportOption) {
      supportOption.onclick = () => {
        setScreen('support');
      };
    }

    // Support Back Button
    const supportBackBtn = document.getElementById('supportBackBtn');
    if (supportBackBtn) {
      supportBackBtn.onclick = () => {
        setScreen('more');
      };
    }

    // Information/About Navigation (for logged-in users)
    const informationOption = document.getElementById('informationOption');
    if (informationOption) {
      informationOption.onclick = () => {
        setScreen('information');
      };
    }

    // Information Back Button
    const informationBackBtn = document.getElementById('informationBackBtn');
    if (informationBackBtn) {
      informationBackBtn.onclick = () => {
        setScreen('more');
      };
    }

    // Public Access Buttons (for logged-out users)
    const publicPrivacyBtn = document.getElementById('publicPrivacyBtn');
    if (publicPrivacyBtn) {
      publicPrivacyBtn.onclick = () => {
        setScreen('privacy');
      };
    }

    const publicSupportBtn = document.getElementById('publicSupportBtn');
    if (publicSupportBtn) {
      publicSupportBtn.onclick = () => {
        setScreen('support');
      };
    }

    // Toggle Login/Signup
    if (authEls.showSignup) authEls.showSignup.onclick = () => {
      authEls.loginContainer.classList.add('hidden');
      authEls.signupContainer.classList.remove('hidden');
      if (authEls.forgotPasswordContainer) authEls.forgotPasswordContainer.classList.add('hidden');
    };
    if (authEls.showLogin) authEls.showLogin.onclick = () => {
      authEls.signupContainer.classList.add('hidden');
      authEls.loginContainer.classList.remove('hidden');
      if (authEls.forgotPasswordContainer) authEls.forgotPasswordContainer.classList.add('hidden');
    };

    // Forgot Password Toggles
    if (authEls.showForgotPassword) authEls.showForgotPassword.onclick = () => {
      authEls.loginContainer.classList.add('hidden');
      authEls.signupContainer.classList.add('hidden');
      authEls.forgotPasswordContainer.classList.remove('hidden');
    }

    if (authEls.backToLoginFromForgot) authEls.backToLoginFromForgot.onclick = () => {
      authEls.forgotPasswordContainer.classList.add('hidden');
      authEls.loginContainer.classList.remove('hidden');
    }

    // Forgot Password Submit
    // Forgot Password Submit
    // Forgot Password Submit
    if (authEls.forgotPasswordForm) authEls.forgotPasswordForm.onsubmit = async (e) => {
      e.preventDefault();
      const rawEmail = document.getElementById('forgotPasswordEmail').value;
      const email = rawEmail ? rawEmail.trim() : '';

      const btn = authEls.forgotPasswordForm.querySelector('button[type="submit"]');
      const errEl = document.getElementById('forgotPasswordError');
      const succEl = document.getElementById('forgotPasswordSuccess');

      errEl.classList.remove('show');
      succEl.classList.remove('show');

      if (!email) {
        errEl.textContent = "Please enter your email.";
        errEl.classList.add('show');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Verifying Account...';

      try {
        let userFound = false;

        // LAYER 1: Auth Check (Fast & Reliable if Protection is OFF)
        try {
          const methods = await firebase.auth().fetchSignInMethodsForEmail(email);
          if (methods && methods.length > 0) userFound = true;
        } catch (e) {
          // Often blocked by policy or network. Ignore specific error.
          console.warn("Auth check ignored", e);
        }

        // LAYER 2: Database Check (Primary verification if Auth is protected)
        if (!userFound) {
          try {
            // Try scanning users table
            const snapshot = await db.ref('users').orderByChild('email').equalTo(email).once('value');
            if (snapshot.exists()) userFound = true;
          } catch (dbErr) {
            console.warn("DB check denied", dbErr);
            // If permission denied, we cannot verify status.
          }
        }

        // DECISION LOGIC
        // If we still haven't found the user after Layer 1 & 2...
        if (!userFound) {
          // ... AND we want strict "Error on Invalid", we must assume they don't exist.
          // WARNING: This blocks valid users if DB is unreadable.
          // But this is what the user explicitly requested ("Invalid email -> No account found").
          throw new Error("No account found with this email address.");
        }

        // If User Found or we are proceeding...
        btn.textContent = 'Sending Link...';
        await firebase.auth().sendPasswordResetEmail(email);

        succEl.textContent = "Reset link sent! Please check your Inbox and Spam folder.";
        succEl.classList.add('show');
        btn.textContent = 'Link Sent';

        setTimeout(() => {
          btn.disabled = false;
          btn.textContent = 'Send Reset Link';
        }, 5000);

      } catch (err) {
        let msg = "Failed: " + err.message;
        if (err.message.includes("No account found")) msg = "No account found with this email address. Please Register first.";
        if (err.code === 'auth/user-not-found') msg = "No account found with this email address.";
        if (err.code === 'auth/invalid-email') msg = "Invalid email format.";

        errEl.textContent = msg;
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Send Reset Link';
      }
    };

    // Toggle Signup Type
    let signupType = 'student';
    function updateSignupType(type) {
      signupType = type;
      if (type === 'student') {
        authEls.signupTypeStudent.classList.add('active');
        authEls.signupTypeTeacher.classList.remove('active');
        renderStudentFields();
      } else {
        authEls.signupTypeTeacher.classList.add('active');
        authEls.signupTypeStudent.classList.remove('active');
        renderTeacherFields();
      }
    }

    if (authEls.signupTypeStudent) authEls.signupTypeStudent.onclick = () => updateSignupType('student');
    if (authEls.signupTypeTeacher) authEls.signupTypeTeacher.onclick = () => updateSignupType('teacher');

    function renderStudentFields() {
      if (!authEls.signupFields) return;
      authEls.signupFields.innerHTML = `
            <div class="field"><span>Full Name</span><input type="text" id="s_name" class="auth-input" required placeholder="Enter your name"></div>
            <div class="field"><span>Student ID</span><input type="text" id="s_id" class="auth-input" required placeholder="Enter your id"></div>
            
            <label class="field control">
                <span>Department</span>
                <select id="s_dept" class="dropdown auth-input">
                    <option value="">Select Department</option>
                </select>
            </label>
            <label class="field control">
                <span>Semester</span>
                <select id="s_sem" class="dropdown auth-input">
                    <option value="">Select Semester</option>
                    <option value="1-1">1st</option>
                    <option value="1-2">2nd</option>
                    <option value="2-1">3rd</option>
                    <option value="2-2">4th</option>
                    <option value="3-1">5th</option>
                    <option value="3-2">6th</option>
                    <option value="4-1">7th</option>
                    <option value="4-2">8th</option>
                </select>
            </label>
            <label class="field control">
                <span>Section</span>
                <select id="s_sec" class="dropdown auth-input" disabled>
                    <option value="">Select Section</option>
                </select>
            </label>

            <div class="field"><span>Phone</span><input type="tel" id="s_phone" class="auth-input" required placeholder="Enter your phone number"></div>
            <div class="field"><span>Email</span><input type="email" id="s_email" class="auth-input" required placeholder="Enter your email"></div>
        `;

      const s_dept = document.getElementById('s_dept');
      const s_sem = document.getElementById('s_sem');
      const s_sec = document.getElementById('s_sec');

      // Populate Departments
      if (s_dept) {
        if (departments && departments.length > 0) {
          departments.forEach(dept => {
            const opt = document.createElement('option');
            opt.value = dept.name;
            opt.textContent = dept.name;
            const isAvailable = departmentAvailability[dept.name] !== false;
            if (!isAvailable) opt.disabled = true;
            if (dept.name === 'EEE' && isAvailable) opt.selected = true;
            s_dept.appendChild(opt);
          });
        } else {
          // Fallback if departments not yet loaded
          const def = document.createElement('option');
          def.value = 'EEE';
          def.textContent = 'EEE';
          def.selected = true;
          s_dept.appendChild(def);
        }
      }

      // Add change listeners
      const updateSections = async () => {
        const dept = s_dept.value;
        const sem = s_sem.value;

        // Populate sections if both dept and sem are selected
        if (dept && sem) {
          await populateSections(s_sec, sem, '', dept);
        } else {
          s_sec.innerHTML = '<option value="">Select Section</option>';
          s_sec.disabled = true;
          refreshCustomDropdown(s_sec);
        }
      };

      if (s_dept) s_dept.addEventListener('change', updateSections);
      if (s_sem) s_sem.addEventListener('change', updateSections);

      // Apply Custom Dropdown UI
      setTimeout(() => {
        if (s_dept) convertSelectToCustomDropdown(s_dept);
        if (s_sem) convertSelectToCustomDropdown(s_sem);
        if (s_sec) convertSelectToCustomDropdown(s_sec);
      }, 50);
    }

    function renderTeacherFields() {
      if (!authEls.signupFields) return;
      authEls.signupFields.innerHTML = `
            <div class="field"><span>Full Name</span><input type="text" id="t_name" class="auth-input" required placeholder="Enter your name"></div>
            <div class="field"><span>Mobile</span><input type="tel" id="t_phone" class="auth-input" required placeholder="Enter your phone number"></div>
            <div class="field"><span>Email</span><input type="email" id="t_email" class="auth-input" required placeholder="Enter your email"></div>
        `;
    }

    renderStudentFields();

    // Login
    if (authEls.loginForm) authEls.loginForm.onsubmit = async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value;
      const pass = document.getElementById('loginPassword').value;
      const btn = authEls.loginForm.querySelector('button[type="submit"]');
      const errEl = document.getElementById('loginError');
      const succEl = document.getElementById('loginSuccess');

      errEl.classList.remove('show');
      succEl.classList.remove('show');
      btn.disabled = true;
      btn.textContent = 'Logging in...';

      try {
        await firebase.auth().signInWithEmailAndPassword(email, pass);
        succEl.textContent = "Login Successful!";
        succEl.classList.add('show');
        // Redirect handled by onAuthStateChanged
      } catch (err) {
        let msg = "Login Failed: " + err.message;

        // Handle specific error codes/messages
        if (err.code === 'auth/user-not-found') msg = "User not found. Please sign up.";
        else if (err.code === 'auth/wrong-password') msg = "Invalid email or password.";
        else if (err.code === 'auth/invalid-credential' || err.code === 'auth/invalid-login-credentials') msg = "Invalid email or password.";
        else if (err.message && err.message.includes('INVALID_LOGIN_CREDENTIALS')) msg = "Invalid email or password.";

        errEl.textContent = msg;
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Login';
      }
    };

    // Signup
    if (authEls.signupForm) authEls.signupForm.onsubmit = async (e) => {
      e.preventDefault();
      const pass = document.getElementById('signupPassword').value;
      const confirm = document.getElementById('signupConfirmPassword').value;
      const btn = authEls.signupForm.querySelector('button[type="submit"]');
      const errEl = document.getElementById('signupError');
      const succEl = document.getElementById('signupSuccess');

      errEl.classList.remove('show');
      succEl.classList.remove('show');

      if (pass !== confirm) {
        errEl.textContent = "Passwords do not match";
        errEl.classList.add('show');
        return;
      }

      btn.disabled = true;
      btn.textContent = 'Creating Account...';

      try {
        let userData = {};
        let email, phone;

        if (signupType === 'student') {
          email = document.getElementById('s_email').value;
          phone = document.getElementById('s_phone').value;
          const name = document.getElementById('s_name').value;
          const id = document.getElementById('s_id').value;
          const dept = document.getElementById('s_dept').value;
          const sem = document.getElementById('s_sem').value;
          const sec = document.getElementById('s_sec').value;

          // Check CR Eligibility - Basic Check
          // Ideally we scan `cr_numbers` node.
          let role = 'student';
          try {
            const snap = await db.ref('cr_numbers').once('value');
            const crNums = snap.val() || {};
            const normPhone = phone.replace(/\D/g, '');
            // Check values
            const isCR = Object.values(crNums).some(n => String(n).replace(/\D/g, '') === normPhone);
            if (isCR) role = 'cr';
          } catch (e) { }

          userData = { name, id, dept, text_semester: sem, section: sec, phone, email, role, type: 'student' };
        } else {
          email = document.getElementById('t_email').value;
          phone = document.getElementById('t_phone').value;
          const name = document.getElementById('t_name').value;

          // Verify Teacher
          let isTeacher = false;
          try {
            // Check against allTeachers
            const normPhone = phone.replace(/\D/g, '');
            isTeacher = Object.values(allTeachers).some(t => String(t.contact || '').replace(/\D/g, '') === normPhone);
          } catch (e) { }

          if (!isTeacher) {
            throw new Error("You are not eligible for teacher account (Mobile mismatch).");
          }
          userData = { name, phone, email, role: 'teacher', type: 'teacher' };
        }

        const cred = await firebase.auth().createUserWithEmailAndPassword(email, pass);
        await db.ref('users/' + cred.user.uid).set(userData);

        succEl.textContent = "Account Created! Logging in...";
        succEl.classList.add('show');
        // Redirect handled by onAuthStateChanged
      } catch (err) {
        errEl.textContent = "Signup Failed: " + err.message;
        errEl.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Sign Up';
      }
    };

    // Auth State
    // Auth State - Real-time Listener
    let userListenerRef = null;

    firebase.auth().onAuthStateChanged((user) => {
      currentUser = user;
      if (user) {
        if (authEls.authView) authEls.authView.classList.add('hidden');
        if (authEls.menuView) authEls.menuView.classList.remove('hidden');
        if (authEls.profileIcon) authEls.profileIcon.classList.remove('hidden');

        // Set up real-time listener for user profile
        if (userListenerRef) userListenerRef.off(); // clear previous if any

        userListenerRef = db.ref('users/' + user.uid);
        userListenerRef.on('value', (snap) => {
          if (snap.exists()) {
            userProfile = snap.val();
            // Save to localStorage for Lab Rat access
            localStorage.setItem('cse.userProfile', JSON.stringify(userProfile));

            if (authEls.userName) authEls.userName.textContent = userProfile.name;
            if (authEls.userRole) authEls.userRole.textContent = userProfile.role;
            if (authEls.userInitials) authEls.userInitials.textContent = (userProfile.name || 'U').charAt(0).toUpperCase();
            if (authEls.cardUserId) {
              const displayId = userProfile.id || userProfile.studentId || userProfile.teacherId || '--';
              authEls.cardUserId.innerHTML = `ID: <span style="font-family: 'Poppins', sans-serif; font-weight: 500; letter-spacing: 0.5px;">${displayId}</span>`;
            }

            // Update booking menu based on role immediately
            // Synced with Local Storage as per user request
            localStorage.setItem('user_role', userProfile.role || 'student');
            updateBookingMenu(userProfile.role);
          }
        });
      } else {
        if (authEls.authView) authEls.authView.classList.remove('hidden');
        if (authEls.menuView) authEls.menuView.classList.add('hidden');
        if (authEls.profileIcon) authEls.profileIcon.classList.add('hidden');

        // Scroll to top when showing auth view
        window.scrollTo(0, 0);
        document.body.scrollTop = 0;
        document.documentElement.scrollTop = 0;

        // Reset Login Form State
        if (authEls.loginForm) {
          authEls.loginForm.reset(); // clear inputs
          const btn = authEls.loginForm.querySelector('button[type="submit"]');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Login';
          }
          const succEl = document.getElementById('loginSuccess');
          const errEl = document.getElementById('loginError');
          if (succEl) { succEl.classList.remove('show'); succEl.textContent = ''; }
          if (errEl) { errEl.classList.remove('show'); errEl.textContent = ''; }
        }

        // Reset Signup Form State (just in case)
        if (authEls.signupForm) {
          authEls.signupForm.reset();
          const btn = authEls.signupForm.querySelector('button[type="submit"]');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Sign Up';
          }
          const succEl = document.getElementById('signupSuccess');
          const errEl = document.getElementById('signupError');
          if (succEl) { succEl.classList.remove('show'); succEl.textContent = ''; }
          if (errEl) { errEl.classList.remove('show'); errEl.textContent = ''; }
        }

        // Reset Forgot Password Form State
        if (authEls.forgotPasswordForm) {
          authEls.forgotPasswordForm.reset();
          const btn = authEls.forgotPasswordForm.querySelector('button[type="submit"]');
          if (btn) {
            btn.disabled = false;
            btn.textContent = 'Send Reset Link';
          }
          const succEl = document.getElementById('forgotPasswordSuccess');
          const errEl = document.getElementById('forgotPasswordError');
          if (succEl) { succEl.classList.remove('show'); succEl.textContent = ''; }
          if (errEl) { errEl.classList.remove('show'); errEl.textContent = ''; }
          if (authEls.forgotPasswordContainer) {
            authEls.forgotPasswordContainer.classList.add('hidden');
          }
        }

        if (userListenerRef) {
          userListenerRef.off();
          userListenerRef = null;
        }
        userProfile = {};
        localStorage.removeItem('user_role');
        updateBookingMenu('student'); // Default to restricted
      }
    });

    function updateBookingMenu(role) {
      const btn = document.getElementById('bookingMenuOption');
      if (!btn) return;

      const normalizedRole = (role || 'student').toLowerCase();
      const isAllowed = normalizedRole === 'cr' || normalizedRole === 'teacher' || normalizedRole === 'admin';

      const titleEl = btn.querySelector('.more-block-title');
      let badgeEl = btn.querySelector('.more-block-badge');

      if (isAllowed) {
        if (titleEl) titleEl.textContent = 'Slot Book';
        // Remove badge if exists
        if (badgeEl) badgeEl.remove();

        btn.classList.remove('disabled-menu-option');
        btn.classList.add('more-block-clickable'); // Ensure hover effects
        btn.classList.remove('more-block-disabled');
        btn.style.opacity = '1';
        btn.style.filter = 'none';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
      } else {
        if (titleEl) titleEl.textContent = 'Slot Book';
        // Add badge if missing
        if (!badgeEl) {
          badgeEl = document.createElement('div');
          badgeEl.className = 'more-block-badge';
          badgeEl.textContent = 'NOT AVAILABLE';
          btn.insertBefore(badgeEl, btn.firstChild);
        } else {
          badgeEl.textContent = 'NOT AVAILABLE';
        }

        btn.classList.add('disabled-menu-option');
        // Add clickable class to allow hover animation (lift effect) even when disabled
        btn.classList.add('more-block-clickable');
        btn.classList.add('more-block-disabled'); // Re-use disabled style

        // Keep visual disabled style but allow interaction for popup
        btn.style.opacity = '0.7';
        btn.style.filter = 'grayscale(100%)';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
      }
    }

    // Use event delegation for logout button to ensure it works properly
    document.addEventListener('click', (e) => {
      if (e.target.closest('#logoutBtn')) {
        const popup = document.getElementById('logoutConfirmPopup');
        if (popup) {
          popup.classList.remove('hidden');
          // Small delay to allow display:block to apply before opacity transition
          requestAnimationFrame(() => {
            popup.classList.add('showing');
          });
        }
      }
    });

    const logoutCancelBtn = document.getElementById('logoutCancelBtn');
    const logoutConfirmBtn = document.getElementById('logoutConfirmBtn');

    if (logoutCancelBtn) {
      logoutCancelBtn.onclick = () => {
        const popup = document.getElementById('logoutConfirmPopup');
        if (popup) {
          popup.classList.remove('showing');
          setTimeout(() => popup.classList.add('hidden'), 200);
        }
      };
    }

    if (logoutConfirmBtn) {
      logoutConfirmBtn.onclick = async () => {
        const popup = document.getElementById('logoutConfirmPopup');
        const originalText = logoutConfirmBtn.textContent;
        logoutConfirmBtn.textContent = 'Logging out...';
        logoutConfirmBtn.disabled = true;

        try {
          await firebase.auth().signOut();
          // Scroll to top immediately after sign out triggers
          window.scrollTo(0, 0);
          document.body.scrollTop = 0;
          document.documentElement.scrollTop = 0;
        } catch (e) {
          console.error('Logout error', e);
        } finally {
          logoutConfirmBtn.textContent = originalText; // Reset for next time
          logoutConfirmBtn.disabled = false;
          if (popup) {
            popup.classList.remove('showing');
            setTimeout(() => popup.classList.add('hidden'), 200);
          }
        }
      };
    }

    // Privacy handlers moved to global scope
    // Profile

    // Profile
    if (authEls.profileIcon) authEls.profileIcon.onclick = () => {
      authEls.profileModal.classList.remove('hidden');
      if (userProfile.name) document.getElementById('profileName').value = userProfile.name;
    };
    if (authEls.profileModalClose) authEls.profileModalClose.onclick = () => authEls.profileModal.classList.add('hidden');
    if (authEls.profileForm) authEls.profileForm.onsubmit = async (e) => {
      e.preventDefault();
      const newName = document.getElementById('profileName').value;
      const newPass = document.getElementById('profilePassword').value;
      if (currentUser) {
        await db.ref('users/' + currentUser.uid + '/name').set(newName);
        if (newPass) await currentUser.updatePassword(newPass);
        alert("Profile Updated");
        authEls.profileModal.classList.add('hidden');
      }
    };

    // Booking
    if (authEls.bookingModalClose) authEls.bookingModalClose.onclick = () => authEls.bookingModal.classList.add('hidden');

    if (authEls.bookingForm) authEls.bookingForm.onsubmit = async (e) => {
      e.preventDefault();
      const date = document.getElementById('bookingDate').value;
      const reason = document.getElementById('bookingReason').value;
      const room = document.getElementById('bookingRoom').value;
      const time = document.getElementById('bookingTime').value;

      if (currentUser) {
        await db.ref('booking_requests').push({
          uid: currentUser.uid,
          name: userProfile.name,
          role: userProfile.role,
          room, time, date, reason,
          status: 'pending',
          timestamp: Date.now()
        });
        alert("Booking Request Sent for Admin Approval");
        // Clear form
        e.target.reset();
        // Refresh history
        if (typeof loadUserBookingHistory === 'function') {
          loadUserBookingHistory(currentUser.uid);
        }
      }
    };
  }

  // Handle new popup close
  const slotAccessCloseBtn = document.getElementById('slotAccessCloseBtn');
  const slotAccessPopup = document.getElementById('slotAccessPopup');

  if (slotAccessCloseBtn && slotAccessPopup) {
    const closeSlotPopup = () => {
      slotAccessPopup.classList.remove('showing');
      setTimeout(() => slotAccessPopup.classList.add('hidden'), 200);
    };

    slotAccessCloseBtn.addEventListener('click', closeSlotPopup);

    // Also close on backdrop click
    slotAccessPopup.addEventListener('click', (e) => {
      if (e.target === slotAccessPopup) closeSlotPopup();
    });
  }

  // Password Visibility Toggle
  window.togglePasswordVisibility = function (inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;

    if (input.type === 'password') {
      input.type = 'text';
      // Switch to Eye Off (Slash) icon
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
            <line x1="1" y1="1" x2="23" y2="23"></line>
        </svg>
      `;
      btn.style.color = 'var(--accent)';
    } else {
      input.type = 'password';
      // Switch back to Eye icon
      btn.innerHTML = `
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
            <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
      btn.style.color = '';
    }
  };

  // Slot Click Handler
  window.handleSlotClick = function (room, time) {
    if (!currentUser) {
      alert("Please login to book a slot.");
      // redirect to more?
      setScreen('more');
      return;
    }
    if (userProfile.role !== 'cr' && userProfile.role !== 'teacher' && userProfile.role !== 'admin') {
      alert("Only CRs and Teachers can book slots.");
      return;
    }

    const modal = document.getElementById('bookingModal');
    if (modal) {
      document.getElementById('bookingRoom').value = room;
      document.getElementById('bookingTime').value = time;
      modal.classList.remove('hidden');
    }
  };

  // Handle Booking Block Click (More Page)
  window.handleBookingClick = function () {
    if (!currentUser) {
      // Should logically be logged in to see this, but safe check
      alert('Please login first');
      return;
    }

    const role = (userProfile.role || 'student').toLowerCase();

    if (role === 'student') {
      const popup = document.getElementById('slotAccessPopup');
      if (popup) {
        popup.classList.remove('hidden');
        setTimeout(() => popup.classList.add('showing'), 10);
      }
    } else {
      // Allow access for CR, Teacher, Admin
      setScreen('booking');
    }
  };

  // Ensure initAuth runs when app loads
  // We prefer running it inside initEntry, but redundancy ensures it works even if initEntry stalls
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAuth);
  } else {
    initAuth();
  }

})();


