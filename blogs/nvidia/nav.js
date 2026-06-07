(function () {
  var search = document.getElementById("search");
  var sidebar = document.getElementById("sidebar");
  var toggle = document.getElementById("menu-toggle");

  if (toggle && sidebar) {
    toggle.addEventListener("click", function () {
      sidebar.classList.toggle("open");
    });
  }

  if (search) {
    search.addEventListener("input", function () {
      var q = search.value.trim().toLowerCase();
      document.querySelectorAll(".nav-link").forEach(function (link) {
        var text = link.textContent.toLowerCase();
        link.classList.toggle("hidden", q && text.indexOf(q) === -1);
      });
      document.querySelectorAll(".nav-section").forEach(function (section) {
        var visible = section.querySelectorAll(".nav-link:not(.hidden)").length;
        section.style.display = visible ? "" : "none";
      });
    });
  }

  var backBlogs = document.getElementById("site-back-blogs");
  var backHome = document.getElementById("site-back-home");
  if (window.SITE_PATHS) {
    if (backBlogs) backBlogs.href = SITE_PATHS.blogs;
    if (backHome) backHome.href = SITE_PATHS.home;
  }
})();
