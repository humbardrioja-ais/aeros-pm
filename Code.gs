// ============================================================
// AerOS-PM — Apps Script Backend
// Edit here → clasp push → live in seconds
// ============================================================

const SPREADSHEET_ID = '14SX9ipvtX_YbQ6U0_dXBDJjLvwRFMCsKDDv0XQhsdq4';
const DRIVE_ROOT_ID  = '1L3k7vaH_jjVsrD2piXJ1tVaupEZsYmsr';
const ATTACHMENTS_ID = '1D3X3KUjN-JaTcditP40fE9rnySjcncnJ';
const MEDIA_ID       = '15wss1UFrGcAGzIcb9EA35QTok1H7gZbQ';
const EXPORTS_ID     = '1gL22nb4oAy1I4L9sKfH9ngai7mQmCj2J';

// ===================== ENTRY POINTS =====================

function doGet(e) {
  const p = e.parameter;
  const action = p.action || '';

  // No action = serve the dashboard
  if (!action) {
    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('AerOS-PM')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
  }

  try {
    const result = route('GET', action, p, null);
    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function doPost(e) {
  const p = e.parameter;
  const action = p.action || '';
  let body = null;
  try { body = JSON.parse(e.postData.contents); } catch(_) {}
  try {
    const result = route('POST', action, p, body);
    return jsonResponse(result);
  } catch(err) {
    return jsonResponse({ error: err.message }, 500);
  }
}

function jsonResponse(data, code) {
  const out = ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
  return out;
}

// ===================== ROUTER =====================

function route(method, action, p, body) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  switch(action) {
    // ── Frontend-compatible aliases ──
    case 'createMeeting':       return createRow(ss, 'MeetingNotes', body);
    case 'getMeetings':         return getRows(ss, 'MeetingNotes');
    case 'createLeave':         return createRow(ss, 'LeaveRequests', body);
    case 'createCDORedemption': return createRow(ss, 'CDORedemptions', body);
    case 'createShoot':         return createRow(ss, 'ShootSessions', body);
    case 'getShoots':           return getRows(ss, 'ShootSessions');
    case 'createClip':          return createRow(ss, 'FootageClips', body);
    case 'markShootDone':       return updateRow(ss, 'ShootSessions', { id: p.id, status: 'done', updated: new Date().toISOString() });
    case 'getNotifs':           return getRows(ss, 'Notifications', p.user ? { userId: p.user } : null);
    case 'markRead':            return updateRow(ss, 'Notifications', { id: p.id, read: 'true', updated: new Date().toISOString() });
    case 'getCDOBalance':       return getRows(ss, 'CDOBalances');
    case 'init':                return initSheet();

    // ── Tasks ──
    case 'getTasks':       return getRows(ss, 'Tasks');
    case 'createTask':     return createRow(ss, 'Tasks', body);
    case 'updateTask':     return updateRow(ss, 'Tasks', body);
    case 'deleteTask':     return deleteRow(ss, 'Tasks', p.id);

    // ── Subtasks ──
    case 'getSubtasks':    return getRows(ss, 'Subtasks', p.taskId ? {taskId: p.taskId} : null);
    case 'createSubtask':  return createRow(ss, 'Subtasks', body);
    case 'updateSubtask':  return updateRow(ss, 'Subtasks', body);
    case 'deleteSubtask':  return deleteRow(ss, 'Subtasks', p.id);

    // ── Projects ──
    case 'getProjects':    return getRows(ss, 'Projects');
    case 'createProject':  return createRow(ss, 'Projects', body);
    case 'updateProject':  return updateRow(ss, 'Projects', body);
    case 'deleteProject':  return deleteRow(ss, 'Projects', p.id);

    // ── Sections ──
    case 'getSections':    return getRows(ss, 'Sections', p.projectId ? {projectId: p.projectId} : null);
    case 'createSection':  return createRow(ss, 'Sections', body);
    case 'updateSection':  return updateRow(ss, 'Sections', body);
    case 'deleteSection':  return deleteRow(ss, 'Sections', p.id);

    // ── TaskProjects ──
    case 'getTaskProjects': return getRows(ss, 'TaskProjects', p.taskId ? {taskId: p.taskId} : null);
    case 'addTaskToProject': return createRow(ss, 'TaskProjects', body);
    case 'removeTaskFromProject': return deleteRow(ss, 'TaskProjects', p.id);

    // ── Tags ──
    case 'getTags':        return getRows(ss, 'Tags');
    case 'createTag':      return createRow(ss, 'Tags', body);
    case 'getTaskTags':    return getRows(ss, 'TaskTags', p.taskId ? {taskId: p.taskId} : null);
    case 'addTagToTask':   return createRow(ss, 'TaskTags', body);
    case 'removeTagFromTask': return deleteRow(ss, 'TaskTags', p.id);

    // ── Comments ──
    case 'getComments':    return getRows(ss, 'Comments', p.taskId ? {taskId: p.taskId} : null);
    case 'createComment':  return createRow(ss, 'Comments', body);
    case 'deleteComment':  return deleteRow(ss, 'Comments', p.id);

    // ── Activity ──
    case 'getActivity':    return getRows(ss, 'Activity', p.taskId ? {taskId: p.taskId} : null);

    // ── Notifications ──
    case 'getNotifications': return getRows(ss, 'Notifications', p.userId ? {userId: p.userId} : null);
    case 'markNotificationRead': return updateRow(ss, 'Notifications', {id: p.id, read: 'TRUE'});

    // ── Team ──
    case 'getTeam':        return getRows(ss, 'Team');
    case 'createMember':   return createRow(ss, 'Team', body);
    case 'updateMember':   return updateRow(ss, 'Team', body);
    case 'deleteMember':   return deleteRow(ss, 'Team', p.id);

    // ── Custom Fields ──
    case 'getCustomFields': return getRows(ss, 'CustomFields');
    case 'createCustomField': return createRow(ss, 'CustomFields', body);
    case 'updateCustomField': return updateRow(ss, 'CustomFields', body);
    case 'deleteCustomField': return deleteRow(ss, 'CustomFields', p.id);
    case 'getFieldValues': return getRows(ss, 'FieldValues', p.taskId ? {taskId: p.taskId} : null);
    case 'setFieldValue':  return upsertFieldValue(ss, body);

    // ── Milestones ──
    case 'getMilestones':  return getRows(ss, 'Milestones', p.projectId ? {projectId: p.projectId} : null);
    case 'createMilestone': return createRow(ss, 'Milestones', body);
    case 'updateMilestone': return updateRow(ss, 'Milestones', body);
    case 'deleteMilestone': return deleteRow(ss, 'Milestones', p.id);

    // ── Goals ──
    case 'getGoals':       return getRows(ss, 'Goals');
    case 'createGoal':     return createRow(ss, 'Goals', body);
    case 'updateGoal':     return updateRow(ss, 'Goals', body);
    case 'deleteGoal':     return deleteRow(ss, 'Goals', p.id);

    // ── Portfolios ──
    case 'getPortfolios':  return getRows(ss, 'Portfolios');
    case 'createPortfolio': return createRow(ss, 'Portfolios', body);
    case 'updatePortfolio': return updateRow(ss, 'Portfolios', body);
    case 'deletePortfolio': return deleteRow(ss, 'Portfolios', p.id);

    // ── Templates ──
    case 'getTemplates':   return getRows(ss, 'Templates');
    case 'createTemplate': return createRow(ss, 'Templates', body);
    case 'applyTemplate':  return applyTemplate(ss, body);

    // ── Forms ──
    case 'getFormDefs':    return getRows(ss, 'FormDefs');
    case 'createFormDef':  return createRow(ss, 'FormDefs', body);
    case 'updateFormDef':  return updateRow(ss, 'FormDefs', body);
    case 'deleteFormDef':  return deleteRow(ss, 'FormDefs', p.id);
    case 'submitForm':     return submitForm(ss, body);
    case 'getFormSubmissions': return getRows(ss, 'FormSubmissions', p.formId ? {formId: p.formId} : null);

    // ── Missions ──
    case 'getMissions':    return getRows(ss, 'Missions');
    case 'createMission':  return createRow(ss, 'Missions', body);
    case 'updateMission':  return updateRow(ss, 'Missions', body);
    case 'deleteMission':  return deleteRow(ss, 'Missions', p.id);
    case 'getMissionApprovals': return getRows(ss, 'MissionApprovals', p.missionId ? {missionId: p.missionId} : null);
    case 'approveMission': return approveMission(ss, body);
    case 'rejectMission':  return rejectMission(ss, body);

    // ── CDO ──
    case 'getCDOBalances':    return getRows(ss, 'CDOBalances');
    case 'getCDORedemptions': return getRows(ss, 'CDORedemptions');
    case 'requestCDO':        return createRow(ss, 'CDORedemptions', body);
    case 'approveCDO':        return approveCDO(ss, body);
    case 'rejectCDO':         return rejectCDO(ss, body);

    // ── Leave ──
    case 'getLeaveRequests':  return getRows(ss, 'LeaveRequests');
    case 'createLeaveRequest': return createRow(ss, 'LeaveRequests', body);
    case 'updateLeaveRequest': return updateRow(ss, 'LeaveRequests', body);
    case 'approveLeave':      return approveLeave(ss, body);
    case 'rejectLeave':       return rejectLeave(ss, body);
    case 'getLeaveBalances':  return getRows(ss, 'LeaveBalances');
    case 'getLeaveTypes':     return getRows(ss, 'LeaveTypes');
    case 'getCDORules':       return getRows(ss, 'CDORules');

    // ── Media: Shoots ──
    case 'getShootSessions':  return getRows(ss, 'ShootSessions');
    case 'createShootSession': return createRow(ss, 'ShootSessions', body);
    case 'updateShootSession': return updateRow(ss, 'ShootSessions', body);
    case 'deleteShootSession': return deleteRow(ss, 'ShootSessions', p.id);
    case 'getFootageClips':   return getRows(ss, 'FootageClips', p.shootId ? {shootId: p.shootId} : null);
    case 'createFootageClip': return createRow(ss, 'FootageClips', body);
    case 'updateFootageClip': return updateRow(ss, 'FootageClips', body);
    case 'deleteFootageClip': return deleteRow(ss, 'FootageClips', p.id);

    // ── Media: Videos ──
    case 'getVideos':         return getRows(ss, 'Videos');
    case 'createVideo':       return createVideo(ss, body);
    case 'updateVideo':       return updateRow(ss, 'Videos', body);
    case 'deleteVideo':       return deleteRow(ss, 'Videos', p.id);
    case 'getFootageVideoLinks': return getRows(ss, 'FootageVideoLink', p.videoId ? {videoId: p.videoId} : null);
    case 'linkFootageToVideo': return createRow(ss, 'FootageVideoLink', body);
    case 'unlinkFootageFromVideo': return deleteRow(ss, 'FootageVideoLink', p.id);
    case 'getVideoReviews':   return getRows(ss, 'VideoReviews', p.videoId ? {videoId: p.videoId} : null);
    case 'createVideoReview': return createRow(ss, 'VideoReviews', body);
    case 'updateVideoReview': return updateRow(ss, 'VideoReviews', body);
    case 'getVideoPosts':     return getRows(ss, 'VideoPosts', p.videoId ? {videoId: p.videoId} : null);
    case 'createVideoPost':   return createRow(ss, 'VideoPosts', body);
    case 'updateVideoPost':   return updateRow(ss, 'VideoPosts', body);

    // ── Meetings ──
    case 'getMeetingNotes':   return getRows(ss, 'MeetingNotes');
    case 'createMeetingNote': return createRow(ss, 'MeetingNotes', body);
    case 'updateMeetingNote': return updateRow(ss, 'MeetingNotes', body);
    case 'deleteMeetingNote': return deleteRow(ss, 'MeetingNotes', p.id);
    case 'getMeetingAttendees': return getRows(ss, 'MeetingAttendees', p.meetingId ? {meetingId: p.meetingId} : null);
    case 'getMeetingItems':   { const mid = p.meetingId || p.meeting_id; return getRows(ss, 'MeetingItems', mid ? {meetingId: mid} : null); }
    case 'saveMeetingItems':  return saveMeetingItems(ss, body);
    case 'parseMeetingNotes': return parseMeetingNotes(ss, body);

    // ── Rules & Audit ──
    case 'getRules':          return getRows(ss, 'Rules');
    case 'createRule':        return createRow(ss, 'Rules', body);
    case 'updateRule':        return updateRow(ss, 'Rules', body);
    case 'deleteRule':        return deleteRow(ss, 'Rules', p.id);
    case 'getAudit':          return getRows(ss, 'Audit');

    // ── Files ──
    case 'uploadFile':        return uploadFile(body);
    case 'deleteFile':        return deleteDriveFile(p.fileId);

    // ── Calendar Events ──
    case 'getEvents':         return getRows(ss, 'CalEvents');
    case 'createEvent':       return createRow(ss, 'CalEvents', body);
    case 'updateEvent':       return updateRow(ss, 'CalEvents', body);
    case 'deleteEvent':       return deleteRow(ss, 'CalEvents', p.id);

    // ── iCal Feed Subscriptions ──
    case 'getFeeds':          return getRows(ss, 'CalFeeds');
    case 'createFeed':        return createRow(ss, 'CalFeeds', body);
    case 'updateFeed':        return updateRow(ss, 'CalFeeds', body);
    case 'deleteFeed':        return deleteRow(ss, 'CalFeeds', p.id);
    case 'fetchIcal':         return fetchIcal(p.url, p.feedId || '');

    // ── Batch fetch (all data in one round-trip) ──
    case 'getAll':            return getAllData(ss, p);

    // ── Init ──
    case 'initSheet':         return initSheet();
    case 'ping':              return { ok: true, ts: new Date().toISOString() };

    // ── Campaigns ──
    case 'getCampaigns':      return getRows(ss, 'Campaigns');
    case 'createCampaign':    return createRow(ss, 'Campaigns', body);
    case 'updateCampaign':    return updateRow(ss, 'Campaigns', body);
    case 'deleteCampaign':    return deleteRow(ss, 'Campaigns', p.id || body?.id);

    // ── Designs ──
    case 'getDesigns':        return getRows(ss, 'Designs');
    case 'createDesign':      return createRow(ss, 'Designs', body);
    case 'updateDesign':      return updateRow(ss, 'Designs', body);
    case 'deleteDesign':      return deleteRow(ss, 'Designs', p.id || body?.id);

    // ── Publishing ──
    case 'getPublishing':     return getRows(ss, 'Publishing');
    case 'createPublishing':  return createRow(ss, 'Publishing', body);
    case 'updatePublishing':  return updateRow(ss, 'Publishing', body);
    case 'deletePublishing':  return deleteRow(ss, 'Publishing', p.id || body?.id);

    // ── SEO ──
    case 'getSeo':            return getRows(ss, 'SeoProjects');
    case 'createSeo':         return createRow(ss, 'SeoProjects', body);
    case 'updateSeo':         return updateRow(ss, 'SeoProjects', body);
    case 'deleteSeo':         return deleteRow(ss, 'SeoProjects', p.id || body?.id);

    // ── Website ──
    case 'getWebsite':        return getRows(ss, 'WebsiteProjects');
    case 'createWebsite':     return createRow(ss, 'WebsiteProjects', body);
    case 'updateWebsite':     return updateRow(ss, 'WebsiteProjects', body);
    case 'deleteWebsite':     return deleteRow(ss, 'WebsiteProjects', p.id || body?.id);

    // ── Social Records ──
    case 'getSocialRecords':  return getRows(ss, 'SocialRecords');
    case 'createSocialRecord': return createRow(ss, 'SocialRecords', body);
    case 'deleteSocialRecord': return deleteRow(ss, 'SocialRecords', p.id || body?.id);

    // ── Monthly Plans ──

    default: throw new Error('Unknown action: ' + action);
  }
}

function getAllData(ss, p) {
  const user = p.user || '';
  return {
    tasks:          getRows(ss, 'Tasks'),
    projects:       getRows(ss, 'Projects'),
    team:           getRows(ss, 'Team'),
    meetings:       getRows(ss, 'MeetingNotes'),
    missions:       getRows(ss, 'Missions'),
    leaves:         getRows(ss, 'LeaveRequests'),
    shoots:         getRows(ss, 'ShootSessions'),
    videos:         getRows(ss, 'Videos'),
    notifs:         user ? getRows(ss, 'Notifications', { userId: user }) : [],
    cdoBalances:    getRows(ss, 'CDOBalances'),
    cdoRedemptions: getRows(ss, 'CDORedemptions'),
    events:         getRows(ss, 'CalEvents'),
    feeds:          getRows(ss, 'CalFeeds'),
    campaigns:      getRows(ss, 'Campaigns'),
    designs:        getRows(ss, 'Designs'),
    publishing:     getRows(ss, 'Publishing'),
    seoProjects:    getRows(ss, 'SeoProjects'),
    websiteProjects: getRows(ss, 'WebsiteProjects'),
    socialRecords:  getRows(ss, 'SocialRecords'),
    rules:          getRows(ss, 'Rules'),
  };
}

// ===================== SHEET SCHEMA =====================

const SHEETS = {
  Tasks: ['id','title','details','owner','department','source','requestedBy','priority','due','status','repeat','attachments','created','updated','followup','notes','projectIds','sectionId','tags','customFields','parentId'],
  Subtasks: ['id','taskId','title','done','assignee','due','created','updated'],
  CalEvents: ['id','title','date','end_date','time','end_time','description','department','color','all_day','created','updated'],
  CalFeeds:  ['id','name','url','color','text_color','enabled','visibility','last_synced','created','updated'],
  Dependencies: ['id','taskId','dependsOnId','type','created'],
  Tags: ['id','name','color','created'],
  TaskTags: ['id','taskId','tagId','created'],
  Comments: ['id','taskId','author','body','created','updated','reactions'],
  Activity: ['id','taskId','actor','action','detail','created'],
  Notifications: ['id','userId','type','refId','message','read','created'],
  Projects: ['id','name','description','owner','department','status','color','startDate','dueDate','isTemplate','portfolioId','created','updated'],
  Sections: ['id','projectId','name','order','created'],
  TaskProjects: ['id','taskId','projectId','sectionId','order','created'],
  Milestones: ['id','projectId','title','due','done','created','updated'],
  Goals: ['id','title','description','owner','department','metric','target','current','unit','dueDate','status','parentGoalId','created','updated'],
  Portfolios: ['id','name','description','owner','created','updated'],
  Templates: ['id','name','description','projectId','taskIds','created'],
  Team: ['id','name','email','role','department','avatar','avatar_color','avatar_img','phone','active','created'],
  CustomFields: ['id','name','type','options','projectId','created'],
  FieldValues: ['id','taskId','fieldId','value','updated'],
  FormDefs: ['id','name','projectId','fields','active','created'],
  FormSubmissions: ['id','formId','submitter','data','taskId','created'],
  Missions: ['id','memberId','memberName','department','date','duration','type','details','status','cdoEarned','created','updated'],
  MissionApprovals: ['id','missionId','approverId','decision','notes','created'],
  CDOBalances: ['id','memberId','memberName','department','totalEarned','totalUsed','balance','updated'],
  CDORedemptions: ['id','memberId','memberName','department','date','duration','reason','status','approvedBy','created','updated'],
  CDORules: ['id','type','multiplier','description','updated'],
  LeaveRequests: ['id','memberId','memberName','department','leaveType','startDate','endDate','duration','period','reason','status','approvedBy','created','updated'],
  LeaveBalances: ['id','memberId','memberName','department','leaveType','entitlement','used','balance','year','updated'],
  LeaveTypes: ['id','name','paidOrUnpaid','maxDays','carryOver','created'],
  ShootSessions: ['id','title','department','scheduledDate','location','director','videographer','talent','status','notes','driveFolder','created','updated'],
  FootageClips: ['id','shootId','clipName','duration','type','description','driveFileId','status','created','updated'],
  Videos: ['id','title','description','department','driveFolder','status','thumbnailUrl','platforms','targetPostDate','created','updated'],
  FootageVideoLink: ['id','footageId','videoId','notes','created'],
  VideoReviews: ['id','videoId','reviewer','status','comments','reviewedAt','created'],
  VideoPosts: ['id','videoId','platform','postUrl','scheduledDate','postedDate','status','metrics','created','updated'],
  MeetingNotes: ['id','title','type','date','attendees','department','rawNotes','summary','status','taskCount','doneCount','pinned','created','updated'],
  MeetingAttendees: ['id','meetingId','memberId','memberName','role','created'],
  MeetingItems: ['id','meetingId','type','title','assignee','department','dueDate','priority','status','taskId','created'],
  Rules: ['id','name','trigger','conditions','actions','active','created','updated'],
  Audit: ['id','actor','action','entity','entityId','before','after','created'],
  Campaigns:     ['id','title','status','start','end','description','projects','milestones','created','updated'],
  Designs:       ['id','title','type','stage','assigned','page','due','publish_date','notes','created','updated'],
  Publishing:    ['id','title','pub_type','edition','status','deadline','target_release','lead','page_count','sections','notes','created','updated'],
  SeoProjects:   ['id','title','target_url','keywords','status','lead','due','metrics','notes','created','updated'],
  WebsiteProjects: ['id','title','web_type','url','status','lead','launch_date','tech_stack','pages','notes','created','updated'],
  SocialRecords: ['id','page','date_from','date_to','reach','engagement','followers','posts','notes','created'],
};

// ===================== CRUD HELPERS =====================

function getRows(ss, sheetName, filter) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const idCol = headers.indexOf('id');
  const createdCol = headers.indexOf('created');
  const now = new Date().toISOString();
  const rows = data.slice(1).map((r, rowIdx) => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    // Auto-fill missing id and created for manually-added rows
    if (idCol >= 0 && !obj.id) {
      const newId = generateId(sheetName);
      obj.id = newId;
      sh.getRange(rowIdx + 2, idCol + 1).setValue(newId);
    }
    if (createdCol >= 0 && !obj.created) {
      obj.created = now;
      sh.getRange(rowIdx + 2, createdCol + 1).setValue(now);
    }
    return obj;
  });
  if (!filter) return rows;
  return rows.filter(r => Object.keys(filter).every(k => String(r[k]) === String(filter[k])));
}

