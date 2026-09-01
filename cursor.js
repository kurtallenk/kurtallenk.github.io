const cursor = document.querySelector(".futuristic-cursor");

let mouseX = 0;
let mouseY = 0;

document.addEventListener("mousemove", (e) => {

    mouseX = e.clientX;
    mouseY = e.clientY;
    

    cursor.style.left = `${mouseX}px`;
    cursor.style.top = `${mouseY}px`;

    createParticle();
});


function createParticle() {

    const particle = document.createElement("span");

    particle.className = "cursor-particle";

    // Random direction
    const angle = Math.random() * Math.PI * 2;

    const distance =
        Math.random() * 30 + 10;

    const x =
        Math.cos(angle) * distance;

    const y =
        Math.sin(angle) * distance;

    let add=15;
    particle.style.left = `${mouseX+add+3}px`;
    particle.style.top = `${mouseY+add+15}px`;

    particle.style.setProperty(
        "--particle-x",
        `${x}px`
    );

    particle.style.setProperty(
        "--particle-y",
        `${y}px`
    );

    // Random size
    const size =
        Math.random() * 3 + 2;

    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    document.body.appendChild(particle);

    setTimeout(() => {
        particle.remove();
    }, 700);
}