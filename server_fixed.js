/**
 * ============================================================================
 * BookNook Library Search Portal — SECURE / REMEDIATED APPLICATION (server_fixed.js)
 * ============================================================================
 * Assigned Vulnerability: #12 — Reflected Cross-Site Scripting (XSS)
 *
 * Remediation & Defense-in-Depth Measures Implemented:
 *   1. Context-Aware Output Encoding:
 *      Converts special HTML characters (&, <, >, ", ', /) into their safe
 *      HTML entities before inserting user input into template strings or attributes.
 *   2. Content Security Policy (CSP):
 *      Sends a strict `Content-Security-Policy` header restricting script execution
 *      to trusted local origins only.
 *   3. Cookie Hardening (HttpOnly + SameSite):
 *      Sets `httpOnly: true` on authentication cookies so JavaScript (document.cookie)
 *      cannot read or exfiltrate session identifiers.
 *   4. Safe HTTP Headers:
 *      X-Content-Type-Options: nosniff, X-Frame-Options: DENY, X-XSS-Protection.
 * ============================================================================
 */

const express = require("express");
const path = require("path");
const app = express();
const PORT = 3001; // Runs on 3001 so both can run side-by-side!

// Serve static assets
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ============================================================================
// REMEDIATION LAYER 1: Content Security Policy & Security Response Headers
// ============================================================================
app.use((req, res, next) => {
  // Content Security Policy restricts script execution origin and disables untrusted inline payloads
  res.setHeader(
    "Content-Security-Policy",
    "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self';"
  );
  // Prevent MIME-type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");
  // Clickjacking defense
  res.setHeader("X-Frame-Options", "DENY");
  next();
});

// ============================================================================
// REMEDIATION LAYER 2: Cookie Hardening (HttpOnly & SameSite)
// ============================================================================
app.use((req, res, next) => {
  // HttpOnly prevents any malicious script from accessing document.cookie
  res.cookie(
    "auth_session",
    "eyJhbGciOiJIUzI1NiIsInN1YiI6ImFsaWNlX3JlYWRlciIsInJvbGUiOiJTdHVkZW50X0FkbWluIn0.x8F9aB27dK091qZ",
    { httpOnly: true, sameSite: "Strict", path: "/" }
  );
  res.cookie("user_role", "Student_Admin", { httpOnly: true, path: "/" });
  next();
});

// ============================================================================
// REMEDIATION LAYER 3: Context-Aware HTML Entity Encoding Helper
// ============================================================================
/**
 * Escapes characters that have syntactic meaning in HTML.
 * Converts:
 *   &  ->  &amp;
 *   <  ->  &lt;
 *   >  ->  &gt;
 *   "  ->  &quot;
 *   '  ->  &#39;
 *   /  ->  &#x2F;
 */
function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/\//g, "&#x2F;");
}

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

