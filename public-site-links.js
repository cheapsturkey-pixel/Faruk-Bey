const publicSiteUrl = String(window.YUVA_PUBLIC_SITE_URL || "").replace(/\/$/, "");
if (publicSiteUrl && !publicSiteUrl.includes("PUBLIC-SITE-DOMAIN")) {
  document.querySelectorAll("[data-public-site-link]").forEach(link => {
    link.href = publicSiteUrl;
  });
}
