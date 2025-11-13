// --- ARCHIVO PRINCIPAL DE LÓGICA DEL MINIJUEGO ---
// Implementación por el Desarrollador 1 (Motor) y Desarrollador 2 (Interfaz/Mouse)

// =================================================================
// UTILIDADES
// =================================================================

/**
 * Calcula la altura total del contenido del documento para dimensionar el canvas.
 */
function getDocumentHeight() {
    const body = document.body;
    const html = document.documentElement;
    
    // Devolvemos la altura máxima de desplazamiento del documento
    return Math.max( 
        body.scrollHeight, body.offsetHeight, 
        html.clientHeight, html.scrollHeight, html.offsetHeight 
    );
}

// =================================================================
// AUDIO MANAGER (HTML5 Audio) - Adaptado para usar archivos MP3
// =================================================================

class GameAudio {
    constructor() {
        this.contextInitialized = false;
        
        // =======================================================================
        // CORRECCIÓN DE RUTA CRÍTICA:
        // Se añade el prefijo de la carpeta donde se encuentran los MP3.
        // =======================================================================
        const AUDIO_PATH = '/Minijuego/Assets/Audios/'; // Ajustado a la estructura de carpetas de tu entorno
        
        const audioUrls = {
            // Música de fondo al iniciar el juego:
            background: AUDIO_PATH + 'Audiofondojuego.mp3', 
            // Sonido al presionar el botón/lanzar la red:
            net: AUDIO_PATH + 'old-men-arm-move-97741.mp3', 
            // Sonido al capturar una luciérnaga (Se usa un nombre de archivo más simple para evitar errores de codificación)
            capture: AUDIO_PATH + 'notification-bell-sound-37688.mp3' // ASUMIMOS QUE ESTE ES EL NOMBRE CORRECTO
        };
        
        // *******************************************************************
        // POSIBLE SOLUCIÓN ALTERNA: 
        // Si el problema persiste, intenta renombrar el archivo físico
        // 'notification-bell-sound-37688.mp3' a algo simple como 'bell.mp3'
        // y cambia la línea de arriba a:
        // capture: AUDIO_PATH + 'bell.mp3'
        // *******************************************************************


        // 1. Música de fondo (Loop)
        this.bgAudio = new Audio(audioUrls.background);
        this.bgAudio.loop = true;
        this.bgAudio.volume = 0.5;
        
        // 2. Sonido de la red (Click)
        this.netAudio = new Audio(audioUrls.net);
        this.netAudio.volume = 0.8;

        // 3. Sonido de captura (Luciérnaga atrapada)
        this.captureAudio = new Audio(audioUrls.capture);
        this.captureAudio.volume = 1.0;

        // NUEVO: Almacenamos las URLs para el método de corrección
        this.urls = audioUrls;
    }

    /**
     * CORRECCIÓN DE DEBUG: Asegura que la fuente de audio se haya asignado y forzar carga.
     * Solo se llama con la primera interacción del usuario.
     */
    _ensureAudioSources() {
        if (!this.contextInitialized) {
            console.warn("Asegurando las fuentes de audio con las rutas corregidas...");
            // Asigna la propiedad 'src' de nuevo para forzar la carga en el navegador
            this.bgAudio.src = this.urls.background;
            this.netAudio.src = this.urls.net;
            this.captureAudio.src = this.urls.capture;
            
            // Carga de promesa de metadata para asegurarse de que el navegador intenta cargarlos
            this.bgAudio.load();
            this.netAudio.load();
            this.captureAudio.load();
        }
    }

    /**
     * Inicia el contexto de audio. Necesario para las políticas de reproducción automática.
     */
    async initializeContext() {
        // Ejecutamos la corrección justo antes de inicializar para el primer click
        this._ensureAudioSources(); 
        this.contextInitialized = true;
    }
    
