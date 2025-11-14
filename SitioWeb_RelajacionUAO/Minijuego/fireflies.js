// --- ARCHIVO PRINCIPAL DE LÓGICA DEL MINIJUEGO (POO) ---
// NOTA: Se ha simplificado la estructura de rutas a "./Assets/..."

// =================================================================
// 0. CONSTANTES Y UTILIDADES
// =================================================================

// RUTAS CRÍTICAS: AJUSTA ESTAS SI EL NAVEGADOR DEVUELVE ERROR 404
// Por defecto, se asume que la carpeta Assets está al lado de este script y del HTML
const ASSET_IMAGE_PATH = './Assets/Imagenes/'; 
const AUDIO_PATH = './Assets/Audios/'; 

/**
 * Calcula la altura total del contenido del documento.
 * Esta función ya NO se usa para el Canvas, sino para el límite de las luciérnagas.
 */
function getDocumentHeight() {
    const body = document.body;
    const html = document.documentElement;
    // Retorna la altura máxima del documento, incluyendo el contenido con scroll
    return Math.max( 
        body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight 
    );
}

// =================================================================
// 1. ASSETS MANAGER (Gestión de Carga de Recursos)
// =================================================================
class AssetsManager {
    constructor() {
        this.images = {};
        this.imageUrls = {
            firefly: ASSET_IMAGE_PATH + 'firefly-image.png', 
            net: ASSET_IMAGE_PATH + 'Red_.png',
            // Rutas de botones necesarias para el UIManager
            btnStart: ASSET_IMAGE_PATH + 'Button_NoInteractua.png',
            btnHover: ASSET_IMAGE_PATH + 'Button_SiInteractua.png',
            btnClose: ASSET_IMAGE_PATH + 'X_Salir.png',
        };
        this.audioUrls = {
            background: AUDIO_PATH + 'Audiofondojuego.mp3', 
            net: AUDIO_PATH + 'old-men-arm-move-97741.mp3', 
            capture: AUDIO_PATH + 'notification-bell-sound-376888.mp3' 
        };
    }

    /**
     * Carga una imagen y la almacena en el objeto 'images'.
     */
    async loadImage(name, url) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = url; 
            
            img.onerror = (e) => {
                console.error(`ERROR 404: Falló la carga de la imagen '${name}' desde: ${url}. Revisa la ruta.`);
                reject(new Error(`Failed to load image ${url}`));
            };
            img.onload = () => {
                this.images[name] = img;
                resolve(img);
            };
        });
    }

    /**
     * Inicia la carga de todos los assets de imagen necesarios para el juego.
     */
    async preloadGameAssets() {
        console.log("Iniciando precarga de assets...");
        // Solo cargamos las imágenes necesarias para el canvas (luciérnaga y red)
        const imageKeys = ['firefly', 'net'];
        const promises = imageKeys.map(name => this.loadImage(name, this.imageUrls[name]));
        
        await Promise.allSettled(promises);
        console.log("Precarga de imágenes de canvas completada.");
    }
}


// =================================================================
// 2. GAME AUDIO (Gestión de Audio con Volúmenes Controlables)
// =================================================================

class GameAudio {
    constructor(assetsManager) {
        this.assetsManager = assetsManager;
        this.contextInitialized = false;
        
        this.volumeBackground = 0.8;
        this.volumeNet = 1.0;
        this.volumeCapture = 0.1;

        // Inicializar los objetos Audio con las rutas cargadas
        this.bgAudio = new Audio(this.assetsManager.audioUrls.background);
        this.bgAudio.loop = true;
        this.netAudio = new Audio(this.assetsManager.audioUrls.net);
        this.captureAudio = new Audio(this.assetsManager.audioUrls.capture);

        this._applyVolumes();
        this._addAudioErrorListeners();
    }
    
    /** Aplica los volúmenes definidos a los objetos Audio. */
    _applyVolumes() {
        this.bgAudio.volume = this.volumeBackground;
        this.netAudio.volume = this.volumeNet;
        this.captureAudio.volume = this.volumeCapture;
    }
    
