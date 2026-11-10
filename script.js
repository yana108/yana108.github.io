/* Yana Chen — personal namecard interactions (dual theme) */

// ---------- 主题管理 ----------
(function initTheme() {
  const root = document.documentElement;
  const toggle = document.getElementById("themeToggle");
  const saved = localStorage.getItem("yana-theme");
  const fromUrl = new URLSearchParams(location.search).get("theme");

  function apply(theme) {
    if (theme === "dark") {
      root.setAttribute("data-theme", "dark");
      if (toggle) toggle.textContent = "LIGHT";
    } else {
      root.removeAttribute("data-theme");
      if (toggle) toggle.textContent = "DARK";
    }
    document.dispatchEvent(new CustomEvent("themechange", { detail: theme === "dark" ? "dark" : "light" }));
  }

  // URL 参数优先（用于两版对比），其次本地存储
  if (fromUrl === "dark" || fromUrl === "light") {
    apply(fromUrl);
  } else if (saved) {
    apply(saved);
  }

  if (toggle) {
    toggle.addEventListener("click", () => {
      const next = root.hasAttribute("data-theme") ? "light" : "dark";
      apply(next);
      localStorage.setItem("yana-theme", next);
    });
  }
})();

// ---------- 阅读进度条 ----------
(function initProgress() {
  const bar = document.getElementById("progressBar");
  if (!bar) return;
  const update = () => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = max > 0 ? window.scrollY / max : 0;
    bar.style.width = `${(ratio * 100).toFixed(2)}%`;
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
})();

// ---------- Stagger reveal ----------
(function initStagger() {
  const groups = document.querySelectorAll("[data-stagger]");
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.12 },
  );
  groups.forEach((group) => {
    [...group.children].forEach((child, i) => {
      child.style.setProperty("--i", i);
    });
    observer.observe(group);
  });
})();

// ---------- 星点背景（按主题着色） ----------
(function initStars() {
  const canvas = document.getElementById("stars");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  let stars = [];
  let w, h;
  let color = "16,16,20"; // light 主题下近乎黑的点（极淡）

  document.addEventListener("themechange", (e) => {
    color = e.detail === "dark" ? "245,245,247" : "16,16,20";
  });

  function resize() {
    w = canvas.width = window.innerWidth * DPR;
    h = canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
    const count = Math.min(60, Math.floor((window.innerWidth * window.innerHeight) / 22000));
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: (Math.random() * 1.1 + 0.3) * DPR,
      vx: (Math.random() - 0.5) * 0.06 * DPR,
      vy: (Math.random() - 0.5) * 0.06 * DPR,
      tw: Math.random() * Math.PI * 2,
      baseA: Math.random() * 0.22 + 0.08,
    }));
  }

  function drawOnce() {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${s.baseA})`;
      ctx.fill();
    }
  }

  function frame(t) {
    ctx.clearRect(0, 0, w, h);
    for (const s of stars) {
      s.x += s.vx;
      s.y += s.vy;
      if (s.x < 0) s.x = w;
      if (s.x > w) s.x = 0;
      if (s.y < 0) s.y = h;
      if (s.y > h) s.y = 0;
      const alpha = s.baseA + Math.sin(t / 900 + s.tw) * 0.1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color}, ${Math.max(0.02, alpha)})`;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);
  if (reduced) drawOnce();
  else requestAnimationFrame(frame);
})();

