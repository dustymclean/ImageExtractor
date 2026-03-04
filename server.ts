import express from "express";
import { createServer as createViteServer } from "vite";
import * as cheerio from "cheerio";
import path from "path";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API route to extract images
  app.post("/api/extract", async (req, res) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    try {
      let targetUrl = url;
      if (!targetUrl.startsWith("http")) {
        targetUrl = `https://${targetUrl}`;
      }

      const response = await fetch(targetUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch website: ${response.statusText}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      const images: { url: string; alt: string; type: string }[] = [];

      const baseUrl = new URL(targetUrl);

      const resolveUrl = (src: string | undefined) => {
        if (!src) return null;
        try {
          return new URL(src, baseUrl.href).href;
        } catch (e) {
          return null;
        }
      };

      // Extract <img> tags
      $("img").each((_, el) => {
        const src = $(el).attr("src") || $(el).attr("data-src") || $(el).attr("data-lazy-src");
        const alt = $(el).attr("alt") || "";
        const resolved = resolveUrl(src);
        if (resolved) {
          images.push({ url: resolved, alt, type: "img" });
        }
      });

      // Extract background images from inline styles
      $("[style*='background-image']").each((_, el) => {
        const style = $(el).attr("style");
        const match = style?.match(/url\(['"]?([^'"]+)['"]?\)/);
        if (match && match[1]) {
          const resolved = resolveUrl(match[1]);
          if (resolved) {
            images.push({ url: resolved, alt: "Background Image", type: "background" });
          }
        }
      });

      // Extract meta tags (og:image)
      $('meta[property="og:image"]').each((_, el) => {
        const src = $(el).attr("content");
        const resolved = resolveUrl(src);
        if (resolved) {
          images.push({ url: resolved, alt: "OG Image", type: "meta" });
        }
      });

      // Extract direct image links from HTML source using regex
      // Matches common image extensions: .jpg, .jpeg, .png, .gif, .svg, .webp
      const imageRegex = /(https?:\/\/[^\s'"]+\.(?:jpg|jpeg|png|gif|svg|webp))/gi;
      let match;
      while ((match = imageRegex.exec(html)) !== null) {
        const url = match[1];
        images.push({ url, alt: "Direct Link", type: "link" });
      }

      // Also look for relative links with extensions
      const relativeImageRegex = /(['"])([^'"]+\.(?:jpg|jpeg|png|gif|svg|webp))\1/gi;
      while ((match = relativeImageRegex.exec(html)) !== null) {
        const src = match[2];
        // Only resolve if it's not already a full URL (to avoid double processing)
        if (!src.startsWith('http')) {
          const resolved = resolveUrl(src);
          if (resolved) {
            images.push({ url: resolved, alt: "Relative Link", type: "link" });
          }
        }
      }

      // Remove duplicates
      const uniqueImages = Array.from(new Map(images.map(img => [img.url, img])).values());

      res.json({ images: uniqueImages });
    } catch (error: any) {
      console.error("Extraction error:", error);
      res.status(500).json({ error: error.message || "Failed to extract images" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
