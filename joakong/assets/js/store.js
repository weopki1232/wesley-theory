/* ===========================================================
   store.js — ชั้นข้อมูลกลางของ "โจ๊ะตอง"
   เก็บทุกอย่างไว้ใน localStorage ของเบราว์เซอร์ (ไม่มีเซิร์ฟเวอร์)
   =========================================================== */

const JT = (() => {
  const KEY = {
    rooms: 'joakong.rooms.v1',
    bookings: 'joakong.bookings.v1',
    mine: 'joakong.mine.v1',
  };

  const KIND = {
    seat: { icon: '🪑', name: 'โต๊ะนักเรียน' },
    teacher: { icon: '🧑‍🏫', name: 'โต๊ะครู' },
    door: { icon: '🚪', name: 'ประตู' },
    board: { icon: '📋', name: 'กระดาน' },
  };

  /* ---------- localStorage ---------- */

  function read(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      if (!raw) return fallback;
      const val = JSON.parse(raw);
      return Array.isArray(fallback) && !Array.isArray(val) ? fallback : val;
    } catch (err) {
      console.warn('อ่านข้อมูลไม่สำเร็จ:', key, err);
      return fallback;
    }
  }

  function write(key, val) {
    try {
      localStorage.setItem(key, JSON.stringify(val));
      return true;
    } catch (err) {
      console.warn('บันทึกข้อมูลไม่สำเร็จ:', key, err);
      return false;
    }
  }

  /* ---------- ตัวช่วยทั่วไป ---------- */

  function uid(prefix) {
    return prefix + '-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 7);
  }

  function bookingCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    for (let i = 0; i < 4; i++) out += chars[Math.floor(Math.random() * chars.length)];
    return 'JT-' + out;
  }

  function todayISO() {
    const now = new Date();
    const off = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - off).toISOString().slice(0, 10);
  }

  function formatThaiDate(iso, style = 'long') {
    if (!iso) return '';
    const d = new Date(iso + 'T00:00:00');
    if (Number.isNaN(d.getTime())) return iso;
    try {
      return new Intl.DateTimeFormat('th-TH-u-ca-buddhist', {
        weekday: style === 'long' ? 'long' : undefined,
        day: 'numeric',
        month: style === 'long' ? 'long' : 'short',
        year: 'numeric',
      }).format(d);
    } catch (err) {
      return iso;
    }
  }

  /** ใช้เทียบว่าเป็นนักเรียนคนเดิมไหม (ตัดช่องว่าง + ไม่สนตัวพิมพ์) */
  function studentKey(name, klass) {
    return (String(name).trim() + '|' + String(klass).trim()).toLowerCase().replace(/\s+/g, ' ');
  }

  /* ---------- ห้องเรียน ---------- */

  function makeRoom(name, note) {
    return {
      id: uid('room'),
      name: String(name).trim(),
      note: String(note || '').trim(),
      cols: 8,
      rows: 6,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  function makeItem(kind, c, r) {
    return { id: uid('it'), kind, c, r, label: '' };
  }

  function getRooms() {
    return read(KEY.rooms, []);
  }

  function getRoom(id) {
    return getRooms().find((r) => r.id === id) || null;
  }

  /** เรียงเลขโต๊ะใหม่จากบนลงล่าง ซ้ายไปขวา */
  function renumberSeats(room) {
    room.items
      .filter((it) => it.kind === 'seat')
      .sort((a, b) => a.r - b.r || a.c - b.c)
      .forEach((it, i) => { it.label = String(i + 1); });
    return room;
  }

  function seatCount(room) {
    return room ? room.items.filter((it) => it.kind === 'seat').length : 0;
  }

  function saveRoom(room) {
    renumberSeats(room);
    room.updatedAt = new Date().toISOString();
    const rooms = getRooms();
    const i = rooms.findIndex((r) => r.id === room.id);
    if (i === -1) rooms.push(room); else rooms[i] = room;
    return write(KEY.rooms, rooms) ? room : null;
  }

  function deleteRoom(id) {
    write(KEY.rooms, getRooms().filter((r) => r.id !== id));
    write(KEY.bookings, getBookings().filter((b) => b.roomId !== id));
  }

  /* ---------- การจอง ---------- */

  function getBookings() {
    return read(KEY.bookings, []);
  }

  function bookingsFor(roomId, date) {
    return getBookings().filter((b) => b.roomId === roomId && b.date === date);
  }

  /** คืน { ok, booking } หรือ { ok:false, error:'ข้อความภาษาไทย' } */
  function book({ roomId, date, seatId, studentName, studentClass }) {
    const name = String(studentName || '').trim();
    const klass = String(studentClass || '').trim();

    if (!name) return { ok: false, error: 'กรอกชื่อ-นามสกุลด้วยนะ' };
    if (name.length > 60) return { ok: false, error: 'ชื่อยาวเกินไป (ไม่เกิน 60 ตัวอักษร)' };
    if (!klass) return { ok: false, error: 'กรอกชั้น/ห้องของเธอด้วยนะ' };
    if (klass.length > 30) return { ok: false, error: 'ชั้น/ห้องยาวเกินไป (ไม่เกิน 30 ตัวอักษร)' };
    if (!date) return { ok: false, error: 'เลือกวันที่ก่อนนะ' };

    const room = getRoom(roomId);
    if (!room) return { ok: false, error: 'ไม่พบห้องนี้แล้ว ลองเลือกห้องใหม่' };

    const seat = room.items.find((it) => it.id === seatId && it.kind === 'seat');
    if (!seat) return { ok: false, error: 'ที่นั่งนี้ถูกครูย้ายออกจากผังแล้ว' };

    const sameDay = bookingsFor(roomId, date);
    if (sameDay.some((b) => b.seatId === seatId)) {
      return { ok: false, error: 'มีคนโจ๊ะตัดหน้าไปแล้ว! ลองเลือกที่นั่งอื่น' };
    }

    const key = studentKey(name, klass);
    const already = sameDay.find((b) => studentKey(b.studentName, b.studentClass) === key);
    if (already) {
      return { ok: false, error: `ชื่อนี้จองโต๊ะ ${already.seatLabel} ของวันนี้ไว้แล้ว (1 คน 1 โต๊ะต่อวัน)` };
    }

    const booking = {
      id: uid('bk'),
      code: bookingCode(),
      roomId,
      roomName: room.name,
      date,
      seatId,
      seatLabel: seat.label,
      studentName: name,
      studentClass: klass,
      createdAt: new Date().toISOString(),
    };

    const all = getBookings();
    all.push(booking);
    if (!write(KEY.bookings, all)) {
      return { ok: false, error: 'บันทึกไม่สำเร็จ พื้นที่เก็บข้อมูลของเบราว์เซอร์อาจเต็ม' };
    }
    rememberMine(booking.id);
    return { ok: true, booking };
  }

  function cancelBooking(id) {
    const all = getBookings();
    const next = all.filter((b) => b.id !== id);
    if (next.length === all.length) return false;
    write(KEY.bookings, next);
    forgetMine(id);
    return true;
  }

  function clearBookings(roomId, date) {
    write(KEY.bookings, getBookings().filter((b) => !(b.roomId === roomId && b.date === date)));
  }

  /** การจองที่ชี้ไปยังโต๊ะซึ่งไม่มีอยู่ในผังแล้ว (เกิดตอนครูลบโต๊ะทิ้ง) */
  function orphanBookings(room) {
    const seatIds = new Set(room.items.filter((it) => it.kind === 'seat').map((it) => it.id));
    return getBookings().filter((b) => b.roomId === room.id && !seatIds.has(b.seatId));
  }

  function deleteBookings(ids) {
    const drop = new Set(ids);
    write(KEY.bookings, getBookings().filter((b) => !drop.has(b.id)));
    ids.forEach(forgetMine);
  }

  /** อัปเดตเลขโต๊ะ/ชื่อห้องที่เก็บไว้ในใบจอง ให้ตรงกับผังล่าสุด */
  function syncBookingLabels(roomId) {
    const room = getRoom(roomId);
    if (!room) return 0;
    const labelOf = new Map(room.items.filter((it) => it.kind === 'seat').map((it) => [it.id, it.label]));
    const all = getBookings();
    let updated = 0;
    all.forEach((b) => {
      if (b.roomId !== roomId) return;
      const label = labelOf.get(b.seatId);
      if (label !== undefined && b.seatLabel !== label) { b.seatLabel = label; updated++; }
      if (b.roomName !== room.name) { b.roomName = room.name; updated++; }
    });
    if (updated) write(KEY.bookings, all);
    return updated;
  }

  /* ---------- "การจองของฉัน" (เฉพาะเครื่องนี้) ---------- */

  function rememberMine(bookingId) {
    const mine = read(KEY.mine, []);
    if (!mine.includes(bookingId)) mine.push(bookingId);
    write(KEY.mine, mine);
  }

  function forgetMine(bookingId) {
    write(KEY.mine, read(KEY.mine, []).filter((id) => id !== bookingId));
  }

  function myBookingIds() {
    return read(KEY.mine, []);
  }

  /** การจองของฉันที่ยังไม่ผ่านไปแล้ว เรียงตามวันที่ */
  function myBookings() {
    const ids = new Set(myBookingIds());
    return getBookings()
      .filter((b) => ids.has(b.id))
      .sort((a, b) => a.date.localeCompare(b.date) || a.seatLabel.localeCompare(b.seatLabel, 'th', { numeric: true }));
  }

  /* ---------- นำข้อมูลออก/เข้า ---------- */

  function exportAll() {
    return {
      app: 'joakong',
      version: 1,
      exportedAt: new Date().toISOString(),
      rooms: getRooms(),
      bookings: getBookings(),
    };
  }

  function importAll(data) {
    if (!data || data.app !== 'joakong' || !Array.isArray(data.rooms) || !Array.isArray(data.bookings)) {
      return { ok: false, error: 'ไฟล์นี้ไม่ใช่ไฟล์ข้อมูลของโจ๊ะตอง' };
    }
    write(KEY.rooms, data.rooms);
    write(KEY.bookings, data.bookings);
    write(KEY.mine, []);
    return { ok: true, rooms: data.rooms.length, bookings: data.bookings.length };
  }

  function resetAll() {
    [KEY.rooms, KEY.bookings, KEY.mine].forEach((k) => localStorage.removeItem(k));
  }

  return {
    KIND,
    uid, todayISO, formatThaiDate, studentKey,
    makeRoom, makeItem, getRooms, getRoom, saveRoom, deleteRoom, renumberSeats, seatCount,
    getBookings, bookingsFor, book, cancelBooking, clearBookings,
    orphanBookings, deleteBookings, syncBookingLabels,
    myBookings, forgetMine,
    exportAll, importAll, resetAll,
  };
})();