function createRow(ss, sheetName, data) {
  let sh = ss.getSheetByName(sheetName);
  if (!sh) {
    sh = ss.insertSheet(sheetName);
    const headers = SHEETS[sheetName];
    if (headers) {
      sh.getRange(1, 1, 1, headers.length).setValues([headers]);
      sh.getRange(1, 1, 1, headers.length).setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  }
  let headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  if (!data.id) data.id = generateId(sheetName);
  if (!data.created) data.created = new Date().toISOString();
  if ('updated' in data || headers.includes('updated')) data.updated = new Date().toISOString();
  // Auto-add missing columns
  const newCols = Object.keys(data).filter(k => !headers.includes(k));
  if (newCols.length) {
    newCols.forEach(col => { sh.getRange(1, headers.length + 1).setValue(col); headers.push(col); });
  }
  const row = headers.map(h => data[h] !== undefined ? data[h] : '');
  sh.appendRow(row);
  logAudit(ss, 'system', 'create', sheetName, data.id, null, data);
  return data;
}

function updateRow(ss, sheetName, data) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet not found: ' + sheetName);
  const allData = sh.getDataRange().getValues();
  let headers = allData[0];
  // Auto-add any missing columns that are in the data
  const newCols = Object.keys(data).filter(k => k !== 'id' && !headers.includes(k));
  if (newCols.length) {
    newCols.forEach(col => {
      const newColIdx = headers.length + 1;
      sh.getRange(1, newColIdx).setValue(col);
      headers.push(col);
    });
  }
  const idCol = headers.indexOf('id');
  const rowIdx = allData.findIndex((r, i) => i > 0 && String(r[idCol]) === String(data.id));
  if (rowIdx < 0) throw new Error('Row not found: ' + data.id);
  const before = {};
  headers.forEach((h, i) => before[h] = allData[rowIdx][i]);
  if (headers.includes('updated')) data.updated = new Date().toISOString();
  headers.forEach((h, i) => {
    if (data[h] !== undefined) sh.getRange(rowIdx + 1, i + 1).setValue(data[h]);
  });
  logAudit(ss, 'system', 'update', sheetName, data.id, before, data);
  return { ok: true };
}

