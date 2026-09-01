/* =========================================================
   CONTACT FORM — GOOGLE APPS SCRIPT TRANSMISSION
   ========================================================= */

const CONTACT_API_URL =
  "https://script.google.com/macros/s/AKfycbySFdsYDwLU7uupLEzf7lAO11Xi-P4sYUMHWwIRRw_XD0bY143J6Yry1iaHf-6JeP8/exec";


document.addEventListener("DOMContentLoaded", () => {

    const contactForm =
        document.getElementById("contactForm");

    const contactSubmit =
        document.getElementById("contactSubmit");

    const contactStatus =
        document.getElementById("contactFormStatus");

    const messageInput =
        document.getElementById("contactMessage");

    const messageCounter =
        document.getElementById("messageCounter");

    const toast =
        document.getElementById("transmissionToast");


    /* =====================================================
       MESSAGE COUNTER
       ===================================================== */

    if (messageInput && messageCounter) {

        const updateCounter = () => {

            messageCounter.textContent =
                `${messageInput.value.length} / 5000`;

        };

        messageInput.addEventListener(
            "input",
            updateCounter
        );

        updateCounter();

    }


    /* =====================================================
       SUCCESS TOAST
       ===================================================== */

    let toastTimeout;

    function showTransmissionToast() {

        if (!toast) return;

        clearTimeout(toastTimeout);

        toast.classList.remove("active");

        /*
         * Force browser reflow so the animation
         * can restart every time.
         */
        void toast.offsetWidth;

        toast.classList.add("active");

        toastTimeout = setTimeout(() => {

            toast.classList.remove("active");

        }, 5000);

    }


    /* =====================================================
       FORM STATUS
       ===================================================== */

    function setStatus(
        message,
        type = ""
    ) {

        if (!contactStatus) return;

        contactStatus.textContent =
            message;

        contactStatus.className =
            "contact-form-status-message visible";

        if (type) {

            contactStatus.classList.add(type);

        }

    }


    /* =====================================================
       TRANSMITTING BUTTON
       ===================================================== */

    function setTransmittingState() {

        if (!contactSubmit) return;

        contactSubmit.disabled = true;

        contactSubmit.classList.add(
            "is-transmitting"
        );


        const text =
            contactSubmit.querySelector(
                ".contact-submit-text"
            );

        const icon =
            contactSubmit.querySelector(
                ".contact-submit-icon"
            );

        const arrow =
            contactSubmit.querySelector(
                ".contact-submit-arrow"
            );


        if (text) {

            text.textContent =
                "TRANSMITTING...";

        }

        if (icon) {

            icon.textContent =
                "◌";

        }

        if (arrow) {

            arrow.textContent =
                "›";

        }

    }


    /* =====================================================
       RESET BUTTON
       ===================================================== */

    function resetSubmitButton() {

        if (!contactSubmit) return;

        contactSubmit.disabled = false;

        contactSubmit.classList.remove(
            "is-transmitting"
        );


        const text =
            contactSubmit.querySelector(
                ".contact-submit-text"
            );

        const icon =
            contactSubmit.querySelector(
                ".contact-submit-icon"
            );

        const arrow =
            contactSubmit.querySelector(
                ".contact-submit-arrow"
            );


        if (text) {

            text.textContent =
                "TRANSMIT MESSAGE";

        }

        if (icon) {

            icon.textContent =
                "↗";

        }

        if (arrow) {

            arrow.textContent =
                "→";

        }

    }


    /* =====================================================
       FORM SUBMISSION
       ===================================================== */

    if (contactForm) {

        contactForm.addEventListener(
            "submit",
            async (event) => {

                event.preventDefault();


                /* -----------------------------------------
                   VALIDATION
                   ----------------------------------------- */

                if (
                    !contactForm.checkValidity()
                ) {

                    contactForm.reportValidity();

                    return;

                }


                const requestType =
                    document.getElementById(
                        "requestType"
                    ).value;

                const email =
                    document.getElementById(
                        "contactEmail"
                    ).value.trim();

                const message =
                    document.getElementById(
                        "contactMessage"
                    ).value.trim();

                const websiteField =
                    document.getElementById(
                        "website"
                    );

                const website =
                    websiteField
                        ? websiteField.value.trim()
                        : "";


                /* -----------------------------------------
                   HONEYPOT
                   ----------------------------------------- */

                if (website !== "") {

                    return;

                }


                /* -----------------------------------------
                   VALIDATION
                   ----------------------------------------- */

                if (!message) {

                    setStatus(
                        "MESSAGE DATA REQUIRED.",
                        "error"
                    );

                    return;

                }


                if (
                    message.length > 5000
                ) {

                    setStatus(
                        "MESSAGE EXCEEDS 5000 CHARACTER LIMIT.",
                        "error"
                    );

                    return;

                }


                /* -----------------------------------------
                   TRANSMITTING
                   ----------------------------------------- */

                setTransmittingState();

                setStatus(
                    "ESTABLISHING SECURE TRANSMISSION..."
                );


                /* -----------------------------------------
                   PAYLOAD
                   ----------------------------------------- */

                const payload = {

                    requestType:
                        requestType,

                    email:
                        email,

                    message:
                        message,

                    website:
                        website

                };


                try {

                    /* -------------------------------------
                       SEND TO GOOGLE APPS SCRIPT
                       ------------------------------------- */

                    await fetch(
                        CONTACT_API_URL,
                        {
                            method: "POST",

                            mode: "no-cors",

                            redirect: "follow",

                            headers: {
                                "Content-Type":
                                    "text/plain;charset=utf-8"
                            },

                            body:
                                JSON.stringify(
                                    payload
                                )
                        }
                    );


                    /*
                     * KURT DONTS:
                     *
                     * DO NOT call response.json()
                     *
                     * Google Apps Script responses are opaque when using no-cors.
                     *
                     * The request completing means the
                     * transmission request was accepted.
                     */


                    /* -------------------------------------
                       SUCCESS
                       ------------------------------------- */

                    setStatus(
                        "TRANSMISSION COMPLETE.",
                        "success"
                    );


                    showTransmissionToast();


                    /* -------------------------------------
                       RESET FORM
                       ------------------------------------- */

                    contactForm.reset();


                    if (messageCounter) {

                        messageCounter.textContent =
                            "0 / 5000";

                    }


                    setTimeout(() => {

                        resetSubmitButton();

                    }, 800);


                } catch (error) {

                    console.error(
                        "Contact form error:",
                        error
                    );


                    setStatus(
                        "TRANSMISSION FAILED. PLEASE TRY AGAIN.",
                        "error"
                    );


                    resetSubmitButton();

                }

            }
        );

    }

});