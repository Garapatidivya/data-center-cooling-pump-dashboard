"use strict";

/* =========================
   DASHBOARD CONFIGURATION
========================= */

let highLimit = 14;
let lowLimit = 4;

let temperature = 8.5;
let selectedPump = "Pump 1";

let temperatures = [
  6.8, 6.2, 6.5, 7.1, 7.8, 9.0, 9.6, 9.8,
  8.9, 10.2, 9.3, 8.1, 7.8, 8.9, 8.7, 8.9,
  9.5, 10.2, 10.8, 11.6, 10.7, 9.4, 8.8, 8.5,
  7.9, 7.1, 6.6, 6.9, 6.8, 6.7, 6.8, 7.4, 7.8, 8.1
];

let historyData = [];
let toastTimeout;

/* =========================
   SHORTCUTS
========================= */

const $ = (id) => document.getElementById(id);

function pad(number) {
  return String(number).padStart(2, "0");
}

function getTimeString(date = new Date()) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function getDateTimeString(date = new Date()) {
  return `${pad(date.getDate())} ${date.toLocaleString("en-US", {
    month: "short"
  })} ${date.getFullYear()} ${getTimeString(date)}`;
}

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.add("show");

  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.remove("show");
  }, 2800);
}

/* =========================
   HEADER DATE AND TIME
========================= */

function updateClock() {
  const now = new Date();

  $("dateTime").textContent =
    `${pad(now.getDate())} ${now.toLocaleString("en-US", {
      month: "short"
    })} ${now.getFullYear()}  ${now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit"
    })}`;

  $("lastReceived").textContent = getDateTimeString(now);
}

updateClock();
setInterval(updateClock, 1000);

/* =========================
   SIDEBAR COLLAPSE / OPEN
========================= */

$("menuToggle").addEventListener("click", () => {
  document.body.classList.toggle("sidebar-collapsed");
});

/* =========================
   NOTIFICATION DROPDOWN
========================= */

const notificationButton = $("notificationButton");
const notificationMenu = $("notificationMenu");
const profileButton = $("profileButton");
const profileMenu = $("profileMenu");

notificationButton.addEventListener("click", (event) => {
  event.stopPropagation();

  notificationMenu.classList.toggle("open");
  profileMenu.classList.remove("open");
});

profileButton.addEventListener("click", (event) => {
  event.stopPropagation();

  profileMenu.classList.toggle("open");
  notificationMenu.classList.remove("open");
});

notificationMenu.addEventListener("click", (event) => {
  event.stopPropagation();
});

profileMenu.addEventListener("click", (event) => {
  event.stopPropagation();
});

document.addEventListener("click", () => {
  notificationMenu.classList.remove("open");
  profileMenu.classList.remove("open");
});

$("clearNotifications").addEventListener("click", () => {
  $("notificationCount").style.display = "none";
  notificationMenu.querySelectorAll(".notification-item").forEach((item) => {
    item.style.display = "none";
  });

  showToast("Notifications cleared.");
});

$("profileDetailsButton").addEventListener("click", () => {
  profileMenu.classList.remove("open");
  showToast("Operator profile: System Operator · Monitoring Access");
});

/* =========================
   SIDEBAR NAVIGATION
========================= */

const navLinks = document.querySelectorAll(".nav-link");

navLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const targetId = link.dataset.section;
    const target = $(targetId);

    if (target) {
      event.preventDefault();

      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });

      history.replaceState(null, "", `#${targetId}`);
    }

    navLinks.forEach((navLink) => navLink.classList.remove("active"));
    link.classList.add("active");

    // On smaller screens, close the expanded sidebar after selection.
    if (window.innerWidth <= 1000) {
      document.body.classList.remove("sidebar-collapsed");
    }
  });
});

/* =========================
   PUMP SELECTION
========================= */

$("pumpSelect").addEventListener("change", (event) => {
  selectedPump = event.target.value;

  const pumpNumber = selectedPump.replace("Pump ", "");
  $("pumpId").textContent = `PUMP-0${pumpNumber}`;

  // Different demo values for each pump.
  if (selectedPump === "Pump 1") {
    temperature = 8.5;
  } else if (selectedPump === "Pump 2") {
    temperature = 9.1;
  } else {
    temperature = 7.8;
  }

  updateDashboard();
  addHistoryRecord();
  renderHistoryTable();

  showToast(`${selectedPump} selected.`);
});

