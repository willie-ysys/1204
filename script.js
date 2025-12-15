// 感覺統合樂園 – 純 JS 版本（糖果計分 + 結果分析圖表）

document.addEventListener("DOMContentLoaded", () => {
  const nameInput = document.getElementById("name-input");

  const scoreInputs = {
    game1: document.getElementById("score-game1"),
    game2: document.getElementById("score-game2"),
    game3: document.getElementById("score-game3"),
    game4: document.getElementById("score-game4"),
  };

  const displayName = document.getElementById("display-name");
  const displayGame1 = document.getElementById("display-game1-score");
  const displayGame2 = document.getElementById("display-game2-score");
  const displayGame3 = document.getElementById("display-game3-score");
  const displayGame4 = document.getElementById("display-game4-score");

  const displayTotalBox = document.getElementById("display-total-score");
  const displayTotalCount = document.getElementById("display-total-count");

  const btnReset = document.getElementById("btn-reset");
  const btnFinish = document.getElementById("btn-finish");

  // ✅ 結果分析（圖表）相關 DOM
  const btnResult = document.getElementById("btn-result");
  const modal = document.getElementById("result-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");

  const scores = {
    game1: 0,
    game2: 0,
    game3: 0,
    game4: 0,
  };

  // 產生糖果圖示（0~3顆）
  function renderCandies(n) {
    if (n <= 0) return `<span class="candy-count-text">0 顆</span>`;
    let html = "";
    for (let i = 0; i < n; i++) {
      html += `<img class="candy-icon" src="photo/candy.jpg" alt="糖果" />`;
    }
    html += `<span class="candy-count-text">${n} 顆</span>`;
    return html;
  }

  function updateScoreCard() {
    const name = nameInput.value.trim();
    displayName.textContent = name || "—";

    displayGame1.innerHTML = renderCandies(scores.game1);
    displayGame2.innerHTML = renderCandies(scores.game2);
    displayGame3.innerHTML = renderCandies(scores.game3);
    displayGame4.innerHTML = renderCandies(scores.game4);

    const total = scores.game1 + scores.game2 + scores.game3 + scores.game4;

    if (total <= 0) {
      displayTotalBox.innerHTML = `<span class="candy-count-text">0 顆</span>`;
    } else {
      let imgs = "";
      for (let i = 0; i < total; i++) {
        imgs += `<img class="candy-icon" src="photo/candy.jpg" alt="糖果" />`;
      }
      displayTotalBox.innerHTML = imgs;
    }

    if (displayTotalCount) {
      displayTotalCount.textContent = total + " 顆";
    }
  }

  function setScore(gameKey, value) {
    const num = parseInt(value, 10);

    let fixed = isNaN(num) ? 0 : num;
    if (fixed < 0) fixed = 0;
    if (fixed > 3) fixed = 3;

    scores[gameKey] = fixed;
    scoreInputs[gameKey].value = fixed === 0 ? "" : fixed;

    updateScoreCard();
  }

  nameInput.addEventListener("input", updateScoreCard);

  scoreInputs.game1.addEventListener("input", (e) => setScore("game1", e.target.value));
  scoreInputs.game2.addEventListener("input", (e) => setScore("game2", e.target.value));
  scoreInputs.game3.addEventListener("input", (e) => setScore("game3", e.target.value));
  scoreInputs.game4.addEventListener("input", (e) => setScore("game4", e.target.value));

  btnReset.addEventListener("click", () => {
    scores.game1 = 0;
    scores.game2 = 0;
    scores.game3 = 0;
    scores.game4 = 0;

    scoreInputs.game1.value = "";
    scoreInputs.game2.value = "";
    scoreInputs.game3.value = "";
    scoreInputs.game4.value = "";

    updateScoreCard();
  });

  btnFinish.addEventListener("click", () => {
    const name = nameInput.value.trim() || "小朋友";
    const total = scores.game1 + scores.game2 + scores.game3 + scores.game4;
    alert(name + " 的總糖果是 " + total + " 顆！🍬🎉");
  });

  // ==========================================================
  // ✅ 結果分析：四覺分數（依糖果換算 0–100）+ Chart.js
  // ==========================================================
  const SENSES = ["視覺", "聽覺", "前庭覺", "本體覺"];

  // 四個遊戲對應到的覺（你前面統整版）
  const GAME_SENSES = {
    game1: ["視覺", "聽覺", "本體覺"],      // 小丑打鼓台
    game2: ["視覺", "前庭覺", "本體覺"],    // 樂園神射手
    game3: ["視覺", "前庭覺"],              // 螢火蟲冒險
    game4: ["視覺", "前庭覺", "本體覺"],    // 小丑躲避球
  };

  function computeSenseScores() {
    const senseCandy = {};
    const senseMaxCandy = {};
    const senseScore = {};

    SENSES.forEach((s) => {
      senseCandy[s] = 0;
      senseMaxCandy[s] = 0;
      senseScore[s] = 0;
    });

    // maxCandy = (有訓練到該覺的遊戲數) * 3
    for (const sense of SENSES) {
      const gamesCount = Object.keys(GAME_SENSES).filter((g) =>
        GAME_SENSES[g].includes(sense)
      ).length;
      senseMaxCandy[sense] = gamesCount * 3;
    }

    // 分配糖果到各覺（每個遊戲的糖果會加到它對應的所有覺）
    for (const gameKey of Object.keys(GAME_SENSES)) {
      const candy = scores[gameKey] || 0; // 0~3
      for (const sense of GAME_SENSES[gameKey]) {
        senseCandy[sense] += candy;
      }
    }

    // 換算成 0~100 分
    for (const sense of SENSES) {
      const maxC = senseMaxCandy[sense] || 1;
      const score = (senseCandy[sense] / maxC) * 100;
      senseScore[sense] = Math.round(score);
    }

    return { senseCandy, senseMaxCandy, senseScore };
  }

  let senseChart = null;

  function renderSenseChart() {
    const { senseCandy, senseMaxCandy, senseScore } = computeSenseScores();

    // 文字區塊（讓老師看得懂計分）
    const textEl = document.getElementById("senseScoresText");
    if (textEl) {
      textEl.innerHTML = SENSES.map(
        (s) => `${s}：${senseScore[s]} 分（${senseCandy[s]} / ${senseMaxCandy[s]} 顆糖果）`
      ).join("<br/>");
    }

    const canvas = document.getElementById("senseChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (senseChart) senseChart.destroy();

    // Chart.js 必須已載入（index.html 先載 chart.js 再載 script.js）
    if (typeof Chart === "undefined") {
      console.error("Chart.js 未載入：請確認 index.html 有先引入 chart.umd.min.js");
      return;
    }

    senseChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: SENSES,
        datasets: [
          {
            label: "分數 (0-100)",
            data: SENSES.map((s) => senseScore[s]),
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: { beginAtZero: true, max: 100 },
        },
      },
    });
  }

  function openModal() {
    if (!modal) return;
    modal.classList.remove("hidden");
    renderSenseChart();
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.add("hidden");
  }

  // 點「📊 結果分析」
  if (btnResult) btnResult.addEventListener("click", openModal);

  // 點 ✕ 關閉
  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);

  // 點黑色背景也關閉
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  updateScoreCard();
});