function deleteRow(ss, sheetName, id) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet not found: ' + sheetName);
  const allData = sh.getDataRange().getValues();
  const headers = allData[0];
  const idCol = headers.indexOf('id');
  const rowIdx = allData.findIndex((r, i) => i > 0 && String(r[idCol]) === String(id));
  if (rowIdx < 0) throw new Error('Row not found: ' + id);
  sh.deleteRow(rowIdx + 1);
  logAudit(ss, 'system', 'delete', sheetName, id, null, null);
  return { ok: true };
}

function generateId(sheetName) {
  const prefix = {
    Tasks:'T', Projects:'P', Team:'M', Missions:'MS', LeaveRequests:'LV',
    CDORedemptions:'CDO', ShootSessions:'SH', FootageClips:'FC', Videos:'VID',
    MeetingNotes:'MTG', Goals:'G', Portfolios:'PF', Tags:'TG', Comments:'C',
    Notifications:'N', Rules:'R', FormDefs:'FD', FormSubmissions:'FS'
  }[sheetName] || sheetName.substring(0,2).toUpperCase();
  return prefix + '-' + Date.now() + '-' + Math.floor(Math.random()*1000);
}

function logAudit(ss, actor, action, entity, entityId, before, after) {
  try {
    const sh = ss.getSheetByName('Audit');
    if (!sh) return;
    sh.appendRow([generateId('Audit'), actor, action, entity, entityId,
      before ? JSON.stringify(before) : '',
      after ? JSON.stringify(after) : '',
      new Date().toISOString()]);
  } catch(_) {}
}

