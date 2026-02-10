document.addEventListener("DOMContentLoaded", function () {

  console.log("SCRIPT LOADED (MOCK MODE)");

  // ===== MOCK MODE =====
  const MOCK_MODE = true;

  let cart = {};
  let halfSlabNoticeShown = false;

  // ===== TELEGRAM =====
  let tgUser = null;
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    tgUser = window.Telegram.WebApp.initDataUnsafe.user;
  }

  // ===== CATALOG (MOCK) =====
  fetch("catalog.json")
    .then(res => res.json())
    .then(data => {
      const catalog = document.getElementById("catalog");
      if (!catalog) return;

      catalog.className = "catalog";
      catalog.innerHTML = "";

      for (const category in data) {
        const block = document.createElement("div");
        block.className = "category";

        block.innerHTML = `
          <div class="category-title">
            <span class="category-icon">🐟</span>
            <h2>${category}</h2>
          </div>
        `;

        data[category].forEach(item => {
          if (!item.available) {
            block.innerHTML += `
              <div class="product disabled">
                <div class="product-info">
                  <div class="product-name">${item.name}</div>
                  <div class="product-desc">Временно нет в наличии</div>
                </div>
              </div>
            `;
            return;
          }

          block.innerHTML += `
            <div class="product">
              <div class="product-info">
                <div class="product-name">${item.name}</div>
                <div class="product-price">${item.price} ₽</div>
              </div>
              <button onclick="addToCart('${item.name}', ${item.price})">
                В корзину
              </button>
            </div>
          `;
        });

        catalog.appendChild(block);
      }
    })
    .catch(err => console.error("CATALOG ERROR:", err));

  // ===== CART =====
  window.addToCart = function (name, price) {

    if (name.includes("1/2 пласта") && !halfSlabNoticeShown) {
      alert("⚠️ Без возможности выбора головной или хвостовой части");
      halfSlabNoticeShown = true;
    }

    if (!cart[name]) {
      cart[name] = { price, qty: 1 };
    } else {
      cart[name].qty += 1;
    }

    updateCartButton();
  };

  function updateCartButton() {
    let btn = document.getElementById("cart-button");
    const count = Object.values(cart).reduce((s, i) => s + i.qty, 0);

    if (count === 0) {
      if (btn) btn.remove();
      return;
    }

    if (!btn) {
      btn = document.createElement("button");
      btn.id = "cart-button";
      btn.className = "cart-button";
      btn.onclick = openCart;
      document.body.appendChild(btn);
    }

    btn.innerText = `Корзина (${count})`;
  }

  function openCart() {
    let overlay = document.getElementById("cart-overlay");
    if (overlay) overlay.remove();

    overlay = document.createElement("div");
    overlay.id = "cart-overlay";
    overlay.className = "cart-modal active";

    let total = 0;
    let itemsHtml = "";

    for (const name in cart) {
      const item = cart[name];
      total += item.price * item.qty;

      itemsHtml += `
        <div class="cart-item">
          <span>${name}</span>
          <div>
            <button onclick="changeQty('${name}', -1)">−</button>
            <strong>${item.qty}</strong>
            <button onclick="changeQty('${name}', 1)">+</button>
            <button onclick="removeItem('${name}')">✕</button>
          </div>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="cart">
        <h3>Ваш заказ</h3>
        ${itemsHtml || "<p>Корзина пустая</p>"}
        <div class="cart-total">Итого: ${total} ₽</div>
        <div class="notice">MOCK-режим (без отправки)</div>
        <br>
        <button onclick="confirmOrder()">Оформить заказ</button>
        <button class="secondary" onclick="clearCart()">Очистить</button>
        <br><br>
        <button class="secondary" onclick="closeCart()">Закрыть</button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  window.changeQty = function (name, delta) {
    cart[name].qty += delta;
    if (cart[name].qty <= 0) delete cart[name];
    updateCartButton();
    openCart();
  };

  window.removeItem = function (name) {
    delete cart[name];
    updateCartButton();
    openCart();
  };

  window.clearCart = function () {
    if (!confirm("Очистить корзину?")) return;
    cart = {};
    halfSlabNoticeShown = false;
    updateCartButton();
    closeCart();
  };

  window.closeCart = function () {
    const overlay = document.getElementById("cart-overlay");
    if (overlay) overlay.remove();
  };

  // ===== CONFIRM (MOCK) =====
  window.confirmOrder = function () {
    let summary = "MOCK ЗАКАЗ:\n\n";
    let total = 0;

    for (const name in cart) {
      const i = cart[name];
      summary += `${name} × ${i.qty} = ${i.price * i.qty} ₽\n`;
      total += i.price * i.qty;
    }

    summary += `\nИтого: ${total} ₽`;

    if (confirm(summary)) {
      alert("✅ MOCK: заказ принят (ничего не отправляли)");
      cart = {};
      halfSlabNoticeShown = false;
      updateCartButton();
      closeCart();
    }
  };

});
