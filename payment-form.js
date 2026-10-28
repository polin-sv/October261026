/**
 * Платёжная форма: маски ввода, валидация и имитация оплаты.
 * Поля: имя, фамилия, email, номер карты, срок действия, CCV.
 */
(function () {
  "use strict";

  const form = document.getElementById("payment-form");
  const firstNameInput = document.getElementById("first-name");
  const lastNameInput = document.getElementById("last-name");
  const emailInput = document.getElementById("email");
  const cardNumberInput = document.getElementById("card-number");
  const expiryInput = document.getElementById("expiry-date");
  const cvvInput = document.getElementById("cvv");
  const cardBrandEl = document.getElementById("card-brand");
  const submitBtn = document.getElementById("submit-btn");
  const statusEl = document.getElementById("form-status");

  /* ---------- Маски ввода ---------- */

  // Номер карты: только цифры, формат "XXXX XXXX XXXX XXXX"
  cardNumberInput.addEventListener("input", function () {
    const digits = this.value.replace(/\D/g, "").slice(0, 16);
    this.value = digits.replace(/(\d{4})(?=\d)/g, "$1 ");
    detectCardBrand(digits);
    clearError(this);
  });

  // Срок действия: формат "ММ/ГГ"
  expiryInput.addEventListener("input", function () {
    let digits = this.value.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) {
      digits = digits.slice(0, 2) + "/" + digits.slice(2);
    }
    this.value = digits;
    clearError(this);
  });

  // CCV: только цифры
  cvvInput.addEventListener("input", function () {
    this.value = this.value.replace(/\D/g, "").slice(0, 4);
    clearError(this);
  });

  [firstNameInput, lastNameInput, emailInput].forEach(function (input) {
    input.addEventListener("input", function () {
      clearError(input);
      hideStatus();
    });
  });

  /* ---------- Определение платёжной системы ---------- */

  function detectCardBrand(digits) {
    let brand = "";
    if (/^4/.test(digits)) brand = "VISA";
    else if (/^(5[1-5]|2[2-7])/.test(digits)) brand = "Mastercard";
    else if (/^220/.test(digits)) brand = "МИР";
    else if (/^3[47]/.test(digits)) brand = "Amex";
    cardBrandEl.textContent = brand;
  }

  /* ---------- Алгоритм Луны ---------- */

  function luhnCheck(digits) {
    let sum = 0;
    let double = false;
    for (let i = digits.length - 1; i >= 0; i--) {
      let d = Number(digits[i]);
      if (double) {
        d *= 2;
        if (d > 9) d -= 9;
      }
      sum += d;
      double = !double;
    }
    return digits.length > 0 && sum % 10 === 0;
  }

  /* ---------- Валидация ---------- */

  function setError(input, message) {
    input.classList.add("invalid");
    const span = document.querySelector(`.error-message[data-for="${input.id}"]`);
    if (span) span.textContent = message;
  }

  function clearError(input) {
    input.classList.remove("invalid");
    const span = document.querySelector(`.error-message[data-for="${input.id}"]`);
    if (span) span.textContent = "";
  }

  function validateForm() {
    let valid = true;

    // Имя
    if (!/^[A-Za-zА-Яа-яЁё\s-]{2,}$/.test(firstNameInput.value.trim())) {
      setError(firstNameInput, "Укажите имя (от 2 символов, без цифр)");
      valid = false;
    }

    // Фамилия
    if (!/^[A-Za-zА-Яа-яЁё\s-]{2,}$/.test(lastNameInput.value.trim())) {
      setError(lastNameInput, "Укажите фамилию (от 2 символов, без цифр)");
      valid = false;
    }

    // Email
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(emailInput.value.trim())) {
      setError(emailInput, "Некорректный адрес электронной почты");
      valid = false;
    }

    // Номер карты
    const digits = cardNumberInput.value.replace(/\D/g, "");
    if (digits.length !== 16) {
      setError(cardNumberInput, "Номер карты должен содержать 16 цифр");
      valid = false;
    } else if (!luhnCheck(digits)) {
      setError(cardNumberInput, "Номер карты недействителен");
      valid = false;
    }

    // Срок действия
    const expMatch = expiryInput.value.match(/^(\d{2})\/(\d{2})$/);
    if (!expMatch) {
      setError(expiryInput, "Формат: ММ/ГГ");
      valid = false;
    } else {
      const month = Number(expMatch[1]);
      const year = 2000 + Number(expMatch[2]);
      const now = new Date();
      const isFuture =
        month >= 1 && month <= 12 &&
        (year > now.getFullYear() ||
          (year === now.getFullYear() && month >= now.getMonth() + 1));
      if (!isFuture) {
        setError(expiryInput, "Срок действия истёк или указан неверно");
        valid = false;
      }
    }

    // CCV
    if (!/^\d{3,4}$/.test(cvvInput.value)) {
      setError(cvvInput, "CCV — 3 или 4 цифры");
      valid = false;
    }

    return valid;
  }

  /* ---------- Статус ---------- */

  function showStatus(type, message) {
    statusEl.className = "form-status " + type;
    statusEl.textContent = message;
  }

  function hideStatus() {
    statusEl.className = "form-status";
    statusEl.textContent = "";
  }

  /* ---------- Отправка формы (имитация) ---------- */

  form.addEventListener("submit", function (e) {
    e.preventDefault();
    hideStatus();

    if (!validateForm()) {
      showStatus("error", "Пожалуйста, исправьте ошибки в форме.");
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = "Обработка платежа…";

    // Имитация запроса к платёжному шлюзу
    setTimeout(function () {
      submitBtn.disabled = false;
      submitBtn.textContent = "Оплатить";
      showStatus(
        "success",
        "✅ Оплата успешно проведена! Чек отправлен на " + emailInput.value.trim()
      );
      form.reset();
      cardBrandEl.textContent = "";
    }, 1500);
  });
})();
