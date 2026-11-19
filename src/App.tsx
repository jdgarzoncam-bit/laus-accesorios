import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, Dispatch, ReactNode, SetStateAction } from 'react'
import { ArrowDown, ArrowRight, ArrowUpRight, ChartNoAxesCombined, Check, CircleHelp, Cloud, Download, Heart, LayoutDashboard, Menu, MessageCircle, Package, Play, Plus, Search, Settings, ShoppingBag, Sprout, Sparkles, Tag, Trash2, Truck, X } from 'lucide-react'

type Category = 'Todos' | 'Entrega inmediata' | 'Aretes' | 'Topitos' | 'Anillos' | 'Cuelga gafas' | 'Iniciales' | 'Collares' | 'Conjuntos' | 'Pulseras' | 'Earcuff' | 'Ropa'
type Product = { id: string; name: string; category: Exclude<Category,'Todos'>; price: number; stock: number; image: string; description: string; badge?: string; sizes?: string[] }
type CartLine = { product: Product; quantity: number; size?: string }

const initialProducts: Product[] = [
  { id:'LA-001', name:'Aretes Aurora', category:'Aretes', price:42000, stock:8, image:'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=900&q=85', description:'Un destello delicado para iluminar cualquier look.', badge:'Favorito' },
  { id:'LA-002', name:'Collar Luz', category:'Collares', price:58000, stock:5, image:'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?auto=format&fit=crop&w=900&q=85', description:'Cadena dorada de silueta fina y contemporánea.', badge:'Nuevo' },
  { id:'LA-003', name:'Anillos Aura', category:'Conjuntos', price:69000, stock:3, image:'https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=900&q=85', description:'Un conjunto pensado para combinar y crear.' },
  { id:'LA-004', name:'Pulsera Bruma', category:'Pulseras', price:36000, stock:0, image:'https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&w=900&q=85', description:'Un detalle sutil que acompaña todos tus días.' },
  { id:'LA-005', name:'Set Perla', category:'Conjuntos', price:89000, stock:6, image:'https://images.unsplash.com/photo-1617038220319-276d3cfab638?auto=format&fit=crop&w=900&q=85', description:'Perlas y brillo suave en una combinación especial.', badge:'Edición especial' },
  { id:'LA-006', name:'Top Blush', category:'Ropa', price:74000, stock:4, image:'https://images.unsplash.com/photo-1551163943-3f6a855d1153?auto=format&fit=crop&w=900&q=85', description:'Una pieza versátil para elevar tu outfit.', sizes:['S','M','L'] }
]
const money = (n:number) => new Intl.NumberFormat('es-CO',{style:'currency',currency:'COP',maximumFractionDigits:0}).format(n)
const waNumber = import.meta.env.VITE_WHATSAPP_NUMBER || ''
const waCatalogLink = 'https://wa.link/3ozvv4'