/* =========================
   TEMPERATURE STATUS
========================= */

function getTemperatureStatus(value) {
  if (value > highLimit) {
    return "High";
  }

  if (value < lowLimit) {
    return "Low";
  }

  return "Normal";
}

function updateDashboard() {
  const status = getTemperatureStatus(temperature);

  $("currentTemperature").textContent = `${temperature.toFixed(1)} °C`;
  $("inletTemperature").textContent = `${temperature.toFixed(1)} °C`;
  $("outletTemperature").textContent = `${(temperature + 1.7).toFixed(1)} °C`;
  $("sensorReading1").textContent = `${temperature.toFixed(1)} °C`;
  $("sensorReading2").textContent = `${(temperature + 0.1).toFixed(1)} °C`;

  const stateElement = $("temperatureState");
  stateElement.textContent = status;

  const temperatureCard = $("temperature-card");
  const pill = temperatureCard.querySelector(".status-pill");

  temperatureCard.classList.remove("green-card", "red-card");
  pill.classList.remove("green-pill", "red-pill");

  if (status === "Normal") {
    temperatureCard.classList.add("green-card");
    pill.classList.add("green-pill");
  } else {
    temperatureCard.classList.add("red-card");
    pill.classList.add("red-pill");
  }

  updateAlarmCount();
}

/* =========================
   ACTIVE ALARMS
========================= */

function updateAlarmCount() {
  const activeRows = document.querySelectorAll(
    '#alarmTable tbody tr[data-active="true"]'
  );

  const activeCount = activeRows.length;

  $("activeAlarmCount").textContent = activeCount;
  $("activeAlarmText").textContent =
    `${activeCount} Active`;

  if (activeCount === 0) {
    $("notificationCount").style.display = "none";
  } else {
    $("notificationCount").style.display = "inline-block";
    $("notificationCount").textContent = activeCount;
  }
}

document.querySelectorAll(".acknowledge-button").forEach((button) => {
  button.addEventListener("click", () => {
    const row = button.closest("tr");
    const statusCell = row.querySelector(".table-status");

    row.dataset.active = "false";

    statusCell.textContent = "Acknowledged";
    statusCell.classList.remove("status-active");
    statusCell.classList.add("status-acknowledged");

    button.textContent = "Acknowledged";
    button.disabled = true;
    button.style.opacity = "0.65";
    button.style.cursor = "default";

    updateAlarmCount();
    showToast("Alarm acknowledged.");
  });
});

// Initial active alarm state.
document.querySelectorAll("#alarmTable tbody tr").forEach((row) => {
  row.dataset.active = "true";
});

/* =========================
   TEMPERATURE GRAPH
========================= */

const chartCanvas = $("temperatureChart");
const chartContext = chartCanvas.getContext("2d");

