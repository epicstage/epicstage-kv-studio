// ZIP download utility (uses JSZip from CDN or dynamic import)

export async function downloadAsZip(
  items: Array<{ name: string; data: string | Blob }>,
  filename: string
) {
  // Dynamic import JSZip
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();

  for (const item of items) {
    if (typeof item.data === "string") {
      // base64 data URL
      const base64 = item.data.split(",")[1] || item.data;
      zip.file(item.name, base64, { base64: true });
    } else {
      zip.file(item.name, item.data);
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// Simple PDF generation (guideline summary)
export function generateGuidelinePdf(guideline: any, eventName: string) {
  // Create a printable HTML and trigger print
  const w = window.open("", "_blank");
  if (!w) return;

  const colors = Object.entries(guideline.color_palette || {})
    .map(([k, v]: [string, any]) => `<div style="display:flex;align-items:center;gap:8px;margin:4px 0"><div style="width:24px;height:24px;border-radius:4px;background:${v.hex}"></div><span style="font-family:monospace;font-size:12px">${k}: ${v.hex}</span><span style="color:#888;font-size:11px">${v.usage}</span></div>`)
    .join("");

  const mood = (guideline.mood?.keywords || []).map((k: string) => `<span style="display:inline-block;padding:2px 10px;border-radius:100px;background:#f0f0f0;font-size:11px;margin:2px">${k}</span>`).join("");

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${eventName} — 디자인 가이드라인</title>
<style>body{font-family:-apple-system,sans-serif;max-width:800px;margin:40px auto;padding:0 20px;color:#222}
h1{font-size:24px;margin-bottom:4px}h2{font-size:16px;color:#666;margin-top:24px;border-bottom:1px solid #eee;padding-bottom:8px}
.meta{color:#888;font-size:13px;margin-bottom:24px}pre{background:#f8f8f8;padding:12px;border-radius:8px;font-size:11px;overflow-x:auto}</style></head>
<body>
<h1>${guideline.event_summary?.name || eventName}</h1>
<div class="meta">${guideline.event_summary?.date || ""} · ${guideline.event_summary?.venue || ""} · ${guideline.event_summary?.organizer || ""}</div>
${guideline.event_summary?.slogan ? `<p style="font-style:italic;color:#555">"${guideline.event_summary.slogan}"</p>` : ""}
<h2>컬러 팔레트</h2>${colors}
<h2>무드</h2><div>${mood}</div><div style="margin-top:8px;color:#666;font-size:13px">톤: ${guideline.mood?.tone || ""}</div>
<h2>타이포그래피</h2><pre>${JSON.stringify(guideline.typography, null, 2)}</pre>
<h2>그래픽 모티프</h2><pre>${JSON.stringify(guideline.graphic_motifs, null, 2)}</pre>
<h2>레이아웃 가이드</h2><pre>${JSON.stringify(guideline.layout_guide, null, 2)}</pre>
</body></html>`;

  w.document.write(html);
  w.document.close();
  setTimeout(() => w.print(), 500);
}
