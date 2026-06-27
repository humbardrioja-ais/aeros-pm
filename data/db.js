// data/db.js — GitHub API helper for AerOS-PM
// Reads from GitHub Pages (fast CDN), writes via GitHub Contents API (needs token)

const GH = {
  owner: 'humbardrioja-ais',
  repo: 'aeros-pm',
  branch: 'main',
  get pagesBase() { return `https://${this.owner}.github.io/${this.repo}`; },
  get apiBase() { return `https://api.github.com/repos/${this.owner}/${this.repo}/contents`; },
  get token() { return localStorage.getItem('aeros_gh_token') || ''; },

  // Collection name -> filename mapping
  FILE_MAP: {
    tasks:          'data/tasks.json',
    projects:       'data/projects.json',
    team:           'data/team.json',
    meetings:       'data/meetings.json',
    missions:       'data/missions.json',
    leaves:         'data/leaves.json',
    shoots:         'data/shoots.json',
    videos:         'data/videos.json',
    events:         'data/events.json',
    feeds:          'data/feeds.json',
    campaigns:      'data/campaigns.json',
    designs:        'data/designs.json',
    publishing:     'data/publishing.json',
    seoProjects:    'data/seo.json',
    websiteProjects:'data/website.json',
    contentItems:   'data/content.json',
    socialRecords:  'data/social.json',
    rules:          'data/rules.json',
    cdoBalances:    'data/cdo-balances.json',
    cdoRedemptions: 'data/cdo-redemptions.json',
    notifications:  'data/notifications.json',
  },

  // API action -> { collection, idPrefix }
  ACTION_MAP: {
    // Tasks
    createTask:       { collection: 'tasks',          idPrefix: 'T' },
    updateTask:       { collection: 'tasks' },
    deleteTask:       { collection: 'tasks' },
    createSubtask:    { collection: 'tasks',          sub: 'subtasks' },
    updateSubtask:    { collection: 'tasks',          sub: 'subtasks' },
    deleteSubtask:    { collection: 'tasks',          sub: 'subtasks' },
    addTaskToProject: { collection: 'tasks',          op: 'addToProject' },
    // Projects
    createProject:    { collection: 'projects',       idPrefix: 'P' },
    updateProject:    { collection: 'projects' },
    deleteProject:    { collection: 'projects' },
    createSection:    { collection: 'projects',       sub: 'sections' },
    createMilestone:  { collection: 'projects',       sub: 'milestones' },
    updateMilestone:  { collection: 'projects',       sub: 'milestones' },
    // Team
    createMember:     { collection: 'team',           idPrefix: 'TM' },
    updateMember:     { collection: 'team' },
    // Meetings
    createMeeting:    { collection: 'meetings',       idPrefix: 'MTG' },
    createMeetingNote:{ collection: 'meetings',       idPrefix: 'MTG' },
    updateMeeting:    { collection: 'meetings' },
    updateMeetingNote:{ collection: 'meetings' },
    deleteMeeting:    { collection: 'meetings',       op: 'delete' },
    deleteMeetingNote:{ collection: 'meetings',       op: 'delete' },
    saveMeetingItems: { collection: 'meetings',       op: 'saveMeetingItems' },
    parseMeetingNotes:{ collection: 'meetings',       op: 'passthrough' },
    // Missions
    createMission:    { collection: 'missions',       idPrefix: 'MS' },
    updateMission:    { collection: 'missions' },
    deleteMission:    { collection: 'missions' },
    approveMission:   { collection: 'missions' },
    rejectMission:    { collection: 'missions' },
    // Leaves
    createLeaveRequest:{ collection: 'leaves',        idPrefix: 'LV' },
    createLeave:      { collection: 'leaves',         idPrefix: 'LV' },
    updateLeave:      { collection: 'leaves' },
    deleteLeave:      { collection: 'leaves' },
    approveLeave:     { collection: 'leaves' },
    rejectLeave:      { collection: 'leaves' },
    // Shoots
    createShoot:      { collection: 'shoots',         idPrefix: 'SH' },
    createShootSession:{ collection: 'shoots',        idPrefix: 'SH' },
    updateShootSession:{ collection: 'shoots' },
    deleteShootSession:{ collection: 'shoots' },
    markShootDone:    { collection: 'shoots' },
    // Videos
    createVideo:      { collection: 'videos',         idPrefix: 'VD' },
    updateVideo:      { collection: 'videos' },
    deleteVideo:      { collection: 'videos' },
    createClip:       { collection: 'videos',         sub: 'clips' },
    // Events
    createEvent:      { collection: 'events',         idPrefix: 'EV' },
    updateEvent:      { collection: 'events' },
    deleteEvent:      { collection: 'events' },
    // Feeds
    createFeed:       { collection: 'feeds',          idPrefix: 'FD' },
    updateFeed:       { collection: 'feeds' },
    deleteFeed:       { collection: 'feeds' },
    // Campaigns
    createCampaign:   { collection: 'campaigns',      idPrefix: 'CM' },
    updateCampaign:   { collection: 'campaigns' },
    deleteCampaign:   { collection: 'campaigns' },
    // Designs
    createDesign:     { collection: 'designs',        idPrefix: 'DS' },
    updateDesign:     { collection: 'designs' },
    deleteDesign:     { collection: 'designs' },
    // Publishing
    createPublishing: { collection: 'publishing',     idPrefix: 'PB' },
    updatePublishing: { collection: 'publishing' },
    deletePublishing: { collection: 'publishing' },
    // SEO
    createSeo:        { collection: 'seoProjects',    idPrefix: 'SEO' },
    updateSeo:        { collection: 'seoProjects' },
    deleteSeo:        { collection: 'seoProjects' },
    // Website
    createWebsite:    { collection: 'websiteProjects', idPrefix: 'WEB' },
    updateWebsite:    { collection: 'websiteProjects' },
    deleteWebsite:    { collection: 'websiteProjects' },
    // Content
    createContent:    { collection: 'contentItems',   idPrefix: 'CT' },
    updateContent:    { collection: 'contentItems' },
    deleteContent:    { collection: 'contentItems' },
    // Social
    createSocialRecord:{ collection: 'socialRecords', idPrefix: 'SR' },
    updateSocialRecord:{ collection: 'socialRecords' },
    deleteSocialRecord:{ collection: 'socialRecords' },
    // Rules
    createRule:       { collection: 'rules',          idPrefix: 'RL' },
    updateRule:       { collection: 'rules' },
    deleteRule:       { collection: 'rules' },
    // CDO
    createCDORedemption:{ collection: 'cdoRedemptions', idPrefix: 'CDO' },
    updateCDORedemption:{ collection: 'cdoRedemptions' },
    deleteCDORedemption:{ collection: 'cdoRedemptions' },
    approveCDO:       { collection: 'cdoRedemptions' },
    // Notifications
    markRead:         { collection: 'notifications' },
    // Read-only / special
    getAll:           { op: 'getAll' },
    getActivity:      { collection: 'tasks',          op: 'passthrough' },
    getComments:      { collection: 'tasks',          op: 'passthrough' },
    getMeetingItems:  { collection: 'meetings',       op: 'passthrough' },
    getMilestones:    { collection: 'projects',       op: 'passthrough' },
    getSections:      { collection: 'projects',       op: 'passthrough' },
    getSubtasks:      { collection: 'tasks',          op: 'passthrough' },
    initSheet:        { op: 'noop' },
  },

  // Track cache-bust timestamps per collection
  _bustCache: {},

  // ── READ: fetch a single collection from GitHub Pages ──
  async ghRead(collection) {
    const file = this.FILE_MAP[collection];
    if (!file) throw new Error('Unknown collection: ' + collection);
    const bust = this._bustCache[collection] || Date.now();
    const url = `${this.pagesBase}/${file}?t=${bust}`;
    const r = await fetch(url);
    if (!r.ok) {
      if (r.status === 404) return [];
      throw new Error(`Failed to read ${file}: ${r.status}`);
    }
    return r.json();
  },

  // ── READ ALL: fetch every collection in parallel ──
  async ghReadAll() {
    const keys = Object.keys(this.FILE_MAP);
    const results = await Promise.allSettled(
      keys.map(k => this.ghRead(k))
    );
    const data = {};
    keys.forEach((k, i) => {
      data[k] = results[i].status === 'fulfilled' ? results[i].value : [];
    });
    // Alias notifs for applyData compatibility
    data.notifs = data.notifications;
    return data;
  },

  // ── WRITE: commit a full collection array to GitHub via API ──
  async ghWrite(collection, items) {
    if (!this.token) throw new Error('GitHub token not set. Go to Settings to add it.');
    const filePath = this.FILE_MAP[collection];
    if (!filePath) throw new Error('Unknown collection: ' + collection);

    // Get current file SHA
    const metaRes = await fetch(`${this.apiBase}/${filePath}?ref=${this.branch}`, {
      headers: { Authorization: 'Bearer ' + this.token, Accept: 'application/vnd.github.v3+json' }
    });
    let sha = '';
    if (metaRes.ok) {
      const meta = await metaRes.json();
      sha = meta.sha;
    }
    // If 404, file doesn't exist yet — that's fine, we'll create it

    const content = btoa(unescape(encodeURIComponent(JSON.stringify(items, null, 2) + '\n')));
    const body = {
      message: `Update ${filePath.split('/').pop()}`,
      content,
      branch: this.branch,
    };
    if (sha) body.sha = sha;

    const putRes = await fetch(`${this.apiBase}/${filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: 'Bearer ' + this.token,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    if (putRes.status === 409) {
      // SHA conflict — retry once with fresh SHA
      const retryMeta = await fetch(`${this.apiBase}/${filePath}?ref=${this.branch}`, {
        headers: { Authorization: 'Bearer ' + this.token, Accept: 'application/vnd.github.v3+json' }
      });
      if (retryMeta.ok) {
        const rm = await retryMeta.json();
        body.sha = rm.sha;
        const retryRes = await fetch(`${this.apiBase}/${filePath}`, {
          method: 'PUT',
          headers: { Authorization: 'Bearer ' + this.token, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        if (!retryRes.ok) {
          const err2 = await retryRes.json().catch(() => ({}));
          throw new Error(`GitHub write retry failed (${retryRes.status}): ${err2.message || 'unknown'}`);
        }
        this._bustCache[collection] = Date.now();
        return retryRes.json();
      }
    }
    if (!putRes.ok) {
      const err = await putRes.json().catch(() => ({}));
      throw new Error(`GitHub write failed (${putRes.status}): ${err.message || 'unknown'}`);
    }
    this._bustCache[collection] = Date.now();
    return putRes.json();
  },

  // ── CREATE: add an item to a collection ──
  async ghCreate(collection, item) {
    const items = await this._readViaApi(collection);
    const prefix = this._prefixFor(collection);
    if (!item.id) item.id = prefix + '-' + Date.now();
    if (!item.created) item.created = new Date().toISOString().slice(0, 10);
    items.unshift(item);
    await this.ghWrite(collection, items);
    return item;
  },

  // ── UPDATE: update fields on an item by id ──
  async ghUpdate(collection, id, fields) {
    const items = await this._readViaApi(collection);
    const idx = items.findIndex(x => x.id === id);
    if (idx < 0) throw new Error(`Item ${id} not found in ${collection}`);
    Object.assign(items[idx], fields);
    await this.ghWrite(collection, items);
    return items[idx];
  },

  // ── DELETE: remove an item by id ──
  async ghDelete(collection, id) {
    let items = await this._readViaApi(collection);
    items = items.filter(x => x.id !== id);
    await this.ghWrite(collection, items);
  },

  // ── Internal: read via GitHub API (not Pages) to get fresh data for writes ──
  async _readViaApi(collection) {
    if (!this.token) throw new Error('GitHub token not set');
    const filePath = this.FILE_MAP[collection];
    const res = await fetch(`${this.apiBase}/${filePath}?ref=${this.branch}`, {
      headers: { Authorization: 'Bearer ' + this.token, Accept: 'application/vnd.github.v3+json' }
    });
    if (!res.ok) {
      if (res.status === 404) return [];
      throw new Error(`Failed to read ${filePath} via API: ${res.status}`);
    }
    const meta = await res.json();
    const text = decodeURIComponent(escape(atob(meta.content.replace(/\n/g, ''))));
    return JSON.parse(text);
  },

  _prefixFor(collection) {
    // Find any action that creates in this collection
    for (const [, cfg] of Object.entries(this.ACTION_MAP)) {
      if (cfg.collection === collection && cfg.idPrefix) return cfg.idPrefix;
    }
    return 'X';
  },
};