// ===================== SPECIALIZED HANDLERS =====================

function approveMission(ss, body) {
  const missionId = body.missionId || body.mission_id;
  const decision  = body.decision || 'approved';
  const approverId = body.approverId || body.approver || '';
  if (decision === 'rejected') return rejectMission(ss, { missionId, approverId, notes: body.notes });
  updateRow(ss, 'Missions', { id: missionId, status: 'approved', updated: new Date().toISOString() });
  createRow(ss, 'MissionApprovals', {
    missionId, approverId, decision: 'approved', notes: body.notes || ''
  });

  // Credit CDO balance
  const missions = getRows(ss, 'Missions', { id: missionId });
  if (missions.length) {
    const m = missions[0];
    const rules = getRows(ss, 'CDORules', { type: m.type });
    const multiplier = rules.length ? parseFloat(rules[0].multiplier) : 1;
    const dayValue = m.duration === 'half' ? 0.5 : 1;
    const cdoEarned = dayValue * multiplier;

    // Update mission with CDO earned
    updateRow(ss, 'Missions', { id: body.missionId, cdoEarned: cdoEarned });

    // Upsert CDO balance
    const balances = getRows(ss, 'CDOBalances', { memberId: m.memberId });
    if (balances.length) {
      const b = balances[0];
      updateRow(ss, 'CDOBalances', {
        id: b.id,
        totalEarned: parseFloat(b.totalEarned || 0) + cdoEarned,
        balance: parseFloat(b.balance || 0) + cdoEarned,
        updated: new Date().toISOString()
      });
    } else {
      createRow(ss, 'CDOBalances', {
        memberId: m.memberId, memberName: m.memberName, department: m.department,
        totalEarned: cdoEarned, totalUsed: 0, balance: cdoEarned
      });
    }
    sendEmail(ss, m.memberId, 'Mission Approved', `Your mission on ${m.date} has been approved. CDO earned: ${cdoEarned} day(s).`);
  }
  return { ok: true };
}

