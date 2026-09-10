// ---------- Checkout endpoint ----------
// The Stripe checkout session is created by a Cloudflare Pages Function
// at /functions/api/create-checkout-session.js, served automatically at
// this same-origin path once this repo is connected to Cloudflare Pages
// via GitHub — no external URL needed.
const CHECKOUT_ENDPOINT = '/api/create-checkout-session';

// ---------- Product data ----------
// Edit names, descriptions and prices here as the shop grows.
const PRODUCTS = [
  {
    id: 'grime-saviour',
    name: 'Grime Saviour — Gig Poster',
    desc: 'Wheat-pasted gig poster design for Resurgence FM, screen-print style with a hand-drawn mascot mark.',
    price: 9.99,
    cover: 'assets/cover-grime-saviour.jpg',
    image: 'assets/poster-grime-saviour.jpg',
    specs: [
      'A3 print (297 × 420mm) — printed to order',
      'Standard UK delivery, 3–5 business days — £2',
      'Next day delivery, UK only — £4'
    ]
  },
  {
    id: 'danger-skate',
    name: 'Danger — Skate Poster',
    desc: 'CRT-textured skate artwork from the Adam Graphics series, built to look ripped straight from an old console.',
    price: 9.99,
    cover: 'assets/cover-danger-skate.jpg',
    image: 'assets/poster-danger-skate.jpg',
    specs: [
      'A3 print (297 × 420mm) — printed to order',
      'Standard UK delivery, 3–5 business days — £2',
      'Next day delivery, UK only — £4'
    ]
  },
  {
    id: 'zombie-scene',
    name: 'Graffiti Zombie Scene',
    desc: 'A street-scene illustration built from an Adam Graphics TikTok — graffiti, a corner store and a zombie wandering into shot.',
    price: 9.99,
    cover: 'assets/cover-zombie.jpg',
    image: 'assets/poster-zombie.jpg',
    specs: [
      'A3 print (297 × 420mm) — printed to order',
      'Standard UK delivery, 3–5 business days — £2',
      'Next day delivery, UK only — £4'
    ]
  },
  {
    id: 'bundle-all-3',
    name: 'All 3 Posters — Bundle',
    desc: 'Grime Saviour, Danger and the Graffiti Zombie Scene all for the price of 2 posters!',
    price: 19.99,
    cover: 'assets/cover-bundle.jpg',
    image: 'assets/cover-bundle.jpg',
    isBundle: true,
    gallery: [
      { image: 'assets/poster-grime-saviour.jpg', label: 'Grime Saviour' },
      { image: 'assets/poster-danger-skate.jpg', label: 'Danger — Skate' },
      { image: 'assets/poster-zombie.jpg', label: 'Graffiti Zombie Scene' }
    ],
    specs: [
      'Includes 3 A3 prints (297 × 420mm) — printed to order',
      'Standard UK delivery, 3–5 business days — £2',
      'Next day delivery, UK only — £4'
    ]
  }
];

// ---------- State ----------
let cart = []; // { id, qty }

const money = n => `£${n.toFixed(2)}`;

function findProduct(id){ return PRODUCTS.find(p => p.id === id); }

function cartLines(){
  return cart.map(entry => ({ ...entry, product: findProduct(entry.id) }));
}

function cartItemsTotal(){
  return cartLines().reduce((sum, l) => sum + l.product.price * l.qty, 0);
}

function cartCount(){
  return cart.reduce((sum, l) => sum + l.qty, 0);
}

// ---------- Render: product carousel ----------
function renderProducts(){
  const grid = document.getElementById('productGrid');
  grid.innerHTML = PRODUCTS.map(p => `
    <article class="product-card${p.isBundle ? ' bundle-card' : ''}" data-id="${p.id}">
      <div class="product-media">
        ${p.isBundle ? '<span class="bundle-badge">Bundle deal</span>' : ''}
        <img src="${p.cover}" alt="${p.name}" loading="lazy">
      </div>
      <div class="product-body">
        <h3 class="product-name">${p.name}</h3>
        <p class="product-desc">${p.desc}</p>
        <div class="product-foot">
          <span class="product-price">${money(p.price)}</span>
          <button class="add-to-cart" data-id="${p.id}">Add to cart</button>
        </div>
      </div>
    </article>
  `).join('');

  grid.querySelectorAll('.add-to-cart').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      addToCart(btn.dataset.id);
      btn.textContent = 'Added';
      btn.classList.add('added');
      setTimeout(() => {
        btn.textContent = 'Add to cart';
        btn.classList.remove('added');
      }, 1200);
    });
  });

  grid.querySelectorAll('.product-card').forEach(card => {
    card.addEventListener('click', () => openProductModal(card.dataset.id));
  });
}

// ---------- Cart actions ----------
function addToCart(id){
  const existing = cart.find(l => l.id === id);
  if (existing) existing.qty += 1;
  else cart.push({ id, qty: 1 });
  renderCart();
  openCart();
}

function removeFromCart(id){
  cart = cart.filter(l => l.id !== id);
  renderCart();
}

function renderCart(){
  document.getElementById('cartCount').textContent = cartCount();

  const itemsEl = document.getElementById('cartItems');
  const emptyEl = document.getElementById('cartEmpty');
  const lines = cartLines();

  if (lines.length === 0){
    itemsEl.innerHTML = '';
    emptyEl.hidden = false;
  } else {
    emptyEl.hidden = true;
    itemsEl.innerHTML = lines.map(l => `
      <li class="cart-item">
        <img src="${l.product.cover}" alt="">
        <div>
          <div class="cart-item-name">${l.product.name}${l.qty > 1 ? ` × ${l.qty}` : ''}</div>
          <div class="cart-item-price">${money(l.product.price * l.qty)}</div>
        </div>
        <button class="cart-item-remove" data-id="${l.id}">Remove</button>
      </li>
    `).join('');

    itemsEl.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeFromCart(btn.dataset.id);
      });
    });
  }

  document.getElementById('cartTotal').textContent = money(cartItemsTotal());
  renderSummary();
}

