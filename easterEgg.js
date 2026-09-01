/* ---------------------------------------------------------
   12. EASTER EGG — KURT MODE
   Type "KURT" anywhere on the website
   --------------------------------------------------------- */

function initEasterEgg() {

  const target = "kurt";
  let buffer = "";
  let active = false;

  /* -------------------------------------------------------
     MEMES!!
  ------------------------------------------------------- */

  const memes = [
    {
      image: "./assets/easter-eggs/meme-01.avif",
      text: "You found the secret 👀"
    },
    {
      image: "./assets/easter-eggs/meme-02.avif",
      text: "KURT MODE ACTIVATED"
    },
    {
      image: "./assets/easter-eggs/meme-03.avif",
      text: "Why did you type KURT? 😂"
    },
    {
      image: "./assets/easter-eggs/meme-04.avif",
      text: "Achievement Unlocked 🏆"
    },
    {
      image: "./assets/easter-eggs/meme-05.avif",
      text: "There was absolutely no reason to do that."
    }
  ];

  const messages = [
    "KURT MODE ACTIVATED",
    "You weren't supposed to find this.",
    "The website is now 73% more Kurt.",
    "Congratulations. You broke nothing. Probably.",
    "Secret developer powers unlocked.",
    "Please remain calm. Kurt is in control.",
    "404: Seriousness Not Found.",
    "Okay... who told you about this?"
  ];


  /* -------------------------------------------------------
     LISTEN FOR "KURT"
  ------------------------------------------------------- */

  window.addEventListener("keydown", (e) => {

    if (e.key === "Escape" && active) {
      closeEasterEgg();
      return;
    }

    if (e.key.length !== 1) return;

    buffer =
      (buffer + e.key.toLowerCase())
      .slice(-target.length);

    if (buffer === target && !active) {
      triggerEasterEgg();
    }
  });


  /* -------------------------------------------------------
     TRIGGER
  ------------------------------------------------------- */

  function triggerEasterEgg() {

    active = true;

    const meme =
      memes[Math.floor(Math.random() * memes.length)];

    const message =
      messages[Math.floor(Math.random() * messages.length)];


    /* -----------------------------------------------------
       ADD STYLES
    ----------------------------------------------------- */

    if (!document.getElementById("kurtModeStyles")) {

      const style = document.createElement("style");

      style.id = "kurtModeStyles";

      style.textContent = `
#kurtMode {
  position: fixed;
  inset: 0;
  z-index: 99999;

  display: flex;
  align-items: center;
  justify-content: center;

  /*
    Important:
    Prevent content from exceeding the viewport.
  */
  width: 100%;
  height: 100%;
  height: 100dvh;

  padding:
    max(15px, env(safe-area-inset-top))
    max(15px, env(safe-area-inset-right))
    max(15px, env(safe-area-inset-bottom))
    max(15px, env(safe-area-inset-left));

  box-sizing: border-box;

  overflow: hidden;

  background:
    radial-gradient(
      circle at center,
      rgba(76,243,224,.20),
      rgba(0,0,0,.92) 70%
    );

  backdrop-filter: blur(10px);

  opacity: 0;

  animation:
    kurtFadeIn .35s ease forwards;

  cursor: pointer;
}


/* ---------------------------------------------------------
   CONTENT
--------------------------------------------------------- */

.kurt-mode-content {

  /*
    Never allow the content to become taller
    than the available screen.
  */
  width: min(750px, 100%);
  max-height: 100%;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  text-align: center;

  box-sizing: border-box;

  transform:
    scale(.5)
    rotate(-5deg);

  opacity: 0;

  animation:
    kurtPop
    .7s
    cubic-bezier(.17,.89,.32,1.28)
    .15s
    forwards;

  position: relative;
  z-index: 2;
}


/* ---------------------------------------------------------
   TITLE
--------------------------------------------------------- */

.kurt-mode-title {

  width: 100%;

  margin-bottom:
    clamp(8px, 2vh, 20px);

  padding: 0 10px;

  box-sizing: border-box;

  font-family: inherit;

  /*
    Responsive font:
    Gets smaller on small screens.
  */
  font-size:
    clamp(18px, 5vw, 48px);

  line-height: 1.1;

  font-weight: 900;

  letter-spacing:
    clamp(.03em, .5vw, .08em);

  color: white;

  text-transform: uppercase;

  text-shadow:
    0 0 10px rgba(76,243,224,.8),
    0 0 30px rgba(76,243,224,.4);

  animation:
    kurtGlitch
    .15s
    infinite alternate;
}


/* ---------------------------------------------------------
   MEME IMAGE
--------------------------------------------------------- */

.kurt-mode-meme {

  display: block;

  /*
    Width adapts to screen.
  */
  width: auto;
  max-width: 100%;

  /*
    VERY IMPORTANT:
    The image can never consume the entire
    screen height because the title/caption
    also need room.
  */
  max-height: min(
    60vh,
    60dvh
  );

  height: auto;

  object-fit: contain;

  margin: 0 auto;

  border-radius:
    clamp(10px, 2vw, 18px);

  border:
    2px solid
    rgba(255,255,255,.2);

  box-shadow:

    0 20px 60px
    rgba(0,0,0,.7),

    0 0 40px
    rgba(76,243,224,.25);
}


/* ---------------------------------------------------------
   MESSAGE
--------------------------------------------------------- */

.kurt-mode-message {

  width: 100%;

  margin-top:
    clamp(8px, 2vh, 18px);

  padding: 0 10px;

  box-sizing: border-box;

  color: white;

  font-size:
    clamp(14px, 3vw, 25px);

  line-height: 1.25;

  font-weight: 700;

  text-shadow:
    0 3px 15px rgba(0,0,0,.8);
}


/* ---------------------------------------------------------
   CLOSE TEXT
--------------------------------------------------------- */

.kurt-mode-close {

  margin-top:
    clamp(6px, 1.5vh, 12px);

  font-size:
    clamp(8px, 2vw, 10px);

  line-height: 1.2;

  letter-spacing:
    clamp(.08em, .3vw, .15em);

  color:
    rgba(255,255,255,.45);
}


/* ---------------------------------------------------------
   SMALL PHONES
--------------------------------------------------------- */

@media (max-width: 480px) {

  #kurtMode {

    padding:
      12px
      12px
      calc(12px + env(safe-area-inset-bottom))
      12px;

  }


  .kurt-mode-content {

    width: 100%;

    max-width: 100%;
  }


  .kurt-mode-title {

    font-size: 20px;

    margin-bottom: 10px;

    /*
      Prevent long messages from becoming
      too wide.
    */
    max-width: 95vw;
  }


  .kurt-mode-meme {

    /*
      On phones, leave enough room for
      title + caption + close text.
    */
    max-height: 52dvh;

    max-width: 92vw;

    border-radius: 12px;
  }


  .kurt-mode-message {

    font-size: 15px;

    margin-top: 10px;

    max-width: 90vw;
  }


  .kurt-mode-close {

    font-size: 8px;

    margin-top: 7px;
  }

}


/* ---------------------------------------------------------
   VERY SHORT SCREENS
   Example:
   landscape phone
--------------------------------------------------------- */

@media (max-height: 500px) {

  #kurtMode {

    padding: 8px;
  }


  .kurt-mode-title {

    font-size: 18px;

    margin-bottom: 6px;
  }


  .kurt-mode-meme {

    max-height: 55dvh;

    max-width: 70vw;
  }


  .kurt-mode-message {

    font-size: 13px;

    margin-top: 6px;
  }


  .kurt-mode-close {

    margin-top: 4px;

    font-size: 7px;
  }

}


/* ---------------------------------------------------------
   ANIMATIONS
--------------------------------------------------------- */

@keyframes kurtFadeIn {

  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }

}


@keyframes kurtFadeOut {

  from {
    opacity: 1;
  }

  to {
    opacity: 0;
  }

}


@keyframes kurtPop {

  0% {

    opacity: 0;

    transform:
      scale(.5)
      rotate(-5deg);

  }

  70% {

    opacity: 1;

    transform:
      scale(1.05)
      rotate(1deg);

  }

  100% {

    opacity: 1;

    transform:
      scale(1)
      rotate(0);

  }

}


@keyframes kurtGlitch {

  from {
    transform: translateX(-1px);
  }

  to {
    transform: translateX(1px);
  }

}


@keyframes kurtFlash {

  0% {
    opacity: 1;
  }

  100% {
    opacity: 0;
  }

}


@keyframes kurtParticle {

  0% {

    transform:
      translate(0,0)
      scale(1)
      rotate(0);

    opacity: 1;

  }

  100% {

    transform:
      translate(
        var(--x),
        var(--y)
      )
      scale(0)
      rotate(720deg);

    opacity: 0;

  }

}


/* ---------------------------------------------------------
   REDUCED MOTION
--------------------------------------------------------- */

@media
(prefers-reduced-motion: reduce) {

  #kurtMode,
  #kurtMode *,
  .kurt-particle {

    animation: none !important;

  }

}

      `;

      document.head.appendChild(style);
    }


    /* -----------------------------------------------------
       OVERLAY
    ----------------------------------------------------- */

    const overlay =
      document.createElement("div");

    overlay.id = "kurtMode";


    /* -----------------------------------------------------
       CONTENT
    ----------------------------------------------------- */

    const content =
      document.createElement("div");

    content.className =
      "kurt-mode-content";


    /* TITLE */

    const title =
      document.createElement("div");

    title.className =
      "kurt-mode-title";

    title.textContent =
      message;


    /* MEME */

    const img =
      document.createElement("img");

    img.className =
      "kurt-mode-meme";

    img.src =
      meme.image;

    img.alt =
      "Kurt Mode Easter Egg";


    /* FALLBACK IF IMAGE FAILS */

    img.onerror = () => {

      img.style.display = "none";

    };


    /* MESSAGE */

    const caption =
      document.createElement("div");

    caption.className =
      "kurt-mode-message";

    caption.textContent =
      meme.text;


    /* CLOSE */

    const close =
      document.createElement("div");

    close.className =
      "kurt-mode-close";

    close.textContent =
      "CLICK ANYWHERE OR PRESS ESC TO RETURN";


    content.appendChild(title);
    content.appendChild(img);
    content.appendChild(caption);
    content.appendChild(close);

    overlay.appendChild(content);

    document.body.appendChild(overlay);


    /* -----------------------------------------------------
       FLASH
    ----------------------------------------------------- */

    const flash =
      document.createElement("div");

    flash.className =
      "kurt-flash";

    document.body.appendChild(flash);

    setTimeout(() => {
      flash.remove();
    }, 700);


    /* -----------------------------------------------------
       SCREEN SHAKE
    ----------------------------------------------------- */

    document.body.animate(

      [
        {
          transform:
            "translate(0,0)"
        },

        {
          transform:
            "translate(-10px,5px)"
        },

        {
          transform:
            "translate(10px,-5px)"
        },

        {
          transform:
            "translate(-6px,-3px)"
        },

        {
          transform:
            "translate(6px,3px)"
        },

        {
          transform:
            "translate(0,0)"
        }
      ],

      {
        duration: 500,
        easing: "ease-out"
      }

    );


    /* -----------------------------------------------------
       PARTICLES
    ----------------------------------------------------- */

    createParticles();


    /* -----------------------------------------------------
       ACCESSIBILITY
    ----------------------------------------------------- */

    const live =
      document.getElementById("srLive");

    if (live) {

      live.textContent =
        "Kurt Mode activated. You found the secret easter egg.";

    }


    /* -----------------------------------------------------
       CLOSE
    ----------------------------------------------------- */

    overlay.addEventListener(
      "click",
      closeEasterEgg
    );


    /* -----------------------------------------------------
       AUTO CLOSE
    ----------------------------------------------------- */

    setTimeout(() => {

      if (active) {
        closeEasterEgg();
      }

    }, 7000);

  }


  /* -------------------------------------------------------
     PARTICLES
  ------------------------------------------------------- */

  function createParticles() {

    const particleCount = 45;

    for (
      let i = 0;
      i < particleCount;
      i++
    ) {

      const particle =
        document.createElement("div");

      particle.className =
        "kurt-particle";


      particle.style.left =
        Math.random() * 100 + "vw";

      particle.style.top =
        Math.random() * 100 + "vh";


      particle.style.setProperty(
        "--x",
        (Math.random() * 500 - 250) + "px"
      );

      particle.style.setProperty(
        "--y",
        (Math.random() * 500 - 250) + "px"
      );


      const size =
        Math.random() * 8 + 4;

      particle.style.width =
        size + "px";

      particle.style.height =
        size + "px";


      particle.style.animationDelay =
        Math.random() * .3 + "s";


      document.body.appendChild(particle);


      setTimeout(() => {

        particle.remove();

      }, 2200);

    }

  }


  /* -------------------------------------------------------
     CLOSE EASTER EGG
  ------------------------------------------------------- */

  function closeEasterEgg() {

    const overlay =
      document.getElementById("kurtMode");

    if (!overlay) return;

    active = false;

    overlay.style.animation =
      "kurtFadeOut .3s ease forwards";


    setTimeout(() => {

      overlay.remove();

    }, 300);

  }

}


initEasterEgg();
