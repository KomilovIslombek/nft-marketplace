const buttons = document.querySelectorAll(".btn-primary[data-parent-header]")

/* 
    We take all the buttons (btn-primary) from html and give them to the iterateButtons function as it lands a hand us to modify all the buttons' places based on their data parents. In addition, it works during the window resize and once loading the page no matter in which section button is placed, the function work for all the primary buttons with class btn-primary!
*/

/* Destruction is being used here in order to turn nodeList into array */
iterateButtons([...buttons])
// window.addEventListener("resize", () => iterateButtons([...buttons]))



// Debounced resize — waits until resizing pauses for 150ms before
// re-running, instead of firing dozens of times per second mid-drag.
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => iterateButtons([...buttons]), 150);
});
