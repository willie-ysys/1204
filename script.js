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
  const btnResult = document.getElementById("btn-result");
  const modal = document.getElementById("result-modal");
  const btnCloseModal = document.getElementById("btn-close-modal");

  const scores = { game1: 0, game2: 0, game3: 0, game4: 0 };

  /* ================= 糖果顯示 ================= */

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

    displayTotalCount.textContent = `${total} 顆`;
  }

  function setScore(gameKey, value) {
    let fixed = parseInt(value, 10);
    if (isNaN(fixed) || fixed < 0) fixed = 0;
    if (fixed > 3) fixed = 3;
    scores[gameKey] = fixed;
    scoreInputs[gameKey].value = fixed === 0 ? "" : fixed;
    updateScoreCard();
  }

  nameInput.addEventListener("input", updateScoreCard);
  Object.keys(scoreInputs).forEach((k) => {
    scoreInputs[k].addEventListener("input", (e) => setScore(k, e.target.value));
  });

  btnReset.addEventListener("click", () => {
    Object.keys(scores).forEach((k) => {
      scores[k] = 0;
      scoreInputs[k].value = "";
    });
    updateScoreCard();
  });

  /* ================= 感覺統合分析 ================= */

  const SENSES = ["視覺", "聽覺", "前庭覺", "本體覺"];

  const GAME_SENSES = {
    game1: ["視覺", "聽覺", "本體覺"],
    game2: ["視覺", "前庭覺", "本體覺"],
    game3: ["視覺", "前庭覺"],
    game4: ["視覺", "前庭覺", "本體覺"],
  };

  function computeSenseScores() {
    const senseCandy = {};
    const senseMax = {};
    const senseScore = {};

    SENSES.forEach((s) => {
      senseCandy[s] = 0;
      senseMax[s] =
        Object.keys(GAME_SENSES).filter((g) =>
          GAME_SENSES[g].includes(s)
        ).length * 3;
    });

    Object.keys(GAME_SENSES).forEach((g) => {
      GAME_SENSES[g].forEach((s) => {
        senseCandy[s] += scores[g];
      });
    });

    SENSES.forEach((s) => {
      senseScore[s] = senseMax[s]
        ? Math.round((senseCandy[s] / senseMax[s]) * 100)
        : 0;
    });

    return senseScore;
  }

  let senseChart = null;

  function renderSenseChart() {
    const senseScore = computeSenseScores();
    const kidName = nameInput.value.trim() || "小朋友";

    const maxScore = Math.max(...SENSES.map((s) => senseScore[s]));
    const minScore = Math.min(...SENSES.map((s) => senseScore[s]));

    const best = SENSES.filter((s) => senseScore[s] === maxScore);
    const weak = SENSES.filter((s) => senseScore[s] === minScore);

    const BEST_DESC = {
      視覺: "你的眼睛超會抓重點，觀察力一級棒！👀✨",
      聽覺: "你很會聽節奏跟指令，耳朵超靈敏！👂🎵",
      前庭覺: "你的平衡感很厲害，轉一轉也不怕暈！🌀🤸",
      本體覺: "你很會控制身體，動作協調又穩！💪🧠",
    };

    /* === 最強 === */
    const summaryEl = document.getElementById("senseSummary");
    if (summaryEl) {
      if (maxScore === 0) {
        summaryEl.innerHTML =
          "🌈 今天還沒開始計分～快去玩遊戲拿糖果吧！🍬✨";
      } else {
        summaryEl.innerHTML = `
          🎉 今天 <span class="kid-name">${kidName}</span> 表現最好的是
          <span class="best-sense">${best.join("、")}</span>（${maxScore} 分）！<br/>
          <span class="best-desc">${BEST_DESC[best[0]] || ""}</span>
        `;
      }
    }

    /* === 分數列表 === */
    const listEl = document.getElementById("senseScoresText");
    if (listEl) {
      listEl.innerHTML = `
        <div class="sense-list">
          ${SENSES.map(
            (s) => `<div>・${s}：<b>${senseScore[s]}</b> 分</div>`
          ).join("")}
        </div>
      `;
    }

    /* === 最弱 + 建議 === */
    const weakEl = document.getElementById("senseWeakAdvice");
    if (weakEl) {
      if (maxScore === 0) {
        weakEl.innerHTML =
          "💡 填完每一關的糖果數，就能看到專屬的訓練建議喔！";
      } else {
        const GAME_NAME = {
          game1: "🥁 小丑打鼓台",
          game2: "🏀 樂園神射手",
          game3: "💡 螢火蟲冒險",
          game4: "🏐 小丑躲避球",
        };

        const PRACTICE = {
          視覺: ["拼圖、找不同", "描線、塗色", "丟接球盯住目標"],
          聽覺: ["跟節拍拍手", "聽指令做動作", "音樂停走遊戲"],
          前庭覺: ["單腳站", "走直線", "轉圈後走路"],
          本體覺: ["深蹲、青蛙跳", "推牆", "控制力道丟球"],
        };

        const trainGames = weak
          .map((s) => {
            const games = Object.keys(GAME_SENSES)
              .filter((g) => GAME_SENSES[g].includes(s))
              .map((g) => GAME_NAME[g])
              .join("、");
            return `・${s}：多玩 ${games}`;
          })
          .join("<br/>");

        const trainOther = weak
          .map((s) => `・${s}：${PRACTICE[s].join("、")}`)
          .join("<br/>");

        weakEl.innerHTML = `
          🌱 今天比較需要加強的是
          <span class="best-sense">${weak.join("、")}</span>（${minScore} 分）<br/>
          <span class="best-desc">每天練一點點就會進步！💖</span>
          <div style="margin-top:10px">
            <b>✅ 建議遊戲：</b><br/>${trainGames}
          </div>
          <div style="margin-top:10px">
            <b>✨ 其他練習：</b><br/>${trainOther}
          </div>
        `;
      }
    }

    /* === Chart.js === */
    const canvas = document.getElementById("senseChart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (senseChart) senseChart.destroy();

    senseChart = new Chart(ctx, {
      type: "bar",
      data: {
        labels: SENSES,
        datasets: [
          {
            label: "分數 (0-100)",
            data: SENSES.map((s) => senseScore[s]),
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: { y: { beginAtZero: true, max: 100 } },
      },
    });
  }

  function openModal() {
    modal.classList.remove("hidden");
    renderSenseChart();
  }
  function closeModal() {
    modal.classList.add("hidden");
  }

  btnResult.addEventListener("click", openModal);
  btnCloseModal.addEventListener("click", closeModal);
  modal.addEventListener("click", (e) => e.target === modal && closeModal());

  updateScoreCard();
});
