const STORAGE_KEY = 'admission_follow_up_enquiries';
const THEME_KEY = 'admission_follow_up_theme';

const state = {
  enquiries: [],
  filterText: '',
  filterStatus: 'All',
  unsavedChanges: false,
  storageFailed: false,
};

const elements = {
  enquiryForm: document.getElementById('enquiryForm'),
  tableBody: document.getElementById('tableBody'),
  searchInput: document.getElementById('searchInput'),
  statusFilter: document.getElementById('statusFilter'),
  totalEnquiries: document.getElementById('totalEnquiries'),
  pendingFollowUps: document.getElementById('pendingFollowUps'),
  confirmedAdmissions: document.getElementById('confirmedAdmissions'),
  tableSummary: document.getElementById('tableSummary'),
  themeToggle: document.getElementById('themeToggle'),
  toastContainer: document.getElementById('toastContainer'),
  saveEnquiryBtn: document.getElementById('saveEnquiryBtn'),
  exportBtn: document.getElementById('exportBtn'),
  autoSaveIndicator: document.getElementById('autoSaveIndicator'),
};

const formFields = {
  enquiryId: document.getElementById('enquiryId'),
  parentName: document.getElementById('parentName'),
  studentName: document.getElementById('studentName'),
  mobileNumber: document.getElementById('mobileNumber'),
  classApplying: document.getElementById('classApplying'),
  followUpDate: document.getElementById('followUpDate'),
  status: document.getElementById('status'),
  notes: document.getElementById('notes'),
};

const statusOptions = [
  'New Enquiry',
  'Follow-Up Pending',
  'Interested',
  'Admission Confirmed',
  'Not Interested',
];

function getStoredEnquiries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('localStorage error', error);
    state.storageFailed = true;
    return [];
  }
}

function saveStoredEnquiries() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.enquiries));
    state.storageFailed = false;
    updateAutoSaveIndicator(true);
    return true;
  } catch (error) {
    console.error('localStorage error', error);
    state.storageFailed = true;
    updateAutoSaveIndicator(false);
    return false;
  }
}

function updateAutoSaveIndicator(enabled) {
  if (!elements.autoSaveIndicator) {
    elements.autoSaveIndicator = document.getElementById('autoSaveIndicator');
  }
  if (!elements.autoSaveIndicator) return;
  if (enabled) {
    elements.autoSaveIndicator.textContent = 'Data auto-saved locally';
    elements.autoSaveIndicator.classList.remove('text-danger');
    elements.autoSaveIndicator.classList.add('text-success');
  } else {
    elements.autoSaveIndicator.textContent = 'Local storage unavailable. Export before leaving.';
    elements.autoSaveIndicator.classList.remove('text-success');
    elements.autoSaveIndicator.classList.add('text-danger');
  }
}

function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY) || 'light';
  if (theme === 'dark') document.body.classList.add('dark-mode');
  updateThemeButton();
}

function updateThemeButton() {
  const isDark = document.body.classList.contains('dark-mode');
  elements.themeToggle.innerHTML = isDark
    ? '<i class="bi bi-sun-fill"></i> Light Mode'
    : '<i class="bi bi-moon-fill"></i> Dark Mode';
}

function toggleTheme() {
  document.body.classList.toggle('dark-mode');
  const theme = document.body.classList.contains('dark-mode') ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, theme);
  updateThemeButton();
}

function generateId() {
  return `enq-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
}

function formatDate(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

function setToast(message, type = 'success') {
  const toastEl = document.getElementById('liveToast');
  const toastMessage = document.getElementById('toastMessage');

  if (!toastEl || !toastMessage) return;

  toastMessage.innerText = message;
  toastEl.className = `toast align-items-center text-bg-${type} border-0`;

  const toast = new bootstrap.Toast(toastEl);
  toast.show();
}

function getFilteredEnquiries() {
  return state.enquiries.filter((enquiry) => {
    const search = state.filterText.trim().toLowerCase();
    const matchesText = !search || [enquiry.parentName, enquiry.studentName, enquiry.mobileNumber, enquiry.classApplying, enquiry.status]
      .some((value) => value.toLowerCase().includes(search));
    const matchesStatus = state.filterStatus === 'All' || enquiry.status === state.filterStatus;
    return matchesText && matchesStatus;
  });
}

function exportToExcel() {
  if (!state.enquiries.length) {
    setToast('No data available to export.', 'warning');
    return;
  }

  const headers = [
    'Parent Name',
    'Student Name',
    'Phone Number',
    'Class Applying',
    'Follow Up Date',
    'Status',
    'Notes'
  ];

  const rows = state.enquiries.map(item => [
    item.parentName,
    item.studentName,
    item.mobileNumber,
    item.classApplying,
    item.followUpDate,
    item.status,
    item.notes
  ]);

  let csvContent = headers.join(',') + '\n';

  rows.forEach(row => {
    csvContent += row.map(value =>
      `"${(value || '').toString().replace(/"/g, '""')}"`
    ).join(',') + '\n';
  });

  const blob = new Blob([csvContent], {
    type: 'text/csv;charset=utf-8;'
  });

  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute(
    'download',
    `admission_followup_${Date.now()}.csv`
  );

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  setToast('Excel export completed.', 'success');
}

