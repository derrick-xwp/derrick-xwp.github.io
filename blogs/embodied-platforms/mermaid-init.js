document.addEventListener("DOMContentLoaded", function () {
  var nodes = document.querySelectorAll(".mermaid");
  if (!nodes.length || !window.mermaid) return;
  mermaid.initialize({
    startOnLoad: false,
    theme: "neutral",
    securityLevel: "loose",
    mindmap: {
      padding: 18,
      useMaxWidth: true,
    },
  });
  mermaid.run({ nodes: nodes }).catch(function (err) {
    console.error("Mermaid render failed:", err);
  });
});
