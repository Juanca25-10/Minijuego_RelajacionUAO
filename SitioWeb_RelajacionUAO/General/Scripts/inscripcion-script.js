// inscripcion-script.js

/**
 * Función para obtener un parámetro de la URL (ej. el ID de la actividad).
 * @param {string} name - Nombre del parámetro a buscar.
 * @returns {string|null} - Valor del parámetro o null si no se encuentra.
 */
const getUrlParameter = (name) => {
    name = name.replace(/[\[]/, '\\[').replace(/[\]]/, '\\]');
    const regex = new RegExp('[\\?&]' + name + '=([^&#]*)');
    const results = regex.exec(location.search);
    return results === null ? null : decodeURIComponent(results[1].replace(/\+/g, ' '));
};

/**
 * Carga y renderiza los detalles de la actividad y configura el formulario.
 * @param {object} allData - Todos los datos de Data.json.
 */
const renderInscriptionPage = (allData) => {
    // 1. Obtener el ID de la URL
    const activityId = getUrlParameter('id');
    // Asumiendo que 'activity_details' está en el nivel superior del JSON
    const detailData = allData.activity_details ? allData.activity_details[activityId] : null;

    if (!activityId || !detailData) {
        // Manejar el caso de ID no encontrado o JSON incompleto
        document.getElementById('page-title').textContent = "Error: Actividad No Encontrada";
        document.getElementById('activity-title').textContent = "Actividad No Encontrada";
        document.getElementById('activity-description').innerHTML = "<p>Lo sentimos, la actividad que buscas no está disponible.</p>";
        return;
    }

    // 2. Inyectar Datos en la Plantilla HTML
    document.getElementById('page-title').textContent = detailData.title;
    document.getElementById('activity-title').textContent = detailData.title;
    document.getElementById('activity-location').textContent = `Ubicación: ${detailData.location}`;
    document.getElementById('activity-description').textContent = detailData.full_description;
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
            
            // Lógica de simulación de registro
            console.log(`Inscripción Recibida para: ${detailData.title}`);
            
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
            renderInscriptionPage(data);
        })
        .catch(error => {
            console.error('Error cargando data:', error);
            document.getElementById('activity-title').textContent = "Error de Conexión";
            document.getElementById('activity-description').innerHTML = "<p>No se pudieron cargar los datos de la actividad.</p>";
        });
        
    // NOTA: Si el script.js global maneja el initAccessibilityPanel(),
    // debe estar cargado ANTES de este script en el HTML.
});