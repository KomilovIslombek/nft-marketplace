/* 
const topCreatorsContainer = document.querySelector(".top-creators .container-section");
const topCreatorsHeader = document.querySelector(".top-creators__header");

function movePrimaryButton() {
    const btnPrimary = document.querySelector(".btn-primary[href='/rankings']");

    if (!btnPrimary || !topCreatorsHeader || !topCreatorsContainer) return;

    if (window.innerWidth <= 500) {
        btnPrimary.classList.add("active-in-end");
        removeChildIfExists(topCreatorsHeader, btnPrimary);
        topCreatorsContainer.appendChild(btnPrimary);
    } else {
        btnPrimary.classList.remove("active-in-end");
        removeChildIfExists(topCreatorsContainer, btnPrimary);
        topCreatorsHeader.appendChild(btnPrimary);
    }
}

movePrimaryButton();

window.addEventListener("resize", movePrimaryButton);
*/