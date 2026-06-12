/* Blind A/B comparison. v1 = original suite, v2 = validation suite.
   Each section independently shuffles which version lands on side A/B
   at page load, so labels never give the mapping away. Nothing is
   stored or sent anywhere; refresh resets everything. */

const REVEAL_NAMES = { v1: "Original", v2: "SermonShot (validation)" };

const params = new URLSearchParams(location.search);
const date = params.get("date");

const state = {
  sections: [], // { key, label, sideA: 'v1'|'v2', vote: 'A'|'B'|null }
};

function fmtDate(d) {
  return new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T12:00:00`)
    .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

function renderText(text) {
  const container = document.createElement("div");
  container.className = "content";
  for (const block of text.split(/\n\s*\n/)) {
    const p = document.createElement("p");
    p.textContent = block.trim();
    container.appendChild(p);
  }
  return container;
}

function buildSection(section, index) {
  const sideA = Math.random() < 0.5 ? "v1" : "v2";
  const sideB = sideA === "v1" ? "v2" : "v1";
  state.sections.push({ key: section.key, label: section.label, sideA, vote: null });

  const el = document.createElement("section");
  el.className = "matchup";
  el.id = `matchup-${index}`;
  el.innerHTML = `
    <h2><span class="num">${index + 1} / 7</span> ${section.label}</h2>
    <div class="panes">
      <div class="pane" data-side="A">
        <div class="pane-head">Version A</div>
        <div class="pane-body"></div>
      </div>
      <div class="pane" data-side="B">
        <div class="pane-head">Version B</div>
        <div class="pane-body"></div>
      </div>
    </div>
    <div class="vote-row">
      <button class="vote" data-side="A">I prefer A</button>
      <button class="vote" data-side="B">I prefer B</button>
    </div>`;

  el.querySelector('.pane[data-side="A"] .pane-body').appendChild(renderText(section[sideA]));
  el.querySelector('.pane[data-side="B"] .pane-body').appendChild(renderText(section[sideB]));

  el.querySelectorAll(".vote").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.sections[index].vote = btn.dataset.side;
      el.querySelectorAll(".vote").forEach((b) => b.classList.toggle("chosen", b === btn));
      el.classList.add("voted");
      updateProgress();
    });
  });
  return el;
}

function updateProgress() {
  const done = state.sections.filter((s) => s.vote).length;
  document.getElementById("progress").textContent =
    done < state.sections.length
      ? `${done} of ${state.sections.length} matchups voted`
      : "All matchups voted — results below";
  if (done === state.sections.length) showResults();
}

function showResults() {
  const tally = { v1: 0, v2: 0 };
  for (const s of state.sections) {
    const picked = s.vote === "A" ? s.sideA : s.sideA === "v1" ? "v2" : "v1";
    s.picked = picked;
    tally[picked]++;
  }
  const winner =
    tally.v1 === tally.v2 ? null : tally.v1 > tally.v2 ? "v1" : "v2";

  const el = document.getElementById("results");
  const rows = state.sections
    .map(
      (s) => `<tr>
        <td>${s.label}</td>
        <td>Version A was <strong>${REVEAL_NAMES[s.sideA]}</strong></td>
        <td>You picked <strong>${REVEAL_NAMES[s.picked]}</strong></td>
      </tr>`
    )
    .join("");
  el.innerHTML = `
    <h2>The reveal</h2>
    <p class="verdict">${
      winner
        ? `🏆 Winner: <strong>${REVEAL_NAMES[winner]}</strong> — ${tally[winner]} of ${state.sections.length} matchups`
        : `🤝 It's a tie — ${tally.v1} matchups each`
    }</p>
    <p class="tally">Original ${tally.v1} &nbsp;&middot;&nbsp; SermonShot ${tally.v2}</p>
    <table><thead><tr><th>Content type</th><th>Blind mapping</th><th>Your pick</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <p><a href="compare.html?date=${date}">Run it again (new shuffle)</a> &nbsp;&middot;&nbsp; <a href="index.html">Back to sermons</a></p>`;
  el.hidden = false;
  el.scrollIntoView({ behavior: "smooth" });
}

async function init() {
  if (!date) {
    document.getElementById("title").textContent = "No sermon selected";
    return;
  }
  let data;
  try {
    const res = await fetch(`data/${date}.json`);
    if (!res.ok) throw new Error(res.statusText);
    data = await res.json();
  } catch (e) {
    document.getElementById("title").textContent = `Couldn't load sermon ${date}`;
    return;
  }
  document.getElementById("title").textContent = `Sermon of ${fmtDate(date)}`;
  document.title = `SermonShot — ${fmtDate(date)}`;
  const host = document.getElementById("sections");
  data.sections.forEach((section, i) => host.appendChild(buildSection(section, i)));
  updateProgress();
}

init();
