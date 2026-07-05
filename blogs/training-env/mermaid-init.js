document.addEventListener("DOMContentLoaded", function () {
  var nodes = document.querySelectorAll(".mermaid");
  if (!nodes.length || !window.mermaid) return;

  var inDarkPanel = document.querySelector(".te-papers-module .mermaid");
  var themeVars = inDarkPanel
    ? {
        fontFamily: '"Source Sans 3", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: "13px",
        lineColor: "#7ecbff",
        primaryTextColor: "#e8f4ff",
        secondaryTextColor: "#c7d9f5",
        tertiaryTextColor: "#8ba3c4",
        primaryColor: "#1e3a5f",
        primaryBorderColor: "#60a5fa",
        secondaryColor: "#162544",
        secondaryBorderColor: "#3b82f6",
        tertiaryColor: "#0c1428",
        mainBkg: "#162544",
        nodeBorder: "#60a5fa",
        clusterBkg: "rgba(22,37,68,0.85)",
        clusterBorder: "#3b82f6",
        titleColor: "#7ecbff",
        edgeLabelBackground: "#111d38",
      }
    : {
        fontFamily: '"Source Sans 3", "PingFang SC", "Microsoft YaHei", sans-serif',
        fontSize: "14px",
        lineColor: "#94a3b8",
        primaryTextColor: "#1e293b",
        tertiaryTextColor: "#475569",
      };

  mermaid.initialize({
    startOnLoad: false,
    theme: "base",
    themeVariables: themeVars,
    flowchart: {
      htmlLabels: true,
      curve: "basis",
      padding: 18,
      nodeSpacing: 36,
      rankSpacing: 48,
      diagramPadding: 12,
    },
    securityLevel: "loose",
  });
  mermaid.run({ nodes: nodes }).catch(function (err) {
    console.error("Mermaid render failed:", err);
  }).finally(function () {
    if (window.initTrainingEnvInteractive) {
      window.initTrainingEnvInteractive(document.querySelector(".te-papers-detail .te-detail-article")
        || document.querySelector(".blog-training-panel .article")
        || document.querySelector(".blog-embodied-overview-article"));
    }
  });
});
