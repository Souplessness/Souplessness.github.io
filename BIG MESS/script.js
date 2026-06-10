// For toggling old stuff in the changelog
let oldChangesVisible = false;

function changelogToggle() {
    if (oldChangesVisible == false) {
        document.getElementById("oldChanges").className = "clVisible";
        oldChangesVisible = true;
    } else if (oldChangesVisible == true) {
        document.getElementById("oldChanges").className = "clHidden";
        oldChangesVisible = false;
    }
}

// For adding the tooltips in the changelog
Array.from(document.getElementsByClassName('gameChange')).forEach(element => {
    element.outerHTML = '<section class="clTooltip">' + element.outerHTML + '<span class="clTooltipText">This change applies to the game</span></section>';
});

Array.from(document.getElementsByClassName('siteChange')).forEach(element => {
    element.outerHTML = '<section class="clTooltip">' + element.outerHTML + '<span class="clTooltipText">This change applies to the website</span></section>';
});