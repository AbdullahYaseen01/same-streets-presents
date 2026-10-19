/* Same Streets Presents
   Drop real nights into UPCOMING_SHOWS and a film into FEATURED_SESSION.
   Forms open a draft to samestreetspresents@gmail.com in the visitor's email app. */

const UPCOMING_SHOWS = [
  // {
  //   title: "Show title",
  //   date: "2026-11-14",
  //   time: "8:00 PM",
  //   venue: "Venue name",
  //   city: "Cleveland, Tennessee",
  //   lineup: ["Artist One", "Artist Two"],
  //   admission: "Tickets at the door",
  //   image: "assets/photos/stage.jpg",
  //   tickets: "https://example.com/tickets"
  // }
];

const FEATURED_SESSION = null;
// { artist, title, intro, image, youtubeId }

const SESSION_LIBRARY = [];
// { artist, title, tags: "live acoustic", image, blurb }

const MAIL = "samestreetspresents@gmail.com";
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (ch) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;"
  }[ch]));
}

function safeUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") return parsed.href;
  } catch (error) {
    return "";
  }
  return "";
}

function initHeader() {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("#site-nav");
  if (!header || !toggle || !nav) return;

  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.textContent = open ? "Close" : "Menu";
    document.body.classList.toggle("nav-lock", open);
  };

  toggle.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  nav.querySelectorAll("a").forEach((link) => link.addEventListener("click", () => setOpen(false)));
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

function initHero() {
  const hero = document.querySelector("[data-hero]");
  if (!hero) return;

  const slides = [...hero.querySelectorAll(".hero-slide")];
  const thumbs = [...hero.querySelectorAll(".hero-thumb")];
  const progress = hero.querySelector(".hero-progress span");
  const currentEl = hero.querySelector("[data-slide-current]");
  const caption = hero.querySelector("[data-hero-caption]");
  const pauseBtn = hero.querySelector("[data-slide-pause]");
  const lines = [
    "The room · Cleveland, Tennessee",
    "Up close · the artist",
    "Turned up · the noise",
    "The night · show up"
  ];
  const duration = 7000;
  let index = 0;
  let timer = 0;
  let paused = reducedMotion;
  let track = false;
  let startX = 0;

  const paintProgress = () => {
    if (!progress) return;
    progress.style.animation = "none";
    void progress.offsetWidth;
    if (!paused && !reducedMotion) {
      progress.style.animation = `fill ${duration}ms linear`;
    }
  };

  const go = (next) => {
    index = (next + slides.length) % slides.length;
    slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
    thumbs.forEach((thumb, i) => {
      const active = i === index;
      thumb.classList.toggle("is-active", active);
      thumb.setAttribute("aria-current", active ? "true" : "false");
    });
    if (currentEl) currentEl.textContent = String(index + 1).padStart(2, "0");
    if (caption) {
      const kicker = caption.parentElement;
      kicker.classList.add("is-swapping");
      window.setTimeout(() => {
        caption.textContent = lines[index];
        kicker.classList.remove("is-swapping");
      }, reducedMotion ? 0 : 180);
    }
    paintProgress();
  };

  const queue = () => {
    window.clearInterval(timer);
    if (paused || reducedMotion) return;
    timer = window.setInterval(() => go(index + 1), duration);
  };

  hero.querySelector("[data-slide-prev]")?.addEventListener("click", () => {
    go(index - 1);
    queue();
  });
  hero.querySelector("[data-slide-next]")?.addEventListener("click", () => {
    go(index + 1);
    queue();
  });
  thumbs.forEach((thumb) => {
    thumb.addEventListener("click", () => {
      go(Number(thumb.dataset.go));
      queue();
    });
  });

  pauseBtn?.addEventListener("click", () => {
    paused = !paused;
    pauseBtn.setAttribute("aria-pressed", String(paused));
    pauseBtn.textContent = paused ? "Play" : "Pause";
    queue();
    paintProgress();
  });

  if (reducedMotion && pauseBtn) {
    pauseBtn.setAttribute("aria-pressed", "true");
    pauseBtn.textContent = "Play";
  }

  hero.addEventListener("pointerdown", (event) => {
    if (event.target.closest("a, button")) return;
    track = true;
    startX = event.clientX;
  });
  hero.addEventListener("pointerup", (event) => {
    if (!track) return;
    track = false;
    const delta = event.clientX - startX;
    if (Math.abs(delta) < 48) return;
    go(index + (delta < 0 ? 1 : -1));
    queue();
  });

  hero.addEventListener("mouseenter", () => window.clearInterval(timer));
  hero.addEventListener("mouseleave", queue);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) window.clearInterval(timer);
    else queue();
  });

  go(0);
  queue();
}

