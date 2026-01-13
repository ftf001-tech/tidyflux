(function () {
    var t = localStorage.getItem('tidyflux-theme');
    if (t && t !== 'default') document.documentElement.setAttribute('data-theme', t);
    var c = localStorage.getItem('tidyflux-color-scheme');
    if (c && c !== 'auto') document.documentElement.setAttribute('data-color-scheme', c);
})();
