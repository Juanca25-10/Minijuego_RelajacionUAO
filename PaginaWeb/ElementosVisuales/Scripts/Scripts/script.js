document.addEventListener('DOMContentLoaded', () => {
    // Referencias a los elementos de la funcionalidad dinámica
    const dataCardContainer = document.getElementById('data-card-container');
    const cardTitle = document.querySelector('.data-card .card-title');
    const cardSubtitle = document.querySelector('.data-card .card-subtitle');
    const cardDescription = document.querySelector('.data-card .card-description');
    const cardStats = document.querySelector('.data-card .card-stats');
    const cardCta = document.querySelector('.data-card .card-cta');
    
    // Referencias para la animación de scroll
    const midGrid = document.querySelector('#mid-section .mid-grid');
    const projectsSectionTitle = document.querySelector('#projects-section .section-title');
    const projectGrid = document.querySelector('#projects-section .project-grid');

    // Datos simulados para la tarjeta flotante, ajustados al proyecto
    const mockCardData = {
        'Gestión de Actividades': {
            title: 'Gestor de Tareas',
            subtitle: 'Funcionalidad Core',
            description: 'Permite a los estudiantes agregar, eliminar y marcar como realizadas sus tareas académicas para reducir la sensación de abrumo.',
            stats: { Impacto: 'Alto', Complejidad: 'Media' }
        },
    };

    // --- 1. FUNCIÓN PRINCIPAL PARA CARGAR Y RENDERIZAR LOS DATOS ---
    const loadDataAndRender = async () => {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error(`Error al cargar data.json: ${response.statusText}`);
            }
            const data = await response.json();
            
            renderHeader(data.header);
            const activators = renderHeroSection(data.hero_section); 
            renderMidSection(data.mid_section);
            renderProjectsSection(data.projects_section);

            connectHoverFunctionality(activators);

        } catch (error) {
            console.error('Fallo al inicializar la página:', error);
            document.body.innerHTML = '<h1>Error al cargar el contenido de la página. Por favor, revisa la consola.</h1>';
        }
    };

    // --- 2. FUNCIONES DE RENDERIZADO (Header, Hero, Mid, Projects) ---
    // (Estas funciones permanecen igual, no se repiten por brevedad)
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

    const renderHeroSection = (heroData) => {
        document.querySelector('.greeting').textContent = heroData.greeting;
        document.querySelector('.title').textContent = heroData.title;
        document.querySelector('.tagline').textContent = heroData.tagline;
        document.querySelector('.trust-text').textContent = heroData.trust_text;

        const statsContainer = document.querySelector('.stats-grid');
        statsContainer.innerHTML = '';
        const activators = [];

        heroData.stats.forEach((stat, index) => {
            const item = document.createElement('div');
            item.classList.add('stat-item');
            item.setAttribute('data-info', stat.description);
            
            if (index === 0) {
                item.classList.add('hover-activator');
                activators.push(item);
            }

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
    
    // --- 3. FUNCIONES DE INTERACCIÓN (Hover y Card Position) ---
    // (Estas funciones se mantienen igual)
    const connectHoverFunctionality = (activators) => {
        activators.forEach(activator => {
            const infoKey = activator.getAttribute('data-info');
            
            activator.addEventListener('mouseover', (e) => {
                const data = mockCardData[infoKey];
                if (!data) return;

                cardTitle.textContent = data.title;
                cardSubtitle.textContent = data.subtitle;
                cardDescription.textContent = data.description;
                cardCta.textContent = 'Ver Más';
                
                cardStats.innerHTML = `
                    <p>${Object.keys(data.stats)[0]}: <strong>${data.stats[Object.keys(data.stats)[0]]}</strong></p>
                    <p>${Object.keys(data.stats)[1]}: <strong>${data.stats[Object.keys(data.stats)[1]]}</strong></p>
                `;

                dataCardContainer.classList.add('visible');
                updateCardPosition(e.clientX, e.clientY);
            });

            activator.addEventListener('mouseleave', () => {
                dataCardContainer.classList.remove('visible');
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


    // --- 4. FUNCIÓN GENÉRICA DE ANIMACIÓN BASADA EN SCROLL (PARALLAX) ---

    const animateSectionOnScroll = (element, startY) => {
        if (!element) return;

        const elementTop = element.getBoundingClientRect().top;
        const viewportHeight = window.innerHeight;

        // Punto de activación: cuando el 80% de la sección ha entrado al viewport
        const triggerPoint = viewportHeight * 0.8; 

        if (elementTop < triggerPoint) {
            const scrollDistance = triggerPoint - elementTop;
            
            // Ajustes para efecto más visible: Velocidad 1.2, Opacidad 80
            let translateY = Math.min(startY, scrollDistance * 1.2); 
            let opacity = Math.min(1, scrollDistance / 80); 

            // Aplicar la transformación (de startY a 0px)
            element.style.transform = `translateY(${startY - translateY}px)`;
            element.style.opacity = opacity;

        } else {
            // Estado inicial (oculto y desplazado hacia abajo)
            element.style.transform = `translateY(${startY}px)`;
            element.style.opacity = '0';
        }
    };
    
    // --- 5. FUNCIÓN ENVOLTORIO PARA LLAMAR AMBAS ANIMACIONES ---
    const handleScrollAnimations = () => {
        // Animación 1: Contenido de la sección intermedia (midGrid) - Empieza 50px abajo
        animateSectionOnScroll(midGrid, 120);

        // Animación 2: Título de Proyectos (projectsSectionTitle) - Empieza 40px abajo
        animateSectionOnScroll(projectsSectionTitle, 40);

        // Animación 3: Cuadrícula de Proyectos (projectGrid) - Empieza 80px abajo (más dramático)
        animateSectionOnScroll(projectGrid, 20);
    };


    // --- 6. INICIALIZACIÓN Y EVENT LISTENERS ---

    // Inicialización del estado CSS para todos los elementos animados
    const elementsToAnimate = [
        { element: midGrid, startY: 50, duration: 0.5 },
        { element: projectsSectionTitle, startY: 40, duration: 0.5 },
        { element: projectGrid, startY: 80, duration: 0.6 } // La cuadrícula puede ser más lenta
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
    
    // Llama a la función de animación una vez al inicio
    handleScrollAnimations();

    // Escuchar el evento de scroll en la ventana para actualizar la animación
    window.addEventListener('scroll', handleScrollAnimations);
});