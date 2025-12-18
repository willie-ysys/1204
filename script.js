/***********************
 * 0) Firebase 初始化（v8 CDN 版）
 ***********************/
const firebaseConfig = {
  apiKey: "AIzaSyCQESWfGgzKF9Zmurly8CbN4MEVPHZ1e4U",
  authDomain: "sense-integration-4882f.firebaseapp.com",
  projectId: "sense-integration-4882f",
  storageBucket: "sense-integration-4882f.firebasestorage.app",
  messagingSenderId: "302510787578",
  appId: "1:302510787578:web:ca3ad4a3d8e3a066577243",
  measurementId: "G-HYK09Z0970",
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

/***********************
 * ✅ 0.5) 計分規則（核心）
 * 一個遊戲 → 對應「多個覺」（2~3 個都可以），不分權重
 ***********************/
const GAME_TO_SENSES = {
  game1: ["視覺", "聽覺", "本體覺"],
  game2: ["視覺", "本體覺", "前庭覺"],
  game3: ["視覺", "本體覺", "前庭覺"],
  game4: ["前庭覺", "本體覺"],
};

const ALL_SENSES = ["視覺", "聽覺", "前庭覺", "本體覺"];

/***********************
 * 1) DOM
 ***********************/
const nameInput = document.getElementById("name-input"); // 你若之後刪掉這塊也沒差，程式都有防呆
const displayNameEl = document.getElementById("display-name");

const scoreInputs = {
  game1: document.getElementById("score-game1"),
  game2: document.getElementById("score-game2"),
  game3: document.getElementById("score-game3"),
  game4: document.getElementById("score-game4"),
};

const displayGameScores = {
  game1: document.getElementById("display-game1-score"),
  game2: document.getElementById("display-game2-score"),
  game3: document.getElementById("display-game3-score"),
  game4: document.getElementById("display-game4-score"),
};

const totalCandyBox = document.getElementById("display-total-score");
const totalCandyCount = document.getElementById("display-total-count");

const btnReset = document.getElementById("btn-reset");
const btnResult = document.getElementById("btn-result");

const resultModal = document.getElementById("result-modal");
const btnCloseModal = document.getElementById("btn-close-modal");
const senseScoresText = document.getElementById("senseScoresText");
const btnSaveRecord = document.getElementById("btn-save-record");

// ✅ 最強/加強方向（你 HTML 新加的）
const bestTitleEl = document.getElementById("best-title");
const bestDescEl = document.getElementById("best-desc");
const needTitleEl = document.getElementById("need-title");
const needDescEl = document.getElementById("need-desc");

// ✅ 小朋友姓名登入
const kidNameLoginInput = document.getElementById("kid-name-login");
const btnLogin = document.getElementById("btn-login");
const btnLogout = document.getElementById("btn-logout");
const authStatus = document.getElementById("auth-status");

// ✅ 趨勢
const trendCanvas = document.getElementById("trendChart");
const historyTable = document.getElementById("historyTable");

/***********************
 * 2) 全域狀態：唯一姓名來源
 ***********************/
let currentKidName = "";
function setKidName(name) {
  currentKidName = (name || "").trim();
  if (nameInput) nameInput.value = currentKidName;
  if (displayNameEl) displayNameEl.textContent = currentKidName || "—";
  if (authStatus) authStatus.textContent = currentKidName || "尚未輸入姓名";
  if (kidNameLoginInput) kidNameLoginInput.value = currentKidName;
}

/***********************
 * 3) 小工具
 ***********************/
function clampInt(v, min, max) {
  const n = parseInt(v, 10);
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ✅ 顯示用：YYYY-MM-DD HH:mm
function formatDateTime(ts) {
  if (!ts) return "—";
  let d = null;

  // Firestore Timestamp
  if (typeof ts.toDate === "function") d = ts.toDate();
  // JS Date
  else if (ts instanceof Date) d = ts;
  // number
  else if (typeof ts === "number") d = new Date(ts);
  // string
  else if (typeof ts === "string") d = new Date(ts);

  if (!d || isNaN(d.getTime())) return "—";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function getKidName() {
  return (currentKidName || "").trim() || "小朋友";
}

function getScores() {
  const g1 = clampInt(scoreInputs.game1?.value, 0, 3);
  const g2 = clampInt(scoreInputs.game2?.value, 0, 3);
  const g3 = clampInt(scoreInputs.game3?.value, 0, 3);
  const g4 = clampInt(scoreInputs.game4?.value, 0, 3);
  return { game1: g1, game2: g2, game3: g3, game4: g4 };
}

function sumCandy(scores) {
  return scores.game1 + scores.game2 + scores.game3 + scores.game4;
}

/***********************
 * ✅ 4) 核心：遊戲→多覺，不分權重；各覺各自分母換算 0~100
 ***********************/
function calcSenseCandiesFromGames(gameScores) {
  const candies = { 視覺: 0, 聽覺: 0, 前庭覺: 0, 本體覺: 0 };

  Object.keys(GAME_TO_SENSES).forEach((gk) => {
    const c = typeof gameScores[gk] === "number" ? gameScores[gk] : 0; // 0~3
    const senses = GAME_TO_SENSES[gk] || [];
    senses.forEach((s) => {
      if (candies[s] == null) candies[s] = 0;
      candies[s] += c;
    });
  });

  return candies; // 糖果數
}

function calcSenseScores100(gameScores) {
  const candies = calcSenseCandiesFromGames(gameScores);

  // 每個覺被多少遊戲涵蓋
  const senseGameCount = { 視覺: 0, 聽覺: 0, 前庭覺: 0, 本體覺: 0 };
  Object.values(GAME_TO_SENSES).forEach((arr) => {
    (arr || []).forEach((s) => {
      if (senseGameCount[s] == null) senseGameCount[s] = 0;
      senseGameCount[s] += 1;
    });
  });

  const scores100 = {};
  ALL_SENSES.forEach((s) => {
    const maxCandy = (senseGameCount[s] || 0) * 3;
    const raw = maxCandy > 0 ? (candies[s] / maxCandy) * 100 : 0;
    scores100[s] = Math.round(raw);
  });

  return { scores100, candies, senseGameCount };
}

/***********************
 * 5) UI 更新：成績卡 & 糖果顯示
 ***********************/
function renderScoreCard() {
  const scores = getScores();
  const total = sumCandy(scores);

  if (displayNameEl) displayNameEl.textContent = currentKidName ? getKidName() : "—";
  if (displayGameScores.game1) displayGameScores.game1.textContent = scores.game1;
  if (displayGameScores.game2) displayGameScores.game2.textContent = scores.game2;
  if (displayGameScores.game3) displayGameScores.game3.textContent = scores.game3;
  if (displayGameScores.game4) displayGameScores.game4.textContent = scores.game4;

  if (totalCandyBox) {
    totalCandyBox.innerHTML = "";
    const maxCandyToRender = 12;
    for (let i = 0; i < maxCandyToRender; i++) {
      const span = document.createElement("span");
      span.textContent = i < total ? "🍬" : "▫️";
      span.style.fontSize = "18px";
      span.style.marginRight = "2px";
      totalCandyBox.appendChild(span);
    }
  }

  if (totalCandyCount) totalCandyCount.textContent = `${total} 顆`;
}

/***********************
 * 6) Chart.js：今日圖表 + 最強/最弱建議
 ***********************/
let senseChartInstance = null;

function setAnalysisBoxes(scores100) {
  const entries = ALL_SENSES.map((s) => [s, scores100[s] ?? 0]);
  if (!entries.length) return;

  let best = entries[0];
  let need = entries[0];
  for (const e of entries) {
    if (e[1] > best[1]) best = e;
    if (e[1] < need[1]) need = e;
  }

  const [bestSense, bestVal] = best;
  const [needSense, needVal] = need;

  if (bestTitleEl) bestTitleEl.textContent = `今日最強能力：${bestSense}（${bestVal}分）`;
  if (bestDescEl) bestDescEl.textContent = `太棒了！這個能力今天表現最突出，可以保持手感～✨`;

  if (needTitleEl) needTitleEl.textContent = `今日加強方向：${needSense}（${needVal}分）`;

  const tips = {
    視覺: "建議多做「找不同、追視、配對顏色/形狀」的小任務，提升視覺辨識與專注。💗",
    聽覺: "可以做「節奏模仿、聽指令做動作、分辨大小聲」的小挑戰，提升聽覺辨識。🎵",
    前庭覺: "可以做「平衡、轉身、跳躍後停住」的小遊戲，提升平衡與身體控制。🌀",
    本體覺: "可以做「推拉搬、深壓、投接球」的小任務，提升肌肉感覺與力量控制。💪",
  };
  if (needDescEl) needDescEl.textContent = tips[needSense] || "可以多安排相關的小任務來加強唷！💖";
}

function renderSenseChartAndText() {
  const gameScores = getScores();
  const { scores100, candies, senseGameCount } = calcSenseScores100(gameScores);

  const labels = ALL_SENSES;
  const data = labels.map((k) => scores100[k] ?? 0);

  if (senseScoresText) {
    senseScoresText.innerHTML = `
      <div style="margin-top: 10px; line-height:1.6;">
        ${labels
          .map((k) => {
            const maxCandy = (senseGameCount[k] || 0) * 3;
            return `<div>• ${k}：<b>${scores100[k]}</b> 分（糖果 ${candies[k]}/${maxCandy}）</div>`;
          })
          .join("")}
        <div style="margin-top: 8px; opacity: 0.8;">
          ※ 計分方式：該覺糖果總和 ÷ (涵蓋遊戲數 × 3) × 100
        </div>
      </div>
    `;
  }

  setAnalysisBoxes(scores100);

  const canvas = document.getElementById("senseChart");
  if (!canvas) return { scores100, totalCandy: sumCandy(gameScores), kidName: getKidName() };

  const ctx = canvas.getContext("2d");

  if (canvas.parentElement) {
    canvas.parentElement.style.height = "260px";
  }

  if (senseChartInstance) senseChartInstance.destroy();

  senseChartInstance = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "分數（0-100）",
          data,
          borderWidth: 1,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true, min: 0, max: 100 },
      },
      plugins: {
        legend: { display: true },
        title: { display: false },
      },
    },
  });

  return { scores100, totalCandy: sumCandy(gameScores), kidName: getKidName() };
}

