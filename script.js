// CodeAlpha Task 4 — Music Player
// Play, pause, next, previous, seekable progress bar, volume + mute,
// clickable playlist, autoplay-next toggle, keyboard shortcuts, theme toggle,
// likes + Liked playlist, import, and playing audio from a phone folder.

// ---------- tracks ----------
// The player ships with no built-in songs — your songs come from Import
// or a music folder on the phone, and are saved in the browser.
const builtinTracks = [];
// Tracks added from the phone — a whole folder, or individual files picked
// with Import. Kept separate so "Remove folder" only removes folder songs,
// never imported ones. Both are kept in IndexedDB so they survive a reload.
let folderTracks = [];
let importedTracks = [];
let allTracks = [...builtinTracks];

function rebuildAllTracks() {
  allTracks = [...builtinTracks, ...folderTracks, ...importedTracks];
}

function currentTrack() { return allTracks[currentIndex]; }

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

// ---------- theme (same pattern as the other CodeAlpha projects) ----------
const themeToggle = document.getElementById("themeToggle");
const savedTheme = localStorage.getItem("music-theme");
if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);
function syncThemeButton() {
  const light = document.documentElement.getAttribute("data-theme") === "light";
  themeToggle.textContent = light ? "☾" : "☀";
}
syncThemeButton();
themeToggle.addEventListener("click", () => {
  const next = document.documentElement.getAttribute("data-theme") === "light" ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("music-theme", next);
  syncThemeButton();
});

// ---------- elements ----------
const audio = document.getElementById("audio");
const disc = document.getElementById("disc");
const trackTitle = document.getElementById("trackTitle");
const trackArtist = document.getElementById("trackArtist");
const statusEl = document.getElementById("status");
const playBtn = document.getElementById("playBtn");
const playIcon = document.getElementById("playIcon");
const pauseIcon = document.getElementById("pauseIcon");
const prevBtn = document.getElementById("prevBtn");
const nextBtn = document.getElementById("nextBtn");
const progressBar = document.getElementById("progressBar");
const progressFill = document.getElementById("progressFill");
const progressKnob = document.getElementById("progressKnob");
const currentTimeEl = document.getElementById("currentTime");
const totalTimeEl = document.getElementById("totalTime");
const volumeSlider = document.getElementById("volumeSlider");
const muteBtn = document.getElementById("muteBtn");
const autoplayToggle = document.getElementById("autoplayToggle");
const playlistEl = document.getElementById("playlist");
const miniPlayer = document.getElementById("miniPlayer");
const miniDisc = document.getElementById("miniDisc");
const miniTitle = document.getElementById("miniTitle");
const miniArtist = document.getElementById("miniArtist");
const miniProgressFill = document.getElementById("miniProgressFill");
const miniOpen = document.getElementById("miniOpen");
const miniPlayBtn = document.getElementById("miniPlayBtn");
const miniPlayIcon = document.getElementById("miniPlayIcon");
const miniPauseIcon = document.getElementById("miniPauseIcon");
const likeBtn = document.getElementById("likeBtn");
const likeIconOutline = document.getElementById("likeIconOutline");
const likeIconFilled = document.getElementById("likeIconFilled");
const importBtn = document.getElementById("importBtn");
const importInput = document.getElementById("importInput");
const folderBtn = document.getElementById("folderBtn");
const removeFolderBtn = document.getElementById("removeFolderBtn");
const folderInput = document.getElementById("folderInput");
const folderChip = document.getElementById("folderChip");
const filterChips = document.querySelectorAll(".filter-chip");

miniOpen.addEventListener("click", openDrawer);
miniPlayBtn.addEventListener("click", togglePlay);
const drawer = document.getElementById("playerDrawer");
const drawerBackdrop = document.getElementById("drawerBackdrop");
const drawerBack = document.getElementById("drawerBack");

