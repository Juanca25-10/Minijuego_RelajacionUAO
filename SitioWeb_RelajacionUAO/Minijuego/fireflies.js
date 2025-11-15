// fireflies.js - versión lista para video y audio

// ---------------------------
// Utilidades
// ---------------------------
function getDocumentHeight() {
    const b = document.body, h = document.documentElement;
    return Math.max(b.scrollHeight, b.offsetHeight, h.clientHeight, h.scrollHeight, h.offsetHeight);
}

// Rutas de assets
const ASSET_IMG = "./Assets/Imagenes/";
const ASSET_AUDIO = "./Assets/Audios/";
const ASSET_VIDEO = "./Assets/Videos/";

// ---------------------------
// ASSETS MANAGER (simple)
// ---------------------------
class AssetsManager {
    constructor() { this.images = {}; }
    loadImage(key, src) {
        return new Promise((res, rej) => {
            const img = new Image();
            img.src = src;
            img.onload = () => { this.images[key] = img; res(img); };
            img.onerror = (e) => { console.error("Error cargando imagen:", src); rej(e); };
        });
    }
    getImage(key) { return this.images[key] || null; }
}

// ---------------------------
// AUDIO (background + net + capture)
// ---------------------------
class GameAudio {
    constructor() {
        this.bg = new Audio(ASSET_AUDIO + "AudioFondoJuego.mp3");
        this.net = new Audio(ASSET_AUDIO + "old-men-arm-move-97741.mp3");
        this.capture = new Audio(ASSET_AUDIO + "notification-bell-sound-376888.mp3");

        this.bg.loop = true; this.bg.volume = 0.9;
        this.net.volume = 1.0; this.capture.volume = 0.05;
    }
    startBg() { this.bg.play().catch(()=>{}); }
    stopBg() { this.bg.pause(); this.bg.currentTime = 0; }
    playNet() { this.net.currentTime = 0; this.net.play().catch(()=>{}); }
    playCapture() { this.capture.currentTime = 0; this.capture.play().catch(()=>{}); }
}

// ---------------------------
// FIREFLY
// ---------------------------
class Firefly {
    constructor(id, docW, docH, image) {
        this.id = id;
        this.image = image;
        this.radius = 20;
        this.width = 48; this.height = 48;
        this.x = Math.random() * docW;
        this.y = Math.random() * docH;
        this.vx = (Math.random()-0.5)*1.2;
        this.vy = (Math.random()-0.5)*1.2;
        this.flickerTime = Math.random()*Math.PI*2;
        this.flickerSpeed = 0.02 + Math.random()*0.06;
        this.alpha = 1;
        this.isCaptured = false;
    }
    update(docW, docH) {
        if(this.isCaptured) return;
        this.x += this.vx;
        this.y += this.vy;

        if(this.x<this.radius){this.x=this.radius; this.vx*=-1;}
        if(this.x>docW-this.radius){this.x=docW-this.radius; this.vx*=-1;}
        if(this.y<this.radius){this.y=this.radius; this.vy*=-1;}
        if(this.y>docH-this.radius){this.y=docH-this.radius; this.vy*=-1;}

        this.flickerTime += this.flickerSpeed;
        this.alpha = 0.6 + Math.sin(this.flickerTime)*0.4;
    }
    draw(ctx, scrollY){
        if(this.isCaptured) return;
        const drawY = this.y - scrollY;
        if(drawY+this.radius<0 || drawY-this.radius>ctx.canvas.height) return;

        ctx.save();
        ctx.globalAlpha = this.alpha;
        ctx.shadowBlur = 12*this.alpha;
        ctx.shadowColor = `rgba(255,230,140,${0.8*this.alpha})`;

        if(this.image && this.image.complete && this.image.naturalWidth>0){
            ctx.drawImage(this.image, this.x-this.width/2, drawY-this.height/2, this.width, this.height);
        } else {
            ctx.fillStyle = `rgba(255,255,180,${this.alpha})`;
            ctx.beginPath(); ctx.arc(this.x, drawY, this.radius,0,Math.PI*2); ctx.fill();
        }

        ctx.restore();
    }
    capture(){ this.isCaptured=true; }
    reset(docW, docH){
        this.x=Math.random()*docW;
        this.y=Math.random()*docH;
        this.vx=(Math.random()-0.5)*1.2;
        this.vy=(Math.random()-0.5)*1.2;
        this.isCaptured=false;
    }
}

