let navOpen = false;
let isClick = true;

document.getElementById('navBackground').addEventListener("click", toggleNav);
document.getElementById('bar').addEventListener("click", toggleNav);

// Step O1 & C1: Checks if navOpen is true or false, and opens or closes it accordingly.
function toggleNav() {
    if (navOpen == false) {
        navOpen = true;
        console.log('open 1');
        preNav();
    } else if (navOpen == true) {
        navOpen = false;
        console.log('close 1');
        closeNav();
    }
}

// Step O2: Upon opening the nav, sets nav and navBackground display to block. They have display set to none by default so that text behind them can be interacted with properly.
function preNav() {
    document.getElementById('nav').style.display = ('block');
    document.getElementById('navBackground').style.display = ('block');
    setTimeout(openNav, 1)
    console.log('open 2');
}

// Step O3: Changes the styling of the nav to have it appear as if it slides in from the top right. This is seperate from the previous step because changing display from none to something messes with transitions.
function openNav() {
    document.getElementById('nav').style.opacity = ('100');
    document.getElementById('firstNav').className = ('navOpened');
    document.getElementById('navBackground').style.opacity = ('100');
    console.log('open 3');
}

// Step C2: 
function closeNav() {
    document.getElementById('nav').style.opacity = ('0');
    document.getElementById('firstNav').className = ('navClosed');
    document.getElementById('navBackground').style.opacity = ('0');
    toggleClick();
    setTimeout(navReturn, 400);
    console.log('close 2');
}

function navReturn() {
    document.getElementById('firstNav').className = ('navStart');
    document.getElementById('nav').style.display = ('none');
    document.getElementById('navBackground').style.display = ('none');
    setTimeout(toggleClick, 100);
    console.log('close 3');
}

function toggleClick() {
    if (isClick == true) {
        isClick = false;
        clickOff();
    } else if (isClick == false) {
        isClick = true;
        clickOn();
    }
}

function clickOff() {
    document.getElementById('navBackground').removeEventListener("click", toggleNav);
    document.getElementById('bar').removeEventListener("click", toggleNav);
    console.log('tog on');
}

function clickOn() {
    document.getElementById('navBackground').addEventListener("click", toggleNav);
    document.getElementById('bar').addEventListener("click", toggleNav);
    console.log('tog off');
}