// Desktop (min-width: 900px) shows the player as a permanent left column,
// not a bottom drawer — so it must stay exposed even when never "opened".
const desktopLayout = window.matchMedia("(min-width: 900px)");

// ---------- bottom drawer ----------
function openDrawer() {
  drawer.classList.add("open");
  drawer.setAttribute("aria-hidden", "false");
  drawerBackdrop.hidden = false;
  requestAnimationFrame(() => drawerBackdrop.classList.add("show"));
}

function closeDrawer() {
  drawer.classList.remove("open");
  if (!desktopLayout.matches) drawer.setAttribute("aria-hidden", "true");
  drawerBackdrop.classList.remove("show");
  setTimeout(() => { drawerBackdrop.hidden = true; }, 300);
}

drawerBack.addEventListener("click", closeDrawer);
drawerBackdrop.addEventListener("click", closeDrawer);

function syncDrawerA11y() {
  drawer.setAttribute("aria-hidden", desktopLayout.matches || drawer.classList.contains("open") ? "false" : "true");
}
desktopLayout.addEventListener("change", syncDrawerA11y);
syncDrawerA11y();

// Drag the top of the drawer down to close it.
const drawerTop = document.getElementById("drawerTop");
let dragStartY = null;
let dragDy = 0;

function onDragMove(e) {
  if (dragStartY == null) return;
  dragDy = Math.max(e.clientY - dragStartY, 0);
  if (dragDy > 0) {
    drawer.classList.add("dragging");
    drawer.style.transform = "translateY(" + dragDy + "px)";
  }
}

function endDrag() {
  if (dragStartY == null) return;
  dragStartY = null;
  window.removeEventListener("pointermove", onDragMove);
  window.removeEventListener("pointerup", endDrag);
  window.removeEventListener("pointercancel", endDrag);
  drawer.classList.remove("dragging");
  drawer.style.transform = "";
  if (dragDy > 120) closeDrawer();
  dragDy = 0;
}

drawerTop.addEventListener("pointerdown", (e) => {
  // A press on the close button is a tap, not a drag — leave it alone so
  // the button's click still works (capturing the pointer would steal it).
  if (e.target.closest("button")) return;
  dragStartY = e.clientY;
  dragDy = 0;
  window.addEventListener("pointermove", onDragMove);
  window.addEventListener("pointerup", endDrag);
  window.addEventListener("pointercancel", endDrag);
});

// ---------- likes (persisted) — liked songs are the "Liked" playlist ----------
const LIKES_KEY = "music-liked";
let likedIds = new Set();
try {
  const savedLikes = JSON.parse(localStorage.getItem(LIKES_KEY) || "[]");
  if (Array.isArray(savedLikes)) likedIds = new Set(savedLikes.filter((x) => typeof x === "string"));
} catch (e) { likedIds = new Set(); }

function saveLikes() {
  try { localStorage.setItem(LIKES_KEY, JSON.stringify([...likedIds])); } catch (e) { /* storage unavailable */ }
}
function isLiked(id) { return likedIds.has(id); }
function toggleLike(id) {
  if (likedIds.has(id)) likedIds.delete(id);
  else likedIds.add(id);
  saveLikes();
  syncLikeButton();
  syncFilterChips();
  renderPlaylist();
}

function heartSvg(filled) {
  const path = '<path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>';
  if (filled) return '<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">' + path + '</svg>';
  return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + path + '</svg>';
}

function syncLikeButton() {
  const track = currentTrack();
  const liked = track ? isLiked(track.id) : false;
  likeBtn.classList.toggle("liked", liked);
  likeBtn.setAttribute("aria-pressed", String(liked));
  likeBtn.setAttribute("aria-label", liked ? "Unlike this song" : "Like this song");
  likeIconOutline.toggleAttribute("hidden", liked);
  likeIconFilled.toggleAttribute("hidden", !liked);
}

likeBtn.addEventListener("click", () => {
  const track = currentTrack();
  if (track) toggleLike(track.id);
});

