---
layout: null
sitemap: false
---
{% if site.github and site.github.build_revision %}{% assign cache_bust = site.github.build_revision %}{% else %}{% assign cache_bust = site.time | date: "%Y%m%d%H%M%S" %}{% endif %}
// Search is loaded on demand: neither the Lunr library nor the search index are
// downloaded or indexed until the reader actually interacts with the search box.
(function () {
  var LUNR_URL = "{{ site.baseurl }}/assets/js/lunr.js?v={{ cache_bust }}";
  var DATA_URL = "{{ site.baseurl }}/assets/js/search-data.json?v={{ cache_bust }}";

  var documents = null;
  var idx = null;
  var loader = null;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var script = document.createElement("script");
      script.src = src;
      script.onload = resolve;
      script.onerror = function () {
        reject(new Error("Failed to load " + src));
      };
      document.head.appendChild(script);
    });
  }

  function buildIndex() {
    if (loader) return loader;

    loader = Promise.all([
      loadScript(LUNR_URL),
      fetch(DATA_URL).then(function (response) {
        if (!response.ok) throw new Error("Failed to load the search index");
        return response.json();
      }),
    ]).then(function (results) {
      documents = results[1];
      idx = lunr(function () {
        this.ref("id");
        this.field("title");
        this.field("body");

        documents.forEach(function (doc) {
          this.add(doc);
        }, this);
      });
    });

    return loader;
  }

  function resultsContainer() {
    return document.getElementById("lunrsearchresults");
  }

  function closeResults() {
    var container = resultsContainer();
    if (container) container.innerHTML = "";
    document.body.classList.remove("modal-open");
  }

  function openResults(term) {
    var container = resultsContainer();
    if (!container) return null;

    container.innerHTML =
      '<div id="resultsmodal" class="modal fade show d-block" tabindex="-1" role="dialog" aria-labelledby="resultsmodal-title">' +
      '<div class="modal-dialog shadow-lg" role="document"><div class="modal-content">' +
      '<div class="modal-header" id="modtit">' +
      '<button type="button" class="close" data-dismiss="modal" aria-label="Close">&times;</button>' +
      "</div>" +
      '<div class="modal-body"><ul class="mb-0"></ul></div>' +
      '<div class="modal-footer"><button type="button" class="btn btn-danger btn-sm" data-dismiss="modal">Close</button></div>' +
      "</div></div></div>";
    document.body.classList.add("modal-open");

    var heading = document.createElement("h5");
    heading.className = "modal-title";
    heading.id = "resultsmodal-title";
    heading.textContent = "Search results for '" + term + "'";
    var header = container.querySelector("#modtit");
    header.insertBefore(heading, header.firstChild);

    return container.querySelector("ul");
  }

  function renderMessage(list, message) {
    var item = document.createElement("li");
    item.className = "lunrsearchresult";
    item.textContent = message;
    list.appendChild(item);
  }

  function renderResults(list, results) {
    if (!results.length) {
      renderMessage(list, "Sorry, no results found. Close & try a different search!");
      return;
    }

    results.forEach(function (result) {
      var doc = documents[result.ref];
      if (!doc) return;

      var item = document.createElement("li");
      item.className = "lunrsearchresult";

      var link = document.createElement("a");
      link.href = doc.url;

      var title = document.createElement("span");
      title.className = "title";
      title.textContent = doc.title;

      var details = document.createElement("small");
      var body = document.createElement("span");
      body.className = "body";
      body.textContent = (doc.body || "").substring(0, 160) + "...";
      var url = document.createElement("span");
      url.className = "url";
      url.textContent = doc.url;

      details.appendChild(body);
      details.appendChild(document.createElement("br"));
      details.appendChild(url);

      link.appendChild(title);
      link.appendChild(document.createElement("br"));
      link.appendChild(details);
      item.appendChild(link);
      list.appendChild(item);
    });
  }

  function search(term) {
    if (!term) {
      closeResults();
      return false;
    }

    var list = openResults(term);
    if (!list) return false;

    renderMessage(list, "Searching...");

    buildIndex()
      .then(function () {
        list.innerHTML = "";
        renderResults(list, idx.search(term));
      })
      .catch(function () {
        list.innerHTML = "";
        renderMessage(list, "Search is unavailable right now, please try again later.");
      });

    return false;
  }

  var input = document.getElementById("lunrsearch");
  var form = document.getElementById("lunrsearchform");

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      search(input ? input.value.trim() : "");
    });
  }

  // Warm the index up as soon as the reader shows intent to search.
  if (input) {
    ["focus", "pointerenter"].forEach(function (eventName) {
      input.addEventListener(eventName, function () {
        buildIndex().catch(function () {});
      }, { once: true });
    });
  }

  document.addEventListener("click", function (event) {
    var target = event.target;
    if (target && target.closest && target.closest('[data-dismiss="modal"]')) {
      closeResults();
    }
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeResults();
  });

  // Kept for backwards compatibility with any inline handlers.
  window.lunr_search = search;
})();
