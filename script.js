document.addEventListener("DOMContentLoaded", function () {

  console.log("SCRIPT LOADED (PRODUCTION)");

  // ===== API =====
  const API = "https://tribal-rather-bras-crucial.trycloudflare.com";

  let cart = {};
  let halfSlabNoticeShown = false;

  // ===== TELEGRAM =====
  let tgUser = null;
  if (window.Telegram && window.Telegram.WebApp) {
    window.Telegram.WebApp.ready();
    tgUser = window.Telegram.WebApp.initDataUnsafe.user;
  }

  // ===== CATALOG =====
  fetch(API + "/catalog")
    .then(res => res.json())
    .then(data => {
      const catalog = document.getElementById("catalog");
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
    .catch(() => alert("Ошибка загрузки каталога"));

  // ===== CART =====
  window.addToCart = function (name, price) {
    if (name.includes("1/2 пласта") && !halfSlabNoticeShown) {
      alert("⚠️ Без возможности выбора головной или хвостовой части");
      halfSlabNoticeShown = true;
    }

    if (!cart[name]) cart[name] = { price, qty: 1 };
    else cart[name].qty += 1;

    updateCartButton();
  };

  function updateCartButton() {
    let btn = document.getElementById("cart-button");
    const count = Object.values(cart).reduce((s, i) => s + i.qty, 0);

    if (!count) {
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

    let items = "";
    let total = 0;

    for (const name in cart) {
      const i = cart[name];
      total += i.price * i.qty;
      items += `
        <div class="cart-item">
          <span>${name}</span>
          <div>
            <button onclick="changeQty('${name}', -1)">−</button>
            <strong>${i.qty}</strong>
            <button onclick="changeQty('${name}', 1)">+</button>
          </div>
        </div>
      `;
    }

    overlay = document.createElement("div");
    overlay.id = "cart-overlay";
    overlay.className = "cart-modal active";
    overlay.innerHTML = `
      <div class="cart">
        <h3>Ваш заказ</h3>

        <div style="max-height:40vh;overflow-y:auto">
          ${items}
        </div>

        <div class="cart-total">Итого: ${total} ₽</div>

        <input id="order-name" placeholder="Имя" value="${tgUser?.first_name || ""}">
        <input id="order-phone" placeholder="Телефон">
        <input id="order-address" placeholder="Адрес">

        <button onclick="confirmOrder()">Оформить заказ</button>
        <button class="secondary" onclick="closeCart()">Закрыть</button>
      </div>
    `;

    document.body.appendChild(overlay);
  }

  window.changeQty = function (name, d) {
    cart[name].qty += d;
    if (cart[name].qty <= 0) delete cart[name];
    updateCartButton();
    openCart();
  };

  window.closeCart = function () {
    document.getElementById("cart-overlay")?.remove();
  };

  // ===== SEND ORDER =====
  window.confirmOrder = function () {
    const name = order-name.value.trim();
    const phone = order-phone.value.trim();
    const address = order-address.value.trim();

    if (!name || !phone || !address) {
      alert("Заполните все поля");
      return;
    }

    const cartData = Object.entries(cart).map(([n, i]) => ({
      name: n,
      qty: i.qty
    }));

    fetch(API + "/order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, phone, address,
        cart: cartData,
        tg_id: tgUser?.id,
        tg_username: tgUser?.username,
        tg_name: tgUser?.first_name
      })
    })
    .then(() => {
      alert("Заказ отправлен ✅");
      cart = {};
      updateCartButton();
      closeCart();
    })
    .catch(() => alert("Ошибка отправки"));
  };

});