// ---------- import audio files from the phone ----------
// The Import button picks individual audio files (one or many); the folder
// button in the top bar picks a whole folder. Both end up as your songs,
// saved in the browser so they survive a reload.
importBtn.addEventListener("click", () => importInput.click());
importInput.addEventListener("change", () => {
  addAudioFiles(importInput.files, "Imported", false);
  importInput.value = ""; // allow picking the same files again
});

// ---------- state ----------
// Remember what was playing across reloads/closes (localStorage).
// The track is saved by id, so it still resolves after folder tracks
// are added or removed.
const STATE_KEY = "music-player-state";
let savedState = null;
try { savedState = JSON.parse(localStorage.getItem(STATE_KEY) || "null"); } catch (e) { savedState = null; }
if (savedState && typeof savedState.trackId !== "string") {
  // Old state saved a track index — map it onto the built-in tracks.
  if (typeof savedState.trackIndex === "number" && builtinTracks[savedState.trackIndex]) {
    savedState.trackId = builtinTracks[savedState.trackIndex].id;
  } else savedState = null;
}

let currentIndex = 0;
let isPlaying = false;
let autoplay = savedState && savedState.autoplay === false ? false : true;
let restoreTime = savedState && isFinite(savedState.currentTime) ? savedState.currentTime : null;
let lastSavedAt = 0;

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify({
      trackId: currentTrack() ? currentTrack().id : null,
      currentTime: audio.currentTime || 0,
      volume: audio.volume,
      muted: audio.muted,
      autoplay: autoplay,
      wasPlaying: isPlaying,
    }));
    lastSavedAt = audio.currentTime || 0;
  } catch (e) { /* storage unavailable — playback still works */ }
}

function formatTime(seconds) {
  if (!isFinite(seconds) || seconds == null) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return m + ":" + String(s).padStart(2, "0");
}

function setPlaying(playing) {
  isPlaying = playing;
  // NB: the `hidden` *property* does not toggle the attribute on SVG elements,
  // so toggle the attribute itself.
  playIcon.toggleAttribute("hidden", playing);
  pauseIcon.toggleAttribute("hidden", !playing);
  playBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
  disc.classList.toggle("spinning", playing);
  // Mini player bar: same icons, and it appears the first time a track plays.
  miniPlayIcon.toggleAttribute("hidden", playing);
  miniPauseIcon.toggleAttribute("hidden", !playing);
  miniPlayBtn.setAttribute("aria-label", playing ? "Pause" : "Play");
  miniDisc.classList.toggle("spinning", playing);
  if (playing) miniPlayer.hidden = false;
}

// ---------- playlist views: All / Liked / Folder ----------
let currentView = "all"; // "all" | "liked" | "folder"
function viewTracks() {
  if (currentView === "liked") return allTracks.filter((t) => likedIds.has(t.id));
  if (currentView === "folder") return folderTracks;
  return allTracks;
}

function syncFilterChips() {
  filterChips.forEach((chip) => chip.classList.toggle("active", chip.dataset.view === currentView));
  const likedChip = document.querySelector('[data-view="liked"]');
  if (likedChip) likedChip.textContent = "♥ Liked" + (likedIds.size ? " (" + likedIds.size + ")" : "");
}
function setView(view) {
  currentView = view;
  syncFilterChips();
  renderPlaylist();
}
filterChips.forEach((chip) => chip.addEventListener("click", () => setView(chip.dataset.view)));

function updatePlaylistUI() {
  const currentId = currentTrack() ? currentTrack().id : null;
  playlistEl.querySelectorAll("li[data-track-id]").forEach((li) => {
    const track = allTracks.find((t) => t.id === li.dataset.trackId);
    li.classList.toggle("active", !!track && track.id === currentId);
    const dur = li.querySelector(".track-duration");
    if (dur) dur.textContent = track && track.duration != null ? formatTime(track.duration) : "–:––";
  });
}