/***********************
 * 7) Firebase Auth：匿名登入
 ***********************/
async function ensureAnonLogin() {
  const user = auth.currentUser;
  if (user) return user;
  const cred = await auth.signInAnonymously();
  return cred.user;
}

auth.onAuthStateChanged(async (user) => {
  if (user) {
    if (btnLogout) btnLogout.style.display = "";
    if (currentKidName) {
      await loadAndRenderHistory();
    } else if (historyTable) {
      historyTable.innerHTML = `<p style="text-align:center;">請先在上方輸入小朋友姓名，再顯示歷史紀錄與趨勢圖。</p>`;
      if (trendChartInstance) {
        trendChartInstance.destroy();
        trendChartInstance = null;
      }
    }
  } else {
    if (btnLogout) btnLogout.style.display = "none";
    if (historyTable) historyTable.innerHTML = `<p style="text-align:center;">尚未登入（系統會在你輸入姓名後自動登入）。</p>`;
    if (trendChartInstance) {
      trendChartInstance.destroy();
      trendChartInstance = null;
    }
  }
});

/***********************
 * 8) Firestore：以姓名為主（✅改成「同一天可多筆」）
 * kids/{kidName}
 *   - records/{autoId}: { createdAt, date, kidName, totalCandy, scores }
 ***********************/
