const loadingImage = document.getElementById("loadingImage");
const loadingGif = document.getElementById("loadingGif");

// Create a separate image object to preload the GIF
const gifPreloader = new Image();

gifPreloader.onload = () => {
    // GIF is completely loaded
    loadingImage.style.display = "none";
    loadingGif.style.display = "block";
    
    // Now display the loaded GIF
    loadingGif.src = gifPreloader.src;
};

gifPreloader.src = "/assets/images/two_orbits.avif";