function renderPlaylist() {
  playlistEl.innerHTML = "";
  const view = viewTracks();
  if (view.length === 0) {
    const li = document.createElement("li");
    li.className = "empty-note";
    li.textContent = currentView === "liked"
      ? "No liked songs yet — tap the heart on a song to add it here."
      : allTracks.length === 0
        ? "No songs yet — import audio or add a music folder from the top bar."
        : "No songs here yet.";
    playlistEl.appendChild(li);
    return;
  }
  view.forEach((track, i) => {
    const li = document.createElement("li");
    li.dataset.trackId = track.id;
    li.innerHTML =
      '<span class="track-num">' + (i + 1) + '</span>' +
      '<span class="track-info"><span class="track-name">' + escapeHtml(track.title) + '</span>' +
      (track.artist ? '<br><span class="track-artist">' + escapeHtml(track.artist) + '</span>' : '') + '</span>' +
      '<span class="track-duration">' + (track.duration != null ? formatTime(track.duration) : "–:––") + '</span>' +
      '<button class="row-like' + (isLiked(track.id) ? " liked" : "") + '" type="button" aria-label="Like ' + escapeHtml(track.title) + '" aria-pressed="' + isLiked(track.id) + '">' + heartSvg(isLiked(track.id)) + '</button>';
    li.addEventListener("click", () => {
      if (currentTrack() && track.id === currentTrack().id) {
        // Tapping the track that is already loaded just reopens the player
        // instead of restarting the song.
        if (audio.paused) playAudio();
        openDrawer();
      } else {
        loadTrackById(track.id, true);
        openDrawer();
      }
    });
    li.querySelector(".row-like").addEventListener("click", (e) => {
      e.stopPropagation();
      toggleLike(track.id);
    });
    playlistEl.appendChild(li);
  });
  updatePlaylistUI();
}

// Preload just the metadata so a track can show its duration.
function probeDuration(track) {
  if (track.duration != null) return;
  const probe = new Audio();
  probe.preload = "metadata";
  probe.addEventListener("loadedmetadata", () => {
    track.duration = probe.duration;
    updatePlaylistUI();
    if (currentTrack() && track.id === currentTrack().id) totalTimeEl.textContent = formatTime(probe.duration);
  });
  probe.src = track.src;
}

// Nothing to play yet — the player shows a placeholder until the first
// song is added (Import or a music folder).
function clearPlayer() {
  currentIndex = -1;
  audio.removeAttribute("src");
  audio.load();
  trackTitle.textContent = "No song yet";
  trackArtist.style.display = "none";
  miniTitle.textContent = "No song yet";
  miniArtist.style.display = "none";
  statusEl.textContent = "";
  progressFill.style.width = "0%";
  progressKnob.style.left = "0%";
  progressBar.setAttribute("aria-valuenow", "0");
  currentTimeEl.textContent = "0:00";
  totalTimeEl.textContent = "0:00";
  setPlaying(false);
  playBtn.disabled = true;
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  miniPlayer.hidden = true;
  syncLikeButton();
  updatePlaylistUI();
  saveState();
}

function loadTrackById(id, startPlaying) {
  const index = allTracks.findIndex((t) => t.id === id);
  if (index === -1) { clearPlayer(); return; }
  currentIndex = index;
  const track = allTracks[currentIndex];
  audio.src = track.src;
  playBtn.disabled = false;
  prevBtn.disabled = false;
  nextBtn.disabled = false;
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  trackArtist.style.display = track.artist ? "" : "none";
  miniTitle.textContent = track.title;
  miniArtist.textContent = track.artist;
  miniArtist.style.display = track.artist ? "" : "none";
  statusEl.textContent = "";
  progressFill.style.width = "0%";
  progressKnob.style.left = "0%";
  progressBar.setAttribute("aria-valuenow", "0");
  currentTimeEl.textContent = "0:00";
  totalTimeEl.textContent = track.duration != null ? formatTime(track.duration) : "0:00";
  syncLikeButton();
  updatePlaylistUI();
  saveState();
  if (startPlaying) playAudio();
}

