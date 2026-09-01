gsap.registerPlugin(ScrollTrigger);

const products = [
  {id:'p1', name:'Sunset Wrap Top', cat:'Tops', price:549, badge:'New', img:'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?w=400&q=60'},
  {id:'p2', name:'Woven Tote Bag', cat:'Bags', price:620, badge:null, img:'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=400&q=60'},
  {id:'p3', name:'Terracotta Hoops', cat:'Accessories', price:210, badge:'Popular', img:'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&q=60'},
  {id:'p4', name:'Linen Wide Pants', cat:'Bottoms', price:780, badge:null, img:'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&q=60'},
];
const trending = [
  {id:'p5', name:'Rose Clay Mug', cat:'Home', price:320, badge:'Trending', img:'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=400&q=60'},
  {id:'p6', name:'Boho Layer Necklace', cat:'Accessories', price:280, badge:null, img:'https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&q=60'},
  {id:'p7', name:'Cream Knit Cardigan', cat:'Tops', price:890, badge:'Trending', img:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&q=60'},
  {id:'p8', name:'Mini Crossbody', cat:'Bags', price:460, badge:null, img:'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=400&q=60'},
];
const categories = [
  {name:'Tops', icon:'checkroom'}, {name:'Bottoms', icon:'dry_cleaning'}, {name:'Bags', icon:'shopping_bag'},
  {name:'Accessories', icon:'diamond'}, {name:'Home', icon:'yard'}, {name:'Footwear', icon:'footprint'},
];

function cardHTML(p){
  return `<div class="card" onclick="location.href='shop.html?product=${p.id}'">
    <div class="card-media">
      ${p.badge ? `<span class="badge">${p.badge}</span>` : ''}
      <button class="fav-btn" onclick="event.stopPropagation()" aria-label="Save"><span class="material-symbols-outlined">favorite</span></button>
      <img src="${p.img}" alt="${p.name}" loading="lazy">
    </div>
    <div class="card-body">
      <div class="card-cat">${p.cat}</div>
      <div class="card-name">${p.name}</div>
      <div class="card-footer">
        <span class="card-price">₱${p.price}</span>
        <button class="add-btn" onclick="event.stopPropagation(); addToCart('${p.id}', this)"><span class="material-symbols-outlined">add</span></button>
      </div>
    </div>
  </div>`;
}
document.getElementById('featuredGrid').innerHTML = products.map(cardHTML).join('');
document.getElementById('trendingGrid').innerHTML = trending.map(cardHTML).join('');
document.getElementById('catScroll').innerHTML = categories.map(c =>
  `<a href="shop.html?cat=${c.name}" class="cat-card"><span class="material-symbols-outlined">${c.icon}</span>${c.name}</a>`
).join('');
const allProducts = [...products, ...trending];

/* ---- Shared cart (localStorage) ---- */
function getCart(){ return JSON.parse(localStorage.getItem('tt_cart') || '[]'); }
function saveCart(cart){ localStorage.setItem('tt_cart', JSON.stringify(cart)); renderCart(); }
function addToCart(id, btnEl){
  const p = allProducts.find(x=>x.id===id);
  if(!p) return;
  const cart = getCart();
  const existing = cart.find(i=>i.id===id);
  if(existing){ existing.qty++; } else { cart.push({id:p.id, name:p.name, price:p.price, img:p.img, qty:1}); }
  saveCart(cart);
  if(btnEl) flyToCart(btnEl);
  showToast();
}
function changeQty(id, delta){
  const cart = getCart();
  const item = cart.find(i=>i.id===id);
  if(!item) return;
  item.qty += delta;
  const updated = item.qty <= 0 ? cart.filter(i=>i.id!==id) : cart;
  saveCart(updated);
}
function renderCart(){
  const cart = getCart();
  const count = cart.reduce((s,i)=>s+i.qty,0);
  document.querySelectorAll('#cartCount').forEach(el=>el.textContent = count);
  const itemsEl = document.getElementById('cartItems');
  const footEl = document.getElementById('cartFoot');
  if(cart.length === 0){
    itemsEl.innerHTML = `<div class="cart-empty"><span class="material-symbols-outlined">shopping_bag</span><div>Your cart is empty</div><a href="shop.html" style="color:var(--color-primary);font-weight:600;">Start shopping →</a></div>`;
    footEl.style.display = 'none';
    return;
  }
  itemsEl.innerHTML = cart.map(i => `
    <div class="cart-row">
      <img src="${i.img}" class="cart-thumb">
      <div class="cart-info">
        <div class="name">${i.name}</div>
        <div class="price">₱${i.price} × ${i.qty}</div>
      </div>
      <div class="qty-control">
        <button onclick="changeQty('${i.id}', -1)"><span class="material-symbols-outlined" style="font-size:14px;">remove</span></button>
        <span>${i.qty}</span>
        <button onclick="changeQty('${i.id}', 1)"><span class="material-symbols-outlined" style="font-size:14px;">add</span></button>
      </div>
    </div>`).join('');
  const subtotal = cart.reduce((s,i)=>s+i.price*i.qty,0);
  document.getElementById('cartSubtotal').textContent = `₱${subtotal}`;
  footEl.style.display = 'block';
}
function flyToCart(btn){
  const cartTarget = document.getElementById('cartBtn');
  const rect = btn.getBoundingClientRect();
  const targetRect = cartTarget.getBoundingClientRect();
  const flyer = document.createElement('div');
  flyer.style.cssText = `position:fixed;left:${rect.left}px;top:${rect.top}px;width:14px;height:14px;border-radius:50%;background:#B5707A;z-index:300;pointer-events:none;`;
  document.body.appendChild(flyer);
  gsap.to(flyer, {left: targetRect.left + 10, top: targetRect.top + 10, scale: 0.3, duration: 0.6, ease: 'power2.in', onComplete: () => flyer.remove()});
  gsap.fromTo(cartTarget, {scale:1}, {scale:1.25, duration:0.15, yoyo:true, repeat:1, ease:'power1.inOut', delay:0.55});
}
function showToast(){
  const toast = document.getElementById('toast');
  gsap.to(toast, {opacity:1, y:0, duration:0.3, ease:'power2.out'});
  clearTimeout(window._toastTimer);
  window._toastTimer = setTimeout(()=> gsap.to(toast, {opacity:0, y:20, duration:0.3}), 1600);
}
function openCart(){ document.getElementById('cartDrawer').classList.add('open'); document.getElementById('overlay').classList.add('open'); }
function closeCart(){ document.getElementById('cartDrawer').classList.remove('open'); document.getElementById('overlay').classList.remove('open'); }
document.getElementById('cartBtn').addEventListener('click', openCart);
document.getElementById('mobileCart').addEventListener('click', (e)=>{e.preventDefault(); openCart();});
document.getElementById('cartClose').addEventListener('click', closeCart);
document.getElementById('overlay').addEventListener('click', closeCart);
renderCart();

/* ---- Entrance animations ---- */
gsap.set('#petals ellipse', {scale:0, transformOrigin:'200px 200px'});
gsap.to('#petals ellipse', {scale:1, duration:1, stagger:0.05, ease:'back.out(1.7)', delay:0.2});
gsap.from('.hero-inner .eyebrow, .hero-inner h1, .hero-inner p, .hero-ctas', {y:24, opacity:0, duration:0.8, stagger:0.12, ease:'power3.out', delay:0.3});
gsap.utils.toArray('.card, .cat-card, .why-item').forEach((el) => {
  gsap.from(el, {y:30, opacity:0, duration:0.6, ease:'power2.out', scrollTrigger:{trigger:el, start:'top 90%'}});
});