// ---------------------------
// FIRELFY GAME
// ---------------------------
class FireflyGame {
    constructor(){
        this.canvas = document.getElementById("firefly-game-canvas");
        this.ctx = this.canvas.getContext("2d");
        this.toggleBtn = document.getElementById("firefly-toggle-btn");
        this.iconStart = document.getElementById("btn-icon-start");
        this.iconClose = document.getElementById("btn-icon-close");
        this.tooltip = document.getElementById("tooltip-text");
        this.ctaBar = document.getElementById("cta-bar");

        this.assets = new AssetsManager();
        this.audio = new GameAudio();

        this.isGameActive = false;
        this.fireflies = [];
        this.total = 28;
        this.capturedCount = 0;

        this.raf = null;
        this.resizeHandler = this.resizeCanvas.bind(this);
        this.clickHandler = this.handleClick.bind(this);

        this._preloadAssets();

        // -------------------
        // VIDEO FIREFLIES
        // -------------------
this.fireflyVideo = document.createElement("video");
this.fireflyVideo.src = ASSET_VIDEO + "0001-0012.webm"; // tu video
this.fireflyVideo.loop = false;        // NO en loop
this.fireflyVideo.autoplay = false;    // NO autoplay
this.fireflyVideo.muted = true;        // solo video, audio separado
this.fireflyVideo.playsInline = true;
Object.assign(this.fireflyVideo.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100vw",
    height: "100vh",
    zIndex: 998,
    background: "transparent",
    pointerEvents: "none",
    display: "none"                  // oculto hasta iniciar
});
document.body.appendChild(this.fireflyVideo);

// -------------------
// Reproducir al click de captura
// -------------------
this.canvas.addEventListener("click", () => {
    if(this.isGameActive && this.fireflyVideo.paused){
        this.fireflyVideo.currentTime = 0;
        this.fireflyVideo.play().catch(()=>{});
    }
});
    }

    async _preloadAssets(){
        try {
            await Promise.all([
                this.assets.loadImage("firefly", ASSET_IMG+"firefly-image.png"),
                this.assets.loadImage("net", ASSET_IMG+"Red_.png")
            ]);
        } catch(e){console.warn("Algunas imágenes no se cargaron:", e);}
    }

    resizeCanvas(){ this.canvas.width=window.innerWidth; this.canvas.height=window.innerHeight; }

    initializeFireflies(){
        const docH=getDocumentHeight();
        const docW=window.innerWidth;
        this.fireflies=[];
        for(let i=0;i<this.total;i++) this.fireflies.push(new Firefly(i,docW,docH,this.assets.getImage("firefly")));
    }

    async start(){
        if(this.isGameActive) return;

        this.audio.startBg();
        this.resizeCanvas();
        window.addEventListener("resize", this.resizeHandler);
        this.canvas.addEventListener("click", this.clickHandler);

        this.initializeFireflies();
        this.isGameActive=true;
        this.capturedCount=0;

        document.body.classList.add("crosshair-cursor");
        this.canvas.style.pointerEvents="auto";

        // mostrar video
        this.fireflyVideo.style.display="block";
        this.fireflyVideo.play().catch(()=>{});

        this.loop();
    }

    stop(){
        if(!this.isGameActive) return;

        this.isGameActive=false;
        cancelAnimationFrame(this.raf);

        window.removeEventListener("resize", this.resizeHandler);
        this.canvas.removeEventListener("click", this.clickHandler);

        this.audio.stopBg();
        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);

        document.body.classList.remove("crosshair-cursor");
        this.canvas.style.pointerEvents="none";

        // ocultar video
        this.fireflyVideo.pause();
        this.fireflyVideo.style.display="none";
    }

    handleClick(ev){
        if(!this.isGameActive) return;

        const vx=ev.clientX;
        const vy=ev.clientY;

        this.audio.playNet();

        const clickAbsX=vx;
        const clickAbsY=vy+window.scrollY;

        const captureRadius=80;
        const docH=getDocumentHeight();
        const docW=window.innerWidth;

        for(const f of this.fireflies){
            if(f.isCaptured) continue;
            const dist=Math.hypot(f.x-clickAbsX,f.y-clickAbsY);
            if(dist<=f.radius+captureRadius){
                f.capture();
                this.capturedCount++;
                this.audio.playCapture();
                setTimeout(()=>{ f.reset(docW,docH); },700);
            }
        }
    }

    drawUI(){
        const text=`${this.capturedCount}`;
        this.ctx.save();
        this.ctx.font="bold 50px Inter, Arial";
        this.ctx.textBaseline="top";
        const x=40, y=35;
        this.ctx.shadowColor="rgba(0,0,0,0.85)";
        this.ctx.shadowBlur=10;
        this.ctx.fillStyle="white";
        this.ctx.fillText(text,x,y);
        this.ctx.restore();
    }

    loop(){
        if(!this.isGameActive) return;
        this.raf=requestAnimationFrame(this.loop.bind(this));

        const docH=getDocumentHeight();
        const docW=window.innerWidth;
        const scrollY=window.scrollY;

        this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
        for(const f of this.fireflies){ f.update(docW,docH); f.draw(this.ctx,scrollY);}
        this.drawUI();
    }
}

// ---------------------------
// Inicialización
// ---------------------------
document.addEventListener("DOMContentLoaded",()=>{
    const game=new FireflyGame();
    game.canvas.style.pointerEvents="none";
    game.canvas.width=window.innerWidth;
    game.canvas.height=window.innerHeight;

    const toggleBtn=document.getElementById("firefly-toggle-btn");
    const iconStart=document.getElementById("btn-icon-start");
    const iconClose=document.getElementById("btn-icon-close");
    const tooltip=document.getElementById("tooltip-text");
    const ctaBar=document.getElementById("cta-bar");

    iconStart.classList.remove("hidden");
    iconClose.classList.add("hidden");

    toggleBtn.addEventListener("mouseenter",()=>{
        if(!game.isGameActive){
            iconStart.src=ASSET_IMG+"Button_SiInteractua.png";
            tooltip.textContent="Iniciar Descanso Activo";
        }
    });
    toggleBtn.addEventListener("mouseleave",()=>{
        if(!game.isGameActive){
            iconStart.src=ASSET_IMG+"Button_NoInteractua.png";
            tooltip.textContent="Iniciar Descanso Activo";
        }
    });

    toggleBtn.addEventListener("click",async()=>{
        const isActivating=!game.isGameActive;
        if(isActivating){
            iconStart.classList.add("hidden");
            iconClose.classList.remove("hidden");
            tooltip.textContent="Detener Descanso Activo";
            if(ctaBar) ctaBar.classList.add("cta-hidden");
            game.canvas.style.pointerEvents="auto";
            await game.start();
        } else {
            game.stop();
            iconStart.classList.remove("hidden");
            iconClose.classList.add("hidden");
            iconStart.src=ASSET_IMG+"Button_NoInteractua.png";
            tooltip.textContent="Iniciar Descanso Activo";
            if(ctaBar && window.scrollY>100) ctaBar.classList.remove("cta-hidden");
        }
    });
});