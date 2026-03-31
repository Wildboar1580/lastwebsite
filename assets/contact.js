const form = document.querySelector("#contact-form");
const status = document.querySelector("#contact-status");

if (form) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const email = String(data.get("email") || "").trim();
    const subject = String(data.get("subject") || "").trim();
    const message = String(data.get("message") || "").trim();
    const submit = form.querySelector("button[type='submit']");

    if (status) {
      status.textContent = "Sending message...";
      status.dataset.state = "pending";
    }

    if (submit) {
      submit.disabled = true;
    }

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "content-type": "application/json"
        },
        body: JSON.stringify({
          name,
          email,
          subject,
          message,
          company: String(data.get("company") || "")
        })
      });

      const result = await response.json();
      if (!response.ok || !result.ok) {
        throw new Error(result.message || "The message could not be sent.");
      }

      form.reset();
      if (status) {
        status.textContent = result.message || "Your message has been sent.";
        status.dataset.state = "success";
      }
    } catch (error) {
      if (status) {
        status.textContent = error.message || "The message could not be sent right now.";
        status.dataset.state = "error";
      }
    } finally {
      if (submit) {
        submit.disabled = false;
      }
    }
  });
}