    /** Añade manejadores de errores de audio para diagnosticar rutas incorrectas. */
    _addAudioErrorListeners() {
        const handleError = (audio, name) => {
            audio.onerror = () => {
                console.error(`Error al cargar o reproducir el audio '${name}'. Revisa la ruta: ${audio.src}`);
            };
        };
        handleError(this.bgAudio, 'Background');
        handleError(this.netAudio, 'Net');
        handleError(this.captureAudio, 'Capture');
    }

    /**
     * Garantiza que el contexto de audio esté listo y las fuentes correctas.
     */
    initializeContext() {
        if (this.contextInitialized) return;
        
        this.bgAudio.src = this.assetsManager.audioUrls.background;
        this.netAudio.src = this.assetsManager.audioUrls.net;
        this.captureAudio.src = this.assetsManager.audioUrls.capture;
            
        this.bgAudio.load();
        this.netAudio.load();
        this.captureAudio.load();
        this.contextInitialized = true;
    }
    
    /**
     * Reproduce un clip de audio. Maneja errores de reproducción.
     */
    _playClip(audioClip) {
        this.initializeContext();
        
        if (!audioClip.src || audioClip.src.endsWith('/')) { 
             console.error("Error al reproducir audio: URL no definida o incorrecta.", "URL actual:", audioClip.src);
             return;
        }

        if (audioClip.readyState > 0 && audioClip.currentTime > 0) {
            audioClip.currentTime = 0;
        }
        
        audioClip.play().catch(e => {
            if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') { 
                console.error("Error al reproducir audio:", e.message, e);
            }
        });
    }

    playNetSound() {
        this._playClip(this.netAudio);
    }

    playCaptureSound() {
        this._playClip(this.captureAudio);
    }

    startBackgroundMusic() {
        this.initializeContext();
        if (!this.bgAudio.src || this.bgAudio.src.endsWith('/')) return;
        
        this.bgAudio.play().catch(e => {
             if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') {
                console.error("Error al iniciar música de fondo:", e.message, e);
            }
        });
    }
    
    stopBackgroundMusic() {
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
    }
}


// =================================================================
// 3. FIREFLY (Objeto Luciérnaga)
// =================================================================

class Firefly {
    // Las luciérnagas se inicializan con coordenadas absolutas al DOCUMENTO
    constructor(id, docWidth, docHeight, fireflyImage) { 
        this.id = id;
        this.radius = 30; 
        this.x = Math.random() * docWidth;
        this.y = Math.random() * docHeight; // Coordenada Y absoluta en el documento
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.color = 'rgba(255, 255, 100, 1)'; 
        this.isCaptured = false;
        this.image = fireflyImage;
        this.width = 60; 
        this.height = 60; 
        this.flickerSpeed = Math.random() * 0.05 + 0.01; 
        this.flickerTime = Math.random() * Math.PI * 2; 
        this.flicker = 1.0; 
    }

    update(docWidth, docHeight) {
        if (this.isCaptured) return;
        this.x += this.vx;
        this.y += this.vy;

        // Rebote en bordes X (Ancho de la ventana visible)
        if (this.x + this.radius > docWidth || this.x - this.radius < 0) {
            this.vx *= -1;
            this.x = Math.min(Math.max(this.x, this.radius), docWidth - this.radius);
        }

        // Rebote en bordes Y (Altura total del documento)
        if (this.y + this.radius > docHeight || this.y - this.radius < 0) {
            this.vy *= -1;
            this.y = Math.min(Math.max(this.y, this.radius), docHeight - this.radius);
        }
        
        this.flickerTime += this.flickerSpeed;
        this.flicker = 0.65 + Math.sin(this.flickerTime) * 0.35; 
    }