export default function App() {
  const [products,setProducts] = useState<Product[]>(() => {
    try { const saved=localStorage.getItem('laus-products'); return saved ? JSON.parse(saved) as Product[] : initialProducts } catch { return initialProducts }
  })
  const [cart,setCart] = useState<CartLine[]>([])
  const [category,setCategory] = useState<Category>('Todos')
  const [query,setQuery] = useState('')
  const [showCart,setShowCart] = useState(false)
  const [showAdmin,setShowAdmin] = useState(false)
  const [activeTab,setActiveTab] = useState('Resumen')
  const [mobileMenu,setMobileMenu] = useState(false)
  const [notice,setNotice] = useState('')
  const [form,setForm] = useState({name:'',category:'Aretes' as Product['category'],price:'',stock:'',image:'',description:''})
  useEffect(()=>{ localStorage.setItem('laus-products',JSON.stringify(products)) },[products])
  const visible = useMemo(()=>products.filter(p=>(category==='Todos'||p.category===category)&&p.name.toLowerCase().includes(query.toLowerCase())),[products,category,query])
  const total = cart.reduce((sum,line)=>sum+line.product.price*line.quantity,0)
  const cartCount = cart.reduce((sum,line)=>sum+line.quantity,0)
  const add = (product:Product) => { if(product.stock<1){setNotice('Consulta la disponibilidad de este producto por WhatsApp.');return} setCart(old=>{const found=old.find(x=>x.product.id===product.id);return found?old.map(x=>x.product.id===product.id?{...x,quantity:x.quantity+1}:x):[...old,{product,quantity:1}]});setNotice('Agregado a tu bolsita ✨') }
  const changeQty = (id:string,delta:number) => setCart(old=>old.map(x=>x.product.id===id?{...x,quantity:Math.max(1,x.quantity+delta)}:x))
  const checkout = () => {
    const message=encodeURIComponent(`¡Hola, Lau's Accesorios! 💗 Quiero realizar este pedido:\n\n${cart.map(x=>`• ${x.quantity} × ${x.product.name}${x.size?` (talla ${x.size})`:''} — ${money(x.product.price*x.quantity)}`).join('\n')}\n\nTotal: ${money(total)}\n\n¿Me ayudan a coordinar disponibilidad y envío? ¡Gracias!`)
    if(waNumber){window.open(`https://wa.me/${waNumber}?text=${message}`,'_blank','noopener,noreferrer');return}
    window.open(waCatalogLink,'_blank','noopener,noreferrer')
  }
  const saveProduct = () => {
    if(!form.name.trim()||!form.price||!form.image.trim()){setNotice('Completa nombre, precio e imagen para guardar.');return}
    const p:Product={id:`LA-${String(Date.now()).slice(-6)}`,name:form.name,category:form.category,price:Number(form.price),stock:Number(form.stock)||0,image:form.image,description:form.description}
    setProducts(old=>[p,...old]);setForm({name:'',category:'Aretes',price:'',stock:'',image:'',description:''});setNotice('Producto guardado en este navegador.')
  }
  const downloadCatalog = () => { setShowAdmin(false); window.setTimeout(() => window.print(), 300) }
  const categories:Category[]=['Todos','Entrega inmediata','Aretes','Topitos','Anillos','Cuelga gafas','Iniciales','Collares','Conjuntos','Pulseras','Earcuff','Ropa']
  return <div className="app-shell">
    <div className="site-frame">
    <div className="announcement">UN PEQUEÑO DETALLE, UNA GRAN FORMA DE BRILLAR <Sparkles size={13}/></div>
    <header className="site-header">
      <button className="icon-btn mobile-only" onClick={()=>setMobileMenu(!mobileMenu)} aria-label="Abrir menú">{mobileMenu?<X/>:<Menu/>}</button>
      <a className="brand-mark" href="#" aria-label="Lau's Accesorios" onClick={()=>setShowAdmin(false)}><Sprout size={34} strokeWidth={1}/></a>
      <nav className={mobileMenu?'nav-links open':'nav-links'}>
        <a href="#coleccion" onClick={()=>{setCategory('Aretes');setMobileMenu(false)}}>ARETES</a><a href="#coleccion" onClick={()=>{setCategory('Collares');setMobileMenu(false)}}>COLLARES</a><a href="#coleccion" onClick={()=>{setCategory('Ropa');setMobileMenu(false)}}>ROPA</a><a href="#coleccion" onClick={()=>{setCategory('Todos');setMobileMenu(false)}}>DEMÁS</a>
      </nav>
      <div className="header-actions"><button className="icon-btn search-toggle" onClick={()=>document.getElementById('catalog-search')?.focus()} aria-label="Buscar"><Search size={22} strokeWidth={1.5}/></button><button className="bag-button" onClick={()=>setShowCart(true)} aria-label="Abrir carrito"><ShoppingBag size={22} strokeWidth={1.5}/><span>{cartCount}</span></button></div>
    </header>

    {!showAdmin ? <>
      <main>
        <section className="hero">
          <div className="hero-sky" aria-hidden="true"></div>
          <div className="hero-copy"><h1>LAU'S</h1><p>Joyas que cuentan tu historia.</p></div>
          <div className="hero-jewels" aria-label="Colección de joyas doradas">
            <img className="jewel jewel-earrings" src="https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?auto=format&fit=crop&w=650&q=90" alt="Aretes dorados"/>
            <img className="jewel jewel-chain" src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?auto=format&fit=crop&w=900&q=90" alt="Collar dorado"/>
            <img className="jewel jewel-ring" src="https://images.unsplash.com/photo-1605100804763-247f67b3557e?auto=format&fit=crop&w=650&q=90" alt="Anillo dorado"/>
          </div>
          <div className="hero-bottom-line"></div>
          <a className="hero-play" href="#coleccion" aria-label="Explorar la colección"><Play size={15} fill="currentColor"/></a>
        </section>
        <section className="benefits"><div><Sparkles/><span>Detalles que enamoran</span></div><div><Truck/><span>Envíos coordinados por WhatsApp</span></div><div><Heart/><span>Encuentra tu próximo favorito</span></div></section>
        <section className="catalog-section" id="coleccion">
          <div className="section-heading"><div><span className="eyebrow">ENCUENTRA TU FAVORITO</span><h2>Una colección <i>para ti.</i></h2></div><label className="search-box"><Search size={17}/><input id="catalog-search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Buscar joyas, accesorios..."/></label></div>
          <div className="category-row">{categories.map(c=><button key={c} className={category===c?'category-chip active':'category-chip'} onClick={()=>setCategory(c)}>{c}<span>↗</span></button>)}</div>
          <div className="product-grid">{visible.map((p,i)=><article className="product-card" key={p.id} style={{'--delay':`${i*60}ms`} as CSSProperties}><div className="product-photo"><img src={p.image} alt={p.name}/>{p.badge&&<span className="product-badge">{p.badge}</span>}<button className="quick-add" onClick={()=>add(p)} aria-label={`Agregar ${p.name}`}><Plus size={18}/></button></div><div className="product-meta"><div><span className="product-category">{p.category}</span><h3>{p.name}</h3></div><strong>{money(p.price)}</strong></div><span className={p.stock>0?'stock in-stock':'stock out-stock'}>{p.stock>0?`Disponible · ${p.stock} unidades`:'Agotado · Consulta disponibilidad'}</span></article>)}</div>
          {visible.length===0&&<div className="empty-state">No encontramos productos con esa búsqueda. Prueba otra palabra.</div>}
        </section>
        <section className="promo-band"><div><span className="eyebrow">UN TOQUE EXTRA DE MAGIA</span><h2>Tu estilo,<br/><i>tu universo.</i></h2><p>Combina, juega y encuentra piezas que hablen de ti.</p><a href="#coleccion" className="light-pill">Ver colección <ArrowRight size={16}/></a></div><div className="promo-orb">✧</div></section>
        <section className="story-section" id="historia"><span className="eyebrow">HOLA, SOMOS LAU'S</span><h2>La belleza está<br/>en los <i>detalles.</i></h2><p>Creemos en esos pequeños acentos que transforman un día común en uno especial. Encuentra aquí piezas para expresar tu esencia.</p></section>
      </main>
      <footer><a className="wordmark" href="#">Lau's<span>Accesorios</span><i>✳</i></a><span>Brilla a tu manera. © {new Date().getFullYear()} Lau's Accesorios</span><div><a href="#coleccion">Colección</a><a href="#historia">Nosotros</a><a href="https://wa.link/3ozvv4" target="_blank" rel="noreferrer">WhatsApp</a><button onClick={()=>setShowAdmin(true)}>Administración</button></div></footer>
    </> : <Admin products={products} setProducts={setProducts} activeTab={activeTab} setActiveTab={setActiveTab} form={form} setForm={setForm} saveProduct={saveProduct} downloadCatalog={downloadCatalog} onExit={()=>setShowAdmin(false)}/>}
    </div>
    {showCart&&<div className="drawer-backdrop" onClick={()=>setShowCart(false)}><aside className="cart-drawer" onClick={e=>e.stopPropagation()}><div className="drawer-head"><div><span className="eyebrow">TU SELECCIÓN</span><h2>Tu bolsita <i>♥</i></h2></div><button className="icon-btn" onClick={()=>setShowCart(false)}><X/></button></div>{cart.length===0?<div className="empty-state">Tu bolsita está esperando algo bonito ✨</div>:<><div className="cart-lines">{cart.map(line=><div className="cart-line" key={line.product.id}><img src={line.product.image} alt={line.product.name}/><div className="cart-line-info"><b>{line.product.name}</b><span>{money(line.product.price)}</span><div className="qty"><button onClick={()=>changeQty(line.product.id,-1)}>−</button>{line.quantity}<button onClick={()=>changeQty(line.product.id,1)}>+</button></div></div><button className="remove-btn" onClick={()=>setCart(old=>old.filter(x=>x.product.id!==line.product.id))}><Trash2 size={16}/></button></div>)}</div><div className="cart-total"><span>Total estimado</span><b>{money(total)}</b></div><p className="cart-note">El envío y la disponibilidad se coordinan directamente por WhatsApp.</p><button className="checkout-btn" onClick={checkout}>Continuar por WhatsApp <MessageCircle size={18}/></button></>}</aside></div>}
    {notice&&<button className="toast" onClick={()=>setNotice('')}>{notice}<X size={14}/></button>}
  </div>
}