function rejectMission(ss, body) {
  const missionId = body.missionId || body.mission_id;
  updateRow(ss, 'Missions', { id: missionId, status: 'rejected', updated: new Date().toISOString() });
  createRow(ss, 'MissionApprovals', {
    missionId, approverId: body.approverId || '', decision: 'rejected', notes: body.notes || ''
  });
  return { ok: true };
}

function approveCDO(ss, body) {
  const approvedBy = body.approvedBy || body.manager || '';
  if (body.decision === 'rejected') return rejectCDO(ss, { id: body.id, approvedBy });
  updateRow(ss, 'CDORedemptions', { id: body.id, status: 'approved', approvedBy, updated: new Date().toISOString() });
  const redemptions = getRows(ss, 'CDORedemptions', { id: body.id });
  if (redemptions.length) {
    const r = redemptions[0];
    const days = r.duration === 'half' ? 0.5 : 1;
    const balances = getRows(ss, 'CDOBalances', { memberId: r.memberId });
    if (balances.length) {
      const b = balances[0];
      updateRow(ss, 'CDOBalances', {
        id: b.id,
        totalUsed: parseFloat(b.totalUsed || 0) + days,
        balance: parseFloat(b.balance || 0) - days,
        updated: new Date().toISOString()
      });
    }
    sendEmail(ss, r.memberId, 'CDO Request Approved', `Your CDO for ${r.date} has been approved.`);
  }
  return { ok: true };
}

