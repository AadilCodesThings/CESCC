(function () {
  var DATA_URL = "data/whitepapers.json";

  function tagSlug(tag) {
    return String(tag)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");
  }

  function formatDate(ym) {
    if (!ym) return "";
    var parts = ym.split("-");
    if (parts.length < 2) return ym;
    var months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    var month = parseInt(parts[1], 10);
    if (!month || month < 1 || month > 12) return ym;
    return months[month - 1] + " " + parts[0];
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function uniqueTags(papers) {
    var seen = {};
    var tags = [];
    papers.forEach(function (paper) {
      (paper.tags || []).forEach(function (tag) {
        if (seen[tag]) return;
        seen[tag] = true;
        tags.push(tag);
      });
    });
    return tags.sort(function (a, b) {
      return a.localeCompare(b);
    });
  }

  function renderTags(tags) {
    if (!tags || !tags.length) return "";
    return tags
      .map(function (tag) {
        return (
          '<span class="whitepaper-tag">' +
          escapeHtml(tag) +
          "</span>"
        );
      })
      .join("");
  }

  function renderCard(paper, compact) {
    var cls = compact ? "whitepaper-card whitepaper-card--compact" : "whitepaper-card";
    return (
      '<article class="' +
      cls +
      '" data-tags="' +
      (paper.tags || []).map(tagSlug).join(" ") +
      '">' +
      '<div class="whitepaper-card__body">' +
      '<p class="whitepaper-card__date">' +
      escapeHtml(formatDate(paper.date)) +
      "</p>" +
      "<h3 class=\"whitepaper-card__title\">" +
      escapeHtml(paper.title) +
      "</h3>" +
      (paper.summary
        ? '<p class="whitepaper-card__summary">' +
          escapeHtml(paper.summary) +
          "</p>"
        : "") +
      '<div class="whitepaper-card__tags" aria-label="Topics">' +
      renderTags(paper.tags) +
      "</div>" +
      "</div>" +
      '<a class="whitepaper-card__link btn btn-ghost" href="' +
      escapeHtml(paper.file) +
      '" target="_blank" rel="noopener noreferrer">' +
      '<span>Read PDF</span>' +
      '<svg class="whitepaper-card__icon" aria-hidden="true" focusable="false"><use href="#i-document"/></svg>' +
      "</a>" +
      "</article>"
    );
  }

  function fetchPapers() {
    return fetch(DATA_URL).then(function (res) {
      if (!res.ok) throw new Error("Could not load white papers.");
      return res.json();
    });
  }

  function initListing() {
    var grid = document.getElementById("whitepapers-grid");
    var filtersEl = document.getElementById("whitepapers-filters");
    var emptyEl = document.getElementById("whitepapers-empty");
    var countEl = document.getElementById("whitepapers-count");
    if (!grid || !filtersEl) return;

    var papers = [];
    var activeTag = "all";

    function getTagFromUrl() {
      var params = new URLSearchParams(window.location.search);
      return params.get("tag") || "all";
    }

    function setTagInUrl(tag) {
      var url = new URL(window.location.href);
      if (tag === "all") {
        url.searchParams.delete("tag");
      } else {
        url.searchParams.set("tag", tag);
      }
      window.history.replaceState({}, "", url);
    }

    function filteredPapers() {
      if (activeTag === "all") return papers.slice();
      return papers.filter(function (paper) {
        return (paper.tags || []).some(function (tag) {
          return tagSlug(tag) === activeTag;
        });
      });
    }

    function updateCount(count) {
      if (!countEl) return;
      countEl.textContent =
        count === 1 ? "1 white paper" : count + " white papers";
    }

    function renderGrid(list) {
      if (!list.length) {
        grid.innerHTML = "";
        grid.hidden = true;
        if (emptyEl) emptyEl.hidden = false;
        updateCount(0);
        return;
      }
      grid.hidden = false;
      if (emptyEl) emptyEl.hidden = true;
      grid.innerHTML = list.map(function (p) {
        return renderCard(p, false);
      }).join("");
      updateCount(list.length);
    }

    function setActiveFilter(tag) {
      activeTag = tag;
      filtersEl.querySelectorAll("[data-tag]").forEach(function (btn) {
        var isActive = btn.getAttribute("data-tag") === tag;
        btn.classList.toggle("is-active", isActive);
        btn.setAttribute("aria-pressed", isActive ? "true" : "false");
      });
      setTagInUrl(tag);
      renderGrid(filteredPapers());
    }

    function buildFilters(allPapers) {
      var tags = uniqueTags(allPapers);
      var html =
        '<button type="button" class="tag-filter is-active" data-tag="all" aria-pressed="true">All</button>';
      html += tags
        .map(function (tag) {
          return (
            '<button type="button" class="tag-filter" data-tag="' +
            escapeHtml(tagSlug(tag)) +
            '" aria-pressed="false">' +
            escapeHtml(tag) +
            "</button>"
          );
        })
        .join("");
      filtersEl.innerHTML = html;

      filtersEl.addEventListener("click", function (e) {
        var btn = e.target.closest("[data-tag]");
        if (!btn) return;
        setActiveFilter(btn.getAttribute("data-tag"));
      });
    }

    fetchPapers()
      .then(function (data) {
        papers = data.papers || [];
        buildFilters(papers);
        var urlTag = getTagFromUrl();
        var valid =
          urlTag === "all" ||
          papers.some(function (p) {
            return (p.tags || []).some(function (t) {
              return tagSlug(t) === urlTag;
            });
          });
        setActiveFilter(valid ? urlTag : "all");
      })
      .catch(function () {
        grid.innerHTML =
          '<p class="whitepapers-error">White papers could not be loaded. Please try again later.</p>';
      });
  }

  function initTeaser() {
    var container = document.getElementById("featured-whitepapers");
    if (!container) return;

    fetchPapers()
      .then(function (data) {
        var featured = (data.papers || []).filter(function (p) {
          return p.featured;
        });
        if (!featured.length) {
          featured = (data.papers || []).slice(0, 3);
        } else {
          featured = featured.slice(0, 3);
        }
        if (!featured.length) {
          container.innerHTML =
            '<p class="whitepapers-teaser-empty">White papers will be published here soon.</p>';
          return;
        }
        container.innerHTML = featured
          .map(function (p) {
            return renderCard(p, true);
          })
          .join("");
      })
      .catch(function () {
        container.innerHTML =
          '<p class="whitepapers-teaser-empty">Browse our technical library on the white papers page.</p>';
      });
  }

  if (document.getElementById("whitepapers-grid")) initListing();
  if (document.getElementById("featured-whitepapers")) initTeaser();
})();
