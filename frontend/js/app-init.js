showScreen('s-land');

PAR.init();

CTRL.init();

NOTIF.init();

DAILY.init();

(function(){
  try {
    var saved = localStorage.getItem('bp_session');
    if(saved){
      var sess = JSON.parse(saved);
      if(sess && sess.email && sess.name){
        // Restore currentUser globals
        if(typeof currentChildClass !== 'undefined') currentChildClass = sess.cls || '6';
        if(typeof currentRole !== 'undefined') currentRole = sess.role || 'child';
        // Auto login silently after a tick so all functions are ready
        setTimeout(function(){
          if(typeof onLoginSuccess === 'function'){
            onLoginSuccess(sess.role||'child', sess);
          }
        }, 100);
      }
    }
  } catch(e){ console.warn('Session restore error:', e); }
})();
