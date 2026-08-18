const hamburger = document.getElementById('hamburger');
const navList = document.querySelector('.header__nav-list');
const navListItems = document.querySelectorAll('.header__nav-item');

hamburger.addEventListener('click', () => {
    navList.classList.toggle('active');

    navListItems.forEach(item => {
        // item.setAttribute("data-animation-top", true)        
        // log(item)

        setTimeout(() => {
            item.classList.toggle("active")        
        }, 450);
    });


    // navList.classList.contains('none') ? hamburger.setAttribute('aria-expanded', 'false') : hamburger.setAttribute('aria-expanded', 'true');
});


const headerNavList = document.querySelector(".header__nav-list")
const rocketTopBtn = document.getElementById("rocket-btn")
let lastScrollTop = window.scrollY;

window.addEventListener("scroll", () => {
    const scrolledY = window.scrollY

    if(rocketTopBtn) {
        if(scrolledY >= 50 && lastScrollTop > scrolledY ) {
            setTimeout(() => {
                removeClass(rocketTopBtn, 'active')
            }, 200)
        } else if (scrolledY >= 50) addClass(rocketTopBtn, 'active')
    }

    if(scrolledY >= 50) {
        addClass(headerNavList, 'fixed')
        // addClass(rocketTopBtn, 'active')
    } else {
        removeClass(headerNavList, 'fixed')
        // removeClass(rocketTopBtn, 'active')
    }
    
    // Update the tracker with the current position of window   
    lastScrollTop = scrolledY <= 0 ? 0 : scrolledY;
})