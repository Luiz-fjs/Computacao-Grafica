// ==================================================
// SCOREBOARD (placar no topo da tela + faixa de mensagens no centro)
// Só manipula o DOM; quem decide o que mostrar é o estado da partida.
// ==================================================

const elements = {
    redName: document.getElementById("team-red-name"),
    blueName: document.getElementById("team-blue-name"),
    redScore: document.getElementById("score-red"),
    blueScore: document.getElementById("score-blue"),
    clockBox: document.getElementById("clock-box"),
    clock: document.getElementById("clock"),
    banner: document.getElementById("banner"),
    bannerTitle: document.querySelector("#banner .title"),
    bannerSubtitle: document.querySelector("#banner .subtitle"),
    bannerHint: document.querySelector("#banner .hint"),
};

let lastClockText = "";
let bannerTimeout = null;

export function formatClock(seconds) {
    const s = Math.max(0, Math.ceil(seconds));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export function setTeamNames(names) {
    elements.redName.textContent = names.red;
    elements.blueName.textContent = names.blue;
}

export function setScore(score) {
    elements.redScore.textContent = score.red;
    elements.blueScore.textContent = score.blue;
}

// isFinalSeconds liga o efeito de últimos segundos (cresce, pisca e treme)
export function setClock(seconds, isFinalSeconds) {
    const text = formatClock(seconds);
    if (text !== lastClockText) {
        elements.clock.textContent = text;
        lastClockText = text;
    }
    elements.clockBox.classList.toggle("final", isFinalSeconds);
}

// Mostra a faixa central; com duration (segundos) ela some sozinha
export function showBanner(title, { subtitle = "", hint = "", duration = 0, pop = false } = {}) {
    clearTimeout(bannerTimeout);
    elements.bannerTitle.textContent = title;
    elements.bannerSubtitle.textContent = subtitle;
    elements.bannerHint.textContent = hint;
    elements.banner.hidden = false;

    // Reinicia a animação de "pulo" (usada na contagem 3, 2, 1)
    elements.bannerTitle.classList.remove("pop");
    if (pop) {
        void elements.bannerTitle.offsetWidth; // força reflow para a animação recomeçar
        elements.bannerTitle.classList.add("pop");
    }

    if (duration > 0) bannerTimeout = setTimeout(hideBanner, duration * 1000);
}

export function hideBanner() {
    clearTimeout(bannerTimeout);
    elements.banner.hidden = true;
}