function getStatusMenu(id) {
  return statusOptions.map((option) => `
    <li><button class="dropdown-item" type="button" onclick="changeStatus('${id}', '${option}')">${option}</button></li>`).join('');
}

function renderTable() {
  if (!elements.tableBody) {
    elements.tableBody = document.querySelector('#tableBody');
  }
  const enquiries = getFilteredEnquiries();
  elements.tableBody.innerHTML = '';
  if (!enquiries.length) {
    elements.tableBody.innerHTML = `
      <tr class="empty-state">
        <td colspan="7">
          <div class="py-5 text-center">
            <i class="bi bi-clipboard-data mb-3"></i>
            <p class="mb-1 fw-semibold">No enquiries added yet</p>
            <p class="mb-0 text-muted">Use the form to add your first admission enquiry.</p>
          </div>
        </td>
      </tr>`;
    elements.tableSummary.textContent = 'No enquiries added yet.';
    return;
  }
  enquiries.forEach((enquiry) => {
    elements.tableBody.insertAdjacentHTML('beforeend', `
      <tr>
        <td>${enquiry.parentName}</td>
        <td>${enquiry.studentName}</td>
        <td>${enquiry.mobileNumber}</td>
        <td>${enquiry.classApplying}</td>
        <td>${formatDate(enquiry.followUpDate)}</td>
        <td>
          <div id="statusView-${enquiry.id}">
            <span class="status-chip ${enquiry.status.replace(/\s/g, '-').toLowerCase()}">${enquiry.status}</span>
          </div>
          <div id="statusEdit-${enquiry.id}" class="status-edit">
            <select class="form-select form-select-sm" id="statusSelect-${enquiry.id}">
              ${statusOptions.map(opt => `<option value="${opt}" ${opt===enquiry.status? 'selected':''}>${opt}</option>`).join('')}
            </select>
            <button class="btn btn-sm btn-success" onclick="saveStatus('${enquiry.id}')">Save</button>
            <button class="btn btn-sm btn-outline-secondary" onclick="cancelStatusEdit('${enquiry.id}')">Cancel</button>
          </div>
        </td>
        <td class="text-center actions-col">
          <button class="btn btn-sm btn-outline-primary me-2" onclick="enableStatusEdit('${enquiry.id}')">Edit</button>
          <button class="btn btn-sm btn-outline-danger" onclick="deleteEntry('${enquiry.id}')">Delete</button>
        </td>
      </tr>`);
  });
  elements.tableSummary.textContent = `${enquiries.length} enquiry${enquiries.length === 1 ? '' : 'ies'} found.`;
}

function updateMetrics() {
  const total = state.enquiries.length;
  const pending = state.enquiries.filter(
    (item) => item.status === 'Follow-Up Pending'
  ).length;
  const confirmed = state.enquiries.filter(
    (item) => item.status === 'Admission Confirmed'
  ).length;

  document.getElementById('totalEnquiries').innerText = total;
  document.getElementById('pendingFollowUps').innerText = pending;
  document.getElementById('confirmedAdmissions').innerText = confirmed;

  console.log('Metrics Updated', {
    total,
    pending,
    confirmed,
  });
}

function saveEnquiry(event) {
  event.preventDefault();
  const values = {
    id: formFields.enquiryId.value || generateId(),
    parentName: formFields.parentName.value.trim(),
    studentName: formFields.studentName.value.trim(),
    mobileNumber: formFields.mobileNumber.value.trim(),
    classApplying: formFields.classApplying.value.trim(),
    followUpDate: formFields.followUpDate.value,
    status: formFields.status.value,
    notes: formFields.notes.value.trim(),
  };
  if (!values.parentName || !values.studentName || !values.mobileNumber) {
    setToast('Please fill parent, student, and phone fields.', 'warning');
    return;
  }
  const index = state.enquiries.findIndex((item) => item.id === values.id);
  if (index > -1) {
    state.enquiries[index] = values;
  } else {
    state.enquiries.unshift(values);
  }
  if (!saveStoredEnquiries()) {
    setToast('Could not save locally. Please export before leaving.', 'danger');
    return;
  }
  setToast(index > -1 ? 'Enquiry updated successfully' : 'Enquiry saved successfully', 'success');
  refreshDisplay();
  resetForm();
}