function drawTemperatureChart() {
  const rect = chartCanvas.getBoundingClientRect();

  if (!rect.width || !rect.height) {
    return;
  }

  const pixelRatio = window.devicePixelRatio || 1;

  chartCanvas.width = Math.round(rect.width * pixelRatio);
  chartCanvas.height = Math.round(rect.height * pixelRatio);

  chartContext.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

  const ctx = chartContext;
  const width = rect.width;
  const height = rect.height;

  ctx.clearRect(0, 0, width, height);

  const margin = {
    top: 8,
    right: 8,
    bottom: 28,
    left: 39
  };

  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const chartMin = 0;
  const chartMax = 20;

  const x = (index) =>
    margin.left + (index / (temperatures.length - 1)) * plotWidth;

  const y = (value) =>
    margin.top +
    ((chartMax - value) / (chartMax - chartMin)) * plotHeight;

  // White chart background.
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(margin.left, margin.top, plotWidth, plotHeight);

  // Horizontal grid lines and Y-axis labels.
  ctx.font = "12px Arial";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  for (let value = 0; value <= 20; value += 5) {
    const yPosition = y(value);

    ctx.beginPath();
    ctx.strokeStyle = "#e2edf7";
    ctx.lineWidth = 1;
    ctx.moveTo(margin.left, yPosition);
    ctx.lineTo(width - margin.right, yPosition);
    ctx.stroke();

    ctx.fillStyle = "#203550";
    ctx.fillText(String(value), margin.left - 8, yPosition);
  }

  // Vertical grid lines and time labels.
  const timeLabels = [
    "00:00", "02:00", "04:00", "06:00", "08:00",
    "10:00", "12:00", "14:00", "16:00", "18:00",
    "20:00", "22:00", "24:00"
  ];

  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.font = "11px Arial";

  timeLabels.forEach((label, index) => {
    const xPosition =
      margin.left + (index / (timeLabels.length - 1)) * plotWidth;

    ctx.beginPath();
    ctx.strokeStyle = "#e8f0f8";
    ctx.lineWidth = 1;
    ctx.moveTo(xPosition, margin.top);
    ctx.lineTo(xPosition, margin.top + plotHeight);
    ctx.stroke();

    ctx.fillStyle = "#203550";
    ctx.fillText(label, xPosition, margin.top + plotHeight + 8);
  });

  // High and low threshold lines.
  function drawLimit(value, color) {
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.moveTo(margin.left, y(value));
    ctx.lineTo(width - margin.right, y(value));
    ctx.stroke();
    ctx.setLineDash([]);
  }

  drawLimit(highLimit, "#f12b2b");
  drawLimit(lowLimit, "#16b96b");

  // Temperature line.
  ctx.beginPath();
  ctx.strokeStyle = "#0878ff";
  ctx.lineWidth = 2.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  temperatures.forEach((value, index) => {
    if (index === 0) {
      ctx.moveTo(x(index), y(value));
    } else {
      ctx.lineTo(x(index), y(value));
    }
  });

  ctx.stroke();

  // Temperature data points.
  temperatures.forEach((value, index) => {
    ctx.beginPath();

    if (value > highLimit) {
      ctx.fillStyle = "#ff9800";
    } else {
      ctx.fillStyle = "#0878ff";
    }

    ctx.arc(x(index), y(value), 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 1.2;
    ctx.stroke();
  });

  // Axis borders.
  ctx.beginPath();
  ctx.strokeStyle = "#8ea5bb";
  ctx.lineWidth = 1;
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, margin.top + plotHeight);
  ctx.lineTo(width - margin.right, margin.top + plotHeight);
  ctx.stroke();
}

function addNewTemperature() {
  // Small demo fluctuation, not a real pump sensor reading.
  const change = (Math.random() - 0.5) * 0.7;

  temperature = Math.max(
    2,
    Math.min(16, temperature + change)
  );

  temperature = Math.round(temperature * 10) / 10;

  temperatures.push(temperature);

  if (temperatures.length > 34) {
    temperatures.shift();
  }

  updateDashboard();
  drawTemperatureChart();
  addHistoryRecord();
  renderHistoryTable();
}

window.addEventListener("resize", drawTemperatureChart);

/* =========================
   HISTORICAL DATA
========================= */

function addHistoryRecord() {
  const now = new Date();

  historyData.unshift({
    timestamp: now,
    pump: selectedPump,
    temperature: temperature,
    pumpStatus: "Running",
    sensorStatus: "Healthy"
  });

  if (historyData.length > 250) {
    historyData.length = 250;
  }
}

function makeInitialHistory() {
  historyData = [];

  const now = new Date();

  for (let i = 0; i < 20; i++) {
    const timestamp = new Date(now.getTime() - i * 60 * 1000);

    const value = i === 4
      ? 12.5
      : Math.round((8.5 - i * 0.08 + Math.random() * 0.3) * 10) / 10;

    historyData.push({
      timestamp,
      pump: "Pump 1",
      temperature: value,
      pumpStatus: "Running",
      sensorStatus: "Healthy"
    });
  }
}

function formatHistoryTimestamp(date) {
  return `${pad(date.getDate())} ${date.toLocaleString("en-US", {
    month: "short"
  })} ${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}:00`;
}

