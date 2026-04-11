export function applySidebarCollapsed(map, collapsed) {
  var appEl = document.getElementById('app');
  if (!appEl) return;
  appEl.classList.toggle('sidebar-collapsed', collapsed);
  var aside = document.getElementById('filter-sidebar');
  if (aside) {
    aside.setAttribute('aria-hidden', collapsed ? 'true' : 'false');
    if (collapsed) aside.setAttribute('inert', '');
    else aside.removeAttribute('inert');
  }
  var openTab = document.getElementById('sidebar-open-tab');
  if (openTab) {
    openTab.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
  var closeBtn = document.getElementById('sidebar-close-btn');
  if (closeBtn) {
    closeBtn.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
  }
  requestAnimationFrame(function () {
    requestAnimationFrame(function () {
      map.resize();
    });
  });
}

export function initSidebarLayout(map) {
  var sidebarWideMq = window.matchMedia('(min-width: 768px)');
  applySidebarCollapsed(map, !sidebarWideMq.matches);

  var sidebarOpenTab = document.getElementById('sidebar-open-tab');
  if (sidebarOpenTab) {
    sidebarOpenTab.addEventListener('click', function () {
      applySidebarCollapsed(map, false);
    });
  }
}
