(function () {
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  var projectFilters = document.querySelectorAll(".project-filter");
  var projectCards = document.querySelectorAll(".project-card");
  var projectsEmpty = document.getElementById("projects-empty");
  if (projectFilters.length && projectCards.length) {
    projectFilters.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var filter = btn.getAttribute("data-filter") || "all";
        projectFilters.forEach(function (other) {
          var active = other === btn;
          other.classList.toggle("is-active", active);
          other.setAttribute("aria-pressed", active ? "true" : "false");
        });
        var visible = 0;
        projectCards.forEach(function (card) {
          var tags = (card.getAttribute("data-tags") || "").split(/\s+/);
          var show = filter === "all" || tags.indexOf(filter) !== -1;
          card.classList.toggle("is-hidden", !show);
          if (show) visible += 1;
        });
        if (projectsEmpty) projectsEmpty.hidden = visible > 0;
      });
    });
  }

  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    function setOpen(open) {
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      nav.classList.toggle("is-open", open);
      document.body.style.overflow = open ? "hidden" : "";
    }

    toggle.addEventListener("click", function () {
      setOpen(!nav.classList.contains("is-open"));
    });

    var backdrop = nav.querySelector(".site-nav__backdrop");
    if (backdrop) {
      backdrop.addEventListener("click", function () {
        setOpen(false);
      });
    }

    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        setOpen(false);
      });
    });

    window.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setOpen(false);
    });
  }

  var explorer = document.querySelector("[data-deliver-explorer]");
  if (explorer) {
    var items = explorer.querySelectorAll(".deliver-item");

    function openItem(target) {
      items.forEach(function (item) {
        var on = item === target;
        var trigger = item.querySelector(".deliver-item__trigger");
        var panel = item.querySelector(".deliver-item__panel");
        item.classList.toggle("is-open", on);
        if (trigger) trigger.setAttribute("aria-expanded", on ? "true" : "false");
        if (panel) {
          if (on) panel.removeAttribute("hidden");
          else panel.setAttribute("hidden", "");
        }
      });
    }

    items.forEach(function (item) {
      var trigger = item.querySelector(".deliver-item__trigger");
      if (!trigger) return;
      trigger.addEventListener("click", function () {
        if (item.classList.contains("is-open")) return;
        openItem(item);
      });
    });
  }

  var header = document.querySelector(".site-header");
  var videoHero = document.querySelector(".hero--video");
  if (header && videoHero && document.body.classList.contains("has-video-hero")) {
    function syncHeader() {
      var past = window.scrollY > Math.max(24, videoHero.offsetHeight * 0.35);
      header.classList.toggle("is-solid", past);
    }
    syncHeader();
    window.addEventListener("scroll", syncHeader, { passive: true });

    var video = videoHero.querySelector(".hero-video__media");
    if (video) {
      var tryPlay = function () {
        var playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {});
        }
      };
      tryPlay();
      video.addEventListener("loadeddata", tryPlay);
    }
  }

  document.querySelectorAll("[data-case-carousel]").forEach(function (root) {
    var thumbs = Array.prototype.slice.call(root.querySelectorAll("[data-carousel-index]"));
    var image = root.querySelector(".case-carousel__image");
    var currentEl = root.querySelector("[data-carousel-current]");
    var totalEl = root.querySelector("[data-carousel-total]");
    var prevBtn = root.querySelector("[data-carousel-prev]");
    var nextBtn = root.querySelector("[data-carousel-next]");
    var stage = root.querySelector(".case-carousel__stage");
    if (!thumbs.length || !image) return;

    var index = 0;
    var total = thumbs.length;
    var touchX = null;
    if (totalEl) totalEl.textContent = String(total);

    function show(nextIndex) {
      index = (nextIndex + total) % total;
      var thumb = thumbs[index];
      var src = thumb.getAttribute("data-src");
      var alt = thumb.getAttribute("data-alt") || "";
      var position = thumb.getAttribute("data-position") || "center 55%";

      image.classList.add("is-fading");
      window.setTimeout(function () {
        image.src = src;
        image.alt = alt;
        image.style.objectPosition = position;
        image.classList.remove("is-fading");
      }, 140);

      thumbs.forEach(function (btn, i) {
        var on = i === index;
        btn.classList.toggle("is-active", on);
        btn.setAttribute("aria-selected", on ? "true" : "false");
        btn.tabIndex = on ? 0 : -1;
      });
      if (currentEl) currentEl.textContent = String(index + 1);
    }

    thumbs.forEach(function (btn) {
      btn.addEventListener("click", function () {
        show(Number(btn.getAttribute("data-carousel-index")) || 0);
      });
    });

    if (prevBtn) {
      prevBtn.addEventListener("click", function () {
        show(index - 1);
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener("click", function () {
        show(index + 1);
      });
    }

    root.addEventListener("keydown", function (e) {
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        show(index - 1);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        show(index + 1);
      }
    });

    if (stage) {
      stage.addEventListener(
        "touchstart",
        function (e) {
          touchX = e.changedTouches[0].clientX;
        },
        { passive: true }
      );
      stage.addEventListener(
        "touchend",
        function (e) {
          if (touchX == null) return;
          var dx = e.changedTouches[0].clientX - touchX;
          touchX = null;
          if (Math.abs(dx) < 40) return;
          show(dx < 0 ? index + 1 : index - 1);
        },
        { passive: true }
      );
    }

    root.setAttribute("tabindex", "0");
    show(0);
  });
})();
