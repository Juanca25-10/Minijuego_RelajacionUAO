document.addEventListener('DOMContentLoaded', () => {
    // Referencias
    const cardCont = document.getElementById('data-card-container');
    const midGrid = document.querySelector('#mid-section .mid-grid');
    
    // Datos Mock para Hover
    const cardData = {
    // Clave: "Gestión de Actividades"
    'Gestión de Actividades': { 
        title: 'Gestión del Tiempo', 
        subtitle: 'Funcionalidad Core', 
        description: 'Planificador inteligente para organizar tareas, plazos y reducir la carga de trabajo académica.', 
        stats: { Impacto: 'Alto', Complejidad: 'Media' } 
    },
    // Clave: "Técnicas de Relajación"
    'Técnicas de Relajación': { 
        title: 'Contenido Audiovisual', 
        subtitle: 'Bienestar Mental', 
        description: 'Acceso a videos guiados de meditación, respiración y estiramientos para pausas activas.', 
        stats: { Impacto: 'Alto', Complejidad: 'Baja' } 
    },
    // Clave: "Mini Juego Anti-estrés"
    'Mini Juego Anti-estrés': { 
        title: 'Minijuego Lúdico', 
        subtitle: 'Pausa Activa y Desconexión', 
        description: 'Juego interactivo simple, diseñado para ofrecer una rápida desconexión mental y alivio del estrés.', 
        stats: { Impacto: 'Medio', Complejidad: 'Alta' } 
    },
    // Clave: "Accesibilidad Web"
    'Accesibilidad Web': { 
        title: 'Compatibilidad Total', 
        subtitle: 'Requisito No Funcional', 
        description: 'Diseño accesible y responsivo garantizando que la aplicación funcione en cualquier dispositivo.', 
        stats: { Impacto: 'Alto', Complejidad: 'Media' } 
    }
};

    // Carga de JSON
    const loadData = async () => {
        try {
            const res = await fetch('Data.json');
            const d = await res.json();
            
            // =========================
            // LÓGICA DE HEADER (GLOBAL)
            // =========================
            const logoElement = document.querySelector('.logo');
            if (logoElement) {
                // Fix: Hace que el logo sea un enlace a index.html
                logoElement.innerHTML = `<a href="index.html">${d.header.logo}</a>`; 
            }

            // Fix: Solo llena la navegación si el elemento existe (evita errores en gestion-actividades.html)
            const nav = document.querySelector('.nav-links');
            if (nav) { 
                nav.innerHTML = '';
                d.header.nav_links.forEach(l => nav.innerHTML += `<li><a href="${l.url}"><span>${l.text}</span></a></li>`);
            }

            if (d.accessibility_panel) {
                initAccessibilityPanel(d); // Llama a la función con los datos del JSON
            }
            
            document.querySelector('.cta-btn').innerHTML = `<span>${d.header.cta_button}</span>`;

            // ===========================================
            // LÓGICA ESPECÍFICA DEL INDEX.HTML (HERO/MID)
            // ===========================================
            // Si la sección principal existe, cargamos todo el contenido dinámico de index.html
            if (document.getElementById('hero-section')) {
                
                // Hero Textos
                const h = d.hero_section;
                document.querySelector('.greeting').textContent = h.greeting;
                document.querySelector('.title').textContent = h.title;
                document.querySelector('.tagline').textContent = h.tagline;
                document.querySelector('.trust-text').textContent = h.trust_text;
                
                // Hero Stats (Recuadros)
                const stats = document.querySelector('.stats-grid'); stats.innerHTML = '';
                const activators = []; // Lista para guardar los elementos que activarán el hover
                
                h.stats.forEach(s => {
                    const div = document.createElement('div'); div.className = 'stat-item hover-activator';
                    div.setAttribute('data-info', s.description);
                    div.innerHTML = `<p class="stat-id">${s.id}</p><p class="stat-description">${s.description}</p>`;
                    div.style.cursor = 'pointer';
                    div.onclick = () => { 
                        if(s.description.includes('Gestión')) window.location.href = 'gestion-actividades.html';
                        if(s.description.includes('Relajación')) window.location.href = 'tecnicas-relajacion.html';
                    };
                    stats.appendChild(div); activators.push(div);
                });
                
                // RE-ACTIVACIÓN DE HOVER
                initHover(activators);

                // Mid Section Textos
                const m = d.mid_section;
                document.querySelector('.mid-text .section-title').innerHTML = `${m.title_part1}<br><span>${m.title_part2}</span>`;
                document.querySelector('.mid-text .bio').textContent = m.bio_text;
                document.querySelector('.mid-cta-btn').innerHTML = `<span>${m.mid_cta}</span>`;
            }

        } catch (e) { console.log("Error en loadData:", e); }
    };

    // --- FUNCIONES DE ACCESIBILIDAD Y PERSONALIZACIÓN ---

// 1. Función Central: Aplica todas las preferencias guardadas (o por defecto) al cuerpo (body)
const applyPreferences = () => {
    // Referencias
    const body = document.body;
    const fontSizeValueDisplay = document.getElementById('font-size-value');
    const fontFamilySelect = document.getElementById('font-family-select');
    const fontSizeSlider = document.getElementById('font-size-slider'); // Agregamos slider aquí para sincronizar

    // 1. Obtener Preferencias (o valores por defecto)
    const fontSize = localStorage.getItem('pref-fontSize') || '100';
    const fontFamily = localStorage.getItem('pref-fontFamily') || 'Inter, sans-serif';
    const contrastMode = localStorage.getItem('pref-contrastMode') || 'default';
    
    // 2. Limpiar clases de tamaño y contraste
    body.classList.remove('text-large', 'text-larger', 'high-contrast', 'dyslexia-color', 'font-dyslexic');

    // 3. Aplicar Tamaño de Fuente
    if (fontSize === '120') {
        body.classList.add('text-large');
    } else if (fontSize >= '130') {
        body.classList.add('text-larger');
    }
    // Sincronizar el display del valor y el slider
    if(fontSizeValueDisplay) fontSizeValueDisplay.textContent = `${fontSize}%`;
    if(fontSizeSlider) fontSizeSlider.value = fontSize;
    
    // 4. Aplicar Familia de Fuente
    body.style.fontFamily = fontFamily;
    if (fontFamily.includes('Dyslexic')) {
         body.classList.add('font-dyslexic');
    }
    // Sincronizar el select
    if(fontFamilySelect) fontFamilySelect.value = fontFamily;
    
    // 5. Aplicar Modo de Contraste
    if (contrastMode !== 'default') {
        body.classList.add(contrastMode);
    }
    
    // 6. Actualizar botones visualmente
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-mode') === contrastMode);
    });
};




