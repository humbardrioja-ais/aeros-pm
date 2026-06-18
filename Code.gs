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

    // ── Batch fetch (all data in one round-trip) ──
    case 'getAll':            return getAllData(ss, p);

    // ── Init ──
    case 'initSheet':         return initSheet();
    case 'ping':              return { ok: true, ts: new Date().toISOString() };

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
  };
}

// ===================== SHEET SCHEMA =====================

const SHEETS = {
  Tasks: ['id','title','details','owner','department','source','requestedBy','priority','due','status','repeat','attachments','created','updated','followup','notes','projectIds','sectionId','tags','customFields','parentId'],
  Subtasks: ['id','taskId','title','done','assignee','due','created','updated'],
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
  Team: ['id','name','email','role','department','avatar','phone','active','created'],
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
  MeetingNotes: ['id','title','date','attendees','department','rawNotes','summary','status','created','updated'],
  MeetingAttendees: ['id','meetingId','memberId','memberName','role','created'],
  MeetingItems: ['id','meetingId','type','title','assignee','department','dueDate','status','taskId','created'],
  Rules: ['id','name','trigger','conditions','actions','active','created','updated'],
  Audit: ['id','actor','action','entity','entityId','before','after','created']
};

// ===================== CRUD HELPERS =====================

function getRows(ss, sheetName, filter) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) return [];
  const data = sh.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  const rows = data.slice(1).map(r => {
    const obj = {};
    headers.forEach((h, i) => obj[h] = r[i]);
    return obj;
  });
  if (!filter) return rows;
  return rows.filter(r => Object.keys(filter).every(k => String(r[k]) === String(filter[k])));
}

function createRow(ss, sheetName, data) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet not found: ' + sheetName);
  const headers = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  if (!data.id) data.id = generateId(sheetName);
  if (!data.created) data.created = new Date().toISOString();
  if ('updated' in data || headers.includes('updated')) data.updated = new Date().toISOString();
  const row = headers.map(h => data[h] !== undefined ? data[h] : '');
  sh.appendRow(row);
  logAudit(ss, 'system', 'create', sheetName, data.id, null, data);
  return data;
}

function updateRow(ss, sheetName, data) {
  const sh = ss.getSheetByName(sheetName);
  if (!sh) throw new Error('Sheet not found: ' + sheetName);
  const allData = sh.getDataRange().getValues();
  const headers = allData[0];
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
  const meetingId = body.meetingId || body.meeting_id;
  const items = body.items || [];
  const created = [];
  for (const item of items) {
    const row = createRow(ss, 'MeetingItems', { ...item, meetingId });
    if (item.type === 'task') {
      const task = createRow(ss, 'Tasks', {
        title: item.title, owner: item.assignee, department: item.department,
        due: item.dueDate, source: 'meeting', status: 'inbox', priority: 'P2'
      });
      updateRow(ss, 'MeetingItems', { id: row.id, taskId: task.id });
    }
    created.push(row);
  }
  return { ok: true, created };
}

function parseMeetingNotes(ss, body) {
  const text = body.text || body.raw_notes || '';
  const team = getRows(ss, 'Team');
  const teamNames = team.map(m => m.name.toLowerCase());
  const deptMap = {};
  team.forEach(m => { deptMap[m.name.toLowerCase()] = m.department; });

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const items = [];

  // Action verbs that signal tasks
  const taskVerbs = /\b(action|todo|task|assign|follow.?up|complete|finish|prepare|send|update|review|schedule|book|check|create|build|fix|resolve|ensure|coordinate|confirm|arrange|draft)\b/i;
  // Date patterns
  const datePattern = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\.?\s+\d{1,2}|\b\d{1,2}[\/\-]\d{1,2}([\/\-]\d{2,4})?|\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|next week|tomorrow|today)\b|\bby\s+(end of|eod|cob)?\s*(the\s+)?(week|month|day)?\b/i;
  // Event signals
  const eventVerbs = /\b(meeting|call|sync|event|webinar|session|workshop|conference|presentation|demo|interview|launch)\b/i;

  lines.forEach((line, idx) => {
    const linesClean = line.replace(/^[-*•►▪]\s*/, '').replace(/^\d+\.\s*/, '');

    // Find assignee
    let assignee = '', department = '';
    teamNames.forEach(name => {
      if (linesClean.toLowerCase().includes(name)) {
        const member = team.find(m => m.name.toLowerCase() === name);
        if (member) { assignee = member.name; department = member.department; }
      }
    });

    // Extract due date
    const dateMatch = linesClean.match(datePattern);
    const dueDate = dateMatch ? dateMatch[0] : '';

    if (taskVerbs.test(linesClean)) {
      items.push({ type: 'task', title: linesClean, assignee, department, dueDate, confirmed: false });
    } else if (eventVerbs.test(linesClean)) {
      items.push({ type: 'event', title: linesClean, assignee, department, date: dueDate, confirmed: false });
    }
  });

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