    draw(ctx, scrollY) {
        if (this.isCaptured) return;
        
        // La posición de dibujo en el CANVAS FIJO es la posición absoluta MENOS el scroll.
        const drawY = this.y - scrollY; 
        
        // No dibujamos si está fuera de la ventana visible (que es el tamaño del canvas)
        if (drawY + this.radius < 0 || drawY - this.radius > ctx.canvas.height) {
            return;
        }

        ctx.shadowBlur = this.flicker * 10 + 5; 
        ctx.shadowColor = `rgba(255, 255, 150, ${this.flicker})`; 
        ctx.globalAlpha = this.flicker; 
        
        if (this.image && this.image.complete && this.image.naturalWidth > 0) {
            ctx.drawImage(this.image, 
                          this.x - this.width / 2, 
                          drawY - this.height / 2, // Usamos drawY compensado
                          this.width, this.height);
        } else {
            // Fallback: Círculo si la imagen falla
            ctx.fillStyle = this.color;
            ctx.beginPath();
            ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2); // Usamos drawY compensado
            ctx.fill();
        }

        ctx.globalAlpha = 1.0; 
        ctx.shadowBlur = 0; 
    }
    
    reset(docWidth, docHeight) {
        this.x = Math.random() * docWidth;
        this.y = Math.random() * docHeight;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.isCaptured = false;
        this.flickerSpeed = Math.random() * 0.05 + 0.01;
        this.flickerTime = Math.random() * Math.PI * 2;
    }
}


// =================================================================
// 4. FIREFLY GAME (Motor Principal)
// =================================================================
class FireflyGame {
    constructor(audio, assetsManager) {
        this.canvas = document.getElementById('firefly-game-canvas');
        this.ctx = this.canvas ? this.canvas.getContext('2d') : null; 
        this.fireflies = [];
        this.totalInitialFireflies = 25; 
        this.capturedCount = 0;
        this.animationFrameId = null;
        this.audio = audio; 
        this.assetsManager = assetsManager;
        this.isGameActive = false;
        
        this.netSize = { width: 500, height: 500 }; 
        
        this.net = { 
            offsetX: 0, 
            x: 0, // Coordenada X relativa a la ventana
            y: 0, // Coordenada Y relativa a la ventana
        };
        
        this.netAnimationState = 'idle'; 
        this.netAnimationTime = 0;
        this.netAnimationDuration = 10; 
        this.netLaunchDistance = 150; 
        this.netCaptureRadius = 50; 
        
        this.fireflyImage = null; 
        this.netImage = null; 

        this.resizeCanvasHandler = this.resizeCanvas.bind(this);
        this.handleMouseClickHandler = this.handleMouseClick.bind(this);
    }

    async initialize() { 
        if (!this.canvas || !this.ctx) {
             console.error("Error: Canvas o Context no encontrados. El juego no puede iniciarse.");
             return;
        }

        await this.assetsManager.preloadGameAssets(); 
        this.fireflyImage = this.assetsManager.images.firefly; 
        this.netImage = this.assetsManager.images.net; 
        
        this.resizeCanvas();
        window.addEventListener('resize', this.resizeCanvasHandler);
        
        const docHeight = getDocumentHeight();
        const docWidth = window.innerWidth;

        if (this.fireflies.length === 0) {
            // Inicializa las luciérnagas en las coordenadas absolutas del documento
            for (let i = 0; i < this.totalInitialFireflies; i++) {
                this.fireflies.push(new Firefly(i, docWidth, docHeight, this.fireflyImage)); 
            }
        } else {
            this.fireflies.forEach(fly => fly.reset(docWidth, docHeight));
        }
        
        this.canvas.addEventListener('click', this.handleMouseClickHandler);
        
        this.startLoop();
        this.audio.startBackgroundMusic(); 
        console.log(`Juego iniciado con ${this.fireflies.length} luciérnagas.`);
    }
    
    // Función para redimensionar el canvas al tamaño de la ventana visible
    resizeCanvas() {
        if(this.canvas) {
            this.canvas.width = window.innerWidth;
            this.canvas.height = window.innerHeight; // Altura de la ventana visible (viewport)
            
            // Forzamos la actualización de límites de las luciérnagas
            if (this.isGameActive) {
                const docHeight = getDocumentHeight();
                const docWidth = window.innerWidth;
                this.fireflies.forEach(fly => fly.update(docWidth, docHeight));
            }
        }
    }

