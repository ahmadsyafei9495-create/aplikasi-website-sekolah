const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');

if (navToggle && siteNav) {
  navToggle.addEventListener('click', () => {
    siteNav.classList.toggle('active');
    navToggle.setAttribute('aria-expanded', siteNav.classList.contains('active'));
  });
}

/* Data Siswa: CRUD + Import/Export */
const STORAGE_KEY = 'aplikasi_students_v1';
let students = [];

const studentsTbody = document.getElementById('studentsTbody');
const btnAddStudent = document.getElementById('btnAddStudent');
const studentModal = document.getElementById('studentModal');
const modalTitle = document.getElementById('modalTitle');
const studentForm = document.getElementById('studentForm');
const btnCancel = document.getElementById('btnCancel');
const fileImport = document.getElementById('fileImport');
const btnImport = document.getElementById('btnImport');
const btnExportExcel = document.getElementById('btnExportExcel');
const btnExportPDF = document.getElementById('btnExportPDF');
const btnPrint = document.getElementById('btnPrint');

function loadStudents() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    students = raw ? JSON.parse(raw) : [];
  } catch (e) {
    students = [];
  }
}

function saveStudents() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
}

function renderStudents() {
  if (!studentsTbody) return;
  studentsTbody.innerHTML = '';
  students.forEach((s, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${escapeHtml(s.name)}</td>
      <td>${escapeHtml(s.nis)}</td>
      <td>${escapeHtml(s.kelas)}</td>
      <td>
        <button class="button" data-action="edit" data-id="${s.id}">Edit</button>
        <button class="button" data-action="delete" data-id="${s.id}">Hapus</button>
      </td>
    `;
    studentsTbody.appendChild(tr);
  });
}

function escapeHtml(text) {
  if (!text) return '';
  return text.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
}

function openModal(mode = 'add', student = null) {
  modalTitle.textContent = mode === 'add' ? 'Tambah Siswa' : 'Edit Siswa';
  studentModal.setAttribute('aria-hidden', 'false');
  if (mode === 'edit' && student) {
    document.getElementById('studentId').value = student.id;
    document.getElementById('studentName').value = student.name;
    document.getElementById('studentNis').value = student.nis;
    document.getElementById('studentKelas').value = student.kelas;
  } else {
    studentForm.reset();
    document.getElementById('studentId').value = '';
  }
}

function closeModal() {
  studentModal.setAttribute('aria-hidden', 'true');
}

if (btnAddStudent) {
  btnAddStudent.addEventListener('click', () => openModal('add'));
}

if (btnCancel) {
  btnCancel.addEventListener('click', closeModal);
}

if (studentForm) {
  studentForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('studentId').value;
    const name = document.getElementById('studentName').value.trim();
    const nis = document.getElementById('studentNis').value.trim();
    const kelas = document.getElementById('studentKelas').value.trim();

    if (!name || !nis) {
      alert('Nama dan NIS wajib diisi.');
      return;
    }

    if (id) {
      const idx = students.findIndex(s => s.id === id);
      if (idx > -1) {
        students[idx].name = name;
        students[idx].nis = nis;
        students[idx].kelas = kelas;
      }
    } else {
      students.push({ id: String(Date.now()), name, nis, kelas });
    }

    saveStudents();
    renderStudents();
    closeModal();
  });
}

if (studentsTbody) {
  studentsTbody.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const action = btn.dataset.action;
    const id = btn.dataset.id;
    if (action === 'edit') {
      const s = students.find(x => x.id === id);
      if (s) openModal('edit', s);
    } else if (action === 'delete') {
      if (confirm('Hapus data siswa ini?')) {
        students = students.filter(x => x.id !== id);
        saveStudents();
        renderStudents();
      }
    }
  });
}

// Import Excel/CSV using SheetJS
if (btnImport && fileImport) {
  btnImport.addEventListener('click', () => fileImport.click());

  fileImport.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = evt.target.result;
      const workbook = XLSX.read(data, { type: 'binary' });
      const firstSheet = workbook.SheetNames[0];
      const ws = workbook.Sheets[firstSheet];
      const json = XLSX.utils.sheet_to_json(ws, { defval: '' });
      // Expect columns: name, nis, kelas (case-insensitive)
      json.forEach(row => {
        const name = row.name || row.Nama || row.nama || '';
        const nis = row.nis || row.NIS || row.Nis || '';
        const kelas = row.kelas || row.Kelas || row.kelas || '';
        if (name && nis) {
          students.push({ id: String(Date.now()) + Math.random().toString(36).slice(2,7), name: String(name), nis: String(nis), kelas: String(kelas) });
        }
      });
      saveStudents();
      renderStudents();
      fileImport.value = '';
      alert('Import selesai.');
    };
    // read as binary string for SheetJS compatibility
    reader.readAsBinaryString(file);
  });
}

// Export to Excel
if (btnExportExcel) {
  btnExportExcel.addEventListener('click', () => {
    if (typeof XLSX === 'undefined') {
      alert('Library XLSX tidak tersedia.');
      return;
    }
    const ws = XLSX.utils.json_to_sheet(students.map((s, i) => ({ No: i + 1, Nama: s.name, NIS: s.nis, Kelas: s.kelas })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DataSiswa');
    XLSX.writeFile(wb, 'data_siswa.xlsx');
  });
}

// Export to PDF (print-friendly) using html2pdf
if (btnExportPDF) {
  btnExportPDF.addEventListener('click', () => {
    const el = document.querySelector('.table-wrap');
    if (!el) return alert('Tidak ada data untuk diekspor');
    if (typeof html2pdf === 'undefined') {
      alert('Library html2pdf tidak tersedia. Gunakan fungsi Cetak sebagai alternatif.');
      return;
    }
    const opt = { margin: 0.5, filename: 'data_siswa.pdf', html2canvas: { scale: 2 } };
    html2pdf().set(opt).from(el).save();
  });
}

if (btnPrint) {
  btnPrint.addEventListener('click', () => {
    window.print();
  });
}

// Initialize
loadStudents();
renderStudents();

const contactForm = document.querySelector('.contact-form');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    alert('Terima kasih! Pesan Anda telah dikirim.');
    contactForm.reset();
  });
}

// Sidebar toggle
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');

if (sidebarToggle && sidebar) {
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('collapsed');
    sidebarToggle.setAttribute('aria-expanded', !sidebar.classList.contains('collapsed'));
  });
}
