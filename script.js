// 感覺統合樂園 – 純 JS 版本（糖果計分 + 結果分析圖表）
// ✅ 最強/最弱左右兩區塊 + 分數列表在圖表下方（可直接覆蓋 script.js）

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
    const name = (nameInput?.value || "").trim();
    if (displayName) displayName.textContent = name || "—";

    if (displayGame1) displayGame1.innerHTML = renderCandies(scores.game1);
    if (displayGame2) displayGame2.innerHTML = renderCandies(scores.game2);
    if (displayGame3) displayGame3.innerHTML = renderCandies(scores.game3);
    if (displayGame4) displayGame4.innerHTML = renderCandies(scores.game4);

    const total = scores.game1 + scores.game2 + scores.game3 + scores.game4;

    if (displayTotalBox) {
      if (total <= 0) {
        displayTotalBox.innerHTML = `<span class="candy-count-text">0 顆</span>`;
      } else {
        let imgs = "";
        for (let i = 0; i < total; i++) {
          imgs += `<img class="candy-icon" src="photo/candy.jpg" alt="糖果" />`;
        }
        displayTotalBox.innerHTML = imgs;
      }
    }

    if (displayTotalCount) {
      displayTotalCount.textContent = total + " 顆";
    }
  }

  function setScore(gameKey, value) {
    const num = parseInt(value, 10);

    let fixed = Number.isNaN(num) ? 0 : num;
    if (fixed < 0) fixed = 0;
    if (fixed > 3) fixed = 3;

    scores[gameKey] = fixed;

    if (scoreInputs[gameKey]) {
      scoreInputs[gameKey].value = fixed === 0 ? "" : String(fixed);
    }

    updateScoreCard();
  }

  if (nameInput) nameInput.addEventListener("input", updateScoreCard);

  if (scoreInputs.game1) scoreInputs.game1.addEventListener("input", (e) => setScore("game1", e.target.value));
  if (scoreInputs.game2) scoreInputs.game2.addEventListener("input", (e) => setScore("game2", e.target.value));
  if (scoreInputs.game3) scoreInputs.game3.addEventListener("input", (e) => setScore("game3", e.target.value));
  if (scoreInputs.game4) scoreInputs.game4.addEventListener("input", (e) => setScore("game4", e.target.value));

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      scores.game1 = 0;
      scores.game2 = 0;
      scores.game3 = 0;
      scores.game4 = 0;

      if (scoreInputs.game1) scoreInputs.game1.value = "";
      if (scoreInputs.game2) scoreInputs.game2.value = "";
      if (scoreInputs.game3) scoreInputs.game3.value = "";
      if (scoreInputs.game4) scoreInputs.game4.value = "";

      updateScoreCard();
    });
  }

  // ==========================================================
  // ✅ 結果分析：四覺分數（依糖果換算 0–100）+ Chart.js
  // ==========================================================
  const SENSES = ["視覺", "聽覺", "前庭覺", "本體覺"];

  // 四個遊戲對應到的覺
  const GAME_SENSES = {
    game1: ["視覺", "聽覺", "本體覺"],      // 小丑打鼓台
    game2: ["視覺", "前庭覺", "本體覺"],    // 樂園神射手
    game3: ["視覺", "前庭覺"],              // 螢火蟲冒險
    game4: ["視覺", "前庭覺", "本體覺"],    // 小丑躲避球
  };

  const GAME_NAME = {
    game1: "🥁 小丑打鼓台",
    game2: "🏀 樂園神射手",
    game3: "💡 螢火蟲冒險",
    game4: "🏐 小丑躲避球",
  };

  const SENSE_DESC = {
    視覺: "你的眼睛超會抓重點，觀察力一級棒！👀✨",
    聽覺: "你很會聽節奏跟指令，耳朵超靈敏！👂🎵",
    前庭覺: "你的平衡感很厲害，轉一轉也不怕暈！🌀🤸",
    本體覺: "你超會控制身體，動作協調又穩！💪🧠",
  };

  const EXTRA_TRAIN = {
    視覺: ["找不同／拼圖", "迷宮／追視練習", "丟接球（看球落點）"],
    聽覺: ["節拍跟拍手", "聽指令做動作", "音樂停止遊戲"],
    前庭覺: ["走直線／平衡木", "原地轉圈後定點", "跳格子／跳躍"],
    本體覺: ["深蹲／熊爬", "推牆／搬輕物", "丟沙包／拉彈力帶"],
  };

  // 反推：每個覺 -> 對應遊戲
  const senseToGames = (() => {
    const map = {};
    SENSES.forEach((s) => (map[s] = []));
    Object.keys(GAME_SENSES).forEach((g) => {
      GAME_SENSES[g].forEach((sense) => map[sense].push(g));
    });
    return map;
  })();

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
      const gamesCount = Object.keys(GAME_SENSES).filter((g) => GAME_SENSES[g].includes(sense)).length;
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
    const { senseScore } = computeSenseScores();

    const kidName = (nameInput?.value || "").trim() || "小朋友";

    const maxScore = Math.max(...SENSES.map((s) => senseScore[s]));
    const minScore = Math.min(...SENSES.map((s) => senseScore[s]));

    const bestSenses = SENSES.filter((s) => senseScore[s] === maxScore);
    const weakSenses = SENSES.filter((s) => senseScore[s] === minScore);

    const bestLabel = bestSenses.join("、");
    const weakLabel = weakSenses.join("、");

    // ✅ 圖表下方：左右兩區塊 + 分數列表（放在最下面）
    const textEl = document.getElementById("senseScoresText");
    if (textEl) {
      // 左：最強
      let bestHtml = "";
      if (maxScore === 0) {
        bestHtml = `
          <div class="panel-title">🌈 今日最強能力</div>
          <div class="panel-main">今天還沒開始計分～</div>
          <div class="panel-sub">快去挑戰遊戲拿糖果吧！🍬✨</div>
        `;
      } else {
        const bestDesc =
          bestSenses.length === 1
            ? (SENSE_DESC[bestSenses[0]] || "太棒了！你今天表現超亮眼！🌟")
            : "你有多項能力並列最強，根本是全能小高手！🌟";

        bestHtml = `
          <div class="panel-title">🎉 今日最強能力</div>
          <div class="panel-main">
            <span class="kid-name">${kidName}</span> 最強的是
            <span class="best-sense">${bestLabel}</span>
            <span class="panel-score">（${maxScore} 分）</span>
          </div>
          <div class="panel-sub">${bestDesc}</div>
        `;
      }

      // 右：最弱 + 建議
      let weakHtml = "";
      if (maxScore === 0) {
        weakHtml = `
          <div class="panel-title">🌱 今日加強方向</div>
          <div class="panel-main">先完成任一關卡計分</div>
          <div class="panel-sub">成果分析就會給你最需要加強的能力喔！💖</div>
        `;
      } else {
        const recGames = Array.from(new Set(weakSenses.flatMap((s) => senseToGames[s] || [])))
          .map((g) => GAME_NAME[g])
          .join("、");

        const recExtra = Array.from(new Set(weakSenses.flatMap((s) => EXTRA_TRAIN[s] || [])))
          .slice(0, 4)
          .map((t) => `・${t}`)
          .join("<br/>");

        weakHtml = `
          <div class="panel-title">🌱 今日加強方向</div>
          <div class="panel-main">
            比較需要加強的是 <span class="weak-sense">${weakLabel}</span>
            <span class="panel-score">（${minScore} 分）</span>
          </div>
          <div class="panel-sub">每天練一點點就會進步！💖</div>

          <div class="panel-list">
            ✅ <b>建議遊戲：</b><br/>
            ${recGames || "（目前沒有對應遊戲）"}
          </div>

          <div class="panel-list">
            ✨ <b>其他練習：</b><br/>
            ${recExtra || "（先從簡單的跟拍、平衡、丟接開始）"}
          </div>
        `;
      }

      // ✅ 分數列表：放在圖表下方，但在兩區塊「下面」
      const scoreListHtml = `
        <div class="sense-list">
          ${SENSES.map((s) => `<div>・${s}：<b>${senseScore[s]}</b> 分</div>`).join("")}
        </div>
      `;

      textEl.innerHTML = `
        <div class="sense-panels">
          <div class="sense-panel best-panel">${bestHtml}</div>
          <div class="sense-panel weak-panel">${weakHtml}</div>
        </div>
        ${scoreListHtml}
      `;
    }

    // ✅ 圖表
    const canvas = document.getElementById("senseChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (senseChart) senseChart.destroy();

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
        maintainAspectRatio: false,
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

  if (btnResult) btnResult.addEventListener("click", openModal);
  if (btnCloseModal) btnCloseModal.addEventListener("click", closeModal);

  // 點黑色背景也關閉
  if (modal) {
    modal.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
  }

  updateScoreCard();
});