    handleMouseClick(event) {
        if (!this.isGameActive) return;
        
        // Coordenadas del click en la ventana visible (canvas fijo)
        const viewportClickX = event.clientX;
        const viewportClickY = event.clientY; 
        
        // Transformamos el click a coordenada ABSOLUTA del documento
        const clickXAbsolute = viewportClickX;
        const clickYAbsolute = viewportClickY + window.scrollY; 

        if (this.netAnimationState === 'idle') {
            this.audio.playNetSound(); 
            this.netAnimationState = 'launching';
            this.netAnimationTime = 0;
            
            // La red se fija en las coordenadas RELATIVAS A LA VENTANA donde se hizo click
            this.net.x = viewportClickX;
            this.net.y = viewportClickY;
        }
        
        const docHeight = getDocumentHeight();
        const docWidth = window.innerWidth;

        for (const fly of this.fireflies) {
            if (fly.isCaptured) continue;

            // La distancia se calcula usando las coordenadas absolutas del documento
            const distance = Math.sqrt(
                (fly.x - clickXAbsolute) ** 2 + (fly.y - clickYAbsolute) ** 2 
            );

            if (distance < fly.radius + this.netCaptureRadius) { 
                fly.isCaptured = true;
                this.capturedCount++;
                this.audio.playCaptureSound();
                
                setTimeout(() => {
                    // Resetea a una nueva posición dentro de la nueva altura del documento
                    fly.reset(docWidth, docHeight);
                }, 500); 

                break;
            }
        }
    }

    gameLoop() {
        if (!this.isGameActive || !this.ctx) {
            this.animationFrameId = null;
            return;
        }
        
        const docHeight = getDocumentHeight();
        const docWidth = window.innerWidth;
        const scrollY = window.scrollY;
        
        // Limpiamos todo el canvas visible (100vw x 100vh)
        this.ctx.clearRect(0, 0, docWidth, window.innerHeight); 
        
        if (this.netAnimationState !== 'idle') {
            this.netAnimationTime++;
            let progress = this.netAnimationTime / this.netAnimationDuration;

            if (this.netAnimationState === 'launching') {
                this.net.offsetX = -this.netLaunchDistance * Math.sin(progress * Math.PI / 2); 
                if (this.netAnimationTime >= this.netAnimationDuration) {
                    this.netAnimationState = 'returning';
                    this.netAnimationTime = 0;
                }
            } else if (this.netAnimationState === 'returning') {
                this.net.offsetX = -this.netLaunchDistance * (1 - Math.sin(progress * Math.PI / 2));
                if (this.netAnimationTime >= this.netAnimationDuration) {
                    this.netAnimationState = 'idle';
                    this.net.offsetX = 0;
                }
            }
        } else {
             this.net.offsetX = 0; 
        }
        
        // Dibujamos las luciérnagas (compensando el scroll)
        for (const fly of this.fireflies) {
            fly.update(docWidth, docHeight);
            
            // El método draw internamente aplica la compensación de scroll
            fly.draw(this.ctx, scrollY);
        }
        
        // La red y el puntaje se dibujan sin scrollY porque el canvas es fijo
        this.drawNet(); 
        this.drawScore();

        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    drawNet() {
        if (!this.netImage || !this.netImage.complete || this.netAnimationState === 'idle' || !this.ctx) {
             return; 
        }

        // La red se dibuja en sus coordenadas relativas a la ventana (this.net.x, this.net.y)
        const drawY = this.net.y - (this.netSize.height / 2); 
        const drawX = this.net.x - (this.netSize.width / 2) + this.net.offsetX; 
        
        this.ctx.drawImage(this.netImage, drawX, drawY, this.netSize.width, this.netSize.height);
    }

    drawScore() {
        if (!this.ctx) return;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '24px Inter';
        this.ctx.shadowColor = 'black'; 
        this.ctx.shadowBlur = 4;
        
        const text = `Luciérnagas recolectadas: ${this.capturedCount}`;
        // La puntuación se dibuja en la parte superior del CANVAS FIJO (viewport)
        const scoreYPosition = 40; 
        
        this.ctx.fillText(text, this.canvas.width - this.ctx.measureText(text).width - 30, scoreYPosition);
        this.ctx.shadowBlur = 0; 
    }
    
    startLoop() {
        this.isGameActive = true;
        // La altura del canvas es la altura de la ventana
        this.resizeCanvas(); 
        if (!this.animationFrameId) {
            this.gameLoop();
        }
    }

    stopLoop() {
        this.isGameActive = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.audio.stopBackgroundMusic(); 
        if(this.ctx) {
            // Limpiamos el canvas al detener
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        }
    }
}


// =================================================================
// 5. UI MANAGER (Control de Interfaz y Botón)
// =================================================================

class UIManager {
    constructor(game) {
        this.game = game;
        this.toggleBtn = document.getElementById('firefly-toggle-btn');
        this.gameCanvas = document.getElementById('firefly-game-canvas');
        this.iconStart = document.getElementById('btn-icon-start');
        this.iconClose = document.getElementById('btn-icon-close');
        
        // Añadimos el listener de scroll aquí para asegurar que el gameLoop lo use
        window.addEventListener('scroll', () => {
             // Solo necesitamos forzar un redibujo si el juego está activo
             if (this.game.isGameActive && this.game.animationFrameId) {
                 // No llamamos a gameLoop directamente, sino que permitimos que requestAnimationFrame lo maneje
                 // Esto asegura que al hacer scroll, el juego se actualice en el siguiente frame.
             }
        });
    }
    
