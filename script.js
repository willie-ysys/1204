// 感覺統合樂園 – 純 JS 版本（糖果計分）

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

    const total =
      scores.game1 + scores.game2 + scores.game3 + scores.game4;

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
    const total =
      scores.game1 + scores.game2 + scores.game3 + scores.game4;

    alert(name + " 的總糖果是 " + total + " 顆！🍬🎉");
  });

  updateScoreCard();
});