function renderSummary(){
  const list = document.getElementById('summaryList');
  const lines = cartLines();
  list.innerHTML = lines.map(l => `
    <li><span>${l.product.name}${l.qty > 1 ? ` × ${l.qty}` : ''}</span><span>${money(l.product.price * l.qty)}</span></li>
  `).join('') || '<li><span>No items yet</span><span>—</span></li>';

  document.getElementById('summaryTotal').textContent = money(cartItemsTotal());
}

// ---------- Cart dropdown open/close ----------
const cartPanel = document.getElementById('cartPanel');
const cartBtn = document.getElementById('cartBtn');

function openCart(){
  cartPanel.hidden = false;
  cartBtn.setAttribute('aria-expanded', 'true');
}
function closeCart(){
  cartPanel.hidden = true;
  cartBtn.setAttribute('aria-expanded', 'false');
}
function toggleCart(){
  cartPanel.hidden ? openCart() : closeCart();
}

cartBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  toggleCart();
});
cartPanel.addEventListener('click', (e) => e.stopPropagation());
document.getElementById('cartPanelClose').addEventListener('click', closeCart);
document.addEventListener('click', () => closeCart());
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeCart(); });

// ---------- Product detail modal ----------
const productOverlay = document.getElementById('productOverlay');
const productModal = document.getElementById('productModal');
let activeProductId = null;

function renderModalSpecs(specs){
  document.getElementById('modalSpecs').innerHTML = specs.map(s => `<li>${s}</li>`).join('');
}

function renderModalThumbs(product){
  const thumbsEl = document.getElementById('modalThumbs');
  if (!product.isBundle){
    thumbsEl.hidden = true;
    thumbsEl.innerHTML = '';
    return;
  }
  thumbsEl.hidden = false;
  thumbsEl.innerHTML = product.gallery.map((g, i) => `
    <button type="button" class="${i === 0 ? 'active' : ''}" style="background-image:url('${g.image}')" data-image="${g.image}" aria-label="${g.label}"></button>
  `).join('');

  thumbsEl.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      document.getElementById('modalImage').src = btn.dataset.image;
      thumbsEl.querySelectorAll('button').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

function openProductModal(id){
  const p = findProduct(id);
  if (!p) return;
  activeProductId = id;
  document.getElementById('modalImage').src = p.isBundle ? p.gallery[0].image : p.image;
  document.getElementById('modalImage').alt = p.name;
  document.getElementById('modalName').textContent = p.name;
  document.getElementById('modalPrice').textContent = money(p.price);
  document.getElementById('modalDesc').textContent = p.desc;
  renderModalSpecs(p.specs);
  renderModalThumbs(p);
  productOverlay.hidden = false;
  productModal.hidden = false;
  closeCart();
}

function closeProductModal(){
  productOverlay.hidden = true;
  productModal.hidden = true;
  activeProductId = null;
}

document.getElementById('productModalClose').addEventListener('click', closeProductModal);
productOverlay.addEventListener('click', closeProductModal);
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeProductModal(); });

document.getElementById('modalAddToCart').addEventListener('click', () => {
  if (!activeProductId) return;
  addToCart(activeProductId);
  closeProductModal();
});

document.getElementById('modalBuyNow').addEventListener('click', () => {
  if (!activeProductId) return;
  addToCart(activeProductId);
  closeProductModal();
  goToCheckout();
});

// ---------- Checkout flow ----------
function goToCheckout(){
  if (cartCount() === 0) return;
  closeCart();
  document.getElementById('checkout').hidden = false;
  document.getElementById('checkout').scrollIntoView({ behavior: 'smooth' });
  renderSummary();
}

document.getElementById('cartCheckoutBtn').addEventListener('click', goToCheckout);

// Sends the cart to a serverless function which creates a Stripe Checkout
// Session and returns its URL. See /netlify/functions/create-checkout-session.js
// (or /api/create-checkout-session.js for Vercel) for the server-side half of this.
document.getElementById('stripeCheckoutBtn').addEventListener('click', async () => {
  const btn = document.getElementById('stripeCheckoutBtn');
  const errorEl = document.getElementById('checkoutError');
  errorEl.hidden = true;

  if (cartCount() === 0) return;

  const origin = window.location.origin;
  const items = cartLines().map(l => ({
    id: l.product.id,
    name: l.product.name,
    price: l.product.price,
    qty: l.qty,
    image: `${origin}/${l.product.cover}`
  }));

  btn.disabled = true;
  btn.textContent = 'Redirecting to Stripe…';

  try {
    const res = await fetch(CHECKOUT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items, successUrl: `${origin}/success.html`, cancelUrl: `${origin}/cancel.html` })
    });
    if (!res.ok) throw new Error('Checkout session request failed');
    const data = await res.json();
    if (!data.url) throw new Error('No checkout URL returned');
    window.location.href = data.url;
  } catch (err) {
    console.error(err);
    errorEl.hidden = false;
    btn.disabled = false;
    btn.textContent = 'Continue to secure checkout';
  }
});

// ---------- Init ----------
document.getElementById('year').textContent = new Date().getFullYear();
renderProducts();
renderCart();
