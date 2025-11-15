const THREE = window.THREE;
const GLTFLoader = window.GLTFLoader;
const gsap = window.gsap;

let scene, camera, renderer;
let netModel = null;

// ------------------------
// Inicialización del 3D
// ------------------------
window.initNet3D = function() {
    const canvas = document.getElementById("net3d-canvas");
    if (!canvas) {
        console.error("No se encontró el canvas con id 'net3d-canvas'");
        return;
    }

    // Renderer
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Scene
    scene = new THREE.Scene();

    // Camera
    camera = new THREE.PerspectiveCamera(
        50,
        window.innerWidth / window.innerHeight,
        0.1,
        100
    );
    camera.position.set(0, 0, 5); // Cámara cerca del modelo

    // Luz
    const light = new THREE.DirectionalLight(0xffffff, 1.2);
    light.position.set(5, 5, 5);
    scene.add(light);

    // GLTF Loader
    const loader = new GLTFLoader();

    loader.load(
        "./Assets/Modelos3d/ModeloRedMariposas.glb", // Ruta relativa
        (gltf) => {
            console.log("Modelo cargado:", gltf);
            netModel = gltf.scene;
            netModel.scale.set(0.6, 0.6, 0.6);
            netModel.rotation.set(0, Math.PI / 2, 0);
            scene.add(netModel);
        },
        (xhr) => {
            console.log(`Cargando modelo: ${(xhr.loaded / xhr.total * 100).toFixed(2)}%`);
        },
        (err) => console.error("Error cargando modelo:", err)
    );

    animate();
};

// ------------------------
// Animación de la red
// ------------------------
window.swingNet = function() {
    if (!netModel) return;

    gsap.to(netModel.rotation, {
        x: -0.5,
        duration: 0.08,
        ease: "power2.out",
        onComplete: () => {
            gsap.to(netModel.rotation, {
                x: 0,
                duration: 0.15,
                ease: "power2.in"
            });
        }
    });
};

// ------------------------
// Animación y render loop
// ------------------------
function animate() {
    requestAnimationFrame(animate);
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// ------------------------
// Ajuste de tamaño
// ------------------------
window.addEventListener("resize", () => {
    if (!camera || !renderer) return;
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});