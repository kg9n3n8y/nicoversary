const START_YEAR = 2007;
const MIN_YEAR = 2008;
const MAX_YEAR = 2025;
const API_ENDPOINT = "https://snapshot.search.nicovideo.jp/api/v2/snapshot/video/contents/search";
const VIEW_COUNTER_MIN = 10000;
const MIN_DATE = new Date(MIN_YEAR, 0, 1);
const MAX_DATE = new Date(MAX_YEAR, 11, 31);
let isInitialRender = true;

const dom = {
  dateLabel: document.getElementById("date-label"),
  tagLabel: document.getElementById("tag-label"),
  prevDay: document.getElementById("prev-day"),
  nextDay: document.getElementById("next-day"),
  tagSelect: document.getElementById("tag-select"),
  results: document.getElementById("results"),
  message: document.getElementById("message"),
};

const defaultState = () => {
  const today = new Date();
  return {
    date: clampDate(today),
    tag: "",
  };
};

function clampDate(date) {
  const time = date.getTime();
  if (Number.isNaN(time)) {
    return new Date(MIN_DATE);
  }
  if (time < MIN_DATE.getTime()) {
    return new Date(MIN_DATE);
  }
  if (time > MAX_DATE.getTime()) {
    return new Date(MAX_DATE);
  }
  return new Date(time);
}

function parseStateFromLocation() {
  const params = new URLSearchParams(window.location.search);
  const state = defaultState();

  if (params.has("date")) {
    const [y, m, d] = params.get("date").split("-").map((value) => parseInt(value, 10));
    if (!Number.isNaN(y) && !Number.isNaN(m) && !Number.isNaN(d)) {
      const candidate = new Date(
        y,
        Number.isNaN(m) ? 0 : Math.max(0, Math.min(11, m - 1)),
        Number.isNaN(d) ? 1 : Math.max(1, Math.min(31, d))
      );
      if (!Number.isNaN(candidate.valueOf())) {
        state.date = clampDate(candidate);
      }
    }
  }

  if (params.has("tag")) {
    state.tag = params.get("tag") || "";
  }

  return state;
}

function updateLocation(state, { replace = false } = {}) {
  const params = new URLSearchParams();
  params.set("date", formatDate(state.date));
  if (state.tag) {
    params.set("tag", state.tag);
  }
  const newUrl = `${window.location.pathname}?${params.toString()}`;
  const method = replace ? "replaceState" : "pushState";
  window.history[method]({}, "", newUrl);
}

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatLabelDate(date) {
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `投稿日：${month}月${day}日`;
}

function createJsonFilter(date) {
  const filters = [];
  for (let year = START_YEAR; year <= date.getFullYear(); year += 1) {
    const rangeStart = new Date(year, date.getMonth(), date.getDate());
    if (rangeStart.getMonth() !== date.getMonth() || rangeStart.getDate() !== date.getDate()) {
      // 指定日が存在しない年（例: 2月29日）をスキップ
      continue;
    }
    const rangeEnd = new Date(rangeStart);
    rangeEnd.setDate(rangeEnd.getDate() + 1);

    filters.push({
      type: "range",
      field: "startTime",
      from: `${formatDate(rangeStart)}T00:00:00+09:00`,
      to: `${formatDate(rangeEnd)}T00:00:00+09:00`,
      include_lower: true,
      include_upper: false,
    });
  }

  return JSON.stringify({ type: "or", filters });
}

function buildSearchUrl(state) {
  const params = new URLSearchParams();
  const tagQuery = typeof state.tag === "string" ? state.tag.trim() : "";
  if (tagQuery) {
    params.set("targets", "tagsExact");
  }
  params.set("fields", "contentId,title,startTime,thumbnailUrl,viewCounter,commentCounter");
  params.set("filters[viewCounter][gte]", String(VIEW_COUNTER_MIN));
  params.set("_sort", "-viewCounter");
  params.set("_limit", "100");
  params.set("_offset", "0");
  params.set("_context", "NicoversaryStatic");

  params.set("jsonFilter", createJsonFilter(state.date));
  params.set("q", tagQuery);

  return `${API_ENDPOINT}?${params.toString()}`;
}

async function fetchVideos(state) {
  const url = buildSearchUrl(state);
  const response = await fetch(url, { method: "GET" });
  if (!response.ok) {
    throw new Error(`API error (${response.status})`);
  }
  const data = await response.json();
  return Array.isArray(data.data) ? data.data : [];
}

function resetResults() {
  dom.results.textContent = "";
  dom.message.textContent = "";
}