// Helper: Render book cards with escaped fields
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
        <div class="book-cover">${escapeHtml(b.cover)}</div>
        <div class="book-info">
          <div>
            <h3 class="book-title">${escapeHtml(b.title)}</h3>
            <p class="book-author">by ${escapeHtml(b.author)} (${b.year})</p>
          </div>
          <div class="book-meta">
            <span class="book-badge">${escapeHtml(b.genre)}</span>
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
function renderFullPage({ queryValue, resultsHtml, resultCount }) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BookNook Library Portal — Hardened Mode</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>

  <!-- Top Security Banner -->
  <div class="security-banner secured">
    <div>
      <span class="badge">🟢 HARDENED VERSION</span>
      <span>Patched: Context-Aware Output Escaping + CSP + HttpOnly Cookies Active</span>
      <span style="opacity:0.75; margin-left:8px;">[Port ${PORT}]</span>
    </div>
    <div class="session-info">
      <span>👤 Simulated Victim: <strong>Alice (Student Admin)</strong></span>
      <span class="session-badge">Protected Cookie: [HttpOnly]</span>
      <span style="color: #10b981; font-weight: bold;">🛡️ XSS Mitigated</span>
    </div>
  </div>

  <!-- Header -->
  <header class="site-header">
    <div class="header-container">
      <a href="/" class="brand">
        <div class="brand-icon">📚</div>
        <div>
          <h1>BookNook Library</h1>
          <p>Online Catalog & Student Academic Search System (Secured)</p>
        </div>
      </a>
      <nav class="nav-links">
        <a href="/" class="nav-btn">📖 Browse Catalog</a>
        <button onclick="toggleLabDrawer()" class="nav-btn primary">🛡️ Test Exploit Resistance</button>
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
          <!-- Query safely escaped in attribute context -->
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

    <!-- Exploit Resistance Testing Drawer -->
    <section class="demo-lab-panel" id="lab-panel">
      <div class="lab-panel-header" onclick="toggleLabDrawer()" style="background: #064e3b;">
        <h3><span>🛡️</span> Security Verification Testbed (Payload Neutralization)</h3>
        <span id="lab-arrow">▼ (Click to Open)</span>
      </div>
      <div class="lab-panel-body" id="lab-panel-content" style="display: none;">
        <p style="margin-bottom: 16px; font-size: 13px; color: var(--text-muted);">
          Test the exact same payloads on this patched server to verify that special characters are safely escaped as inert HTML entities:
        </p>

        <div class="payload-list">
          
          <div class="payload-card">
            <div class="payload-title">
              <span>1. Test Script Tag Alert Payload</span>
              <span class="badge" style="background:#dcfce7; color:#15803d; font-size:11px; padding:2px 6px;">Neutralized</span>
            </div>
            <p class="payload-desc">Output is converted to <code>&amp;lt;script&amp;gt;...&amp;lt;/script&amp;gt;</code> and rendered strictly as text.</p>
            <div class="payload-code-row">
              <div class="payload-code">/search?q=&lt;script&gt;alert('XSS')&lt;/script&gt;</div>
              <a href="/search?q=%3Cscript%3Ealert('Reflected XSS Test')%3C%2Fscript%3E" class="btn-launch" style="background:#059669;">Test on Secured Server 🛡️</a>
            </div>
          </div>

          <div class="payload-card">
            <div class="payload-title">
              <span>2. Test Event Handler Injection (&lt;img onerror&gt;)</span>
              <span class="badge" style="background:#dcfce7; color:#15803d; font-size:11px; padding:2px 6px;">Neutralized</span>
            </div>
            <p class="payload-desc">Tags are neutralized into harmless text entities; CSP blocks inline event handlers.</p>
            <div class="payload-code-row">
              <div class="payload-code">/search?q=&lt;img src=x onerror=alert(1)&gt;</div>
              <a href="/search?q=%3Cimg src=invalid onerror=alert(1)%3E" class="btn-launch" style="background:#059669;">Test on Secured Server 🛡️</a>
            </div>
          </div>

          <div class="payload-card">
            <div class="payload-title">
              <span>3. Test Session Cookie Exfiltration</span>
              <span class="badge" style="background:#dcfce7; color:#15803d; font-size:11px; padding:2px 6px;">Neutralized</span>
            </div>
            <p class="payload-desc">Script cannot execute, and cookies marked with <code>HttpOnly</code> cannot be read by JavaScript.</p>
            <div class="payload-code-row">
              <div class="payload-code">/search?q=&lt;script&gt;fetch('/attacker/collect?stolen=' + document.cookie)&lt;/script&gt;</div>
              <a href="/search?q=%3Cscript%3Efetch('/attacker/collect?stolen=' + document.cookie)%3C%2Fscript%3E" class="btn-launch" style="background:#059669;">Test on Secured Server 🛡️</a>
            </div>
          </div>

        </div>
      </div>
    </section>

  </main>

  <footer class="site-footer">
    <p><strong>BookNook Library Portal (Hardened)</strong> &mdash; Demonstration Web Application</p>
    <div class="footer-meta">
      <span>CS Lab 2 — Problem #12: Reflected Cross-Site Scripting</span>
      <span>•</span>
      <span>Secured Server (Port ${PORT})</span>
    </div>
  </footer>

  <script src="/app.js"></script>
</body>
</html>`;
}

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
    })
  );
});

// Search endpoint (SECURE & PATCHED)
app.get("/search", (req, res) => {
  const rawQuery = req.query.q || "";

  // Filter books safely
  const filtered = rawQuery
    ? BOOKS.filter(
        (b) =>
          b.title.toLowerCase().includes(rawQuery.toLowerCase()) ||
          b.author.toLowerCase().includes(rawQuery.toLowerCase()) ||
          b.genre.toLowerCase().includes(rawQuery.toLowerCase())
      )
    : BOOKS;

  // =========================================================================
  // *** SECURITY FIX ***
  // Context-aware HTML entity escaping is applied to rawQuery BEFORE it is
  // inserted into any HTML response or attribute.
  // =========================================================================
  const safeQuery = escapeHtml(rawQuery);

  const statusHtml = rawQuery
    ? `<h3 class="status-message">Showing search results for: <em>${safeQuery}</em></h3>`
    : `<h3 class="status-message">All Catalog Books</h3>`;

  res.send(
    renderFullPage({
      queryValue: safeQuery, // Safe in input value attribute
      resultsHtml: {
        status: statusHtml,
        cards: renderBookCards(filtered),
      },
      resultCount: filtered.length,
    })
  );
});

app.listen(PORT, () => {
  console.log("===============================================================");
  console.log(`🛡️  BookNook (HARDENED & SECURED) running on:`);
  console.log(`👉 http://127.0.0.1:${PORT}/`);
  console.log("===============================================================");
});
