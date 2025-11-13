document.addEventListener('DOMContentLoaded', () => {
    // Referencias a elementos DOM
    const dataCardContainer = document.getElementById('data-card-container');
    const cardTitle = document.querySelector('.data-card .card-title');
    const cardSubtitle = document.querySelector('.data-card .card-subtitle');
    const cardDescription = document.querySelector('.data-card .card-description');
    const cardStats = document.querySelector('.data-card .card-stats');
    const cardCta = document.querySelector('.data-card .card-cta'); // Referencia al botón a ocultar
    
    // Referencias para la animación de scroll
    const midGrid = document.querySelector('#mid-section .mid-grid');
    const projectsSectionTitle = document.querySelector('#projects-section .section-title');
    const projectGrid = document.querySelector('#projects-section .project-grid');
    const midSection = document.getElementById('mid-section'); 

    // --- 1. DATOS SIMULADOS PARA LA TARJETA FLOTANTE (mockCardData) ---
    // Incluye las 4 funcionalidades clave del proyecto.
    const mockCardData = {
    'Gestión de Actividades': {
        title: 'Gestor de Tareas',
        subtitle: 'Funcionalidad Core',
        description: 'Permite a los estudiantes agregar, eliminar y marcar como realizadas sus tareas académicas para reducir la sensación de abrumo.',
        stats: { Impacto: 'Alto', Complejidad: 'Media' }
    },
    'Técnicas de Relajación': {
        title: 'Video y Animación',
        subtitle: 'Gestión Rápida de Estrés',
        description: 'Proporciona un video o animación con técnicas rápidas para manejar situaciones estresantes.',
        stats: { Impacto: 'Alto', Complejidad: 'Baja' }
    },
    'Mini Juego Anti-estrés': {
        title: 'Herramienta Lúdica',
        subtitle: 'Promoción del Bienestar',
        description: 'Ofrece un mini juego que ayuda al estudiante a relajarse, promoviendo un ambiente de aprendizaje más saludable.',
        stats: { Impacto: 'Medio', Complejidad: 'Alta' }
    },
    'Accesibilidad Web': {
        title: 'Ubicación y Recursos',
        subtitle: 'Requisito No Funcional',
        description: 'Garantiza que la aplicación sea accesible con conexión a Internet y que use solo recursos y software gratuitos y libres.',
        stats: { Impacto: 'Alto', Complejidad: 'Media' }
    }
};

    // --- 2. FUNCIÓN PRINCIPAL PARA CARGAR Y RENDERIZAR LOS DATOS ---
    const loadDataAndRender = async () => {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`Error al cargar data.json: ${response.statusText}`);
            }
            const data = await response.json();
            
            renderHeader(data.header);
            // Ahora renderHeroSection devuelve todos los activadores
            const activators = renderHeroSection(data.hero_section); 
            renderMidSection(data.mid_section);
            renderProjectsSection(data.projects_section);

            connectHoverFunctionality(activators);

        } catch (error) {
            console.error('Fallo al inicializar la página:', error);
            document.body.innerHTML = '<h1>Error al cargar el contenido de la página. Por favor, revisa la consola.</h1>';
        }
    };

    // --- 3. FUNCIONES DE RENDERIZADO ---
    const renderHeader = (headerData) => {
        document.querySelector('.logo').textContent = headerData.logo;
        const navLinksContainer = document.querySelector('.nav-links');
        navLinksContainer.innerHTML = '';
        headerData.nav_links.forEach(link => {
            const li = document.createElement('li');
            li.innerHTML = `<a href="${link.url}"><span>${link.text}</span></a>`;
            navLinksContainer.appendChild(li);
        });
        const ctaBtn = document.querySelector('.cta-btn');
        ctaBtn.innerHTML = `<span>${headerData.cta_button}</span>`;
    };

    // --- MODIFICADA: Aplica hover a TODOS los elementos ---
    const renderHeroSection = (heroData) => {
        document.querySelector('.greeting').textContent = heroData.greeting;
        document.querySelector('.title').textContent = heroData.title;
        document.querySelector('.tagline').textContent = heroData.tagline;
        document.querySelector('.trust-text').textContent = heroData.trust_text;

        const statsContainer = document.querySelector('.stats-grid');
        statsContainer.innerHTML = '';
        const activators = [];

        heroData.stats.forEach((stat) => {
            const item = document.createElement('div');
            item.classList.add('stat-item');
            item.setAttribute('data-info', stat.description);
            
            // SE APLICA LA CLASE HOVER A TODOS LOS ELEMENTOS
            item.classList.add('hover-activator');
            activators.push(item);
            // ------------------------------------------------

            item.innerHTML = `
                <p class="stat-id">${stat.id}</p>
                <p class="stat-description">${stat.description}</p>
            `;
            statsContainer.appendChild(item);
        });

        return activators;
    };

    const renderMidSection = (midData) => {
        const titleElement = document.querySelector('#mid-section .section-title');
        titleElement.innerHTML = `${midData.title_part1}<br><span>${midData.title_part2}</span>`;
        document.querySelector('.bio').textContent = midData.bio_text;
        const midCtaBtn = document.querySelector('.mid-cta-btn');
        midCtaBtn.innerHTML = `<span>${midData.mid_cta}</span>`;
    };
    
    const renderProjectsSection = (projectsData) => {
        document.querySelector('#projects-section .section-title').textContent = projectsData.title;

        const projectGrid = document.querySelector('.project-grid');
        projectGrid.innerHTML = '';

        projectsData.projects.forEach(project => {
            const item = document.createElement('div');
            item.classList.add('project-item');
            item.innerHTML = `
                <img src="${project.image_url}" alt="${project.name}">
                <div class="project-info">
                    <h3>${project.name}</h3>
                    <p class="price">${project.price}</p>
                    <button class="cta-btn buy-btn"><span>${project.cta}</span></button>
                </div>
            `;
            projectGrid.appendChild(item);
        });
    };
    
    // --- 4. FUNCIONES DE INTERACCIÓN (Hover y Card Position) ---
    // --- MODIFICADA: Oculta el botón 'Ver Más' ---
    const connectHoverFunctionality = (activators) => {
        activators.forEach(activator => {
            const infoKey = activator.getAttribute('data-info');
            
            activator.addEventListener('mouseover', (e) => {
                const data = mockCardData[infoKey];
                if (!data) return;

                cardTitle.textContent = data.title;
                cardSubtitle.textContent = data.subtitle;
                cardDescription.textContent = data.description;
                
                // OCULTAMOS EL BOTÓN 'VER MÁS'
                cardCta.textContent = ''; 
                cardCta.style.display = 'none'; 
                // ---------------------------------
                
                cardStats.innerHTML = `
                    <p>${Object.keys(data.stats)[0]}: <strong>${data.stats[Object.keys(data.stats)[0]]}</strong></p>
                    <p>${Object.keys(data.stats)[1]}: <strong>${data.stats[Object.keys(data.stats)[1]]}</strong></p>
                `;

                dataCardContainer.classList.add('visible');
                updateCardPosition(e.clientX, e.clientY);
            });

            activator.addEventListener('mouseleave', () => {
                dataCardContainer.classList.remove('visible');
                //cardCta.style.display = 'block'; // Aseguramos que se muestre si es usado en otro lado
            });

            activator.addEventListener('mousemove', (e) => {
                if (dataCardContainer.classList.contains('visible')) {
                    updateCardPosition(e.clientX, e.clientY);
                }
            });
        });
    };
    
    const updateCardPosition = (mouseX, mouseY) => {
        const cardWidth = dataCardContainer.offsetWidth;
        const cardHeight = dataCardContainer.offsetHeight;
        
        let newX = mouseX + 15;
        let newY = mouseY - (cardHeight / 2);

        if (newX + cardWidth > window.innerWidth) {
            newX = mouseX - cardWidth - 15;
        }
        
        if (newY + cardHeight > window.innerHeight) {
            newY = window.innerHeight - cardHeight - 10;
        }

        if (newY < 10) {
            newY = 10;
        }

        dataCardContainer.style.transform = `translate(${newX}px, ${newY}px) scale(1)`;
    };


    // --- 5. FUNCIÓN GENÉRICA DE ANIMACIÓN BASADA EN SCROLL (PARALLAX) ---

    const animateSectionOnScroll = (element, startY) => {
        if (!element) return;

        const elementTop = element.getBoundingClientRect().top;
        const viewportHeight = window.innerHeight;

        const triggerPoint = viewportHeight * 0.8; 

        if (elementTop < triggerPoint) {
            const scrollDistance = triggerPoint - elementTop;
            
            let translateY = Math.min(startY, scrollDistance * 1.2); 
            let opacity = Math.min(1, scrollDistance / 80); 

            element.style.transform = `translateY(${startY - translateY}px)`;
            element.style.opacity = opacity;

        } else {
            element.style.transform = `translateY(${startY}px)`;
            element.style.opacity = '0';
        }
    };
    
    // --- 6. FUNCIÓN DE DEGRADADO DINÁMICO (SUTIL Y FLUIDO) ---

    const animateBackgroundGradient = () => {
        if (!midSection) return;
        
        const scrollPos = window.scrollY;
        const startPosition = midSection.offsetTop - (window.innerHeight / 2); 
        
        let progress = 0;
        if (scrollPos > startPosition) {
            // Rango de scroll sobre el cual ocurre el cambio (ajustable)
            const scrollRange = 1000; 
            progress = Math.min(1, (scrollPos - startPosition) / scrollRange);
        }

        // El alfa (transparencia) del color Rojo/Maroon (156, 31, 55).
        // Modifica maxAlpha para cambiar la intensidad (ej: 0.15 - muy sutil, 0.50 - notable).
        const maxAlpha = 0.30; 
        const currentAlpha = progress * maxAlpha;

        // Combina el degradado dinámico (superior) con el degradado radial base (inferior)
        document.body.style.backgroundImage = `
            linear-gradient(to bottom, rgba(156, 31, 55, ${currentAlpha}) 0%, rgba(156, 31, 55, 0) 100%),
            radial-gradient(circle at center, var(--color-background) 0%, var(--color-subtle-background) 100%)
        `;
    };

    // --- 7. FUNCIÓN ENVOLTORIO PARA LLAMAR TODAS LAS ANIMACIONES ---
    const handleScrollEffects = () => {
        // Animación de Parallax
        animateSectionOnScroll(midGrid, 50);
        animateSectionOnScroll(projectsSectionTitle, 40);
        animateSectionOnScroll(projectGrid, 20);

        // Animación de Fondo Sutil
        animateBackgroundGradient();
    };


    // --- 8. INICIALIZACIÓN Y EVENT LISTENERS ---

    // Inicialización del estado CSS para todos los elementos animados
    const elementsToAnimate = [
        { element: midGrid, startY: 50, duration: 0.5 },
        { element: projectsSectionTitle, startY: 40, duration: 0.5 },
        { element: projectGrid, startY: 50, duration: 0.6 } 
    ];

    elementsToAnimate.forEach(({ element, startY, duration }) => {
        if (element) {
            element.style.transition = `opacity ${duration}s ease-out, transform ${duration}s ease-out`;
            element.style.transform = `translateY(${startY}px)`;
            element.style.opacity = '0';
        }
    });
    
    // Inicia la carga de datos
    loadDataAndRender();
    
    // Llama a las funciones de animación una vez al inicio para establecer el estado
    handleScrollEffects();

    // Escuchar el evento de scroll en la ventana para actualizar la animación
    window.addEventListener('scroll', handleScrollEffects);
});