function renderHistoryTable() {
  const tbody = $("historyTableBody");
  const hours = Number($("timeRange").value);
  const selectedDate = $("historyDate").value;

  let filtered = historyData.filter((record) => {
    const age = Date.now() - record.timestamp.getTime();
    const withinRange = age <= hours * 60 * 60 * 1000;

    const dateMatches =
      !selectedDate ||
      `${record.timestamp.getFullYear()}-${pad(record.timestamp.getMonth() + 1)}-${pad(record.timestamp.getDate())}` === selectedDate;

    return withinRange && dateMatches;
  });

  // If the chosen date/range has no rows, show available recent demo records.
  if (filtered.length === 0) {
    filtered = historyData.slice(0, 5);
  }

  tbody.innerHTML = "";

  filtered.slice(0, 12).forEach((record) => {
    const row = document.createElement("tr");

    const timeCell = document.createElement("td");
    timeCell.textContent = formatHistoryTimestamp(record.timestamp);

    const pumpCell = document.createElement("td");
    pumpCell.textContent = record.pump;

    const tempCell = document.createElement("td");
    tempCell.textContent = record.temperature.toFixed(1);

    if (record.temperature > highLimit) {
      tempCell.classList.add("temperature-high");
    }

    const pumpStatusCell = document.createElement("td");
    pumpStatusCell.innerHTML =
      '<span class="green-dot"></span> ' + record.pumpStatus;

    const sensorStatusCell = document.createElement("td");
    sensorStatusCell.innerHTML =
      '<span class="green-dot"></span> ' + record.sensorStatus;

    row.append(
      timeCell,
      pumpCell,
      tempCell,
      pumpStatusCell,
      sensorStatusCell
    );

    tbody.appendChild(row);
  });
}

$("timeRange").addEventListener("change", renderHistoryTable);

$("historyDate").addEventListener("change", renderHistoryTable);

/* =========================
   CSV EXPORT
========================= */

function exportCSV() {
  const rows = [
    [
      "Timestamp",
      "Pump",
      "Temperature (C)",
      "Pump Status",
      "Sensor Status"
    ]
  ];

  historyData.forEach((record) => {
    rows.push([
      formatHistoryTimestamp(record.timestamp),
      record.pump,
      record.temperature.toFixed(1),
      record.pumpStatus,
      record.sensorStatus
    ]);
  });

  const csv = rows
    .map((row) =>
      row.map((value) => {
        const text = String(value).replace(/"/g, '""');
        return `"${text}"`;
      }).join(",")
    )
    .join("\r\n");

  const blob = new Blob([csv], {
    type: "text/csv;charset=utf-8;"
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "cooling-pump-temperature-history.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);

  showToast("CSV file exported.");
}

$("exportButton").addEventListener("click", exportCSV);
$("reportExportButton").addEventListener("click", exportCSV);

/* =========================
   SETTINGS
========================= */

$("saveSettingsButton").addEventListener("click", () => {
  const newHigh = Number($("highLimitInput").value);
  const newLow = Number($("lowLimitInput").value);

  if (
    !Number.isFinite(newHigh) ||
    !Number.isFinite(newLow) ||
    newLow < 0 ||
    newHigh <= newLow
  ) {
    showToast("Enter valid limits: high must be greater than low.");
    return;
  }

  highLimit = newHigh;
  lowLimit = newLow;

  drawTemperatureChart();
  updateDashboard();
  renderHistoryTable();

  showToast("Demo temperature limits updated.");
});

/* =========================
   START DASHBOARD
========================= */

function startDashboard() {
  // Set today's date in the date selector.
  const today = new Date();

  $("historyDate").value =
    `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  makeInitialHistory();
  addHistoryRecord();

  updateDashboard();
  renderHistoryTable();

  // Wait until the browser has laid out the canvas before drawing.
  requestAnimationFrame(() => {
    drawTemperatureChart();
    requestAnimationFrame(drawTemperatureChart);
  });

  // Demo temperature refresh every 3 seconds.
  setInterval(addNewTemperature, 3000);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startDashboard);
} else {
  startDashboard();
}