    // Método de inicialización de listeners
    initListeners() {
        if (!this.toggleBtn || !this.gameCanvas || !this.iconStart || !this.iconClose) {
            console.error("Error: Componentes del botón o Canvas no encontrados. Revisa el HTML.");
            return;
        }

        this.toggleBtn.addEventListener('click', this.toggleGame.bind(this));
        
        // Llamar a resizeCanvas una vez para la configuración inicial
        this.game.resizeCanvas();
        
        this.toggleBtn.addEventListener('mouseenter', this.handleMouseEnter.bind(this));
        this.toggleBtn.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    }
    
    handleMouseEnter() {
        if (!this.game.isGameActive && this.iconStart) {
            this.iconStart.src = ASSET_IMAGE_PATH + 'Button_SiInteractua.png';
            document.getElementById('tooltip-text').textContent = "Iniciar Descanso Activo";
        }
    }
    
    handleMouseLeave() {
        if (!this.game.isGameActive && this.iconStart) {
            this.iconStart.src = ASSET_IMAGE_PATH + 'Button_NoInteractua.png';
        }
    }

    async toggleGame() {
        const isActive = this.gameCanvas.classList.toggle('active');

        if (isActive) {
            // Modo JUEGO ACTIVO
            this.toggleBtn.classList.add('active');
            
            // Ocultar icono de inicio, mostrar icono de cierre
            this.iconStart.classList.add('hidden');
            this.iconClose.classList.remove('hidden');

            document.body.classList.add('crosshair-cursor'); 
            
            // Cambiar tooltip a "Detener"
            document.getElementById('tooltip-text').textContent = "Detener Descanso Activo";

            this.game.capturedCount = 0; 
            await this.game.initialize(); 

        } else {
            // Modo SITIO WEB ACTIVO
            this.toggleBtn.classList.remove('active');
            
            // Mostrar icono de inicio, ocultar icono de cierre
            this.iconStart.classList.remove('hidden');
            this.iconClose.classList.add('hidden');
            
            document.body.classList.remove('crosshair-cursor'); 
            
            // Cambiar tooltip a "Iniciar"
            document.getElementById('tooltip-text').textContent = "Iniciar Descanso Activo";


            this.game.stopLoop();
        }
    }
}


// =================================================================
// 6. INICIALIZACIÓN GLOBAL
// =================================================================

document.addEventListener('DOMContentLoaded', () => {
    // Inicialización en orden de dependencia
    const assetsManager = new AssetsManager();
    const audioManager = new GameAudio(assetsManager); 
    const game = new FireflyGame(audioManager, assetsManager);
    const uiManager = new UIManager(game);
    
    uiManager.initListeners();
    
    document.body.style.setProperty('cursor', 'default');
});