function resetForm() {
  elements.enquiryForm.reset();
  formFields.enquiryId.value = '';
  formFields.status.value = 'New Enquiry';
  elements.saveEnquiryBtn.textContent = 'Save';
  state.unsavedChanges = false;
}

function editEntry(id) {
  const enquiry = state.enquiries.find((item) => item.id === id);
  if (!enquiry) return;
  formFields.enquiryId.value = enquiry.id;
  formFields.parentName.value = enquiry.parentName;
  formFields.studentName.value = enquiry.studentName;
  formFields.mobileNumber.value = enquiry.mobileNumber;
  formFields.classApplying.value = enquiry.classApplying;
  formFields.followUpDate.value = enquiry.followUpDate;
  formFields.status.value = enquiry.status;
  formFields.notes.value = enquiry.notes;
  elements.saveEnquiryBtn.textContent = 'Update';
  state.unsavedChanges = false;
  setToast('Editing enquiry. Save to update.', 'info');
}

function deleteEntry(id) {
  if (!window.confirm('Are you sure you want to delete this enquiry? This action cannot be undone.')) return;
  state.enquiries = state.enquiries.filter((item) => item.id !== id);
  saveStoredEnquiries();
  setToast('Enquiry deleted successfully', 'danger');
  refreshDisplay();
}
function enableStatusEdit(id) {
  const view = document.getElementById(`statusView-${id}`);
  const edit = document.getElementById(`statusEdit-${id}`);
  if (!view || !edit) return;
  view.classList.add('d-none');
  edit.classList.add('show');
}

function cancelStatusEdit(id) {
  const view = document.getElementById(`statusView-${id}`);
  const edit = document.getElementById(`statusEdit-${id}`);
  if (!view || !edit) return;
  edit.classList.remove('show');
  view.classList.remove('d-none');
}

function saveStatus(id) {
  const enquiry = state.enquiries.find((item) => item.id === id);
  if (!enquiry) return;
  const select = document.getElementById(`statusSelect-${id}`);
  if (!select) return;
  const newStatus = select.value;
  enquiry.status = newStatus;
  saveStoredEnquiries();
  setToast('Status updated successfully', 'success');
  refreshDisplay();
}

function whatsAppParent(id) {
  const enquiry = state.enquiries.find((item) => item.id === id);
  if (!enquiry) return;
  const phone = enquiry.mobileNumber.replace(/\D/g, '');
  const message = `Hello ${enquiry.parentName}, this is a follow-up regarding admission enquiry for ${enquiry.studentName} in ${enquiry.classApplying || 'your chosen class'} at our school. Please let us know if you need any assistance.`;
  const url = `https://wa.me/${encodeURIComponent(phone)}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

function refreshDisplay() {
  renderTable();
  updateMetrics();
}

function initializeEvents() {
  elements.enquiryForm.addEventListener('submit', saveEnquiry);
  elements.enquiryForm.addEventListener('input', () => {
    state.unsavedChanges = true;
  });
  document.getElementById('resetForm').addEventListener('click', resetForm);
  elements.searchInput.addEventListener('input', (event) => {
    state.filterText = event.target.value;
    renderTable();
  });
  elements.statusFilter.addEventListener('change', (event) => {
    state.filterStatus = event.target.value;
    renderTable();
  });
  elements.themeToggle.addEventListener('click', toggleTheme);
  if (elements.exportBtn) {
    elements.exportBtn.addEventListener('click', exportToExcel);
  }
}

function initialize() {
  loadTheme();
  state.enquiries = getStoredEnquiries();
  initializeEvents();
  updateAutoSaveIndicator(!state.storageFailed);
  refreshDisplay();
}

window.editEntry = editEntry;
window.deleteEntry = deleteEntry;
window.whatsAppParent = whatsAppParent;
window.enableStatusEdit = enableStatusEdit;
window.cancelStatusEdit = cancelStatusEdit;
window.saveStatus = saveStatus;
window.exportToExcel = exportToExcel;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}
