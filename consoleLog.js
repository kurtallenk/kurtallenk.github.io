(() => {
    /* =========================================================
       KURT ALLEN — CONSOLE LOG
       ========================================================= */

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const asciiLogo = `
██╗  ██╗██╗   ██╗██████╗ ████████╗
██║ ██╔╝██║   ██║██╔══██╗╚══██╔══╝
█████╔╝ ██║   ██║██████╔╝   ██║
██╔═██╗ ██║   ██║██╔══██╗   ██║
██║  ██╗╚██████╔╝██║  ██║   ██║
╚═╝  ╚═╝ ╚═════╝ ╚═╝  ╚═╝   ╚═╝

          A L L E N
`;

    const styles = {
        title:
            "font-family:monospace;font-size:16px;font-weight:bold;line-height:1.4;",

        logo:
            "font-family:monospace;font-size:11px;font-weight:bold;line-height:1.15;",

        normal:
            "font-family:monospace;font-size:12px;line-height:1.6;",

        success:
            "font-family:monospace;font-size:12px;font-weight:bold;line-height:1.6;",

        final:
            "font-family:monospace;font-size:18px;font-weight:bold;line-height:1.6;"
    };

    /* ---------------------------------------------------------
       TYPEWRITER
       --------------------------------------------------------- */

    async function typeLine(text, speed = 18) {
        let output = "";

        for (const char of text) {
            output += char;

            console.clear();

            console.log(
                "%c" + output + "█",
                styles.normal
            );

            await sleep(speed);
        }

        return output;
    }

    /* ---------------------------------------------------------
       LOADING BAR
       --------------------------------------------------------- */

    async function loadingBar(label, duration = 900) {

        const steps = 24;
        const delay = duration / steps;

        for (let i = 0; i <= steps; i++) {

            const filled = "█".repeat(i);
            const empty = "░".repeat(steps - i);

            const percent = Math.round((i / steps) * 100);

            console.clear();

            console.log(
                "%c" +
                "\n" +
                "KURT.ALLEN // SYSTEM INITIALIZATION\n\n" +
                `${label}\n` +
                `[${filled}${empty}] ${percent}%` +
                "\n\n" +
                "█",
                styles.normal
            );

            await sleep(delay);
        }
    }

    /* ---------------------------------------------------------
       BOOT SEQUENCE
       --------------------------------------------------------- */

    async function boot() {

        console.clear();

        await sleep(300);

        await loadingBar(
            "> Initializing curiosity protocol...",
            850
        );

        await loadingBar(
            "> Loading creative subsystem...",
            700
        );

        await loadingBar(
            "> Searching for hidden secrets...",
            650
        );

        console.clear();

        console.log(
            "%c" + asciiLogo,
            styles.logo
        );

        await sleep(700);

        console.log(
            "%c\n> SYSTEM STATUS",
            styles.title
        );

        await sleep(350);

        console.log(
            "%c\n  ✓ Developer detected",
            styles.success
        );

        await sleep(250);

        console.log(
            "%c  ✓ DevTools detected",
            styles.success
        );

        await sleep(250);

        console.log(
            "%c  ✓ Curiosity level: EXTREME",
            styles.success
        );

        await sleep(250);

        console.log(
            "%c  ✓ Secret developer area accessed",
            styles.success
        );

        await sleep(500);

        /* -----------------------------------------------------
           FUN DIAGNOSTICS
           ----------------------------------------------------- */

        console.log(
            "%c\n> RUNNING DIAGNOSTICS...\n",
            styles.title
        );

        const diagnostics = [
            "  Coffee dependency     ███████████████████░  97%",
            "  CSS complexity        ████████████████████  100%",
            "  Pixel perfection      ███████████████████░  96%",
            "  Bugs                  ███████░░░░░░░░░░░░░  CLASSIFIED",
            "  Sleep schedule        ████░░░░░░░░░░░░░░░░  CRITICAL"
        ];

        for (const line of diagnostics) {
            console.log("%c" + line, styles.normal);
            await sleep(300);
        }

        await sleep(700);

        /* -----------------------------------------------------
           FINAL MESSAGE
           ----------------------------------------------------- */

        console.log(
            "%c\n\n╔══════════════════════════════════════════╗",
            styles.final
        );

        await sleep(150);

        console.log(
            "%c║                                          ║",
            styles.final
        );

        await sleep(150);

        console.log(
            "%c║       Y O U   F O U N D   T H E         ║",
            styles.final
        );

        await sleep(150);

        console.log(
            "%c║                                          ║",
            styles.final
        );

        await sleep(150);

        console.log(
            "%c║              S O U R C E                 ║",
            styles.final
        );

        await sleep(150);

        console.log(
            "%c║                                          ║",
            styles.final
        );

        await sleep(150);

        console.log(
            "%c╚══════════════════════════════════════════╝",
            styles.final
        );

        await sleep(600);

        console.log(
            "%c\n\n👁  Welcome behind the interface.",
            styles.title
        );

        await sleep(500);

        console.log(
            "%c\n" +
            "You weren't supposed to find this.\n" +
            "But since you're here...\n\n" +
            "Respect. 🤝\n\n",
            "Easter Egg: Type 'kurt' anywhere in the website for secret message!",
            styles.normal
        );

        await sleep(400);

        console.log(
            "%c\n\n— Kurt Allen",
            styles.success
        );

        await sleep(300);

        console.log(
            "%c\n\n[ END OF TRANSMISSION ] █",
            styles.normal
        );
    }

    /* ---------------------------------------------------------
       START
       --------------------------------------------------------- */

    boot();

})();
