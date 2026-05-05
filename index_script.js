// User Dashboard Dynamic Loading System (Fixed)
class UserDashboardManager {
  constructor() {
    this.contentArea = document.getElementById('content');
    this.sidebarItems = document.querySelectorAll('.sidebar ul li');
    this.currentPage = null;

    this.PAGE_BASE = '/laundry/dashboard/html/';
    this.SCRIPT_BASE = '/laundry/dashboard/script/';

    this.init();
  }

  init() {
    if (!this.contentArea) {
      console.error('Content area (#content) not found.');
      return;
    }

    this.setupEventListeners();
    this.loadDefaultContent();
  }

  setupEventListeners() {
    this.sidebarItems.forEach((item, index) => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        this.setActiveItem(item);
        this.handleNavigation(index);
      });
    });
  }

  setActiveItem(activeItem) {
    this.sidebarItems.forEach(item => item.classList.remove('active'));
    activeItem.classList.add('active');
  }

  handleNavigation(index) {
    const pageMap = {
      0: 'dashboard.html',
      1: 'my_profile.html',
      2: 'logout'
    };

    const page = pageMap[index];
    if (!page) return;

    if (page === 'logout') {
      this.handleLogout();
      return;
    }

    this.loadPage(page);
  }

  loadDefaultContent() {
    this.loadPage('dashboard.html');
  }

  async loadPage(pageFile) {
    try {
      if (this.currentPage === pageFile) return;
      this.currentPage = pageFile;

      const pageUrl = this.PAGE_BASE + pageFile;
      console.log('Loading page:', pageUrl);

      this.setLoading(true);

      const response = await fetch(pageUrl, { cache: 'no-store' });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${response.statusText}`);
      }

      const htmlText = await response.text();

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlText;

      const body = tempDiv.querySelector('body');
      const mainContent = body ? body.innerHTML : tempDiv.innerHTML;

      this.contentArea.style.opacity = '0';

      setTimeout(() => {
        this.contentArea.innerHTML = mainContent;
        this.contentArea.style.opacity = '1';
        this.setLoading(false);

        // Load script and wait for it before initializing
        this.loadPageScript(pageFile).then(() => {
          this.initializePageFunctionality(pageFile);
        }).catch(err => {
          console.error('Error in page script flow:', err);
        });
      }, 150);

    } catch (error) {
      console.error('Error loading page:', error);
      this.setLoading(false);
      this.showErrorPage(`Failed to load page: ${error.message}`);
    }
  }

  setLoading(isLoading) {
    if (!this.contentArea) return;
    if (isLoading) this.contentArea.classList.add('loading');
    else this.contentArea.classList.remove('loading');
  }

  loadPageScript(pageFile) {
    const scriptMap = {
      // ✅ Don’t load user_dashboard.js again (this file is already running)
      // Put only scripts that are truly page-specific:
      'my_profile.html': 'my_profile_handler.js'
    };

    const scriptFile = scriptMap[pageFile];
    if (!scriptFile) return Promise.resolve();

    const scriptUrl = this.SCRIPT_BASE + scriptFile;

    // prevent duplicate injection
    const existing = document.querySelector(`script[data-page-script="${scriptUrl}"]`);
    if (existing) return Promise.resolve();

    const script = document.createElement('script');
    script.src = scriptUrl;
    script.dataset.pageScript = scriptUrl;

    script.onload = () => {
      console.log('Script loaded:', scriptUrl);
    };
    script.onerror = () => {
      console.error('Failed to load script:', scriptUrl);
    };

    document.body.appendChild(script);
  }

  loadPageScript(pageFile) {
    const scriptMap = {
      'my_profile.html': 'my_profile_handler.js'
    };

    const scriptFile = scriptMap[pageFile];
    if (!scriptFile) return Promise.resolve();

    const scriptUrl = this.SCRIPT_BASE + scriptFile;
    const existing = document.querySelector(`script[data-page-script="${scriptUrl}"]`);
    if (existing) return Promise.resolve();

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = scriptUrl;
      script.dataset.pageScript = scriptUrl;

      script.onload = () => {
        console.log('Script loaded:', scriptUrl);
        resolve();
      };
      script.onerror = () => {
        console.error('Failed to load script:', scriptUrl);
        reject(new Error(`Failed to load: ${scriptUrl}`));
      };

      document.body.appendChild(script);
    });
  }

  initializePageFunctionality(pageFile) {
    if (pageFile === 'dashboard.html') {
      if (typeof window.initDashboard === 'function') window.initDashboard();
    }

    if (pageFile === 'my_profile.html') {
      if (typeof window.initMyProfileHandlers === 'function') {
        console.log('Calling initMyProfileHandlers...');
        window.initMyProfileHandlers();
      } else {
        console.warn('initMyProfileHandlers() not found. Is my_profile_handler.js loaded?');
      }
    }
  }

  handleLogout() {
    localStorage.removeItem('userEmail');
    sessionStorage.clear();
    window.location.href = '/laundry/html/login_page.html';
  }

  showErrorPage(message) {
    if (!this.contentArea) return;
    this.contentArea.innerHTML = `
      <div style="padding:16px; border:1px solid #ccc; border-radius:8px;">
        <h3>Page Load Error</h3>
        <p>${message}</p>
      </div>
    `;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new UserDashboardManager();
});