/* ---------- ตัวช่วย UI ที่ใช้ร่วมกันทุกหน้า ---------- */

const UI = {
  el(sel, root = document) { return root.querySelector(sel); },
  els(sel, root = document) { return Array.from(root.querySelectorAll(sel)); },

  toast(message, type = '') {
    let area = document.querySelector('.toast-area');
    if (!area) {
      area = document.createElement('div');
      area.className = 'toast-area';
      area.setAttribute('role', 'status');
      area.setAttribute('aria-live', 'polite');
      document.body.appendChild(area);
    }
    const box = document.createElement('div');
    box.className = 'toast ' + type;
    box.textContent = message;
    area.appendChild(box);
    setTimeout(() => box.remove(), 3200);
  },

  /** วาดผังห้องลงใน container — ใช้ทั้งหน้านักเรียนและหน้าครู */
  renderGrid(container, room, renderItem) {
    container.innerHTML = '';
    container.style.gridTemplateColumns = `repeat(${room.cols}, minmax(34px, 1fr))`;
    for (let r = 0; r < room.rows; r++) {
      for (let c = 0; c < room.cols; c++) {
        const cell = document.createElement('div');
        cell.className = 'cell';
        cell.dataset.c = String(c);
        cell.dataset.r = String(r);
        const item = room.items.find((it) => it.c === c && it.r === r);
        if (item) {
          const node = renderItem(item);
          if (node) cell.appendChild(node);
        }
        container.appendChild(cell);
      }
    }
  },
};
