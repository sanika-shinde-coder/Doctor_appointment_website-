// ===== Helpers =====
function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}
function setData(key, val) {
  localStorage.setItem(key, JSON.stringify(val));
}

// ===== Login Handler =====
function login() {
  const role = document.getElementById("userType").value;
  if (!role) {
    alert("Please select a role.");
    return;
  }

  if (role === "admin") {
    const pwd = prompt("Enter Admin Password:");
    if (pwd === "admin123") {
      window.location.href = "admin.html";
    } else {
      alert("Incorrect admin password.");
    }
  } else if (role === "doctor") {
    const pwd = prompt("Enter Doctor Access Password:");
    if (pwd === "doctor123") {
      window.location.href = "doctor.html";
    } else {
      alert("Incorrect doctor password.");
    }
  } else if (role === "patient") {
    window.location.href = "patient.html";
  } else if (role === "appointments") {
    window.location.href = "appointments.html";
  }
}

// ===== Admin Side =====
let selectedDates = [],
  editingIndex = null;
function addDate() {
  const d = document.getElementById("availableDates").value;
  if (!d) return;
  if (!selectedDates.includes(d)) selectedDates.push(d);
  updateDateChips();
}
function updateDateChips() {
  const c = document.getElementById("dateList");
  c.innerHTML = "";
  selectedDates.forEach((d) => {
    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = d;
    c.appendChild(chip);
  });
}
function addOrUpdateDoctor() {
  const n = document.getElementById("docName").value.trim();
  const t = document.getElementById("docType").value.trim();
  // Collect all checked time slots
  const slotCheckboxes = document.querySelectorAll(
    "#slotCheckboxes input[type='checkbox']:checked"
  );
  const slots = Array.from(slotCheckboxes).map((cb) => cb.value);

  if (!n || !t || !selectedDates.length || !slots.length) {
    alert("Please fill all doctor details and select time slots.");
    return;
  }

  let docs = getData("doctors");
  if (editingIndex !== null) {
    docs[editingIndex] = { name: n, type: t, dates: [...selectedDates], slots };
    editingIndex = null;
  } else {
    docs.push({ name: n, type: t, dates: [...selectedDates], slots });
  }

  setData("doctors", docs);
  clearForm();
  displayDoctors();
}

function clearForm() {
  document.getElementById("docName").value = "";
  document.getElementById("docType").value = "";
  document.getElementById("availableSlots").value = "";
  selectedDates = [];
  updateDateChips();
}
function displayDoctors() {
  const list = document.getElementById("doctorList");
  if (!list) return;
  const docs = getData("doctors");
  list.innerHTML = "";
  docs.forEach((doc, i) => {
    const li = document.createElement("li");
    li.innerHTML = `<b>${doc.name}</b> (${doc.type})<br>Dates: ${doc.dates.join(
      ", "
    )}<br>Slots: ${doc.slots.join(", ")}
    <div><button onclick="editDoctor(${i})">Edit</button><button onclick="deleteDoctor(${i})">Delete</button></div>`;
    list.appendChild(li);
  });
  displayAppointments();
}
function editDoctor(i) {
  const d = getData("doctors")[i];
  document.getElementById("docName").value = d.name;
  document.getElementById("docType").value = d.type;

  selectedDates = [...d.dates];
  updateDateChips();

  // Reset checkboxes first
  document
    .querySelectorAll("#slotCheckboxes input[type='checkbox']")
    .forEach((cb) => {
      cb.checked = d.slots.includes(cb.value);
    });

  editingIndex = i;
}

function deleteDoctor(i) {
  const docs = getData("doctors");
  docs.splice(i, 1);
  setData("doctors", docs);
  displayDoctors();
}

function displayAppointments() {
  const list = document.getElementById("appointmentList");
  if (!list) return;

  const appts = getData("appointments");
  list.innerHTML = "";

  appts.forEach((a, i) => {
    const li = document.createElement("li");
    li.className = "appointment-item";
    li.innerHTML = `
      <div class="appointment-text">
        <b>${a.patientName}</b> → Dr. ${a.doctorName} (${a.type})<br>
        ${a.date} at ${a.slot}
      </div>
      <button class="cancel-btn" onclick="cancelAppointment(${i})">Cancel</button>
    `;
    list.appendChild(li);
  });
}

function cancelAppointment(i) {
  const a = getData("appointments");
  a.splice(i, 1);
  setData("appointments", a);
  displayAppointments();
}