function showDateParts(dateStr) {
  const when = new Date(`${dateStr}T12:00:00`);
  if (Number.isNaN(when.getTime())) {
    return { month: "Date", day: "—", weekday: dateStr };
  }
  return {
    month: when.toLocaleString("en-US", { month: "short" }),
    day: String(when.getDate()).padStart(2, "0"),
    weekday: when.toLocaleString("en-US", { weekday: "long" })
  };
}

function ticketMarkup(show, index) {
  const when = showDateParts(show.date);
  const lineup = (show.lineup || []).join(" · ");
  const tickets = safeUrl(show.tickets);
  const image = show.image ? esc(show.image) : "";
  const art = image
    ? `<div class="ticket-art"><img src="${image}" alt=""></div>`
    : "";
  const ticketLink = tickets
    ? `<a class="btn btn-primary" href="${esc(tickets)}" target="_blank" rel="noopener noreferrer">Get tickets <span aria-hidden="true">→</span></a>`
    : "";
  return `<article class="ticket${image ? " has-art" : ""}">
    ${art}
    <div class="ticket-date">
      <span>${esc(when.month)}</span>
      <strong>${esc(when.day)}</strong>
      <em>${esc(show.time || when.weekday)}</em>
    </div>
    <div class="ticket-body">
      <h3>${esc(show.title)}</h3>
      ${lineup ? `<p class="ticket-lineup">${esc(lineup)}</p>` : ""}
      <p class="ticket-venue">${esc([show.venue, show.city].filter(Boolean).join(" · "))}</p>
    </div>
    <div class="ticket-side">
      ${show.admission ? `<p class="price">${esc(show.admission)}</p>` : ""}
      <button class="btn btn-ghost" type="button" data-show-index="${index}">Show details</button>
      ${ticketLink}
    </div>
  </article>`;
}

function ensureDialog(id) {
  let dialog = document.getElementById(id);
  if (dialog) return dialog;
  dialog = document.createElement("dialog");
  dialog.id = id;
  dialog.className = "modal";
  dialog.innerHTML = `<div class="modal-top"><button class="modal-close icon-btn" type="button" data-close aria-label="Close">×</button></div><div class="modal-body stack"></div>`;
  document.body.appendChild(dialog);
  return dialog;
}

function bindDialog(dialog) {
  if (!dialog || dialog.dataset.bound) return;
  dialog.dataset.bound = "true";
  dialog.querySelectorAll("[data-close]").forEach((button) => {
    button.addEventListener("click", () => dialog.close());
  });
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) dialog.close();
  });
}