function rejectCDO(ss, body) {
  updateRow(ss, 'CDORedemptions', { id: body.id, status: 'rejected', approvedBy: body.approvedBy || body.manager || '', updated: new Date().toISOString() });
  return { ok: true };
}

function approveLeave(ss, body) {
  const approvedBy = body.approvedBy || body.manager || '';
  if (body.decision === 'rejected') return rejectLeave(ss, { id: body.id, approvedBy });
  updateRow(ss, 'LeaveRequests', { id: body.id, status: 'approved', approvedBy, updated: new Date().toISOString() });
  const requests = getRows(ss, 'LeaveRequests', { id: body.id });
  if (requests.length) {
    const req = requests[0];
    const days = parseFloat(req.duration) || (req.period !== 'full' ? 0.5 : 1);
    const year = new Date(req.startDate).getFullYear();
    const balances = getRows(ss, 'LeaveBalances').filter(b =>
      String(b.memberId) === String(req.memberId) &&
      String(b.leaveType) === String(req.leaveType) &&
      String(b.year) === String(year)
    );
    if (balances.length) {
      const b = balances[0];
      updateRow(ss, 'LeaveBalances', {
        id: b.id,
        used: parseFloat(b.used || 0) + days,
        balance: parseFloat(b.balance || 0) - days,
        updated: new Date().toISOString()
      });
    }
    sendEmail(ss, req.memberId, 'Leave Approved', `Your leave from ${req.startDate} to ${req.endDate} has been approved.`);
  }
  return { ok: true };
}

function rejectLeave(ss, body) {
  updateRow(ss, 'LeaveRequests', { id: body.id, status: 'rejected', approvedBy: body.approvedBy || body.manager || '', updated: new Date().toISOString() });
  return { ok: true };
}

function createVideo(ss, body) {
  // Create a Drive subfolder for this video project
  try {
    const mediaFolder = DriveApp.getFolderById(MEDIA_ID);
    const videoFolder = mediaFolder.createFolder(body.title || 'Video-' + Date.now());
    body.driveFolder = videoFolder.getId();
  } catch(e) { body.driveFolder = ''; }
  return createRow(ss, 'Videos', body);
}

function upsertFieldValue(ss, body) {
  const existing = getRows(ss, 'FieldValues').filter(r =>
    String(r.taskId) === String(body.taskId) && String(r.fieldId) === String(body.fieldId)
  );
  if (existing.length) {
    return updateRow(ss, 'FieldValues', { id: existing[0].id, value: body.value, updated: new Date().toISOString() });
  }
  return createRow(ss, 'FieldValues', body);
}

function applyTemplate(ss, body) {
  const templates = getRows(ss, 'Templates', { id: body.templateId });
  if (!templates.length) throw new Error('Template not found');
  const tpl = templates[0];
  // Create project from template
  const project = createRow(ss, 'Projects', {
    name: body.name || tpl.name,
    description: tpl.description || '',
    owner: body.owner || '',
    department: body.department || ''
  });
  return { ok: true, projectId: project.id };
}

function submitForm(ss, body) {
  const submission = createRow(ss, 'FormSubmissions', {
    formId: body.formId, submitter: body.submitter, data: JSON.stringify(body.data)
  });
  // Auto-create task from form submission
  if (body.createTask) {
    const task = createRow(ss, 'Tasks', {
      title: body.data.title || 'Form Submission',
      details: JSON.stringify(body.data),
      source: 'form',
      requestedBy: body.submitter,
      status: 'inbox',
      priority: 'P2'
    });
    updateRow(ss, 'FormSubmissions', { id: submission.id, taskId: task.id });
  }
  return { ok: true, id: submission.id };
}

function saveMeetingItems(ss, body) {
  // normalise field names from either old or new frontend
  if (body.items) body.items = body.items.map(i => ({
    ...i,
    type:      i.type      || i.item_type || 'task',
    assignee:  i.assignee  || i.owner     || '',
    dueDate:   i.dueDate   || i.due       || '',
    priority:  i.priority  || 'P2',
  }));

  const meetingId = body.meetingId || body.meeting_id;
  const items = body.items || [];
  const created = [];
  for (const item of items) {
    const row = createRow(ss, 'MeetingItems', { ...item, meetingId });
    if (item.type === 'task') {
      const task = createRow(ss, 'Tasks', {
        title: item.title, owner: item.assignee, department: item.department || body.department,
        due: item.dueDate, source: 'meeting', status: 'inbox', priority: item.priority || 'P2',
        requested_by: body.requestedBy || ''
      });
      updateRow(ss, 'MeetingItems', { id: row.id, taskId: task.id });
      row.taskId = task.id;
    } else if (item.type === 'event') {
      createRow(ss, 'Events', {
        title: item.title, date: item.dueDate, department: item.department || body.department,
        description: 'Extracted from meeting notes'
      });
    }
    created.push(row);
  }
  return { ok: true, created };
}

