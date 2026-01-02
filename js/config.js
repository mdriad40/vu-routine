// Configuration and Constants
(function(window) {
  'use strict';
  
  window.AppConfig = {
    PRIMARY_COLOR: '#6C63FF',
    DAYS_ORDER: ['Saturday','Sunday','Monday','Tuesday','Wednesday','Thursday'],
    DEPARTMENT_LOCK_MODE: 'yes', // 'yes' to disable other departments, 'no' to allow but force back to EEE
    
    firebaseConfig: {
      apiKey: "AIzaSyBJDhjAO85qtK4SexkvvLIgvs36i3Chyf4",
      authDomain: "eee-routine.firebaseapp.com",
      databaseURL: "https://eee-routine-default-rtdb.firebaseio.com",
      projectId: "eee-routine",
      storageBucket: "eee-routine.firebasestorage.app",
      messagingSenderId: "1001291186233",
      appId: "1:1001291186233:web:801a065bc6f3304e1d8de8",
      measurementId: "G-16X655Y9KQ"
    }
  };
  
  // Initialize Firebase
  if (window.firebase && !window.firebase.apps?.length) {
    window.firebase.initializeApp(window.AppConfig.firebaseConfig);
  }
  
  window.AppConfig.db = window.firebase ? window.firebase.database() : null;
  
})(window);

