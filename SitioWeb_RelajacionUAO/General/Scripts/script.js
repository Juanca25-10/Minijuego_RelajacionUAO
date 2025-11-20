document.addEventListener('DOMContentLoaded', () => {
    // Referencias
    const cardCont = document.getElementById('data-card-container');
    const midGrid = document.querySelector('#mid-section .mid-grid');
    
    // Datos Mock para Hover
    const cardData = {
        'Gestión de Actividades': { title: 'Gestor de Tareas', subtitle: 'Funcionalidad Core', description: 'Organiza y completa tareas académicas.', stats: { Impacto: 'Alto', Complejidad: 'Media' } },
        'Técnicas de Relajación': { title: 'Video y Animación', subtitle: 'Bienestar Mental', description: 'Recursos guiados para reducir estrés.', stats: { Impacto: 'Alto', Complejidad: 'Baja' } },
        'Mini Juego Anti-estrés': { title: 'Herramienta Lúdica', subtitle: 'Pausa Activa', description: 'Juego interactivo para desconectar.', stats: { Impacto: 'Medio', Complejidad: 'Alta' } },
        'Accesibilidad Web': { title: 'Para Todos', subtitle: 'Requisito No Funcional', description: 'Accesible en cualquier dispositivo.', stats: { Impacto: 'Alto', Complejidad: 'Media' } }
    };

    // Carga de JSON
    const loadData = async () => {
        try {
            const res = await fetch('Data.json'); // Asegúrate del nombre correcto
            const d = await res.json();
            
            // Header
            document.querySelector('.logo').textContent = d.header.logo;
            const nav = document.querySelector('.nav-links'); nav.innerHTML = '';
            d.header.nav_links.forEach(l => nav.innerHTML += `<li><a href="${l.url}"><span>${l.text}</span></a></li>`);
            document.querySelector('.cta-btn').innerHTML = `<span>${d.header.cta_button}</span>`;

            // Hero
            const h = d.hero_section;
            document.querySelector('.greeting').textContent = h.greeting;
            document.querySelector('.title').textContent = h.title;
            document.querySelector('.tagline').textContent = h.tagline;
            document.querySelector('.trust-text').textContent = h.trust_text;
            
            const stats = document.querySelector('.stats-grid'); stats.innerHTML = '';
            const activators = [];
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
            initHover(activators);

            // Mid Section
            const m = d.mid_section;
            document.querySelector('.mid-text .section-title').innerHTML = `${m.title_part1}<br><span>${m.title_part2}</span>`;
            document.querySelector('.mid-text .bio').textContent = m.bio_text;
            document.querySelector('.mid-cta-btn').innerHTML = `<span>${m.mid_cta}</span>`;
        } catch (e) { console.log(e); }
    };

    // Hover Card Logic
    const initHover = (els) => {
        const move = (x, y) => {
            let nx = x + 15, ny = y - (cardCont.offsetHeight/2);
            if(nx + cardCont.offsetWidth > window.innerWidth) nx = x - cardCont.offsetWidth - 15;
            cardCont.style.transform = `translate(${nx}px, ${ny}px)`;
        };
        els.forEach(el => {
            el.addEventListener('mouseover', (e) => {
                const d = cardData[el.getAttribute('data-info')]; if(!d) return;
                cardCont.querySelector('.card-title').textContent = d.title;
                cardCont.querySelector('.card-subtitle').textContent = d.subtitle;
                cardCont.querySelector('.card-description').textContent = d.description;
                cardCont.querySelector('.card-stats').innerHTML = `<p>Imp: <strong>${d.stats.Impacto}</strong></p>`;
                cardCont.querySelector('.card-cta').style.display = 'none';
                cardCont.classList.add('visible'); move(e.clientX, e.clientY);
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
    if(document.getElementById('hero-section')) loadData();
    if(midGrid) { midGrid.style.transition='0.5s'; midGrid.style.transform='translateY(50px)'; midGrid.style.opacity=0; }
    renderRewards();
    window.addEventListener('scroll', animateScroll);
    animateScroll();
});