function parseMeetingNotes(ss, body) {
  const text = body.text || body.raw_notes || '';
  const team = getRows(ss, 'Team');
  const teamNames = team.map(m => ({ name: m.name, lower: m.name.toLowerCase(), dept: m.department }));

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];

  const taskVerbs = /\b(action|todo|task|assign|follow.?up|complete|finish|prepare|send|update|review|schedule|book|check|create|build|fix|resolve|ensure|coordinate|confirm|arrange|draft|submit|deliver|share)\b/i;
  const eventVerbs = /\b(meeting|call|sync|event|webinar|session|workshop|conference|presentation|demo|interview|launch)\b/i;
  const datePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s*\d{1,2}(?:st|nd|rd|th)?|\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?|\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|next\s+week|this\s+week|tomorrow|today|eod|eow|end\s+of\s+(week|month|day))\b|\bby\s+\w+/i;
  const bulletPat = /^[-*•►▪✓☐□]\s+|^\d+[.)]\s+/;
  const colonAssign = /^([A-Za-z][A-Za-z\s]{1,20}):\s+(.+)$/; // "Sara: send the report"

  lines.forEach(line => {
    const isBullet = bulletPat.test(line);
    const clean = line.replace(bulletPat, '').trim();
    if (!clean || clean.length < 5) return;

    // Detect colon-assignment pattern "Name: action"
    let assignee = '', department = '', titleText = clean;
    const colonMatch = clean.match(colonAssign);
    if (colonMatch) {
      const possible = colonMatch[1].trim().toLowerCase();
      const member = teamNames.find(m => m.lower === possible || m.lower.startsWith(possible));
      if (member) {
        assignee = member.name; department = member.dept;
        titleText = colonMatch[2].trim();
      }
    }
    // Fallback: name anywhere in the line
    if (!assignee) {
      for (const m of teamNames) {
        if (clean.toLowerCase().includes(m.lower)) {
          assignee = m.name; department = m.dept; break;
        }
      }
    }

    const dateMatch = clean.match(datePattern);
    const due = dateMatch ? dateMatch[0] : '';

    // Confidence: sum signals (0-100)
    const hasVerb  = taskVerbs.test(clean) ? 30 : 0;
    const hasBullet= isBullet ? 25 : 0;
    const hasDate  = due ? 20 : 0;
    const hasOwner = assignee ? 15 : 0;
    const hasColon = colonMatch && assignee ? 10 : 0;
    const confidence = Math.min(100, hasVerb + hasBullet + hasDate + hasOwner + hasColon);

    if (confidence < 20) return; // skip very unlikely lines

    if (eventVerbs.test(clean) && !taskVerbs.test(clean)) {
      items.push({ item_type: 'event', title: titleText, owner: assignee, department, due, confidence });
    } else if (taskVerbs.test(clean) || isBullet) {
      items.push({ item_type: 'task', title: titleText, owner: assignee, department, due, priority: 'P2', confidence });
    }
  });

  // Sort by confidence desc
  items.sort((a, b) => b.confidence - a.confidence);
  return { ok: true, items };
}

function uploadFile(body) {
  const folder = DriveApp.getFolderById(body.folderId || ATTACHMENTS_ID);
  const blob = Utilities.newBlob(
    Utilities.base64Decode(body.content),
    body.mimeType || 'application/octet-stream',
    body.name || 'upload'
  );
  const file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  return { ok: true, fileId: file.getId(), url: file.getDownloadUrl() };
}

function deleteDriveFile(fileId) {
  DriveApp.getFileById(fileId).setTrashed(true);
  return { ok: true };
}

function sendEmail(ss, memberId, subject, body) {
  try {
    const members = getRows(ss, 'Team').filter(m => String(m.id) === String(memberId));
    if (members.length && members[0].email) {
      MailApp.sendEmail({ to: members[0].email, subject: '[AerOS-PM] ' + subject, body });
    }
  } catch(_) {}
}

// ===================== INIT =====================

function initSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const existing = ss.getSheets().map(s => s.getName());

  Object.keys(SHEETS).forEach(name => {
    let sh;
    if (existing.includes(name)) {
      sh = ss.getSheetByName(name);
    } else {
      sh = ss.insertSheet(name);
    }
    // Write headers
    const headers = SHEETS[name];
    sh.getRange(1, 1, 1, headers.length).setValues([headers]);
    sh.getRange(1, 1, 1, headers.length)
      .setBackground('#1a73e8').setFontColor('#ffffff').setFontWeight('bold');
    sh.setFrozenRows(1);
  });

  // Delete default "Sheet1" if present
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1 && ss.getSheets().length > 1) ss.deleteSheet(sheet1);

  // Seed LeaveTypes
  const ltSh = ss.getSheetByName('LeaveTypes');
  if (ltSh && ltSh.getLastRow() < 2) {
    [
      ['LT-1','Annual Leave','paid',15,true],
      ['LT-2','Sick Leave','paid',10,false],
      ['LT-3','Maternity Leave','paid',60,false],
      ['LT-4','Paternity Leave','paid',7,false],
      ['LT-5','Emergency Leave','paid',3,false],
      ['LT-6','Unpaid Leave','unpaid',30,false],
    ].forEach(r => ltSh.appendRow([...r, new Date().toISOString()]));
  }

  // Seed CDORules
  const cdoSh = ss.getSheetByName('CDORules');
  if (cdoSh && cdoSh.getLastRow() < 2) {
    [
      ['CDR-1','weekend',1,'Regular weekend mission = 1 CDO day'],
      ['CDR-2','holiday',1.5,'Holiday mission = 1.5 CDO days'],
      ['CDR-3','overtime',0.5,'Overtime half-day = 0.5 CDO'],
    ].forEach(r => cdoSh.appendRow([...r, new Date().toISOString()]));
  }

  return { ok: true, sheets: Object.keys(SHEETS).length };
}

// ===================== iCAL FEED FETCHER =====================

