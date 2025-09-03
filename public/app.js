// ---- Configuración Firebase (REEMPLAZAR) ----
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "000000000000",
  appId: "1:000000000000:web:xxxxxxxxxxxxxxxxxxxx"
};
const ADMIN_EMAIL = "admin@cti-muebles.com"; // Cambiá si usás otro email

// ---- Firebase SDK v9 modular desde CDN ----
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js';
import { getAuth, signInWithEmailAndPassword, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js';
import { getFirestore, collection, addDoc, getDocs, doc, getDoc, setDoc, deleteDoc, serverTimestamp, query, orderBy } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'https://www.gstatic.com/firebasejs/9.22.2/firebase-storage.js';

// ---- Init ----
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

const $ = (s) => document.querySelector(s);
const $$ = (s) => Array.from(document.querySelectorAll(s));
const show = (el) => el.classList.remove('hidden');
const hide = (el) => el.classList.add('hidden');

// UI elements
const productsGrid = $('#productsGrid');
const filterCategory = $('#filterCategory');
const searchInput = $('#searchInput');
const adminBtn = $('#adminBtn');
const adminPanel = $('#adminPanel');
const adminList = $('#adminList');
const signOutBtn = $('#signOutBtn');
const adminEmailLabel = $('#adminEmailLabel');

// Form elements
const pId = $('#pId');
const pTitle = $('#pTitle');
const pPrice = $('#pPrice');
const pCategory = $('#pCategory');
const pDimensions = $('#pDimensions');
const pMaterials = $('#pMaterials');
const pFinish = $('#pFinish');
const pStock = $('#pStock');
const pImage = $('#pImage');
const imagePreview = $('#imagePreview');
const saveBtn = $('#saveBtn');
const resetBtn = $('#resetBtn');
const formMsg = $('#formMsg');

// Login modal elements
const loginModal = $('#loginModal');
const closeLogin = $('#closeLogin');
const loginEmail = $('#loginEmail');
const loginPass = $('#loginPass');
const loginBtn = $('#loginBtn');
const loginMsg = $('#loginMsg');

// ---- Helpers ----
function currency(n){ return new Intl.NumberFormat('es-AR', { style:'currency', currency:'ARS' }).format(Number(n || 0)); }
function toast(msg, type='info'){
  const el = document.createElement('div');
  el.textContent = msg;
  el.className = 'fixed bottom-4 right-4 px-3 py-2 rounded-lg text-sm ' + (type==='error' ? 'bg-red-600' : 'bg-slate-700');
  document.body.appendChild(el);
  setTimeout(()=> el.remove(), 2500);
}

// ---- Catalog ----
let allProducts = [];

async function loadProducts(){
  const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  allProducts = snap.docs.map(d=> ({ id: d.id, ...d.data() }));
  renderGrid();
  renderAdminList();
}

function matchFilters(p){
  const cat = filterCategory.value.trim();
  const term = searchInput.value.trim().toLowerCase();
  let ok = true;
  if(cat) ok = ok && (p.category || '').toLowerCase().includes(cat.toLowerCase());
  if(term){
    const blob = [p.title, p.materials, p.finish, p.dimensions].join(' ').toLowerCase();
    ok = ok && blob.includes(term);
  }
  return ok;
}

function renderGrid(){
  productsGrid.innerHTML = '';
  const frag = document.createDocumentFragment();
  allProducts.filter(matchFilters).forEach(p=>{
    const card = document.createElement('div');
    card.className = 'card overflow-hidden';
    card.innerHTML = `
      <img src="${p.imageURL || 'https://picsum.photos/seed/fallback/1200/900'}" class="w-full h-56 object-cover border-b border-white/10" alt="\${p.title||''}">
      <div class="p-4">
        <div class="flex items-center justify-between gap-2 mb-1">
          <h4 class="font-semibold">\${p.title || 'Sin título'}</h4>
          <div class="text-sm">\${p.price ? currency(p.price) : ''}</div>
        </div>
        <div class="muted text-sm">\${p.materials || ''}</div>
        <div class="muted text-xs">\${p.dimensions || ''}</div>
        <div class="mt-3 flex gap-2">
          <a class="btn-ghost" href="https://wa.me/549XXXXXXXXXX?text=\${encodeURIComponent('Hola! Me interesa: ' + (p.title||'') + (p.price ? ' ('+currency(p.price)+')' : ''))}" target="_blank">Consultar</a>
        </div>
      </div>`;
    frag.appendChild(card);
  });
  productsGrid.appendChild(frag);
}

filterCategory.addEventListener('change', renderGrid);
searchInput.addEventListener('input', renderGrid);

// ---- Admin Auth ----
adminBtn.addEventListener('click', ()=>{
  show(loginModal);
  loginMsg.textContent = '';
});

closeLogin.addEventListener('click', ()=> hide(loginModal));

loginBtn.addEventListener('click', async ()=>{
  try{
    loginMsg.textContent = 'Ingresando...';
    const email = loginEmail.value.trim() || ADMIN_EMAIL;
    const pass = loginPass.value.trim();
    await signInWithEmailAndPassword(auth, email, pass);
    loginMsg.textContent = 'OK';
    hide(loginModal);
  }catch(err){
    console.error(err);
    loginMsg.textContent = err.message || 'Error de login';
  }
});

signOutBtn.addEventListener('click', ()=> signOut(auth));

onAuthStateChanged(auth, async (user)=>{
  if(user && user.email === ADMIN_EMAIL){
    show(adminPanel);
    adminEmailLabel.textContent = user.email;
    await loadProducts();
  }else{
    hide(adminPanel);
  }
});

// ---- Admin CRUD ----
function fillForm(p){
  pId.value = p?.id || '';
  pTitle.value = p?.title || '';
  pPrice.value = p?.price || '';
  pCategory.value = p?.category || '';
  pDimensions.value = p?.dimensions || '';
  pMaterials.value = p?.materials || '';
  pFinish.value = p?.finish || '';
  pStock.value = p?.stock || '';
  imagePreview.innerHTML = p?.imageURL ? `<a href="\${p.imageURL}" target="_blank" class="underline">Ver imagen actual</a>` : '<span class="muted">Sin imagen</span>';
  pImage.value = '';
}
resetBtn.addEventListener('click', ()=> fillForm(null));

async function uploadImage(docId, file){
  const path = `products/\${docId}/\${file.name}`;
  const r = ref(storage, path);
  await uploadBytes(r, file);
  const url = await getDownloadURL(r);
  return { url, path };
}

saveBtn.addEventListener('click', async ()=>{
  try{
    formMsg.textContent = 'Guardando...';
    const payload = {
      title: pTitle.value.trim(),
      price: Number(pPrice.value || 0),
      category: pCategory.value.trim(),
      dimensions: pDimensions.value.trim(),
      materials: pMaterials.value.trim(),
      finish: pFinish.value.trim(),
      stock: Number(pStock.value || 0),
      updatedAt: serverTimestamp()
    };

    if(!payload.title){ toast('Completá el título','error'); formMsg.textContent = ''; return; }

    let id = pId.value.trim();
    if(!id){
      // crear
      const refDoc = await addDoc(collection(db, 'products'), { ...payload, createdAt: serverTimestamp() });
      id = refDoc.id;
      if(pImage.files[0]){
        const up = await uploadImage(id, pImage.files[0]);
        await setDoc(doc(db, 'products', id), { ...payload, imageURL: up.url, imagePath: up.path, createdAt: serverTimestamp() }, { merge:true });
      }
      toast('Producto creado');
    }else{
      // editar
      if(pImage.files[0]){
        const up = await uploadImage(id, pImage.files[0]);
        payload.imageURL = up.url;
        payload.imagePath = up.path;
      }
      await setDoc(doc(db, 'products', id), payload, { merge:true });
      toast('Producto actualizado');
    }

    formMsg.textContent = 'Listo ✔︎';
    await loadProducts();
    fillForm(null);
  }catch(err){
    console.error(err); toast(err.message || 'Error al guardar', 'error');
    formMsg.textContent = 'Error';
  }
});

function renderAdminList(){
  adminList.innerHTML = '';
  const list = document.createElement('div');
  allProducts.forEach(p=>{
    const row = document.createElement('div');
    row.className = 'p-2 rounded bg-slate-800/50 border border-white/10 flex items-center justify-between';
    row.innerHTML = `
      <div class="flex items-center gap-3">
        <img src="\${p.imageURL || 'https://picsum.photos/seed/fb/100/70'}" class="w-16 h-12 object-cover rounded">
        <div>
          <div class="font-semibold">\${p.title}</div>
          <div class="muted text-xs">\${p.category || ''} · \${p.dimensions || ''}</div>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="btn-ghost text-xs" data-edit="\${p.id}">Editar</button>
        <button class="btn-danger text-xs" data-del="\${p.id}">Eliminar</button>
      </div>`;
    list.appendChild(row);
  });
  adminList.appendChild(list);

  list.addEventListener('click', async (e)=>{
    if(e.target.dataset.edit){
      const id = e.target.dataset.edit;
      const snap = await getDoc(doc(db, 'products', id));
      if(snap.exists()){
        fillForm({ id, ...snap.data() });
        window.scrollTo({ top: adminPanel.offsetTop - 80, behavior: 'smooth' });
      }
    }else if(e.target.dataset.del){
      const id = e.target.dataset.del;
      if(!confirm('¿Eliminar este producto?')) return;
      const snap = await getDoc(doc(db, 'products', id));
      const data = snap.data() || {};
      if(data.imagePath){
        try{ await deleteObject(ref(storage, data.imagePath)); }catch(_){}
      }else{
        try{
          const root = ref(storage, `products/\${id}`);
          const res = await listAll(root);
          await Promise.all(res.items.map(item=> deleteObject(item)));
        }catch(_){}
      }
      await deleteDoc(doc(db, 'products', id));
      toast('Producto eliminado');
      await loadProducts();
    }
  });
}

// cargar catálogo público al inicio
loadProducts().catch(console.error);