function Admin({products,setProducts,activeTab,setActiveTab,form,setForm,saveProduct,downloadCatalog,onExit}:{products:Product[];setProducts:Dispatch<SetStateAction<Product[]>>;activeTab:string;setActiveTab:(s:string)=>void;form:{name:string;category:Product['category'];price:string;stock:string;image:string;description:string};setForm:Dispatch<SetStateAction<typeof form>>;saveProduct:()=>void;downloadCatalog:()=>void;onExit:()=>void}) {
 const [adding,setAdding]=useState(false)
 const nav=[['Resumen',LayoutDashboard],['Productos',Package],['Inventario',Package],['Promociones',Tag],['Estadísticas',ChartNoAxesCombined],['Configuración',Settings]] as const
 const low=products.filter(p=>p.stock>0&&p.stock<=3).length, out=products.filter(p=>p.stock===0).length
 return <div className="admin-shell"><aside className="admin-sidebar"><a className="admin-brand" href="#" onClick={e=>{e.preventDefault();onExit()}}>L<span>✳</span></a><span className="admin-label">WORKSPACE</span>{nav.map(([n,Icon])=><button key={n} className={activeTab===n?'admin-nav active':'admin-nav'} onClick={()=>setActiveTab(n)}><Icon size={17}/>{n}</button>)}<div className="sidebar-bottom"><div className="admin-avatar">L</div><div><b>Lau's Admin</b><small>Administrador</small></div></div></aside><section className="admin-main"><header className="admin-top"><div><span className="eyebrow">LAU'S ACCESORIOS / ADMIN</span><h1>{activeTab}</h1></div><div className="admin-top-actions"><span className="live-dot">● Guardado local</span><button className="outline-btn" onClick={onExit}>Ver tienda <ArrowUpRight size={15}/></button></div></header>
 {activeTab==='Resumen'&&<><div className="admin-kpis"><Kpi title="Productos publicados" value={String(products.length).padStart(2,'0')} note="En tu catálogo" icon={<Package/>}/><Kpi title="Stock bajo" value={String(low).padStart(2,'0')} note="Revisar existencias" icon={<Cloud/>}/><Kpi title="Agotados" value={String(out).padStart(2,'0')} note="Consultar disponibilidad" icon={<CircleHelp/>}/><Kpi title="Valor del inventario" value={money(products.reduce((s,p)=>s+p.price*p.stock,0))} note="Estimado actual" icon={<ChartNoAxesCombined/>}/></div><div className="admin-panels"><div className="admin-panel wide"><div className="panel-title"><div><span className="eyebrow">VISTA GENERAL</span><h3>Productos del catálogo</h3></div><button className="pink-btn" onClick={()=>{setActiveTab('Productos');setAdding(true)}}><Plus size={15}/> Nuevo producto</button></div><div className="mini-product-list">{products.slice(0,5).map(p=><div key={p.id}><img src={p.image} alt=""/><span>{p.name}<small>{p.category} · {p.id}</small></span><b>{money(p.price)}</b><em>{p.stock>0?`${p.stock} uds.`:'Agotado'}</em></div>)}</div></div><div className="admin-panel"><span className="eyebrow">ATENCIÓN</span><h3>Alertas de inventario</h3><div className="alert-number">{low+out}<small> productos necesitan atención</small></div>{products.filter(p=>p.stock<=3).slice(0,4).map(p=><div className="alert-row" key={p.id}><span>{p.name}</span><b>{p.stock===0?'Agotado':`${p.stock} uds.`}</b></div>)}</div></div><div className="admin-panel"><div className="panel-title"><div><span className="eyebrow">ACCESO RÁPIDO</span><h3>Herramientas de tu tienda</h3></div></div><div className="quick-tools"><button onClick={()=>{setActiveTab('Productos');setAdding(true)}}><Plus/>Agregar producto</button><button onClick={downloadCatalog}><Download/>Imprimir / guardar catálogo PDF</button><button onClick={()=>setActiveTab('Inventario')}><Package/>Revisar inventario</button></div></div></>}
 {activeTab==='Productos'&&<div className="admin-panel"><div className="panel-title"><div><span className="eyebrow">CATÁLOGO</span><h3>Gestiona tus productos</h3></div><button className="pink-btn" onClick={()=>setAdding(!adding)}><Plus size={15}/> {adding?'Cerrar':'Agregar producto'}</button></div>{adding&&<div className="product-form"><input placeholder="Nombre del producto" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/><select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value as Product['category']}))}>{['Entrega inmediata','Aretes','Topitos','Anillos','Cuelga gafas','Iniciales','Collares','Conjuntos','Pulseras','Earcuff','Ropa'].map(c=><option key={c}>{c}</option>)}</select><input type="number" placeholder="Precio COP" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))}/><input type="number" placeholder="Unidades" value={form.stock} onChange={e=>setForm(f=>({...f,stock:e.target.value}))}/><input className="full" placeholder="URL de la fotografía" value={form.image} onChange={e=>setForm(f=>({...f,image:e.target.value}))}/><textarea className="full" placeholder="Descripción" value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/><button className="pink-btn full" onClick={saveProduct}><Check size={16}/> Guardar producto</button></div>}<div className="table-wrap"><table><thead><tr><th>Producto</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acción</th></tr></thead><tbody>{products.map(p=><tr key={p.id}><td><div className="table-product"><img src={p.image} alt=""/><span>{p.name}<small>{p.id}</small></span></div></td><td>{p.category}</td><td>{money(p.price)}</td><td><span className={p.stock>0?'stock-tag':'stock-tag empty'}>{p.stock>0?p.stock:'Agotado'}</span></td><td><button className="icon-btn danger" onClick={()=>setProducts(old=>old.filter(x=>x.id!==p.id))}><Trash2 size={16}/></button></td></tr>)}</tbody></table></div></div>}
 {activeTab==='Inventario'&&<div className="admin-panel"><span className="eyebrow">CONTROL DE EXISTENCIAS</span><h3>Inventario</h3><div className="inventory-list">{products.map(p=><div key={p.id}><img src={p.image} alt=""/><span>{p.name}<small>{p.id}</small></span><button onClick={()=>setProducts(old=>old.map(x=>x.id===p.id?{...x,stock:Math.max(0,x.stock-1)}:x))}>−</button><b>{p.stock}</b><button onClick={()=>setProducts(old=>old.map(x=>x.id===p.id?{...x,stock:x.stock+1}:x))}>+</button></div>)}</div></div>}
 {activeTab==='Promociones'&&<div className="admin-panel"><span className="eyebrow">CAMPAÑAS</span><h3>Promociones</h3><p>La gestión de descuentos y campañas se habilitará en la siguiente iteración del panel.</p></div>}
 {activeTab==='Estadísticas'&&<div className="admin-panel"><span className="eyebrow">RENDIMIENTO</span><h3>Actividad de la tienda</h3><p>Los pedidos se concretan en WhatsApp. Para medir consultas, clics y productos más solicitados conectaremos eventos de analítica en la siguiente fase.</p></div>}
 {activeTab==='Configuración'&&<div className="admin-panel"><span className="eyebrow">AJUSTES</span><h3>Configuración de Lau's</h3><p>El número de WhatsApp se configura mediante la variable VITE_WHATSAPP_NUMBER. La autenticación segura y la sincronización en la nube se conectarán antes de publicar el panel.</p><button className="outline-btn" onClick={downloadCatalog}><Download size={16}/> Generar catálogo PDF</button></div>}
 </section></div>
}
function Kpi({title,value,note,icon}:{title:string;value:string;note:string;icon:ReactNode}){return <div className="kpi-card"><div className="kpi-top"><span>{title}</span>{icon}</div><strong>{value}</strong><small>{note}</small></div>}
