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
      empty: document.getElementById('empty'),
      query: document.getElementById('query')
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
    studentLoadingOverlay: document.getElementById('studentLoadingOverlay')
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
    // Prevent screen switching when landing screen is visible (except when going to student after selection)
    if (els.landingOverlay && !els.landingOverlay.classList.contains('hidden') && name !== 'student') {
      return;
    }

    Object.entries(els.screens).forEach(([key, node]) => {
      if (!node) return;
      if (key === name) node.classList.remove('hidden'); else node.classList.add('hidden');
    });
    els.tabs.forEach(btn => btn.classList.toggle('active', btn.dataset.tab === name));

    // Update icons based on active page
    updateTabIcons(name);

    // Convert landing screen selects to custom dropdowns (same as student page)
    if (name === 'landing') {
      setTimeout(() => {
        // Check each select individually and convert if not already converted
        if (els.department && !els.department.dataset.converted) {
          convertSelectToCustomDropdown(els.department);
        }
        if (els.semester && !els.semester.dataset.converted) {
          convertSelectToCustomDropdown(els.semester);
        }
        if (els.section && !els.section.dataset.converted) {
          convertSelectToCustomDropdown(els.section);
        }
      }, 200);
    }

    // Convert selects to custom dropdowns when student screen is shown
    if (name === 'student') {
      setTimeout(() => {
        if (els.departmentDisplay && !els.departmentDisplay.dataset.converted) {
          convertSelectToCustomDropdown(els.departmentDisplay);
        }
        if (els.semesterDisplay && !els.semesterDisplay.dataset.converted) {
          convertSelectToCustomDropdown(els.semesterDisplay);
        }
        if (els.sectionDisplay && !els.sectionDisplay.dataset.converted) {
          convertSelectToCustomDropdown(els.sectionDisplay);
        }
      }, 50);
    }

    // Convert selects to custom dropdowns when teacher screen is shown
    if (name === 'teacher') {
      setTimeout(() => {
        if (els.teacherDepartment && !els.teacherDepartment.dataset.converted) {
          convertSelectToCustomDropdown(els.teacherDepartment);
        }
      }, 50);
    }

    // Convert selects to custom dropdowns when query screen is shown
    if (name === 'query') {
      setTimeout(() => {
        // Hide day selector initially (will show after selecting a value)
        if (els.roomQueryDaySelectorWrapper) els.roomQueryDaySelectorWrapper.classList.add('hidden');

        // Room Query Interface dropdowns
        if (els.roomQueryDepartment && !els.roomQueryDepartment.dataset.converted) {
          convertSelectToCustomDropdown(els.roomQueryDepartment);
        }
        if (els.roomQuerySearchBy && !els.roomQuerySearchBy.dataset.converted) {
          convertSelectToCustomDropdown(els.roomQuerySearchBy);
        }
        if (els.roomQueryThirdSelect && !els.roomQueryThirdSelect.dataset.converted) {
          convertSelectToCustomDropdown(els.roomQueryThirdSelect);
        }
        // CR Info Interface dropdowns
        if (els.crInfoDepartment && !els.crInfoDepartment.dataset.converted) {
          convertSelectToCustomDropdown(els.crInfoDepartment);
        }
        if (els.crInfoSemester && !els.crInfoSemester.dataset.converted) {
          convertSelectToCustomDropdown(els.crInfoSemester);
        }
        if (els.crInfoSection && !els.crInfoSection.dataset.converted) {
          convertSelectToCustomDropdown(els.crInfoSection);
        }

        // Check dropdowns and show/hide lotties based on current state
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

    if (!studentIcon || !teacherIcon || !queryIcon) return;

    // Reset all icons to inactive state
    if (activeTab === 'student') {
      studentIcon.src = 'attachment/student.png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history (1).png';
    } else if (activeTab === 'teacher') {
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card.png';
      queryIcon.src = 'attachment/history (1).png';
    } else if (activeTab === 'query') {
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history.png';
    } else {
      // For landing or other pages, use inactive icons
      studentIcon.src = 'attachment/student (1).png';
      teacherIcon.src = 'attachment/id-card (1).png';
      queryIcon.src = 'attachment/history (1).png';
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
      els.roomQueryDepartment, els.crInfoDepartment
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
      const tab = btn.dataset.tab;
      setScreen(tab);
      // Teacher data is already preloaded on page load, just show the UI
      // No need to reload when switching tabs
    });
  });

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
      const v = document.createElement('b'); v.innerHTML = `<span class="teacher" data-t="${it.teacher}">${it.teacher}</span>`;
      teacher.appendChild(k); teacher.appendChild(v);

      main.appendChild(title);
      main.appendChild(grid);
      main.appendChild(teacher);

      card.appendChild(time);
      card.appendChild(main);
      els.scheduleContainer.appendChild(card);
    }

    els.scheduleContainer.querySelectorAll('.teacher').forEach(node => {
      node.addEventListener('click', () => {
        alert(`Teacher: ${node.dataset.t}`);
      });
    });
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

    if (type === 'timeslot') {
      // Display empty rooms as full-width blocks (same style as room number search)
      const container = document.createElement('div');
      container.className = 'room-query-free-slots';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '12px';
      container.style.marginTop = '16px';

      data.forEach(item => {
        const block = document.createElement('div');
        block.className = 'room-query-free-slot-block';
        block.style.cssText = 'padding: 14px; background: rgba(158, 140, 255, 0.1); border: 1px solid var(--outline); border-radius: 12px; width: 100%;';

        const title = document.createElement('div');
        title.className = 'room-query-free-slot-title';
        title.style.cssText = 'color: var(--text); margin-bottom: 6px;';
        title.textContent = `Room: ${item.room}`;

        const subtitle = document.createElement('div');
        subtitle.className = 'room-query-free-slot-time';
        subtitle.style.cssText = 'color: var(--muted);';
        subtitle.textContent = item.timeSlot;

        block.appendChild(title);
        block.appendChild(subtitle);
        container.appendChild(block);
      });

      els.roomQueryResults.appendChild(container);
    } else {
      // Display free time slots as full-width blocks for room number search (one after another)
      const container = document.createElement('div');
      container.className = 'room-query-free-slots';
      container.style.display = 'flex';
      container.style.flexDirection = 'column';
      container.style.gap = '12px';
      container.style.marginTop = '16px';

      data.forEach(item => {
        const block = document.createElement('div');
        block.className = 'room-query-free-slot-block';
        block.style.cssText = 'padding: 14px; background: rgba(158, 140, 255, 0.1); border: 1px solid var(--outline); border-radius: 12px; width: 100%;';

        const title = document.createElement('div');
        title.className = 'room-query-free-slot-title';
        title.style.cssText = 'color: var(--text); margin-bottom: 6px;';
        title.textContent = `Room: ${item.room}`;

        const subtitle = document.createElement('div');
        subtitle.className = 'room-query-free-slot-time';
        subtitle.style.cssText = 'color: var(--muted);';
        subtitle.textContent = item.timeSlot;

        block.appendChild(title);
        block.appendChild(subtitle);
        container.appendChild(block);
      });

      els.roomQueryResults.appendChild(container);
    }
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
})();