    /**
     * Toca un clip de audio (reinicia la posición si ya está sonando).
     * @param {HTMLAudioElement} audioClip - El clip a reproducir.
     */
    _playClip(audioClip) {
        // Si el contexto aún no está inicializado, lo hacemos aquí (se llama en el primer click)
        if (!this.contextInitialized) {
            this.initializeContext();
        }
        
        if (!audioClip.src) return;
        
        // Reinicia el clip al inicio para poder tocarlo varias veces rápidamente (ej. captura)
        if (audioClip.currentTime > 0) {
            audioClip.currentTime = 0;
        }
        // Intentar reproducir y manejar errores de Promise (común en navegadores)
        audioClip.play().catch(e => {
            // Error común en la primera interacción si el usuario no ha interactuado antes
            if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') { 
                console.error("Error al reproducir audio:", e.message, "Asegúrate de que la ruta del MP3 sea la correcta y esté disponible.");
                console.error("URL actual:", audioClip.src);
            }
        });
    }

    /**
     * Toca el sonido de lanzamiento de la red (al hacer click).
     */
    playNetSound() {
        this._playClip(this.netAudio);
    }

    /**
     * Toca el sonido de captura.
     */
    playCaptureSound() {
        this._playClip(this.captureAudio);
    }

    /**
     * Inicia el loop de música de fondo (al iniciar el juego).
     */
    startBackgroundMusic() {
        // Si el contexto aún no está inicializado, lo hacemos aquí (se llama en el primer click)
        if (!this.contextInitialized) {
            this.initializeContext();
        }

        if (!this.bgAudio.src) return;
        this.bgAudio.play().catch(e => {
            if (e.name !== 'NotAllowedError' && e.name !== 'AbortError') {
                console.error("Error al iniciar música de fondo:", e.message, "Asegúrate de que la ruta del MP3 sea la correcta y esté disponible.");
                console.error("URL actual:", this.bgAudio.src);
            }
        });
    }
    
    /**
     * Detiene el loop de música de fondo (al detener el juego).
     */
    stopBackgroundMusic() {
        this.bgAudio.pause();
        this.bgAudio.currentTime = 0;
    }
}


// =================================================================
// ESTRUCTURAS DE DATOS
// =================================================================

/**
 * Clase que representa una sola luciérnaga.
 * Por ahora, es un círculo simple.
 */
class Firefly {
    constructor(id, canvasWidth, canvasHeight) {
        this.id = id;
        this.radius = 10;
        // Posición inicial aleatoria en toda la altura del documento
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight; // canvasHeight es ahora Document Height
        // Velocidad inicial y dirección aleatoria (lenta)
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.color = `rgba(255, 255, 100, ${Math.random() * 0.5 + 0.5})`; // Amarillo brillante semitransparente
        this.isCaptured = false;
    }

    /**
     * Actualiza la posición y maneja el rebote en los bordes.
     */
    update(canvasWidth, canvasHeight) {
        if (this.isCaptured) return;

        // Movimiento
        this.x += this.vx;
        this.y += this.vy;

        // Rebote en bordes X
        if (this.x + this.radius > canvasWidth || this.x - this.radius < 0) {
            this.vx *= -1;
            // Pequeño ajuste para evitar que se quede pegado en el borde
            this.x = Math.min(Math.max(this.x, this.radius), canvasWidth - this.radius);
        }

        // Rebote en bordes Y (Usa la altura del documento completo)
        if (this.y + this.radius > canvasHeight || this.y - this.radius < 0) {
            this.vy *= -1;
            this.y = Math.min(Math.max(this.y, this.radius), canvasHeight - this.radius);
        }
    }

    /**
     * Dibuja la luciérnaga en el canvas.
     */
    draw(ctx) {
        if (this.isCaptured) return;
        
        // Efecto de brillo
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fill();

        // Limpiar el efecto de brillo
        ctx.shadowBlur = 0;
    }
    
    /**
     * Resetea la luciérnaga a una nueva posición para "resucitarla".
     */
    reset(canvasWidth, canvasHeight) {
        this.x = Math.random() * canvasWidth;
        this.y = Math.random() * canvasHeight;
        this.vx = (Math.random() - 0.5) * 1.5;
        this.vy = (Math.random() - 0.5) * 1.5;
        this.color = `rgba(255, 255, 100, ${Math.random() * 0.5 + 0.5})`; 
        this.isCaptured = false;
    }
}