function initShows() {
  const mount = document.querySelector("[data-upcoming]");
  if (mount && UPCOMING_SHOWS.length) {
    mount.innerHTML = `<div class="ticket-list">${UPCOMING_SHOWS.map(ticketMarkup).join("")}</div>`;
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-show-index]");
    if (!button) return;
    const show = UPCOMING_SHOWS[Number(button.dataset.showIndex)];
    if (!show) return;
    const dialog = ensureDialog("show-modal");
    bindDialog(dialog);
    const when = showDateParts(show.date);
    const tickets = safeUrl(show.tickets);
    dialog.querySelector(".modal-body").innerHTML = `
      <p class="eyebrow">Upcoming show</p>
      <h3>${esc(show.title)}</h3>
      <p>${esc(when.weekday)} · ${esc(when.month)} ${esc(when.day)} · ${esc(show.time || "Time coming")}</p>
      <p>${esc([show.venue, show.city].filter(Boolean).join(" · "))}</p>
      ${(show.lineup || []).length ? `<p>${esc(show.lineup.join(" · "))}</p>` : ""}
      ${show.admission ? `<p class="price">${esc(show.admission)}</p>` : ""}
      ${tickets ? `<a class="btn btn-primary" href="${esc(tickets)}" target="_blank" rel="noopener noreferrer">Get tickets <span aria-hidden="true">→</span></a>` : `<a class="btn btn-primary" href="contact.html?topic=booking">Let's make a show <span aria-hidden="true">→</span></a>`}
    `;
    dialog.showModal();
  });
}

function initSession() {
  const dialog = document.getElementById("session-modal");
  bindDialog(dialog);

  if (FEATURED_SESSION) {
    document.querySelectorAll("[data-session-artist]").forEach((node) => {
      node.textContent = FEATURED_SESSION.artist || "";
    });
    document.querySelectorAll("[data-session-title]").forEach((node) => {
      node.textContent = FEATURED_SESSION.title || "";
    });
    document.querySelectorAll("[data-session-intro]").forEach((node) => {
      node.textContent = FEATURED_SESSION.intro || "";
    });
    if (FEATURED_SESSION.image) {
      document.querySelectorAll("[data-session-image]").forEach((img) => {
        img.src = FEATURED_SESSION.image;
      });
    }
  }

  document.querySelectorAll("[data-open-session]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!dialog) return;
      const frame = dialog.querySelector("[data-session-frame]");
      const fallback = dialog.querySelector("[data-session-fallback]");
      if (FEATURED_SESSION?.youtubeId && frame) {
        const id = encodeURIComponent(FEATURED_SESSION.youtubeId);
        const title = esc(FEATURED_SESSION.title || "Same Streets Session");
        frame.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${id}?autoplay=1" title="${title}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
        if (fallback) fallback.hidden = true;
      }
      dialog.showModal();
    });
  });

  dialog?.addEventListener("close", () => {
    const frame = dialog.querySelector("[data-session-frame]");
    const fallback = dialog.querySelector("[data-session-fallback]");
    if (frame) frame.innerHTML = "";
    if (fallback) fallback.hidden = false;
  });

  const library = document.querySelector("[data-library]");
  if (library && SESSION_LIBRARY.length) {
    library.innerHTML = SESSION_LIBRARY.map((item) => `
      <article class="session-card" data-tags="${esc(item.tags || "live")}">
        <img src="${esc(item.image || "assets/photos/stage.jpg")}" alt="">
        <div class="card-body">
          <p class="badge">${esc(item.artist || "Session")}</p>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.blurb || "")}</p>
        </div>
      </article>
    `).join("");
  }

  const cards = () => [...document.querySelectorAll("[data-library] [data-tags]")];
  document.querySelectorAll("[data-filter]").forEach((chip) => {
    chip.addEventListener("click", () => {
      const tag = chip.dataset.filter;
      document.querySelectorAll("[data-filter]").forEach((item) => {
        const active = item === chip;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-pressed", String(active));
      });
      cards().forEach((card) => {
        const tags = (card.dataset.tags || "").split(/\s+/);
        card.hidden = tag !== "all" && !tags.includes(tag);
      });
    });
  });
}

function initLightbox() {
  const links = [...document.querySelectorAll("[data-lightbox]")];
  if (!links.length) return;
  const dialog = ensureDialog("lightbox");
  dialog.classList.add("lightbox");
  bindDialog(dialog);
  links.forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      dialog.querySelector(".modal-body").innerHTML = `
        <figure>
          <img src="${esc(link.href)}" alt="">
          <figcaption>${esc(link.dataset.caption || "")}</figcaption>
        </figure>`;
      dialog.showModal();
    });
  });
}

function initForms() {
  const params = new URLSearchParams(window.location.search);
  const topic = params.get("topic");
  const select = document.querySelector('select[name="topic"]');
  if (topic && select) {
    const match = [...select.options].find((option) => option.value.toLowerCase() === topic.toLowerCase());
    if (match) select.value = match.value;
  }

  document.querySelectorAll("form[data-mail]").forEach((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const honey = form.querySelector('[name="company"]');
      if (honey && honey.value.trim()) {
        form.hidden = true;
        const decoy = form.parentElement.querySelector(".form-success");
        if (decoy) decoy.hidden = false;
        return;
      }

      const lines = [];
      const data = new FormData(form);
      for (const [key, value] of data.entries()) {
        if (key === "company") continue;
        const field = form.querySelector(`[name="${CSS.escape(key)}"]`);
        const label = field?.dataset.label || key;
        const text = String(value).trim();
        if (!text) continue;
        lines.push(`${label}: ${text}`);
      }

      const subject = form.dataset.subject || "Same Streets inquiry";
      window.location.href = `mailto:${MAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(lines.join("\n\n"))}`;

      const success = form.parentElement.querySelector(".form-success");
      form.hidden = true;
      if (success) success.hidden = false;
    });
  });
}

function initSocial() {
  document.querySelectorAll("[data-soon]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      showToast("Social channels are almost online. Write samestreetspresents@gmail.com and we'll point you to the noise.");
    });
  });
}

function showToast(message) {
  let toast = document.querySelector(".toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.className = "toast";
    toast.setAttribute("role", "status");
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("is-on");
  window.clearTimeout(showToast.timer);
  showToast.timer = window.setTimeout(() => toast.classList.remove("is-on"), 4200);
}

function initReveal() {
  const nodes = [...document.querySelectorAll("[data-reveal]")];
  if (!nodes.length) return;
  if (reducedMotion || !("IntersectionObserver" in window)) {
    nodes.forEach((node) => node.classList.add("is-in"));
    return;
  }
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("is-in");
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
  nodes.forEach((node) => observer.observe(node));
}

function initYear() {
  const year = String(new Date().getFullYear());
  document.querySelectorAll("[data-year]").forEach((node) => {
    node.textContent = year;
  });
}

initHeader();
initHero();
initShows();
initSession();
initLightbox();
initForms();
initSocial();
initReveal();
initYear();