function testExternalFetch() {
  const r = UrlFetchApp.fetch('https://calendar.google.com/calendar/ical/school.production%40mjqeducation.edu.kh/public/basic.ics', {
    muteHttpExceptions: true,
    headers: { 'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Thunderbird/91.0' }
  });
  Logger.log('Status: ' + r.getResponseCode());
  Logger.log('Body length: ' + r.getContentText().length);
}

function fetchIcal(url, feedId) {
  if (!url) return { error: 'No URL provided' };
  try {
    const opts = {
      muteHttpExceptions: true,
      followRedirects: true,
      headers: {
        'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:91.0) Gecko/20100101 Thunderbird/91.0',
        'Accept': 'text/calendar, application/calendar+xml, */*'
      }
    };
    const resp = UrlFetchApp.fetch(url, opts);
    const code = resp.getResponseCode();
    if (code !== 200) return { error: 'HTTP ' + code };
    const text = resp.getContentText('UTF-8');
    if (!text || text.trim().length === 0) return { error: 'Empty response — calendar may not be public. In Google Calendar, go to Settings → your calendar → "Make available to public" and use the iCal link.' };
    if (!text.includes('BEGIN:VCALENDAR')) return { error: 'Not a valid iCal feed (missing BEGIN:VCALENDAR). Check the URL.' };
    const events = parseIcal(text, feedId);
    return { events, count: events.length };
  } catch(e) {
    return { error: e.message };
  }
}

function parseIcal(text, feedId) {
  // Unfold lines (RFC 5545 — continuation lines start with space/tab)
  const unfolded = text.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '');
  const lines = unfolded.split(/\r\n|\r|\n/);

  const events = [];
  let inEvent = false;
  let cur = {};

  for (const raw of lines) {
    const line = raw.trim();
    if (line === 'BEGIN:VEVENT') { inEvent = true; cur = {}; continue; }
    if (line === 'END:VEVENT')   { inEvent = false; const evs = buildEvents(cur, feedId); if (evs) events.push(...evs); continue; }
    if (!inEvent) continue;
    const ci = line.indexOf(':');
    if (ci < 0) continue;
    const keyFull = line.substring(0, ci);          // e.g. DTSTART;TZID=America/Manila
    const key     = keyFull.split(';')[0].toUpperCase();
    const val     = line.substring(ci + 1);
    cur[key] = val;
  }
  return events;
}

function buildEvents(cur, feedId) {
  const title = icalText(cur['SUMMARY'] || cur['DESCRIPTION'] || '');
  if (!title) return null;

  const startRaw = cur['DTSTART'] || '';
  const endRaw   = cur['DTEND']   || cur['DTSTART'] || '';
  const start    = parseIcalDt(startRaw);
  const end      = parseIcalDt(endRaw);
  if (!start) return null;

  const uid = cur['UID'] || (feedId + '-' + Math.random().toString(36).slice(2));
  // For all-day events, iCal DTEND is exclusive (day after last day) — subtract 1
  let endDate = end ? end.date : start.date;
  if (end && !end.time && endDate > start.date) {
    const parts = endDate.split('-');
    const d = new Date(Date.UTC(+parts[0], +parts[1]-1, +parts[2]));
    d.setUTCDate(d.getUTCDate() - 1);
    endDate = d.toISOString().slice(0, 10);
  }
  const base = {
    id:          'ical-' + feedId + '-' + uid.replace(/[^a-z0-9]/gi,''),
    feedId,
    title,
    date:        start.date,
    end_date:    (endDate !== start.date) ? endDate : '',
    time:        start.time,
    end_time:    end ? end.time : '',
    description: icalText(cur['DESCRIPTION'] || ''),
    location:    icalText(cur['LOCATION']    || ''),
    uid,
    isExternal:  true,
  };

  if (cur['RRULE']) return expandRrule(base, cur['RRULE'], start);
  return [base];
}

function parseIcalDt(s) {
  if (!s) return null;
  s = s.trim().replace('Z','');   // strip UTC marker for display purposes
  if (s.length === 8) {           // DATE: 20260601
    return { date: s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8), time: '' };
  }
  if (s.length >= 15) {           // DATETIME: 20260601T090000
    return { date: s.slice(0,4)+'-'+s.slice(4,6)+'-'+s.slice(6,8),
             time: s.slice(9,11)+':'+s.slice(11,13) };
  }
  return null;
}

function icalText(s) {
  return s.replace(/\\n/g,'\n').replace(/\\,/g,',').replace(/\;/g,';').replace(/\\\\/g,'\\').trim();
}

function expandRrule(base, rrule, start) {
  const rules = {};
  rrule.split(';').forEach(p => { const [k,v]=p.split('='); rules[k]=v; });

  const freq     = rules['FREQ'] || 'DAILY';
  const maxCount = Math.min(parseInt(rules['COUNT'] || '365'), 200);
  const interval = parseInt(rules['INTERVAL'] || '1');
  const untilStr = rules['UNTIL'] ? parseIcalDt(rules['UNTIL']) : null;
  const cutoff   = new Date(); cutoff.setFullYear(cutoff.getFullYear() + 1);

  const results = [{ ...base }];
  const cur = new Date(start.date + 'T' + (start.time || '00:00') + ':00');

  for (let i = 1; i < maxCount; i++) {
    const prev = new Date(cur);
    if      (freq === 'DAILY')   cur.setDate(cur.getDate() + interval);
    else if (freq === 'WEEKLY')  cur.setDate(cur.getDate() + 7 * interval);
    else if (freq === 'MONTHLY') cur.setMonth(cur.getMonth() + interval);
    else if (freq === 'YEARLY')  cur.setFullYear(cur.getFullYear() + interval);
    else break;
    if (cur <= prev) break; // safety — no infinite loops
    if (untilStr && cur > new Date(untilStr.date)) break;
    if (cur > cutoff) break;
    const dateStr = cur.toISOString().split('T')[0];
    results.push({ ...base, id: base.id + '_' + i, date: dateStr });
  }
  return results;
}
