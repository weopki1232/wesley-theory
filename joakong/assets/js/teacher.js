/* ===========================================================
   teacher.js — หน้าครู: สร้างห้อง จัดผังด้วยการลาก และดูรายการจอง
   =========================================================== */

(() => {
  const LAST_ROOM = 'joakong.teacherRoom.v1';
  const DRAG_THRESHOLD = 6; // px — ขยับน้อยกว่านี้ถือว่าเป็นการ "แตะ"

  const dom = {
    roomSelect: UI.el('#room-select'),
    newRoom: UI.el('#new-room'),
    renameRoom: UI.el('#rename-room'),
    deleteRoom: UI.el('#delete-room'),

    editorCard: UI.el('#editor-card'),
    editorName: UI.el('#editor-room-name'),
    palette: UI.el('#palette'),
    grid: UI.el('#editor-grid'),
    cols: UI.el('#cols-input'),
    rows: UI.el('#rows-input'),
    statSeats: UI.el('#stat-seats'),
    statState: UI.el('#stat-state'),
    save: UI.el('#save-layout'),
    revert: UI.el('#revert-layout'),

    bookingsCard: UI.el('#bookings-card'),
    bookingDate: UI.el('#booking-date'),
    bookingRows: UI.el('#booking-rows'),
    bookingEmpty: UI.el('#booking-empty'),
    bookingTable: UI.el('#booking-table'),
    statBooked: UI.el('#stat-booked'),
    statEmpty: UI.el('#stat-empty'),

    roomModal: UI.el('#room-modal'),
    roomForm: UI.el('#room-form'),
    roomModalTitle: UI.el('#room-modal-title'),
    roomName: UI.el('#room-name'),
    roomNote: UI.el('#room-note'),
    roomError: UI.el('#room-error'),

    importFile: UI.el('#import-file'),
  };

  /** draft = สำเนาผังที่กำลังแก้ไข (ยังไม่บันทึกลง localStorage) */
  const state = { draft: null, dirty: false, tool: null, modalMode: 'new', date: JT.todayISO() };
  let drag = null;

  const clone = (obj) => (typeof structuredClone === 'function' ? structuredClone(obj) : JSON.parse(JSON.stringify(obj)));

  const escapeHTML = (str) => String(str).replace(/[&<>"']/g, (ch) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
  ));

  /* =========================================================
     เริ่มต้น
     ========================================================= */

  function init() {
    dom.bookingDate.value = state.date;

    dom.roomSelect.addEventListener('change', () => selectRoom(dom.roomSelect.value));
    dom.newRoom.addEventListener('click', () => openRoomModal('new'));
    dom.renameRoom.addEventListener('click', () => openRoomModal('edit'));
    dom.deleteRoom.addEventListener('click', onDeleteRoom);
    dom.roomForm.addEventListener('submit', onRoomFormSubmit);
    UI.el('#room-cancel').addEventListener('click', () => dom.roomModal.close());

    dom.palette.addEventListener('pointerdown', onPalettePointerDown);
    dom.grid.addEventListener('pointerdown', onGridPointerDown);
    dom.grid.addEventListener('click', onGridClick);

    dom.cols.addEventListener('change', () => resizeGrid('cols'));
    dom.rows.addEventListener('change', () => resizeGrid('rows'));

    UI.el('#preset-40').addEventListener('click', applyPreset40);
    UI.el('#fill-all').addEventListener('click', fillAll);
    UI.el('#clear-layout').addEventListener('click', clearLayout);
    dom.save.addEventListener('click', saveLayout);
    dom.revert.addEventListener('click', revertLayout);

    dom.bookingDate.addEventListener('change', () => {
      state.date = dom.bookingDate.value || JT.todayISO();
      dom.bookingDate.value = state.date;
      renderBookings();
    });
    dom.bookingRows.addEventListener('click', onBookingRowClick);
    UI.el('#export-csv').addEventListener('click', exportCSV);
    UI.el('#clear-day').addEventListener('click', clearDay);

    UI.el('#export-json').addEventListener('click', exportJSON);
    UI.el('#import-json').addEventListener('click', () => dom.importFile.click());
    dom.importFile.addEventListener('change', importJSON);
    UI.el('#reset-all').addEventListener('click', resetAll);

    window.addEventListener('beforeunload', (ev) => {
      if (!state.dirty) return;
      ev.preventDefault();
      ev.returnValue = '';
    });

    refreshRoomList();
  }

  /* =========================================================
     ห้องเรียน
     ========================================================= */

  function refreshRoomList(preferId) {
    const rooms = JT.getRooms();
    dom.roomSelect.innerHTML = '';

    if (!rooms.length) {
      const opt = document.createElement('option');
      opt.textContent = 'ยังไม่มีห้อง — กด “สร้างห้องใหม่”';
      dom.roomSelect.appendChild(opt);
      dom.roomSelect.disabled = true;
      dom.renameRoom.disabled = dom.deleteRoom.disabled = true;
      dom.editorCard.hidden = dom.bookingsCard.hidden = true;
      state.draft = null;
      return;
    }

    dom.roomSelect.disabled = false;
    dom.renameRoom.disabled = dom.deleteRoom.disabled = false;

    rooms.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.name} · ${JT.seatCount(r)} ที่นั่ง`;
      dom.roomSelect.appendChild(opt);
    });

    const remembered = localStorage.getItem(LAST_ROOM);
    const wanted = [preferId, state.draft && state.draft.id, remembered].find((id) => rooms.some((r) => r.id === id));
    dom.roomSelect.value = wanted || rooms[0].id;
    selectRoom(dom.roomSelect.value);
  }

  function selectRoom(id) {
    if (state.dirty && state.draft && state.draft.id !== id) {
      if (!confirm('ผังห้องเดิมยังไม่ได้บันทึก ถ้าเปลี่ยนห้องตอนนี้การแก้ไขจะหายไป ไปต่อไหม?')) {
        dom.roomSelect.value = state.draft.id;
        return;
      }
    }
    const room = JT.getRoom(id);
    if (!room) { refreshRoomList(); return; }

    localStorage.setItem(LAST_ROOM, id);
    state.draft = clone(room);
    setDirty(false);

    dom.editorCard.hidden = dom.bookingsCard.hidden = false;
    dom.editorName.textContent = room.name;
    dom.cols.value = String(room.cols);
    dom.rows.value = String(room.rows);

    renderEditor();
    renderBookings();
  }

  function openRoomModal(mode) {
    state.modalMode = mode;
    dom.roomError.textContent = '';
    dom.roomModalTitle.textContent = mode === 'new' ? 'สร้างห้องใหม่' : 'แก้ไขข้อมูลห้อง';
    dom.roomName.value = mode === 'edit' && state.draft ? state.draft.name : '';
    dom.roomNote.value = mode === 'edit' && state.draft ? state.draft.note : '';
    dom.roomModal.showModal();
    dom.roomName.focus();
  }

  function onRoomFormSubmit(ev) {
    ev.preventDefault();
    const name = dom.roomName.value.trim();
    const note = dom.roomNote.value.trim();
    if (!name) { dom.roomError.textContent = 'ใส่ชื่อห้องด้วยนะ'; return; }

    const clash = JT.getRooms().some((r) => r.name === name && !(state.modalMode === 'edit' && state.draft && r.id === state.draft.id));
    if (clash) { dom.roomError.textContent = 'มีห้องชื่อนี้อยู่แล้ว ลองตั้งชื่อให้ต่างกัน'; return; }

    if (state.modalMode === 'new') {
      const room = JT.makeRoom(name, note);
      JT.saveRoom(room);
      dom.roomModal.close();
      UI.toast('สร้างห้อง “' + room.name + '” แล้ว', 'ok');
      refreshRoomList(room.id);
      return;
    }

    if (!state.draft) return;
    const room = JT.getRoom(state.draft.id);
    if (!room) { dom.roomModal.close(); refreshRoomList(); return; }

    room.name = name;
    room.note = note;
    JT.saveRoom(room);
    JT.syncBookingLabels(room.id);
    state.draft.name = name;
    state.draft.note = note;
    dom.roomModal.close();
    UI.toast('แก้ไขข้อมูลห้องแล้ว', 'ok');
    refreshRoomList(room.id);
  }

  function onDeleteRoom() {
    if (!state.draft) return;
    const count = JT.getBookings().filter((b) => b.roomId === state.draft.id).length;
    const warn = count ? `\nการจองของห้องนี้ ${count} รายการจะถูกลบไปด้วย` : '';
    if (!confirm(`ลบห้อง “${state.draft.name}” ทิ้งเลยไหม?${warn}`)) return;

    JT.deleteRoom(state.draft.id);
    state.draft = null;
    setDirty(false);
    UI.toast('ลบห้องแล้ว', 'ok');
    refreshRoomList();
  }

  /* =========================================================
     ตัวแก้ไขผัง
     ========================================================= */

  function setDirty(value) {
    state.dirty = value;
    dom.statState.textContent = value ? 'ยังไม่บันทึก' : 'บันทึกแล้ว';
    dom.statState.style.color = value ? 'var(--orange-dk)' : 'var(--ink)';
    dom.revert.disabled = !value;
  }

  function renderEditor() {
    const room = state.draft;
    if (!room) return;

    UI.renderGrid(dom.grid, room, (item) => {
      const node = document.createElement('div');
      node.className = 'seat';
      node.dataset.kind = item.kind;
      node.dataset.itemId = item.id;
      node.title = JT.KIND[item.kind].name + ' — ลากเพื่อย้าย, ลากออกนอกตารางเพื่อลบ';
      node.innerHTML = item.kind === 'seat'
        ? `${escapeHTML(item.label || '?')}<small>🪑</small>`
        : JT.KIND[item.kind].icon;
      return node;
    });

    dom.statSeats.textContent = String(JT.seatCount(room));
  }

  function itemAt(c, r) {
    return state.draft.items.find((it) => it.c === c && it.r === r) || null;
  }

  /** เรียงเลขโต๊ะใหม่ทันทีเพื่อให้ผังที่เห็นตรงกับตอนบันทึก */
  function touchLayout() {
    JT.renumberSeats(state.draft);
    setDirty(true);
    renderEditor();
  }

  /* ---------- ลากวาง ---------- */

  function onPalettePointerDown(ev) {
    const tool = ev.target.closest('.tool');
    if (!tool || !state.draft) return;
    startDrag(ev, { from: 'palette', kind: tool.dataset.kind, node: tool });
  }

  function onGridPointerDown(ev) {
    const node = ev.target.closest('.seat');
    if (!node || !state.draft) return;
    startDrag(ev, { from: 'grid', itemId: node.dataset.itemId, node });
  }

  function startDrag(ev, source) {
    if (typeof ev.button === 'number' && ev.button !== 0) return;
    ev.preventDefault();
    drag = { ...source, startX: ev.clientX, startY: ev.clientY, moved: false, ghost: null };
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', endDrag);
  }

  function onPointerMove(ev) {
    if (!drag) return;
    if (!drag.moved) {
      if (Math.hypot(ev.clientX - drag.startX, ev.clientY - drag.startY) < DRAG_THRESHOLD) return;
      drag.moved = true;
      drag.ghost = document.createElement('div');
      drag.ghost.className = 'drag-ghost';
      drag.ghost.textContent = ghostFace(drag);
      document.body.appendChild(drag.ghost);
    }
    drag.ghost.style.left = ev.clientX + 'px';
    drag.ghost.style.top = ev.clientY + 'px';
    highlight(cellUnder(ev.clientX, ev.clientY));
  }

  function ghostFace(d) {
    if (d.from === 'palette') return d.kind === 'erase' ? '🧽' : JT.KIND[d.kind].icon;
    const item = state.draft.items.find((it) => it.id === d.itemId);
    if (!item) return '🪑';
    return item.kind === 'seat' ? item.label : JT.KIND[item.kind].icon;
  }

  function cellUnder(x, y) {
    const node = document.elementFromPoint(x, y);
    const cell = node && node.closest ? node.closest('.cell') : null;
    return cell && dom.grid.contains(cell) ? cell : null;
  }

  function highlight(cell) {
    UI.els('.cell.is-drop-target', dom.grid).forEach((el) => el.classList.remove('is-drop-target'));
    if (cell) cell.classList.add('is-drop-target');
  }

  function onPointerUp(ev) {
    if (!drag) return;
    const current = drag;
    const cell = current.moved ? cellUnder(ev.clientX, ev.clientY) : null;
    endDrag();

    if (!current.moved) { handleTap(current); return; }

    if (!cell) {
      if (current.from === 'grid') removeItem(current.itemId);
      return;
    }
    dropOnCell(current, Number(cell.dataset.c), Number(cell.dataset.r));
  }

  function endDrag() {
    window.removeEventListener('pointermove', onPointerMove);
    window.removeEventListener('pointerup', onPointerUp);
    window.removeEventListener('pointercancel', endDrag);
    highlight(null);
    if (drag && drag.ghost) drag.ghost.remove();
    drag = null;
  }

  function dropOnCell(source, c, r) {
    const target = itemAt(c, r);

    if (source.from === 'palette') {
      if (source.kind === 'erase') {
        if (target) removeItem(target.id);
        return;
      }
      if (target) { UI.toast('ช่องนี้มีของวางอยู่แล้ว', 'warn'); return; }
      state.draft.items.push(JT.makeItem(source.kind, c, r));
      touchLayout();
      return;
    }

    const moving = state.draft.items.find((it) => it.id === source.itemId);
    if (!moving) return;
    if (target && target.id === moving.id) return;

    if (target) { // สลับที่กัน
      [target.c, target.r, moving.c, moving.r] = [moving.c, moving.r, c, r];
    } else {
      moving.c = c;
      moving.r = r;
    }
    touchLayout();
  }

  function handleTap(source) {
    if (source.from === 'palette') {
      state.tool = state.tool === source.kind ? null : source.kind;
      UI.els('.tool', dom.palette).forEach((el) => el.classList.toggle('is-active', el.dataset.kind === state.tool));
      if (state.tool) {
        UI.toast(state.tool === 'erase' ? 'โหมดยางลบ: แตะไอเท็มเพื่อลบ' : 'แตะช่องว่างในตารางเพื่อวาง');
      }
      return;
    }
    if (state.tool === 'erase') removeItem(source.itemId);
  }

  /** แตะช่องว่างในตารางเมื่อเลือกเครื่องมือไว้แล้ว */
  function onGridClick(ev) {
    if (!state.draft || !state.tool || state.tool === 'erase') return;
    const cell = ev.target.closest('.cell');
    if (!cell || cell.querySelector('.seat')) return;

    state.draft.items.push(JT.makeItem(state.tool, Number(cell.dataset.c), Number(cell.dataset.r)));
    touchLayout();
  }

  function removeItem(itemId) {
    const i = state.draft.items.findIndex((it) => it.id === itemId);
    if (i === -1) return;
    state.draft.items.splice(i, 1);
    touchLayout();
  }

  /* ---------- ขนาดตาราง / ผังสำเร็จรูป ---------- */

  function resizeGrid(which) {
    const input = which === 'cols' ? dom.cols : dom.rows;
    const min = Number(input.min);
    const max = Number(input.max);
    const value = Math.min(max, Math.max(min, Math.round(Number(input.value) || min)));
    input.value = String(value);

    const nextCols = which === 'cols' ? value : state.draft.cols;
    const nextRows = which === 'rows' ? value : state.draft.rows;
    const outside = state.draft.items.filter((it) => it.c >= nextCols || it.r >= nextRows);

    if (outside.length && !confirm(`ย่อตารางแล้วจะมีไอเท็ม ${outside.length} ชิ้นหลุดออกนอกผังและถูกลบ ตกลงไหม?`)) {
      input.value = String(which === 'cols' ? state.draft.cols : state.draft.rows);
      return;
    }

    state.draft.cols = nextCols;
    state.draft.rows = nextRows;
    state.draft.items = state.draft.items.filter((it) => it.c < nextCols && it.r < nextRows);
    touchLayout();
  }

  /** 8 โต๊ะต่อแถว × 5 แถว เว้นทางเดินกลาง = 40 ที่นั่ง */
  function applyPreset40() {
    if (state.draft.items.length && !confirm('จะแทนที่ผังเดิมทั้งหมดด้วยผังมาตรฐาน 40 ที่นั่ง ตกลงไหม?')) return;

    state.draft.cols = 9;
    state.draft.rows = 6;
    state.draft.items = [];
    for (let r = 1; r <= 5; r++) {
      for (let c = 0; c < 9; c++) {
        if (c === 4) continue; // ทางเดินกลาง
        state.draft.items.push(JT.makeItem('seat', c, r));
      }
    }
    state.draft.items.push(JT.makeItem('teacher', 0, 0));
    state.draft.items.push(JT.makeItem('door', 8, 0));

    dom.cols.value = '9';
    dom.rows.value = '6';
    touchLayout();
    UI.toast('วางผัง 40 ที่นั่งให้แล้ว ปรับต่อได้เลย', 'ok');
  }

  function fillAll() {
    let added = 0;
    for (let r = 0; r < state.draft.rows; r++) {
      for (let c = 0; c < state.draft.cols; c++) {
        if (!itemAt(c, r)) { state.draft.items.push(JT.makeItem('seat', c, r)); added++; }
      }
    }
    if (!added) { UI.toast('ผังเต็มอยู่แล้ว'); return; }
    touchLayout();
    UI.toast(`เพิ่มโต๊ะอีก ${added} ตัว`, 'ok');
  }

  function clearLayout() {
    if (!state.draft.items.length) return;
    if (!confirm('ล้างไอเท็มทั้งหมดในผังนี้เลยไหม?')) return;
    state.draft.items = [];
    touchLayout();
  }

  /* ---------- บันทึก / ย้อนกลับ ---------- */

  function saveLayout() {
    if (!state.draft) return;

    const orphans = JT.orphanBookings(state.draft);
    if (orphans.length && !confirm(`ผังใหม่ไม่มีโต๊ะที่ถูกจองไว้ ${orphans.length} รายการแล้ว\nถ้าบันทึก การจองเหล่านั้นจะถูกลบ ตกลงไหม?`)) return;

    if (!JT.saveRoom(state.draft)) { UI.toast('บันทึกไม่สำเร็จ พื้นที่เก็บข้อมูลอาจเต็ม', 'warn'); return; }
    if (orphans.length) JT.deleteBookings(orphans.map((b) => b.id));
    JT.syncBookingLabels(state.draft.id);

    setDirty(false);
    UI.toast('บันทึกผังห้องแล้ว นักเรียนจองตามผังนี้ได้เลย', 'ok');
    refreshRoomList(state.draft.id);
  }

  function revertLayout() {
    if (!state.draft) return;
    if (!confirm('ทิ้งการแก้ไขที่ยังไม่บันทึก แล้วกลับไปใช้ผังเดิมไหม?')) return;
    selectRoom(state.draft.id);
  }

  /* =========================================================
     รายการจอง
     ========================================================= */

  function currentBookings() {
    if (!state.draft) return [];
    return JT.bookingsFor(state.draft.id, state.date)
      .slice()
      .sort((a, b) => String(a.seatLabel).localeCompare(String(b.seatLabel), 'th', { numeric: true }));
  }

  function renderBookings() {
    const rows = currentBookings();
    const saved = JT.getRoom(state.draft ? state.draft.id : '');
    const total = saved ? JT.seatCount(saved) : 0;

    dom.statBooked.textContent = String(rows.length);
    dom.statEmpty.textContent = String(Math.max(0, total - rows.length));
    dom.bookingEmpty.hidden = rows.length > 0;
    dom.bookingTable.hidden = rows.length === 0;

    dom.bookingRows.innerHTML = '';
    rows.forEach((b) => {
      const time = new Date(b.createdAt);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHTML(b.seatLabel)}</strong></td>
        <td>${escapeHTML(b.studentName)}</td>
        <td>${escapeHTML(b.studentClass)}</td>
        <td><span class="code-chip">${escapeHTML(b.code)}</span></td>
        <td>${Number.isNaN(time.getTime()) ? '-' : escapeHTML(time.toLocaleString('th-TH', { dateStyle: 'short', timeStyle: 'short' }))}</td>
        <td><button type="button" class="btn btn-sm btn-danger" data-cancel="${escapeHTML(b.id)}">ลบ</button></td>`;
      dom.bookingRows.appendChild(tr);
    });
  }

  function onBookingRowClick(ev) {
    const btn = ev.target.closest('[data-cancel]');
    if (!btn) return;
    if (!confirm('ลบการจองรายการนี้ไหม?')) return;
    JT.cancelBooking(btn.dataset.cancel);
    UI.toast('ลบการจองแล้ว', 'ok');
    renderBookings();
  }

  function clearDay() {
    if (!state.draft) return;
    const rows = currentBookings();
    if (!rows.length) { UI.toast('วันนี้ยังไม่มีการจอง'); return; }
    if (!confirm(`ล้างการจองของ ${JT.formatThaiDate(state.date)} ทั้งหมด ${rows.length} รายการไหม?`)) return;
    JT.clearBookings(state.draft.id, state.date);
    UI.toast('ล้างการจองของวันนี้แล้ว', 'ok');
    renderBookings();
  }

  /* =========================================================
     ส่งออก / นำเข้า
     ========================================================= */

  function download(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function csvCell(value) {
    const text = String(value == null ? '' : value);
    return /[",\n]/.test(text) ? '"' + text.replace(/"/g, '""') + '"' : text;
  }

  function exportCSV() {
    const rows = currentBookings();
    if (!rows.length) { UI.toast('วันนี้ยังไม่มีการจองให้ส่งออก', 'warn'); return; }

    const header = ['โต๊ะ', 'ชื่อ-นามสกุล', 'ชั้น/ห้อง', 'รหัสการจอง', 'ห้องเรียน', 'วันที่', 'เวลาที่จอง'];
    const lines = [header, ...rows.map((b) => [b.seatLabel, b.studentName, b.studentClass, b.code, b.roomName, b.date, b.createdAt])];
    const csv = '﻿' + lines.map((line) => line.map(csvCell).join(',')).join('\r\n');
    download(`joakong-${state.draft.name}-${state.date}.csv`, csv, 'text/csv;charset=utf-8');
  }

  function exportJSON() {
    download(`joakong-backup-${JT.todayISO()}.json`, JSON.stringify(JT.exportAll(), null, 2), 'application/json');
    UI.toast('ส่งออกไฟล์ข้อมูลแล้ว', 'ok');
  }

  function importJSON(ev) {
    const file = ev.target.files && ev.target.files[0];
    ev.target.value = '';
    if (!file) return;
    if (!confirm('การนำเข้าจะเขียนทับห้องและการจองทั้งหมดในเครื่องนี้ ตกลงไหม?')) return;

    const reader = new FileReader();
    reader.onload = () => {
      let data;
      try {
        data = JSON.parse(String(reader.result));
      } catch (err) {
        UI.toast('อ่านไฟล์ไม่ได้ ไฟล์อาจเสียหาย', 'warn');
        return;
      }
      const result = JT.importAll(data);
      if (!result.ok) { UI.toast(result.error, 'warn'); return; }
      state.draft = null;
      setDirty(false);
      UI.toast(`นำเข้าแล้ว: ${result.rooms} ห้อง / ${result.bookings} การจอง`, 'ok');
      refreshRoomList();
    };
    reader.onerror = () => UI.toast('อ่านไฟล์ไม่สำเร็จ', 'warn');
    reader.readAsText(file);
  }

  function resetAll() {
    if (!confirm('ล้างข้อมูลทั้งหมด (ทุกห้องและทุกการจอง) ในเครื่องนี้ไหม? กู้คืนไม่ได้นะ')) return;
    JT.resetAll();
    state.draft = null;
    setDirty(false);
    UI.toast('ล้างข้อมูลทั้งหมดแล้ว', 'ok');
    refreshRoomList();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
