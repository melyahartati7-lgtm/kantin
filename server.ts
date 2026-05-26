import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests
  app.use(express.json());

  // API proxy GET route to bypass CORS / iframe sandboxing
  app.get("/api/proxy", async (req, res) => {
    const targetUrl = req.query.url as string;
    if (!targetUrl) {
      return res.status(400).json({ status: "ERROR", message: "Parameter 'url' diperlukan." });
    }

    try {
      console.log(`[Proxy GET] Meminta data dari: ${targetUrl}`);
      const response = await fetch(targetUrl);
      if (!response.ok) {
        return res.status(response.status).json({
          status: "ERROR",
          message: `Server mengembalikan status HTTP ${response.status}: ${response.statusText}`,
        });
      }
      
      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.json(json);
      } catch {
        let errMsg = "Server mengembalikan format non-JSON. Harap periksa apakah Apps Script Anda telah dideploy dengan akses 'Anyone' (Siapa saja, bahkan anonim) dan diotorisasi.";
        if (text.includes("Service-Login") || text.includes("Google Accounts") || text.includes("login") || text.includes("signin")) {
          errMsg = "Izin Ditolak/Memerlukan Autentikasi Google. Pastikan setelan akses 'Who has access' di Apps Script Anda diatur ke 'Anyone' (Siapa saja, bahkan anonim), bukan 'Only myself'.";
        } else if (text.trim().startsWith("<")) {
          const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            errMsg += ` (Kesalahan: ${titleMatch[1]})`;
          }
        } else if (text) {
          errMsg += ` (Isi Respon: ${text.substring(0, 100)}...)`;
        }
        return res.status(422).json({
          status: "ERROR",
          message: errMsg,
          rawResponse: text.substring(0, 500)
        });
      }
    } catch (err: any) {
      console.error("[Proxy GET Error]", err);
      return res.status(500).json({
        status: "ERROR",
        message: `Gagal mengambil data dari server: ${err.message || err}`,
      });
    }
  });

  // API proxy POST route to bypass CORS / iframe sandboxing
  app.post("/api/proxy", async (req, res) => {
    const { url, ...payload } = req.body;
    if (!url) {
      return res.status(400).json({ status: "ERROR", message: "Properti 'url' diperlukan di body request." });
    }

    try {
      console.log(`[Proxy POST] Mengirim data ke: ${url}`);
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return res.status(response.status).json({
          status: "ERROR",
          message: `Server mengembalikan status HTTP ${response.status}: ${response.statusText}`,
        });
      }

      const text = await response.text();
      try {
        const json = JSON.parse(text);
        return res.json(json);
      } catch {
        let errMsg = "Server mengembalikan format non-JSON. Harap periksa apakah Apps Script Anda telah dideploy dengan akses 'Anyone' (Siapa saja, bahkan anonim) dan diotorisasi.";
        if (text.includes("Service-Login") || text.includes("Google Accounts") || text.includes("login") || text.includes("signin")) {
          errMsg = "Izin Ditolak/Memerlukan Autentikasi Google. Pastikan setelan akses 'Who has access' di Apps Script Anda diatur ke 'Anyone' (Siapa saja, bahkan anonim), bukan 'Only myself'.";
        } else if (text.trim().startsWith("<")) {
          const titleMatch = text.match(/<title>([^<]+)<\/title>/i);
          if (titleMatch && titleMatch[1]) {
            errMsg += ` (Kesalahan: ${titleMatch[1]})`;
          }
        } else if (text) {
          errMsg += ` (Isi Respon: ${text.substring(0, 100)}...)`;
        }
        return res.status(422).json({
          status: "ERROR",
          message: errMsg,
          rawResponse: text.substring(0, 500)
        });
      }
    } catch (err: any) {
      console.error("[Proxy POST Error]", err);
      return res.status(500).json({
        status: "ERROR",
        message: `Gagal mengirim data ke server: ${err.message || err}`,
      });
    }
  });

  // Health check API
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
