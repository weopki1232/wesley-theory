/* ===========================================================
   app.js — หน้านักเรียน: เลือกห้อง เลือกวัน แล้วจองโต๊ะ
   =========================================================== */

(() => {
  const LAST_STUDENT = 'joakong.lastStudent.v1';
  const LAST_ROOM = 'joakong.lastRoom.v1';

  const dom = {
    noRoom: UI.el('#no-room'),
    picker: UI.el('#picker'),
    roomSelect: UI.el('#room-select'),
    dateInput: UI.el('#date-input'),

    roomCard: UI.el('#room-card'),
    roomTitle: UI.el('#room-title'),
    roomNote: UI.el('#room-note'),
    grid: UI.el('#room-grid'),
    noSeat: UI.el('#no-seat'),
    statTotal: UI.el('#stat-total'),
    statFree: UI.el('#stat-free'),
    statTaken: UI.el('#stat-taken'),

    mineList: UI.el('#mine-list'),
    mineEmpty: UI.el('#mine-empty'),

    bookModal: UI.el('#book-modal'),
    bookForm: UI.el('#book-form'),
    bookError: UI.el('#book-error'),
    modalSeat: UI.el('#modal-seat'),
    modalMeta: UI.el('#modal-meta'),
    name: UI.el('#student-name'),
    klass: UI.el('#student-class'),

    doneModal: UI.el('#done-modal'),
    doneDetail: UI.el('#done-detail'),
    doneCode: UI.el('#done-code'),
  };

  const state = { room: null, date: JT.todayISO(), pendingSeat: null };

  /* ---------- เริ่มต้น ---------- */

  function init() {
    dom.dateInput.value = state.date;
    dom.dateInput.min = JT.todayISO();

    dom.roomSelect.addEventListener('change', () => {
      localStorage.setItem(LAST_ROOM, dom.roomSelect.value);
      loadRoom(dom.roomSelect.value);
    });

    dom.dateInput.addEventListener('change', () => {
      state.date = dom.dateInput.value || JT.todayISO();
      dom.dateInput.value = state.date;
      renderRoom();
    });

    dom.grid.addEventListener('click', onGridClick);
    dom.bookForm.addEventListener('submit', onBookSubmit);
    UI.el('#book-cancel').addEventListener('click', () => dom.bookModal.close());
    UI.el('#done-close').addEventListener('click', () => dom.doneModal.close());
    dom.mineList.addEventListener('click', onMineClick);

    // เปิดหลายแท็บพร้อมกันแล้วยังเห็นตรงกัน
    window.addEventListener('storage', () => { refreshRooms(); renderMine(); });

    refreshRooms();
    renderMine();
  }

  function refreshRooms() {
    const rooms = JT.getRooms();

    if (!rooms.length) {
      dom.noRoom.hidden = false;
      dom.picker.hidden = true;
      dom.roomCard.hidden = true;
      state.room = null;
      return;
    }

    dom.noRoom.hidden = true;
    dom.picker.hidden = false;

    const keep = state.room && rooms.some((r) => r.id === state.room.id) ? state.room.id : null;
    const remembered = localStorage.getItem(LAST_ROOM);
    const wanted = keep || (rooms.some((r) => r.id === remembered) ? remembered : rooms[0].id);

    dom.roomSelect.innerHTML = '';
    rooms.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r.id;
      opt.textContent = `${r.name} · ${JT.seatCount(r)} ที่นั่ง`;
      dom.roomSelect.appendChild(opt);
    });
    dom.roomSelect.value = wanted;
    loadRoom(wanted);
  }

  function loadRoom(id) {
    state.room = JT.getRoom(id);
    renderRoom();
  }

  /* ---------- วาดผังห้อง ---------- */

  function renderRoom() {
    const room = state.room;
    if (!room) { dom.roomCard.hidden = true; return; }

    dom.roomCard.hidden = false;
    dom.roomTitle.textContent = room.name;
    dom.roomNote.textContent = [room.note, JT.formatThaiDate(state.date)].filter(Boolean).join(' · ');

    const taken = new Map(JT.bookingsFor(room.id, state.date).map((b) => [b.seatId, b]));
    const mineIds = new Set(JT.myBookings().map((b) => b.id));
    const total = JT.seatCount(room);

    dom.noSeat.hidden = total > 0;
    dom.statTotal.textContent = String(total);
    dom.statTaken.textContent = String(Array.from(taken.keys()).filter((id) => room.items.some((it) => it.id === id)).length);
    dom.statFree.textContent = String(Math.max(0, total - Number(dom.statTaken.textContent)));

    UI.renderGrid(dom.grid, room, (item) => {
      const node = document.createElement(item.kind === 'seat' ? 'button' : 'div');
      node.className = 'seat';
      node.dataset.kind = item.kind;

      if (item.kind !== 'seat') {
        node.textContent = JT.KIND[item.kind].icon;
        node.title = JT.KIND[item.kind].name;
        return node;
      }

      node.type = 'button';
      node.dataset.seatId = item.id;
      const booking = taken.get(item.id);

      if (!booking) {
        node.classList.add('is-free');
        node.innerHTML = `${item.label}<small>ว่าง</small>`;
        node.setAttribute('aria-label', `โต๊ะ ${item.label} ว่าง แตะเพื่อจอง`);
      } else {
        const mine = mineIds.has(booking.id);
        node.classList.add(mine ? 'is-mine' : 'is-taken');
        node.disabled = true;
        node.innerHTML = `${item.label}<small>${escapeHTML(shortName(booking.studentName))}</small>`;
        node.setAttribute('aria-label', `โต๊ะ ${item.label} จองแล้วโดย ${booking.studentName} ${booking.studentClass}`);
        node.title = `${booking.studentName} (${booking.studentClass})`;
      }
      return node;
    });
  }

  function shortName(full) {
    const first = String(full).trim().split(/\s+/)[0] || '';
    return first.length > 8 ? first.slice(0, 8) + '…' : first;
  }

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (ch) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]
    ));
  }

  /* ---------- จอง ---------- */

  function onGridClick(ev) {
    const btn = ev.target.closest('.seat.is-free');
    if (!btn || !state.room) return;

    const item = state.room.items.find((it) => it.id === btn.dataset.seatId);
    if (!item) return;

    state.pendingSeat = item;
    dom.modalSeat.textContent = item.label;
    dom.modalMeta.textContent = `${state.room.name} · ${JT.formatThaiDate(state.date)} · จองทั้งวัน`;
    dom.bookError.textContent = '';

    try {
      const last = JSON.parse(localStorage.getItem(LAST_STUDENT) || '{}');
      dom.name.value = last.name || '';
      dom.klass.value = last.klass || '';
    } catch (err) { /* ไม่มีข้อมูลเดิมก็ไม่เป็นไร */ }

    dom.bookModal.showModal();
    (dom.name.value ? dom.klass : dom.name).focus();
  }

  function onBookSubmit(ev) {
    ev.preventDefault();
    if (!state.room || !state.pendingSeat) return;

    const result = JT.book({
      roomId: state.room.id,
      date: state.date,
      seatId: state.pendingSeat.id,
      studentName: dom.name.value,
      studentClass: dom.klass.value,
    });

    if (!result.ok) {
      dom.bookError.textContent = result.error;
      renderRoom();
      return;
    }

    localStorage.setItem(LAST_STUDENT, JSON.stringify({ name: result.booking.studentName, klass: result.booking.studentClass }));
    dom.bookModal.close();

    dom.doneDetail.textContent =
      `${result.booking.studentName} · โต๊ะ ${result.booking.seatLabel} · ${result.booking.roomName} · ${JT.formatThaiDate(result.booking.date)}`;
    dom.doneCode.textContent = result.booking.code;
    dom.doneModal.showModal();

    state.pendingSeat = null;
    renderRoom();
    renderMine();
  }

  /* ---------- การจองของฉัน ---------- */

  function renderMine() {
    const list = JT.myBookings();
    dom.mineList.innerHTML = '';
    dom.mineEmpty.hidden = list.length > 0;

    list.forEach((b) => {
      const li = document.createElement('li');
      li.className = 'mine-item';
      li.innerHTML = `
        <span>
          <span class="who">โต๊ะ ${escapeHTML(b.seatLabel)} · ${escapeHTML(b.roomName)}</span><br>
          <span class="meta">${escapeHTML(JT.formatThaiDate(b.date))} · ${escapeHTML(b.studentName)} (${escapeHTML(b.studentClass)})</span>
        </span>
        <span class="code-chip">${escapeHTML(b.code)}</span>
        <button type="button" class="btn btn-sm btn-danger" data-cancel="${escapeHTML(b.id)}">ยกเลิก</button>`;
      dom.mineList.appendChild(li);
    });
  }

  function onMineClick(ev) {
    const btn = ev.target.closest('[data-cancel]');
    if (!btn) return;
    if (!confirm('ยกเลิกการจองนี้จริงๆ นะ?')) return;

    if (JT.cancelBooking(btn.dataset.cancel)) {
      UI.toast('ยกเลิกการจองแล้ว', 'ok');
      renderMine();
      renderRoom();
    } else {
      UI.toast('ไม่พบการจองนี้แล้ว', 'warn');
      renderMine();
    }
  }

  document.addEventListener('DOMContentLoaded', init);
})();
