// inscripcion-script.js - COMPLETO

/**
 * Función para obtener un parámetro de la URL (ej. el ID de la actividad).
 */
const getUrlParameter = (name) => {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

/**
 * Carga el logo, links de navegación y CTA en el header.
 */
const loadHeader = (headerData) => {
    const navLinksUl = document.getElementById('main-nav-links');
    const logoLink = document.querySelector('#main-header .logo a'); // Selecciona el <a> dentro de .logo
    const ctaButton = document.getElementById('header-cta-btn'); 
    
    if (!logoLink || !navLinksUl || !ctaButton) return;

    // 1. Logo (el texto ya está en el HTML, pero se actualiza el texto)
    logoLink.textContent = headerData.logo;

    // 2. Botón CTA
    ctaButton.textContent = headerData.cta_button;
    // Opcional: Si el CTA va a una URL específica:
    // ctaButton.onclick = () => { window.location.href = headerData.cta_url || '#'; };

    // 3. Links de navegación
    navLinksUl.innerHTML = ''; // Limpiar links existentes
    headerData.nav_links.forEach(link => {
        const li = document.createElement('li');
        li.innerHTML = `<a href="${link.url}">${link.text}</a>`;
        navLinksUl.appendChild(li);
    });
};

/**
 * Carga y renderiza los detalles de la actividad y configura el formulario.
 */
const renderInscriptionPage = (allData) => {
    // 1. Obtener el ID de la URL
    const activityId = getUrlParameter('id');
    // Asumiendo que 'activity_details' está en el nivel superior del JSON
    // ESTA LÍNEA DEBE ENCONTRAR activity_details en el JSON (Punto 1 de la respuesta anterior)
    const detailData = allData.activity_details ? allData.activity_details[activityId] : null;

    if (!activityId || !detailData) {
        // Manejar el caso de ID no encontrado o JSON incompleto
        document.getElementById('page-title').textContent = "Error: Actividad No Encontrada";
        document.getElementById('activity-title').textContent = "Actividad No Encontrada";
        document.getElementById('activity-location').textContent = ""; // Limpiar ubicación
        document.getElementById('activity-description').innerHTML = "<p>Lo sentimos, la actividad que buscas no está disponible. Asegúrate de que el enlace es correcto y que el `Data.json` tiene la sección `activity_details`.</p>";
        // Ocultar elementos irrelevantes en caso de error
        const scheduleBox = document.querySelector('.schedule-box');
        if (scheduleBox) scheduleBox.classList.add('hidden');
        const formContainer = document.querySelector('.inscription-form-container');
        if (formContainer) formContainer.classList.add('hidden');
        return;
    }

    // 2. Inyectar Datos en la Plantilla HTML
    document.getElementById('page-title').textContent = detailData.title;
    document.getElementById('activity-title').textContent = detailData.title;
    document.getElementById('activity-location').textContent = `Ubicación: ${detailData.location}`;
    document.getElementById('activity-description').textContent = detailData.full_description;
    
    // El horario se toma de detailData.schedule, que es el valor completo
    document.getElementById('activity-schedule').textContent = detailData.schedule;
    document.getElementById('form-schedule-display').value = detailData.schedule;
    
    // Inyectar imagen de fondo del banner
    const banner = document.getElementById('detail-banner');
    if (banner) {
        banner.style.backgroundImage = `url('${detailData.banner_image}')`;
    }

    // 3. Configurar Formulario de Inscripción
    const inscriptionForm = document.getElementById('inscription-form');
    const successMessage = document.getElementById('success-message');
    const confirmationDetails = document.getElementById('confirmation-details');

    if (inscriptionForm) {
        inscriptionForm.addEventListener('submit', (e) => {
            e.preventDefault(); 
            
            const name = document.getElementById('student-name').value;
            const code = document.getElementById('student-code').value;
            const email = document.getElementById('student-email').value;
            
            // 4. Mostrar Mensaje de Éxito
            inscriptionForm.classList.add('hidden'); // Ocultar formulario
            successMessage.classList.remove('hidden'); // Mostrar mensaje de éxito
            
            confirmationDetails.innerHTML = `
                Te has inscrito a: <strong>${detailData.title}</strong>.<br>
                Horario: <strong>${detailData.schedule}</strong>.
                Recibirás un correo de confirmación a <strong>${email}</strong>.
            `;
        });
    }
};


// 5. INICIALIZACIÓN: Cargar el JSON cuando la página esté lista
document.addEventListener('DOMContentLoaded', () => {
    // Intentar cargar Data.json
    fetch('Data.json')
        .then(response => response.json())
        .then(data => {
            // Cargar el Header con los datos de Data.json
            loadHeader(data.header);
            
            // Renderizar el contenido específico de la página de inscripción
            renderInscriptionPage(data);
        })
        .catch(error => {
            console.error('Error cargando data:', error);
            document.getElementById('activity-title').textContent = "Error de Conexión";
            document.getElementById('activity-description').innerHTML = "<p>No se pudieron cargar los datos del sistema. Verifica el archivo Data.json.</p>";
        });
});