// Next/previous move inside the list you are looking at (All, Liked or
// Folder); if the playing track is not in that list, move in the full list.
function stepTrack(dir) {
  if (!allTracks.length || !currentTrack()) return;
  const view = viewTracks();
  const currentId = currentTrack().id;
  const i = view.findIndex((t) => t.id === currentId);
  if (i === -1 || view.length === 0) {
    loadTrackById(allTracks[(currentIndex + dir + allTracks.length) % allTracks.length].id, true);
    return;
  }
  loadTrackById(view[(i + dir + view.length) % view.length].id, true);
}

async function playAudio() {
  if (!currentTrack()) return;
  try {
    await audio.play();
    setPlaying(true);
    saveState();
  } catch (err) {
    setPlaying(false);
    // Browsers block autoplay with sound before the user has interacted
    // with the page (e.g. resuming after a reload) — that is not a load
    // failure, so stay quiet and let the user press play.
    if (err && err.name !== "NotAllowedError") {
      statusEl.textContent = "Couldn't play this track — check your connection and try the next one.";
    }
  }
}

function pauseAudio() {
  audio.pause();
  setPlaying(false);
  saveState();
}

function togglePlay() {
  if (isPlaying) pauseAudio();
  else playAudio();
}

// ---------- play audio from a folder on the phone ----------
const AUDIO_EXTS = [".mp3", ".wav", ".ogg", ".oga", ".m4a", ".flac", ".aac", ".opus"];

function openFolderDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open("music-player-db", 1);
    req.onupgradeneeded = () => { req.result.createObjectStore("folder-tracks", { keyPath: "id" }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function makeUserTrack(file, fileName, artist, isFolder) {
  const base = fileName.replace(/\.[^.]+$/, "");
  return {
    id: "user-" + fileName + "-" + file.size,
    title: base,
    // Imported files show no artist line at all; folder songs show the
    // folder name.
    artist: isFolder ? (artist || "Your folder") : "",
    src: URL.createObjectURL(file),
    fileName: fileName,
    size: file.size,
    folder: isFolder,
    imported: !isFolder,
  };
}

async function saveFolderTrackToDB(record) {
  try {
    const db = await openFolderDB();
    await new Promise((resolve, reject) => {
      const tx = db.transaction("folder-tracks", "readwrite");
      tx.objectStore("folder-tracks").put(record);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) { /* private mode / quota — the folder still plays this session */ }
}

async function restoreFolderTracks() {
  try {
    const db = await openFolderDB();
    const records = await new Promise((resolve, reject) => {
      const req = db.transaction("folder-tracks", "readonly").objectStore("folder-tracks").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    db.close();
    records.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    for (const rec of records) {
      if (!rec.blob) continue;
      const track = makeUserTrack(rec.blob, rec.name, rec.imported ? "Imported" : (rec.folderName || "Your folder"), !rec.imported);
      if (rec.imported) importedTracks.push(track);
      else folderTracks.push(track);
    }
    if (folderTracks.length || importedTracks.length) {
      rebuildAllTracks();
      folderTracks.forEach(probeDuration);
      importedTracks.forEach(probeDuration);
    }
  } catch (e) { /* no saved songs — the player starts empty */ }
}

function syncFolderUI() {
  folderChip.hidden = folderTracks.length === 0;
  folderChip.textContent = "Folder" + (folderTracks.length ? " (" + folderTracks.length + ")" : "");
  removeFolderBtn.hidden = folderTracks.length === 0;
  if (currentView === "folder" && folderTracks.length === 0) setView("all");
}

async function addAudioFiles(fileList, folderName, isFolder) {
  const files = [...fileList].filter((f) => {
    const name = (f.name || "").toLowerCase();
    return AUDIO_EXTS.some((ext) => name.endsWith(ext));
  });
  if (!files.length) {
    statusEl.textContent = "No audio files found — try files ending in .mp3 or .wav.";
    return;
  }
  files.sort((a, b) => (a.webkitRelativePath || a.name).localeCompare(b.webkitRelativePath || b.name));
  let added = 0;
  for (const file of files) {
    const track = makeUserTrack(file, file.name, folderName, isFolder);
    if (allTracks.some((t) => t.id === track.id)) continue; // already added
    if (isFolder) folderTracks.push(track);
    else importedTracks.push(track);
    allTracks.push(track);
    probeDuration(track);
    saveFolderTrackToDB({ id: track.id, name: file.name, folderName: folderName, blob: file, imported: !isFolder });
    added++;
  }
  syncFolderUI();
  syncFilterChips();
  renderPlaylist();
  // If the player was empty, load the first added song so it is ready.
  if (added && !currentTrack()) loadTrackById(allTracks[0].id, false);
  statusEl.textContent = added
    ? isFolder
      ? "Added " + added + " song" + (added === 1 ? "" : "s") + " from “" + folderName + "”."
      : "Added " + added + " song" + (added === 1 ? "" : "s") + " to your list."
    : "Those songs are already in your list.";
}

async function removeFolder() {
  const wasPlayingFolder = currentTrack() && currentTrack().folder;
  folderTracks = [];
  rebuildAllTracks();
  try {
    const db = await openFolderDB();
    // Delete only the folder records — imported songs stay.
    const records = await new Promise((resolve, reject) => {
      const req = db.transaction("folder-tracks", "readonly").objectStore("folder-tracks").getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
    await new Promise((resolve, reject) => {
      const tx = db.transaction("folder-tracks", "readwrite");
      const store = tx.objectStore("folder-tracks");
      records.forEach((rec) => { if (!rec.imported) store.delete(rec.id); });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch (e) { /* nothing saved */ }
  syncFolderUI();
  syncFilterChips();
  if (wasPlayingFolder) {
    audio.pause();
    setPlaying(false);
    if (allTracks.length) loadTrackById(allTracks[0].id, false);
    else clearPlayer();
  }
  renderPlaylist();
}

folderBtn.addEventListener("click", () => folderInput.click());
folderInput.addEventListener("change", () => {
  const files = folderInput.files;
  const folderName = files.length && (files[0].webkitRelativePath || "").split("/")[0]
    ? (files[0].webkitRelativePath || "").split("/")[0]
    : "Your folder";
  addAudioFiles(files, folderName, true);
  folderInput.value = ""; // allow picking the same folder again
});
removeFolderBtn.addEventListener("click", removeFolder);

// ---------- audio events ----------
audio.addEventListener("loadedmetadata", () => {
  if (currentTrack()) currentTrack().duration = audio.duration;
  totalTimeEl.textContent = formatTime(audio.duration);
  updatePlaylistUI();
  // Jump back to where the track was when the page was last closed.
  if (restoreTime != null && isFinite(audio.duration) && audio.duration > 0) {
    audio.currentTime = Math.min(restoreTime, Math.max(audio.duration - 1, 0));
    restoreTime = null;
  }
});

audio.addEventListener("timeupdate", () => {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  progressFill.style.width = pct + "%";
  progressKnob.style.left = pct + "%";
  progressBar.setAttribute("aria-valuenow", String(Math.round(pct)));
  currentTimeEl.textContent = formatTime(audio.currentTime);
  miniProgressFill.style.width = pct + "%";
  // Remember the position every few seconds while playing.
  if (Math.abs(audio.currentTime - lastSavedAt) >= 5) saveState();
});

window.addEventListener("pagehide", saveState);
window.addEventListener("beforeunload", saveState);

audio.addEventListener("ended", () => {
  if (autoplay) stepTrack(1);
  else setPlaying(false);
});

audio.addEventListener("error", () => {
  if (!audio.src) return;
  setPlaying(false);
  statusEl.textContent = "Couldn't load this track — try the next one.";
});

// ---------- controls ----------
playBtn.addEventListener("click", togglePlay);
prevBtn.addEventListener("click", () => stepTrack(-1));
nextBtn.addEventListener("click", () => stepTrack(1));

function seekFromEvent(e) {
  const rect = progressBar.getBoundingClientRect();
  const x = (e.clientX - rect.left) / rect.width;
  if (audio.duration) audio.currentTime = Math.min(Math.max(x, 0), 1) * audio.duration;
}
progressBar.addEventListener("click", seekFromEvent);
progressBar.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight" && audio.duration) audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
  if (e.key === "ArrowLeft" && audio.duration) audio.currentTime = Math.max(audio.currentTime - 5, 0);
});

// ---------- volume ----------
audio.volume = 0.8;
function syncVolumeIcon() {
  const muted = audio.muted || audio.volume === 0;
  muteBtn.setAttribute("aria-label", muted ? "Unmute" : "Mute");
}
volumeSlider.addEventListener("input", () => {
  audio.volume = volumeSlider.value / 100;
  audio.muted = false;
  syncVolumeIcon();
  saveState();
});
muteBtn.addEventListener("click", () => {
  audio.muted = !audio.muted;
  syncVolumeIcon();
  saveState();
});

// ---------- autoplay toggle ----------
function syncAutoplayToggle() {
  autoplayToggle.classList.toggle("on", autoplay);
  autoplayToggle.setAttribute("aria-pressed", String(autoplay));
  autoplayToggle.setAttribute("aria-label", "Autoplay " + (autoplay ? "on" : "off"));
}
autoplayToggle.addEventListener("click", () => {
  autoplay = !autoplay;
  syncAutoplayToggle();
  saveState();
});

// ---------- keyboard shortcuts ----------
document.addEventListener("keydown", (e) => {
  const tag = (e.target.tagName || "").toLowerCase();
  if (tag === "input" || tag === "textarea") return;
  if (e.key === "Escape") {
    closeDrawer();
    return;
  }
  if (e.code === "Space") {
    e.preventDefault();
    togglePlay();
  } else if (e.key === "ArrowRight" && audio.duration) {
    audio.currentTime = Math.min(audio.currentTime + 5, audio.duration);
  } else if (e.key === "ArrowLeft" && audio.duration) {
    audio.currentTime = Math.max(audio.currentTime - 5, 0);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    volumeSlider.value = Math.min(Number(volumeSlider.value) + 5, 100);
    volumeSlider.dispatchEvent(new Event("input"));
  } else if (e.key === "ArrowDown") {
    e.preventDefault();
    volumeSlider.value = Math.max(Number(volumeSlider.value) - 5, 0);
    volumeSlider.dispatchEvent(new Event("input"));
  }
});

// ---------- init ----------
(async function init() {
  if (savedState) {
    if (isFinite(savedState.volume)) {
      audio.volume = Math.min(Math.max(savedState.volume, 0), 1);
      volumeSlider.value = Math.round(audio.volume * 100);
    }
    audio.muted = !!savedState.muted;
  }
  syncAutoplayToggle();
  syncVolumeIcon();
  // Restore songs added earlier, before deciding which track to load.
  await restoreFolderTracks();
  syncFolderUI();
  syncFilterChips();
  renderPlaylist();
  const startId = savedState && savedState.trackId && allTracks.some((t) => t.id === savedState.trackId)
    ? savedState.trackId
    : (allTracks[0] ? allTracks[0].id : null);
  if (startId) {
    loadTrackById(startId, false);
    if (savedState) {
      // The mini bar shows the remembered track right away, even before play.
      miniPlayer.hidden = false;
      if (savedState.wasPlaying) playAudio();
    }
  } else {
    clearPlayer();
  }
})();
