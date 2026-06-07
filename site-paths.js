(function (global) {
  'use strict';

  function siteRoot() {
    var path = global.location.pathname;
    var marker = '/blogs/';
    var i = path.indexOf(marker);
    if (i >= 0) return path.slice(0, i + 1);
    try {
      return new URL('./', global.location.href).pathname;
    } catch (e) {
      var last = path.lastIndexOf('/');
      return last > 0 ? path.slice(0, last + 1) : '/';
    }
  }

  var root = siteRoot();
  global.SITE_PATHS = {
    root: root,
    home: root,
    blogs: root + 'blogs/',
  };
})(window);