// =================================================================
// CLASE PRINCIPAL DEL JUEGO
// =================================================================
class FireflyGame {
    constructor(audio) {
        this.canvas = document.getElementById('firefly-game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.fireflies = [];
        this.totalInitialFireflies = 15; 
        this.capturedCount = 0;
        this.animationFrameId = null;
        this.audio = audio; // Referencia al manager de audio
        
        // Estado del cursor (Red de Caza) - Desarrollador 2
        this.net = { x: 0, y: 0, radius: 25, color: '#DC2626' }; // Círculo rojo como red
    }

    /**
     * Inicializa el canvas y genera las luciérnagas.
     */
    initialize() {
        // Asegura que el canvas ocupe toda la ventana
        this.resizeCanvas();
        
        // El canvas debe redimensionarse cuando la ventana cambie, o cuando el contenido cambie (aunque esto último es más complejo)
        window.addEventListener('resize', this.resizeCanvas.bind(this));
        
        // Inicializa 15 luciérnagas (solo si es la primera vez que se llama)
        if (this.fireflies.length === 0) {
            for (let i = 0; i < this.totalInitialFireflies; i++) {
                this.fireflies.push(new Firefly(i, this.canvas.width, this.canvas.height));
            }
        }
        
        // Agrega el listener para capturar el movimiento del mouse
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

        // Agrega el listener para capturar el click (intento de caza)
        this.canvas.addEventListener('click', this.handleMouseClick.bind(this));
        
        this.startLoop();
        this.audio.startBackgroundMusic(); // Inicia la música de fondo
        console.log(`Juego iniciado con ${this.totalInitialFireflies} luciérnagas iniciales. Modo recolección.`);
    }
    
    /**
     * Ajusta el tamaño del canvas al tamaño del documento.
     */
    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        // CAMBIO CLAVE: Altura total del documento
        this.canvas.height = getDocumentHeight(); 
    }

    /**
     * Actualiza la posición de la 'red' con el mouse, ajustando por el scroll.
     */
    handleMouseMove(event) {
        this.net.x = event.clientX;
        // Agregamos el desplazamiento vertical (scroll)
        this.net.y = event.clientY + window.scrollY; 
    }
    
    /**
     * Maneja el evento de click (Captura de Luciérnaga).
     */
    handleMouseClick(event) {
        this.audio.playNetSound(); // Suena al lanzar la red (al hacer click)
        
        // Itera sobre las luciérnagas
        for (const fly of this.fireflies) {
            if (fly.isCaptured) continue;

            // Distancia entre el click (ya ajustado por scroll en handleMouseMove) y la luciérnaga
            const distance = Math.sqrt(
                (fly.x - this.net.x) ** 2 + (fly.y - this.net.y) ** 2
            );

            if (distance < fly.radius + this.net.radius) { 
                fly.isCaptured = true;
                this.capturedCount++;
                this.audio.playCaptureSound(); // Suena al capturar la luciérnaga
                console.log(`Luciérnaga capturada! Total: ${this.capturedCount}`);
                
                // Resetea la luciérnaga para que reaparezca
                setTimeout(() => {
                    fly.reset(this.canvas.width, this.canvas.height);
                }, 500); 

                break; // Solo capturamos una por click
            }
        }
    }

    /**
     * Bucle principal de animación.
     */
    gameLoop() {
        // 1. Limpiar solo la región visible del canvas (Viewport) para optimizar
        const viewportX = window.scrollX || document.documentElement.scrollLeft;
        const viewportY = window.scrollY || document.documentElement.scrollTop;
        const viewportW = window.innerWidth;
        const viewportH = window.innerHeight;

        this.ctx.clearRect(viewportX, viewportY, viewportW, viewportH);
        
        // 2. Actualizar y Dibujar Luciérnagas
        for (const fly of this.fireflies) {
            fly.update(this.canvas.width, this.canvas.height);
            // Solo dibujamos si la luciérnaga está en o cerca del área visible (viewport)
            if (fly.y >= viewportY - fly.radius && fly.y <= viewportY + viewportH + fly.radius) {
                fly.draw(this.ctx);
            }
        }
        
        // 3. Dibujar la Red (Círculo de captura)
        this.drawNet();
        
        // 4. Dibujar Contador
        this.drawScore();

        // 5. Solicitar el siguiente frame
        this.animationFrameId = requestAnimationFrame(this.gameLoop.bind(this));
    }
    
