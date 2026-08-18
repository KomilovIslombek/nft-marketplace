// Functions & Custom functions
const log = console.log;

function removeClass(els, className) {
    if(Array.isArray(els) || els.length > 1) {
        els.forEach(el => {
            el.classList.remove(className)
        });
    } else {
        els.classList.remove(className)
    }
}

function addClass(els, className) {
    if(Array.isArray(els) || els?.length > 1) {
        els.forEach(el => {
            el.classList.add(className)
        });
    } else {
        els.classList.add(className)
    }
}


/**
 * @param {HTMLElement} parent
 * @param {HTMLElement} child
 */
function removeChildIfExists(parent, child) {
    if (!parent || !child) return;
    // Only remove when the child is a direct child of the given parent.
    if (child.parentNode === parent) {
        parent.removeChild(child);
    }
}

// function getError(message, [...errors]) {
//     errors.forEach(e => {
//         if(e) {
            
//             throw new Error(`${message} , ${e}`);
//         }
//     })
// }



/**
 * This function work for modify the place of the primary Buttons of the website on resize the window and once on loading the page
 * @param {Array} btns 
 * @returns 
 */
function iterateButtons (btns = '') {
    if(!btns || !Array.isArray(btns)) return

    let i = 0
    
    for (const btn of btns) {
        let { parentHeader = false, parentContainer = false } = btn.dataset;
        
        if(!btn.dataset || !parentHeader || !parentContainer) continue;

        
        parentHeader = document.querySelector(`.${parentHeader}`)
        parentContainer = document.querySelector(`.${parentContainer}`)

        if(!parentHeader || !parentContainer) throw new Error("not an Element with such a className!");
         
        movePrimaryButton(btn, parentHeader, parentContainer)        
    }
}


function movePrimaryButton(btnPrimary, parentHeader, parentContainer) {
    if (!btnPrimary || !parentHeader || !parentContainer) return;

    if (window.innerWidth <= 500) {
        btnPrimary.classList.add("active-in-end");
        removeChildIfExists(parentHeader, btnPrimary);
        parentContainer.appendChild(btnPrimary);
    } else {
        btnPrimary.classList.remove("active-in-end");
        removeChildIfExists(parentContainer, btnPrimary);
        parentHeader.appendChild(btnPrimary);
    }
}


/**
 * Rocket btn ups the page from down till navbar
 * @param {Element}
 * @returns {true}
 */
function rocketTop(el) {
    // const body = document.querySelector("body")
    // log('hello', )
    // window.scrollY = 0;
    // body.style.scrollBehavior = 'smooth'
    window.scrollTo({
        top: 0,
        behavior: 'smooth'
    })
    // body.scroll
    // window.body
    
}