function kidDocRef(kidName) {
  const safe = encodeURIComponent(kidName);
  return db.collection("kids").doc(safe);
}

async function saveTodayRecord() {
  const kidName = getKidName();
  if (!currentKidName) {
    alert("請先在上方輸入小朋友姓名，再紀錄喔！");
    return;
  }

  await ensureAnonLogin();

  const { scores100, totalCandy } = renderSenseChartAndText();
  const dateStr = todayKey();

  await kidDocRef(kidName).set(
    {
      kidName,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  // ✅ 關鍵：不要再用 doc(date) 覆蓋，而是每次新增一筆
  await kidDocRef(kidName)
    .collection("records")
    .add({
      createdAt: firebase.firestore.FieldValue.serverTimestamp(), // 排序用
      date: dateStr, // 顯示/分組用（但不是 key）
      kidName,
      totalCandy,
      scores: scores100, // 0~100
    });

  alert("✅ 已新增一筆成績（同一天可紀錄多次）！");
  await loadAndRenderHistory();
}

async function loadHistory() {
  if (!currentKidName) return [];
  await ensureAnonLogin();

  const kidName = getKidName();
  const snap = await kidDocRef(kidName)
    .collection("records")
    .orderBy("createdAt", "asc")
    .get();

  return snap.docs.map((d) => ({ docId: d.id, ...d.data() }));
}

/***********************
 * 9) 趨勢圖（折線圖）
 ***********************/
let trendChartInstance = null;

function safeScore(obj, key) {
  if (!obj || typeof obj !== "object") return 0;
  const v = obj[key];
  return typeof v === "number" ? v : 0;
}

async function loadAndRenderHistory() {
  const history = await loadHistory();

  if (!historyTable || !trendCanvas) return;

  if (!history.length) {
    historyTable.innerHTML = `<p style="text-align:center;">尚無紀錄。去按「📌 紀錄今天成績」就會出現趨勢圖！</p>`;
    if (trendChartInstance) {
      trendChartInstance.destroy();
      trendChartInstance = null;
    }
    return;
  }

  // ✅ labels 改成「日期 + 時間」，同一天多筆才看得懂
  const labels = history.map((r) => {
    const dt = formatDateTime(r.createdAt);
    // 若 createdAt 還沒回來（極少數剛寫入立刻讀），用 date 補一下
    return dt !== "—" ? dt : (r.date || "—");
  });

  const visual = history.map((r) => safeScore(r.scores, "視覺"));
  const auditory = history.map((r) => safeScore(r.scores, "聽覺"));
  const vestib = history.map((r) => safeScore(r.scores, "前庭覺"));
  const proprio = history.map((r) => safeScore(r.scores, "本體覺"));

  const ctx = trendCanvas.getContext("2d");
  if (trendChartInstance) trendChartInstance.destroy();

  trendChartInstance = new Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        { label: "視覺", data: visual, tension: 0.25 },
        { label: "聽覺", data: auditory, tension: 0.25 },
        { label: "前庭覺", data: vestib, tension: 0.25 },
        { label: "本體覺", data: proprio, tension: 0.25 },
      ],
    },
    options: {
      responsive: true,
      plugins: { legend: { position: "bottom" } },
      scales: { y: { beginAtZero: true, min: 0, max: 100 } },
    },
  });

  const rows = history
    .slice()
    .reverse()
    .map((r) => {
      const s = r.scores || {};
      const when = formatDateTime(r.createdAt);
      const showTime = when !== "—" ? when : (r.date || "—");
      return `
        <tr>
          <td style="padding:6px 8px;">${showTime}</td>
          <td style="padding:6px 8px; text-align:center;">${safeScore(s, "視覺")}</td>
          <td style="padding:6px 8px; text-align:center;">${safeScore(s, "聽覺")}</td>
          <td style="padding:6px 8px; text-align:center;">${safeScore(s, "前庭覺")}</td>
          <td style="padding:6px 8px; text-align:center;">${safeScore(s, "本體覺")}</td>
        </tr>
      `;
    })
    .join("");

  historyTable.innerHTML = `
    <div style="overflow:auto; margin-top: 8px;">
      <p style="text-align:center; margin: 0 0 8px 0;">
        目前檢視：<b>${getKidName()}</b> 的歷史紀錄（同一天可多筆）
      </p>
      <table style="width:100%; border-collapse: collapse; background: rgba(255,255,255,0.55); border-radius: 12px;">
        <thead>
          <tr>
            <th style="padding:8px; text-align:left;">日期時間</th>
            <th style="padding:8px;">視覺</th>
            <th style="padding:8px;">聽覺</th>
            <th style="padding:8px;">前庭覺</th>
            <th style="padding:8px;">本體覺</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;
}

/***********************
 * 10) 事件綁定
 ***********************/
function openModal() {
  if (resultModal) resultModal.classList.remove("hidden");
}
function closeModal() {
  if (resultModal) resultModal.classList.add("hidden");
}

function resetAnalysisBoxes() {
  if (bestTitleEl) bestTitleEl.textContent = "今天還沒開始計分～";
  if (bestDescEl) bestDescEl.textContent = "快去挑戰遊戲拿糖果吧！🍬✨";
  if (needTitleEl) needTitleEl.textContent = "先完成任一關卡計分";
  if (needDescEl) needDescEl.textContent = "成果分析就會給你最需要加強的能力喔！💖";
}

function wireEvents() {
  if (nameInput) {
    nameInput.addEventListener("input", () => {
      const v = (nameInput.value || "").trim();
      setKidName(v);
      renderScoreCard();
      if (v) loadAndRenderHistory();
    });
  }

  Object.values(scoreInputs).forEach((inp) => {
    if (!inp) return;
    inp.addEventListener("input", renderScoreCard);
    inp.addEventListener("change", renderScoreCard);
  });

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      setKidName("");
      if (scoreInputs.game1) scoreInputs.game1.value = "";
      if (scoreInputs.game2) scoreInputs.game2.value = "";
      if (scoreInputs.game3) scoreInputs.game3.value = "";
      if (scoreInputs.game4) scoreInputs.game4.value = "";

      renderScoreCard();
      closeModal();
      resetAnalysisBoxes();

      if (historyTable) {
        historyTable.innerHTML = `<p style="text-align:center;">請先在上方輸入小朋友姓名，再顯示歷史紀錄與趨勢圖。</p>`;
      }
      if (trendChartInstance) {
        trendChartInstance.destroy();
        trendChartInstance = null;
      }
    });
  }

  if (btnResult) {
    btnResult.addEventListener("click", () => {
      renderScoreCard();
      renderSenseChartAndText();
      openModal();
    });
  }

  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);

  if (resultModal) {
    resultModal.addEventListener("click", (e) => {
      if (e.target === resultModal) closeModal();
    });
  }

  if (btnSaveRecord) {
    btnSaveRecord.addEventListener("click", async () => {
      await saveTodayRecord();
    });
  }

  if (btnLogin) {
    btnLogin.addEventListener("click", async () => {
      const name = (kidNameLoginInput?.value || "").trim();
      if (!name) {
        alert("請輸入小朋友姓名");
        return;
      }
      setKidName(name);
      await ensureAnonLogin();
      alert(`✅ 歡迎 ${getKidName()} 進入樂園！`);
      await loadAndRenderHistory();
    });
  }

  if (btnLogout) {
    btnLogout.addEventListener("click", async () => {
      setKidName("");
      if (kidNameLoginInput) kidNameLoginInput.focus();

      try {
        await auth.signOut();
      } catch (_) {}

      alert("已切換姓名（可輸入新的小朋友姓名）");
      resetAnalysisBoxes();

      if (historyTable) {
        historyTable.innerHTML = `<p style="text-align:center;">請先在上方輸入小朋友姓名，再顯示歷史紀錄與趨勢圖。</p>`;
      }
      if (trendChartInstance) {
        trendChartInstance.destroy();
        trendChartInstance = null;
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  setKidName("");
  renderScoreCard();
  resetAnalysisBoxes();
  wireEvents();
});
