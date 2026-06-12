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

/* Structure-aware renderer. One shared rule set applied identically to
   both sides of every matchup, so formatting can never identify which
   version is which — only the words differ. */

const SECTION_LABELS = new Set([
  // devotional
  "devotional", "bible verse", "reflection question", "quote", "prayer",
  // discussion guide
  "summary", "intro prayer", "ice breaker", "key verses", "questions",
  "life application", "key takeaways",
  // summaries
  "short", "long", "youtube", "social media teaser",
  // quotes & verses
  "quotes", "verses",
]);

const QUOTE_LABELS = new Set(["bible verse", "quote"]);
const INLINE_LABEL = /^(Hook|Why it works|Excerpt|Title)\s*:\s*/;
const NUMBERED_HEAD = /^(Day|Clip|Carousel)\s+\d+\s*:/i;

function isStandaloneHeading(line) {
  return line.length <= 90 && !/[.,;]$/.test(line) && !/^["'“‘]/.test(line) && !INLINE_LABEL.test(line);
}

function renderText(text) {
  const container = document.createElement("div");
  container.className = "content";
  const lines = text.split("\n").map((l) => l.trim());

  let para = [];        // accumulating paragraph lines
  let list = null;      // open <ul>/<ol>
  let quoteNext = false; // next paragraph renders as a blockquote
  let sawTitle = false;

  const flushPara = () => {
    if (!para.length) return;
    const textBlock = para.join(" ");
    para = [];
    if (quoteNext) {
      quoteNext = false;
      const bq = document.createElement("blockquote");
      bq.textContent = textBlock;
      container.appendChild(bq);
      return;
    }
    const p = document.createElement("p");
    const m = textBlock.match(INLINE_LABEL);
    if (m) {
      const strong = document.createElement("strong");
      strong.textContent = m[1] + ": ";
      p.appendChild(strong);
      p.appendChild(document.createTextNode(textBlock.slice(m[0].length)));
    } else {
      p.textContent = textBlock;
    }
    container.appendChild(p);
  };

  const closeList = () => { list = null; };

  const openList = (tag) => {
    if (!list || list.tagName !== tag.toUpperCase()) {
      flushPara();
      list = document.createElement(tag);
      container.appendChild(list);
    }
    return list;
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line) { flushPara(); continue; } // blanks don't close lists — items are often blank-separated

    const prevBlank = i === 0 || !lines[i - 1];
    const nextBlank = i === lines.length - 1 || !lines[i + 1];
    const alone = prevBlank && nextBlank;
    const lower = line.toLowerCase();

    // document title: first line of the file (unless it's a Day/Clip/Carousel heading)
    if (!sawTitle) {
      sawTitle = true;
      if (line.length <= 120 && nextBlank && !NUMBERED_HEAD.test(line) && !SECTION_LABELS.has(lower)) {
        const h = document.createElement("h3");
        h.textContent = line;
        container.appendChild(h);
        continue;
      }
    }

    // bullet items
    if (/^- /.test(line)) {
      const li = document.createElement("li");
      li.textContent = line.replace(/^- /, "");
      openList("ul").appendChild(li);
      continue;
    }
    // numbered items (quotes file etc.)
    if (/^\d+\.\s/.test(line)) {
      const li = document.createElement("li");
      li.textContent = line.replace(/^\d+\.\s*/, "");
      openList("ol").appendChild(li);
      continue;
    }

    closeList();

    // known field/section labels on their own line
    if (SECTION_LABELS.has(lower) && prevBlank) {
      flushPara();
      const h = document.createElement("h5");
      h.textContent = line;
      container.appendChild(h);
      if (QUOTE_LABELS.has(lower)) quoteNext = true;
      continue;
    }

    // Day N: / Clip N: / Carousel N: headings
    if (NUMBERED_HEAD.test(line)) {
      flushPara();
      const h = document.createElement("h4");
      h.textContent = line;
      container.appendChild(h);
      continue;
    }

    // short standalone line => section heading (blog-style)
    if (alone && isStandaloneHeading(line)) {
      flushPara();
      const h = document.createElement("h4");
      h.textContent = line;
      container.appendChild(h);
      continue;
    }

    para.push(line);
  }
  flushPara();
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
