(function () {
  "use strict";

  const config = window.CK_FORMS_CONFIG || {};
  const thanksModal = document.getElementById("lead-thanks-modal");
  const thanksDialog = thanksModal?.querySelector(".lead-thanks-modal__dialog");
  const thanksText = thanksModal?.querySelector("[data-lead-thanks-text]");
  const header = document.querySelector(".header");

  const formLabels = {
    consultation: "Консультация — перезвоните мне",
    callback: "Обратный звонок",
    product: "Заявка на товар",
  };

  function lockScroll() {
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    document.documentElement.classList.add("lock");
    document.body.classList.add("lock");
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      header?.style.setProperty("padding-right", `${scrollbarWidth}px`);
    }
  }

  function unlockScroll() {
    document.documentElement.classList.remove("lock");
    document.body.classList.remove("lock");
    document.body.style.paddingRight = "";
    header?.style.removeProperty("padding-right");
  }

  function openThanksModal(message) {
    if (!thanksModal) return;
    if (thanksText) {
      thanksText.textContent =
        message ||
        "Спасибо! Менеджер скоро свяжется с вами и ответит на все вопросы.";
    }
    thanksModal.hidden = false;
    if (!document.body.classList.contains("lock")) lockScroll();
    requestAnimationFrame(() => thanksModal.classList.add("is-open"));
  }

  function closeThanksModal() {
    if (!thanksModal) return;
    thanksModal.classList.remove("is-open");
    unlockScroll();
    window.setTimeout(() => {
      if (!thanksModal.classList.contains("is-open")) thanksModal.hidden = true;
    }, 260);
  }

  thanksModal?.querySelectorAll("[data-lead-thanks-close]").forEach((el) => {
    el.addEventListener("click", closeThanksModal);
  });

  thanksDialog?.addEventListener("click", (event) => event.stopPropagation());

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && thanksModal?.classList.contains("is-open")) {
      closeThanksModal();
    }
  });

  function closeCallbackModal(keepScrollLocked) {
    const callbackModal = document.getElementById("callback-modal");
    if (!callbackModal) return;
    callbackModal.classList.remove("is-open");
    if (!keepScrollLocked) unlockScroll();
    window.setTimeout(() => {
      if (!callbackModal.classList.contains("is-open")) callbackModal.hidden = true;
    }, 260);
  }

  async function sendLead(payload) {
    const base = document.body.getAttribute("data-base") || "";
    const fields = payload.fields || {};

    try {
      const phpResponse = await fetch(`${base}api/lead.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          subject: payload._subject || "Заявка с сайта Ск-классик",
          fields,
        }),
      });

      const phpData = await phpResponse.json().catch(() => ({}));
      if (phpResponse.ok && phpData.success) {
        return phpData;
      }

      if (phpData.message) {
        throw new Error(phpData.message);
      }
    } catch (phpError) {
      console.warn("[CK Forms] PHP lead endpoint failed, trying FormSubmit", phpError);
    }

    const email = (
      window.CK_FORMS_CONFIG?.email ||
      window.CK_SITE_CONFIG?.email ||
      config.email ||
      ""
    ).trim();

    if (!email || email === "your@email.com") {
      console.warn(
        "[CK Forms] Укажите email в site-config.js (поле CK_SITE_CONFIG.email)",
      );
      return { success: true, demo: true };
    }

    const response = await fetch(
      `https://formsubmit.co/ajax/${encodeURIComponent(email)}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          _subject: payload._subject || "Заявка с сайта Ск-классик",
          _template: "table",
          _captcha: "false",
          _replyto: fields.email || fields.Email || "",
          ...fields,
        }),
      },
    );

    const data = await response.json();
    if (!response.ok || data.success === false) {
      throw new Error(data.message || "Не удалось отправить заявку");
    }

    return data;
  }

  function collectFormFields(form) {
    const fields = {};
    new FormData(form).forEach((value, key) => {
      if (key.startsWith("_")) return;
      fields[key] = String(value).trim();
    });
    return fields;
  }

  function bindLeadForms() {
    document.querySelectorAll("[data-lead-form]").forEach((form) => {
      if (form.dataset.leadBound === "true") return;
      form.dataset.leadBound = "true";

      form.addEventListener("submit", async (event) => {
        event.preventDefault();

        const formType = form.dataset.leadForm || "lead";
        const submitBtn = form.querySelector('[type="submit"]');
        const fields = collectFormFields(form);

        if (submitBtn) {
          submitBtn.disabled = true;
          submitBtn.dataset.originalText = submitBtn.textContent;
          submitBtn.textContent = "Отправка…";
        }

        try {
          await sendLead({
            _subject: formLabels[formType] || "Заявка с сайта Ск-классик",
            fields: {
              "Тип заявки": formLabels[formType] || formType,
              "Страница": document.title,
              "URL": window.location.href,
              ...fields,
            },
          });

          form.reset();

          if (formType === "callback") {
            closeCallbackModal(true);
          }

          openThanksModal();
        } catch (error) {
          console.error(error);
          const phone = window.CK_SITE_CONFIG?.phoneDisplay || "+7 (964) 510-67-47";
          window.alert(
            `Не удалось отправить заявку. Попробуйте позже или позвоните нам: ${phone}`,
          );
        } finally {
          if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent =
              submitBtn.dataset.originalText || "Отправить";
          }
        }
      });
    });
  }

  bindLeadForms();

  window.CKForms = {
    sendLead,
    openThanksModal,
    closeThanksModal,
  };
})();