// ---------- 鼠标圆点跟随（hover 交互元素变圆环） ----------
(function initCursorDot() {
  const canvas = document.getElementById("trail");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const DPR = Math.min(window.devicePixelRatio || 1, 2);
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if (reduced || !fine) return;

  let w, h;
  function resize() {
    w = canvas.width = window.innerWidth * DPR;
    h = canvas.height = window.innerHeight * DPR;
    canvas.style.width = window.innerWidth + "px";
    canvas.style.height = window.innerHeight + "px";
  }
  resize();
  window.addEventListener("resize", resize);

  const mouse = { x: -9999, y: -9999, visible: false };
  let dot = { x: -9999, y: -9999, r: 4 * DPR };
  let hoverTarget = false;

  window.addEventListener("pointermove", (e) => {
    mouse.x = e.clientX * DPR;
    mouse.y = e.clientY * DPR;
    mouse.visible = true;
    const el = document.elementFromPoint(e.clientX, e.clientY);
    hoverTarget = !!el && !!el.closest("a, button, .life-item");
  });

  function frame() {
    ctx.clearRect(0, 0, w, h);
    if (!mouse.visible) {
      requestAnimationFrame(frame);
      return;
    }
    // 平滑跟随
    dot.x += (mouse.x - dot.x) * 0.16;
    dot.y += (mouse.y - dot.y) * 0.16;
    const targetR = (hoverTarget ? 16 : 4) * DPR;
    dot.r += (targetR - dot.r) * 0.18;

    const dark = document.documentElement.hasAttribute("data-theme");
    const dotColor = dark ? "229,72,77" : "16,16,20";
    const alpha = hoverTarget ? 0.5 : 0.85;

    if (hoverTarget) {
      // 圆环
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(${dotColor}, ${alpha})`;
      ctx.lineWidth = 1.2 * DPR;
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${dotColor}, ${alpha})`;
      ctx.fill();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

// ---------- 终端打字机 ----------
(function initTypewriter() {
  const terminal = document.getElementById("terminal");
  if (!terminal) return;
  const lines = [...terminal.querySelectorAll(".terminal__line")];
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduced) return;

  const texts = lines.map((line) => {
    const tmp = document.createElement("div");
    tmp.innerHTML = line.innerHTML;
    return tmp.innerText;
  });
  lines.forEach((line) => (line.innerHTML = ""));

  let lineIndex = 0;
  let charIndex = 0;

  function escapeHtml(str) {
    return str.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function renderLine(line, text, progress, showCaret) {
    if (text.startsWith("$")) {
      line.innerHTML =
        '<span class="prompt">$</span>' + escapeHtml(text.slice(1, progress)) + (showCaret ? '<span class="caret" aria-hidden="true"></span>' : "");
    } else {
      line.innerHTML = escapeHtml(text.slice(0, progress)) + (showCaret ? '<span class="caret" aria-hidden="true"></span>' : "");
    }
  }

  function typeNext() {
    if (lineIndex >= lines.length) return;
    const line = lines[lineIndex];
    const text = texts[lineIndex];
    const isLast = lineIndex === lines.length - 1;

    if (charIndex <= text.length) {
      renderLine(line, text, charIndex, isLast);
      charIndex++;
      setTimeout(typeNext, 34);
    } else {
      charIndex = 0;
      lineIndex++;
      setTimeout(typeNext, 300);
    }
  }

  const startObserver = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        startObserver.disconnect();
        setTimeout(typeNext, 500);
      }
    },
    { threshold: 0.3 },
  );
  startObserver.observe(terminal);
})();

// ---------- 复制微信号 ----------
const WECHAT_ID = "SideWave0_1";
const toast = document.getElementById("toast");
let toastTimer = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-shown");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("is-shown"), 2200);
}

async function copyWechat() {
  try {
    await navigator.clipboard.writeText(WECHAT_ID);
    showToast("微信号 SideWave0_1 已复制 ✓");
  } catch {
    const input = document.createElement("textarea");
    input.value = WECHAT_ID;
    document.body.appendChild(input);
    input.select();
    try {
      document.execCommand("copy");
      showToast("微信号 SideWave0_1 已复制 ✓");
    } catch {
      showToast("微信号：SideWave0_1");
    }
    input.remove();
  }
}

document.querySelectorAll("[data-copy-wechat]").forEach((el) => {
  el.addEventListener("click", copyWechat);
});