// ===== Patient Booking =====
function populateDoctors() {
  const types = [...new Set(getData("doctors").map((d) => d.type))];
  const tSel = document.getElementById("typeSelect");
  if (!tSel) return;
  tSel.innerHTML = `<option value="">Select Type</option>`;
  types.forEach(
    (t) => (tSel.innerHTML += `<option value="${t}">${t}</option>`)
  );
  document.getElementById(
    "doctorSelect"
  ).innerHTML = `<option value="">Select Doctor</option>`;
  document.getElementById(
    "dateSelect"
  ).innerHTML = `<option value="">Select Date</option>`;
  document.getElementById(
    "slotSelect"
  ).innerHTML = `<option value="">Select Slot</option>`;
}
function populateDates() {
  const type = document.getElementById("typeSelect").value;
  const dSel = document.getElementById("doctorSelect");
  const docs = getData("doctors").filter((d) => d.type === type);
  dSel.innerHTML = `<option value="">Select Doctor</option>`;
  docs.forEach(
    (d) => (dSel.innerHTML += `<option value="${d.name}">${d.name}</option>`)
  );
  document.getElementById(
    "dateSelect"
  ).innerHTML = `<option value="">Select Date</option>`;
  document.getElementById(
    "slotSelect"
  ).innerHTML = `<option value="">Select Slot</option>`;
}
function populateSlots() {
  const dName = document.getElementById("doctorSelect").value;
  const doc = getData("doctors").find((d) => d.name === dName);
  const dateSel = document.getElementById("dateSelect");
  const slotSel = document.getElementById("slotSelect");
  if (!doc) return;
  dateSel.innerHTML = `<option value="">Select Date</option>`;
  doc.dates.forEach(
    (d) => (dateSel.innerHTML += `<option value="${d}">${d}</option>`)
  );
  slotSel.innerHTML = `<option value="">Select Slot</option>`;
  doc.slots.forEach(
    (s) => (slotSel.innerHTML += `<option value="${s}">${s}</option>`)
  );
}
function scheduleAppointment() {
  const patientName =
    localStorage.getItem("currentPatient") ||
    document.getElementById("patientNameInput")?.value.trim();
  const type = document.getElementById("typeSelect").value;
  const doctorName = document.getElementById("doctorSelect").value;
  const date = document.getElementById("dateSelect").value;
  const slot = document.getElementById("slotSelect").value;
  if (!patientName || !type || !doctorName || !date || !slot) {
    alert("Please fill all fields.");
    return;
  }
  const appts = getData("appointments");
  appts.push({ patientName, type, doctorName, date, slot });
  setData("appointments", appts);
  alert(`Appointment scheduled for ${patientName}`);
  populateDoctors();
}

// ===== Doctor View =====
function displayAppointmentsForDoctor() {
  const list = document.getElementById("doctorAppointmentList");
  const appts = getData("appointments");
  list.innerHTML = "";
  if (!appts.length) {
    list.innerHTML = "<li>No appointments yet.</li>";
    return;
  }
  appts.forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.date} - ${a.slot} → ${a.patientName} with Dr. ${a.doctorName}`;
    list.appendChild(li);
  });
}

// ===== Patient Appointment List =====
function displayAppointmentsForPatient() {
  const list = document.getElementById("patientAppointmentList");
  const appts = getData("appointments");
  list.innerHTML = "";

  if (!appts.length) {
    list.innerHTML = "<li>No appointments yet.</li>";
    return;
  }

  appts.forEach((a, i) => {
    const li = document.createElement("li");
    li.className = "appointment-item"; // Flex container
    li.innerHTML = `
      <div class="appointment-text">
        ${a.date} - ${a.slot} with Dr. ${a.doctorName} (${a.type})<br>
        Patient: <b>${a.patientName}</b>
      </div>
      <button class="cancel-btn" onclick="cancelAppointmentFromPatient(${i})">Cancel</button>
    `;
    list.appendChild(li);
  });
}

function cancelAppointmentFromPatient(i) {
  const appts = getData("appointments");
  appts.splice(i, 1);
  setData("appointments", appts);
  displayAppointmentsForPatient();
}

// ===== Init =====
document.addEventListener("DOMContentLoaded", () => {
  displayDoctors();
  populateDoctors();
});
function displayDoctorList() {
  const listContainer = document.getElementById("doctorListContainer");
  const doctors = getData("doctors");
  listContainer.innerHTML = "";

  if (!doctors.length) {
    listContainer.innerHTML = "<p>No doctors available.</p>";
    return;
  }

  doctors.forEach((doc, index) => {
    const row = document.createElement("div");
    row.className = "doctor-row";
    row.innerHTML = `
      <span class="doctor-name">${doc.name} (${doc.type})</span>
      <button class="view-btn" onclick="viewDoctorAppointments('${doc.name}')">View Appointments</button>
    `;
    listContainer.appendChild(row);
  });
}

function viewDoctorAppointments(doctorName) {
  const apptContainer = document.getElementById("doctorAppointments");
  const appointments = getData("appointments").filter(
    (a) => a.doctorName === doctorName
  );

  apptContainer.innerHTML = `<h3>Appointments for Dr. ${doctorName}</h3>`;

  if (!appointments.length) {
    apptContainer.innerHTML += "<p>No appointments found for this doctor.</p>";
    return;
  }

  const ul = document.createElement("ul");
  appointments.forEach((a) => {
    const li = document.createElement("li");
    li.textContent = `${a.date} at ${a.slot} — Patient: ${a.patientName}`;
    ul.appendChild(li);
  });

  apptContainer.appendChild(ul);
}