function renderVideos(state, videos) {
  resetResults();

  if (videos.length === 0) {
    dom.message.textContent = "該当する動画が見つかりませんでした。";
    return;
  }

  videos.forEach((video, index) => {
    const container = document.createElement("a");
    container.className = "container";
    container.href = `https://nico.ms/${video.contentId}`;
    container.target = "_blank";
    container.rel = "noopener noreferrer";

    const section = document.createElement("section");
    container.appendChild(section);

    const imgWrapper = document.createElement("div");
    imgWrapper.className = "img";
    const thumbnail = document.createElement("img");
    thumbnail.src = video.thumbnailUrl;
    thumbnail.alt = `${video.title} のサムネイル`;
    imgWrapper.appendChild(thumbnail);
    section.appendChild(imgWrapper);

    const titleBox = document.createElement("div");
    titleBox.className = "textbox title";

    const anniversary = state.date.getFullYear() - Number(video.startTime?.split("-")[0] || state.date.getFullYear());
    const anniversaryText = document.createElement("p");
    anniversaryText.className = "anniversary bold";
    anniversaryText.textContent = `＼ ${anniversary}周年 ／`;
    titleBox.appendChild(anniversaryText);

    const titleText = document.createElement("p");
    titleText.className = "text bold";
    titleText.textContent = video.title;
    titleBox.appendChild(titleText);

    section.appendChild(titleBox);

    const statsBox = document.createElement("div");
    statsBox.className = "textbox num";

    const views = document.createElement("p");
    views.className = "text";
    const viewIcon = document.createElement("img");
    viewIcon.className = "mini-icon";
    viewIcon.src = "./public/icon_play.svg";
    viewIcon.alt = "再生数";
    views.appendChild(viewIcon);
    views.append(video.viewCounter ? Number(video.viewCounter).toLocaleString("ja-JP") : "0");

    const commentIcon = document.createElement("img");
    commentIcon.className = "mini-icon ml-15";
    commentIcon.src = "./public/icon_comment.svg";
    commentIcon.alt = "コメント数";
    views.appendChild(commentIcon);
    views.append(video.commentCounter ? Number(video.commentCounter).toLocaleString("ja-JP") : "0");

    statsBox.appendChild(views);
    section.appendChild(statsBox);

    const rank = document.createElement("span");
    rank.className = "rank";
    rank.textContent = index + 1;
    container.appendChild(rank);

    dom.results.appendChild(container);
  });
}

function showLoading() {
  dom.message.textContent = "読み込み中…";
  dom.results.textContent = "";
}

function calculateAdjacentDate(date, offset) {
  const next = new Date(date);
  next.setDate(next.getDate() + offset);
  return clampDate(next);
}

function updateLabels(state) {
  dom.dateLabel.textContent = formatLabelDate(state.date);
  dom.tagLabel.textContent = state.tag ? `表示中：${state.tag}` : "表示中：タグ検索なし";

  const tagOptions = Array.from(dom.tagSelect.options);
  const matchingOption = tagOptions.find((option) => option.value === state.tag);
  if (matchingOption) {
    matchingOption.selected = true;
  } else {
    dom.tagSelect.value = state.tag ? state.tag : "";
  }
}

async function refresh(state, { updateHistory = true } = {}) {
  if (updateHistory) {
    updateLocation(state, { replace: isInitialRender });
  }
  if (isInitialRender) {
    isInitialRender = false;
  }
  updateLabels(state);
  showLoading();
  try {
    const videos = await fetchVideos(state);
    renderVideos(state, videos);
  } catch (error) {
    resetResults();
    dom.message.textContent = "データの取得中にエラーが発生しました。時間をおいて再度お試しください。";
    // eslint-disable-next-line no-console
    console.error(error);
  }
}

function init() {
  const state = parseStateFromLocation();
  dom.prevDay.addEventListener("click", (event) => {
    event.preventDefault();
    state.date = calculateAdjacentDate(state.date, -1);
    refresh(state);
  });

  dom.nextDay.addEventListener("click", (event) => {
    event.preventDefault();
    state.date = calculateAdjacentDate(state.date, 1);
    refresh(state);
  });

  dom.tagSelect.addEventListener("change", (event) => {
    const value = event.target.value;
    if (value === "__placeholder") {
      event.target.value = state.tag;
      return;
    }
    state.tag = value;
    refresh(state);
  });

  window.addEventListener("popstate", () => {
    const newState = parseStateFromLocation();
    state.date = newState.date;
    state.tag = newState.tag;
    refresh(state, { updateHistory: false });
  });

  refresh(state, { updateHistory: false });
}

document.addEventListener("DOMContentLoaded", init);