// 2. Inicializa el panel, carga los textos del JSON y configura listeners
const initAccessibilityPanel = (data) => {
    // Referencias
    const settingsPanel = document.getElementById('settings-panel');
    const accessBtn = document.getElementById('access-btn');
    const fontSizeSlider = document.getElementById('font-size-slider');
    const fontFamilySelect = document.getElementById('font-family-select');
    const resetSettingsBtn = document.getElementById('reset-settings-btn');
    
    if (!settingsPanel || !data.accessibility_panel) return;

    const panelData = data.accessibility_panel;
    
    // --- A. INYECTAR TEXTOS Y OPCIONES DINÁMICAS (Desde Data.json) ---
    
    // 1. Título y Labels estáticos
    settingsPanel.querySelector('h3').textContent = panelData.title;
    settingsPanel.querySelector('label[for="font-size-slider"]').textContent = panelData.font_size_label;
    settingsPanel.querySelector('label[for="font-family-select"]').textContent = panelData.font_family_label;
    settingsPanel.querySelector('.setting-group:nth-child(3) label').textContent = panelData.contrast_mode_label;
    resetSettingsBtn.textContent = panelData.reset_button;

    // 2. Inyectar opciones de Tipografía (Select)
    fontFamilySelect.innerHTML = ''; // Limpiamos las opciones estáticas
    panelData.font_options.forEach(opt => {
        const option = document.createElement('option');
        option.value = opt.value;
        option.textContent = opt.text;
        fontFamilySelect.appendChild(option);
    });

    // 3. Inyectar Botones de Contraste
    const contrastGroup = settingsPanel.querySelector('.setting-group:nth-child(3)');
    
    // Eliminamos los botones estáticos que hayan quedado en el HTML para reconstruirlos
    while (contrastGroup.children.length > 1) { // Mantiene solo el <label>
        contrastGroup.removeChild(contrastGroup.lastChild);
    }
    
    // Reconstruir botones dinámicamente
    panelData.mode_buttons.forEach(btnData => {
         const btn = document.createElement('button');
         btn.className = 'mode-btn';
         btn.setAttribute('data-mode', btnData.mode);
         btn.textContent = btnData.text;
         contrastGroup.appendChild(btn);
         
         // Añadir listener de click
         btn.addEventListener('click', () => {
            localStorage.setItem('pref-contrastMode', btnData.mode);
            applyPreferences(); 
         });
    });

    // --- B. LISTENERS DEL PANEL ---

    // 1. Toggle Abrir/Cerrar
    if(accessBtn) {
        accessBtn.addEventListener('click', () => {
            settingsPanel.classList.toggle('settings-panel-visible');
        });
    }

    // 2. Control de Tamaño de Fuente (Slider)
    fontSizeSlider.addEventListener('input', (e) => {
        localStorage.setItem('pref-fontSize', e.target.value);
        applyPreferences(); 
    });

    // 3. Control de Tipografía (Select)
    fontFamilySelect.addEventListener('change', (e) => {
        localStorage.setItem('pref-fontFamily', e.target.value);
        applyPreferences(); 
    });

    // 4. Botón de Restablecer
    resetSettingsBtn.addEventListener('click', () => {
        localStorage.clear(); // Limpiamos todo el localStorage
        
        // Resetear visualmente el slider y select
        if (fontSizeSlider) fontSizeSlider.value = 100;
        if (fontFamilySelect) fontFamilySelect.value = 'Inter, sans-serif';
        
        applyPreferences(); 
    });
    
    // 5. Aplicar la configuración al cargar la página
    applyPreferences();
};

    // Hover Card Logic
    const initHover = (els) => {
        if (!cardCont) return;
        const move = (x, y) => {
            let nx = x + 15, ny = y - (cardCont.offsetHeight/2);
            if(nx + cardCont.offsetWidth > window.innerWidth) nx = x - cardCont.offsetWidth - 15;
            cardCont.style.transform = `translate(${nx}px, ${ny}px)`;
        };
        els.forEach(el => {
            el.addEventListener('mouseover', (e) => {
                const d = cardData[el.getAttribute('data-info')]; if(!d) return;
                if(!d) return;
                cardCont.querySelector('.card-title').textContent = d.title;
                cardCont.querySelector('.card-subtitle').textContent = d.subtitle;
                cardCont.querySelector('.card-description').textContent = d.description;
                cardCont.querySelector('.card-stats').innerHTML = `<p>Imp: <strong>${d.stats.Impacto}</strong></p>`;
                cardCont.querySelector('.card-cta').style.display = 'none';
                cardCont.classList.add('visible'); move(e.clientX, e.clientY);

                cardCont.classList.remove('hidden');
            });
            el.addEventListener('mouseleave', () => cardCont.classList.remove('visible'));
            el.addEventListener('mousemove', (e) => { if(cardCont.classList.contains('visible')) move(e.clientX, e.clientY); });
        });
    };

    // Scroll Animations
    const animateScroll = () => {
        if(midGrid && midGrid.getBoundingClientRect().top < window.innerHeight * 0.8) {
            midGrid.style.transform = 'translateY(0)'; midGrid.style.opacity = 1;
        }
    };

    // --- 5. SISTEMA DE RECOMPENSAS (ACTUALIZADO) ---
    const renderRewards = () => {
        const container = document.getElementById('rewards-track-list');
        if (!container) return;

        // Leer tareas
        const tasks = JSON.parse(localStorage.getItem('uaoTasks') || '[]');
        const completed = tasks.filter(t => t.completed).length;
        
        document.getElementById('total-completed-tasks').textContent = completed;
        document.getElementById('global-progress-bar').style.width = `${Math.min(100, (completed/20)*100)}%`;

        const rewards = [
            { req: 3, item: "Botella de Agua", icon: "💧" },
            { req: 6, item: "Manzana Roja", icon: "🍎" },
            { req: 9, item: "Barra de Cereal", icon: "🍫" },
            { req: 12, item: "Jugo de Naranja", icon: "🧃" },
            { req: 15, item: "Café del Campus", icon: "☕" },
            { req: 18, item: "Sandwich", icon: "🥪" },
            { req: 20, item: "Kit Anti-Estrés", icon: "🎁" }
        ];

        container.innerHTML = '';
        rewards.forEach((r, i) => {
            const unlocked = completed >= r.req;
            // Generamos el link del QR
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=Premio-${r.item.replace(/ /g,'-')}`;
            
            const div = document.createElement('div');
            div.className = `reward-tier ${unlocked ? 'unlocked' : ''}`;
            div.innerHTML = `
                <div class="tier-goal"><span class="tier-number">${r.req}</span><span>Tareas</span></div>
                <div class="tier-info">
                    <div class="reward-img-placeholder">${r.icon}</div>
                    <div class="reward-text"><h4>Nivel ${i+1}</h4><p>${r.item}</p></div>
                </div>
                <div class="tier-action" id="act-${i}">
                    ${unlocked 
                        ? `<button class="claim-btn" onclick="openRewardModal('${r.item}', '${qrUrl}')">RECLAMAR</button>` 
                        : `<div class="lock-icon">🔒</div>`}
                </div>
            `;
            container.appendChild(div);
        });
    };

    // --- NUEVAS FUNCIONES PARA EL MODAL ---
    const modalOverlay = document.getElementById('reward-fullscreen-modal');
    const step1 = document.getElementById('reward-step-1');
    const step2 = document.getElementById('reward-step-2');
    const rewardNameDisplay = document.getElementById('reward-name-display');
    const zoomedQrImg = document.getElementById('zoomed-qr-image');
    const magicBtn = document.getElementById('magic-claim-btn');

    // Función global para abrir el modal (se llama desde el HTML inyectado)
    window.openRewardModal = (rewardName, qrUrl) => {
        // 1. Resetear modal
        step1.classList.remove('hidden');
        step2.classList.add('hidden');
        
        // 2. Preparar datos
        rewardNameDisplay.textContent = rewardName;
        zoomedQrImg.src = qrUrl;

        // 3. Mostrar modal
        modalOverlay.classList.remove('hidden');
        // Pequeño delay para permitir transición CSS
        setTimeout(() => {
            modalOverlay.classList.add('active');
        }, 10);
    };

    // Función al hacer clic en el botón mágico
    if(magicBtn) {
        magicBtn.onclick = () => {
            step1.classList.add('hidden'); // Ocultar botón
            step2.classList.remove('hidden'); // Mostrar QR Gigante
        };
    }

    // Función global para cerrar
    window.closeRewardModal = () => {
        modalOverlay.classList.remove('active');
        setTimeout(() => {
            modalOverlay.classList.add('hidden');
        }, 300);
    };

    window.showQR = (id, url) => {
        document.getElementById(id).innerHTML = `<div class="qr-reveal-box"><img src="${url}"><span class="claim-text">¡CANJEADO!</span></div>`;
    };

    // Init
    //if(document.getElementById('hero-section')) loadData();
    loadData();
    if(midGrid) { midGrid.style.transition='0.5s'; midGrid.style.transform='translateY(50px)'; midGrid.style.opacity=0; }
    renderRewards();
    window.addEventListener('scroll', animateScroll);
    animateScroll();
});