    /**
     * Dibuja la red de caza (círculo rojo).
     */
    drawNet() {
        // El Net ya tiene la posición Y ajustada por scroll en handleMouseMove
        
        // Círculo exterior (Red)
        this.ctx.strokeStyle = this.net.color; 
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.arc(this.net.x, this.net.y, this.net.radius, 0, Math.PI * 2);
        this.ctx.stroke();

        // Círculo central (Mango de la red)
        this.ctx.fillStyle = this.net.color;
        this.ctx.beginPath();
        this.ctx.arc(this.net.x, this.net.y, 4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    /**
     * Dibuja el contador de luciérnagas capturadas (Fijo al viewport).
     */
    drawScore() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        this.ctx.font = '24px Inter';
        const text = `Luciérnagas recolectadas: ${this.capturedCount}`;
        
        // Agregamos el desplazamiento vertical (scroll) para que se quede fijo en la pantalla
        const scoreYPosition = window.scrollY + 40; 
        
        // Dibuja el texto en la esquina superior derecha
        this.ctx.fillText(text, this.canvas.width - this.ctx.measureText(text).width - 30, scoreYPosition);
    }
    
    /**
     * Inicia el bucle de animación.
     */
    startLoop() {
        if (!this.animationFrameId) {
            this.gameLoop();
        }
    }

    /**
     * Detiene el bucle de animación.
     */
    stopLoop() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
        this.audio.stopBackgroundMusic(); // Detiene la música de fondo
    }
}

// =================================================================
// LÓGICA DE INTERFAZ Y CONTROL (DEL HTML AL JS)
// =================================================================
const audioManager = new GameAudio(); // NUEVO: Inicializamos el audio manager
const game = new FireflyGame(audioManager);
let isGameActive = false;

/**
 * Inicializa el juego y comienza el bucle de animación.
 */
function startFireflyGame() {
    if (!isGameActive) {
        // Obligatorio: Inicializar el contexto de audio en una interacción del usuario
        audioManager.initializeContext(); 

        // Al iniciar, nos aseguramos de que el canvas tenga la altura correcta antes de iniciar el juego
        game.resizeCanvas(); 
        
        // IMPORTANTE: Aseguramos que las instancias de GameAudio no se pierdan, 
        // pero reiniciamos el juego para que el contador inicie en 0
        Object.assign(game, new FireflyGame(audioManager)); 
        
        game.initialize();
        isGameActive = true;
    }
}

/**
 * Detiene el juego y el bucle de animación.
 */
function stopFireflyGameLoop() {
    game.stopLoop();
    isGameActive = false;
    
    // Al detener, eliminamos el contenido residual del canvas que esté en el viewport.
    game.ctx.clearRect(0, 0, game.canvas.width, game.canvas.height);
}


// Event Listener para el botón de toggle (MOVIDO DEL INDEX.HTML)
document.addEventListener('DOMContentLoaded', () => {
    const toggleBtn = document.getElementById('firefly-toggle-btn');
    const gameCanvas = document.getElementById('firefly-game-canvas');
    
    if (!toggleBtn || !gameCanvas) return;

    toggleBtn.addEventListener('click', () => {
        const isActive = gameCanvas.classList.toggle('active');

        if (isActive) {
            // Modo JUEGO ACTIVO
            toggleBtn.classList.add('active');
            toggleBtn.querySelector('.icon-jar').classList.add('hidden');
            toggleBtn.querySelector('.icon-close').classList.remove('hidden');

            startFireflyGame();

        } else {
            // Modo SITIO WEB ACTIVO
            toggleBtn.classList.remove('active');
            toggleBtn.querySelector('.icon-jar').classList.remove('hidden');
            toggleBtn.querySelector('.icon-close').classList.add('hidden');

            stopFireflyGameLoop();
        }
    });
    
    // Si el contenido de la página se carga dinámicamente o cambia,
    // es una buena práctica llamar a resizeCanvas() de nuevo.
    game.resizeCanvas();
    
    // Añadir listener para recalcular la altura del canvas si la ventana cambia de tamaño
    window.addEventListener('resize', () => {
        if (isGameActive) {
            game.resizeCanvas();
        }
    });
});