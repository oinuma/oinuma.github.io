/* Script for mobile navigation menu toggle open plus close */
   $(function() {  
    $(".responsive-nav-tab").click(function() {  
        $(".responsive-nav").toggleClass("responsive-nav-changed");  
    });  
});
/* End mobile navigation menu toggle */

/* Script for scroll functions */

function scrollToElement(selector, time, verticalOffset) {
    time = typeof(time) != 'undefined' ? time : 1000;
    verticalOffset = typeof(verticalOffset) != 'undefined' ? verticalOffset : 0;
    element = $(selector);
    offset = element.offset();
    offsetTop = offset.top + verticalOffset;
    $('html, body').animate({
        scrollTop: offsetTop
    }, time);
}

/* Prevents the default action of the link which causes a split second scroll to top of page before scrolling to div.
This resulted in a flicker on the screen but the below will fix this. */
$('.responsive-nav a').bind('click', function(event) {
    event.preventDefault();
});

/* Which Links / Classes will scroll to which Div Id's on the page */
$('.one').click(function () {
    scrollToElement('#row-one-container');
});

$('.two').click(function () {
    scrollToElement('#row-two-container');
});

$('.three').click(function () {
    scrollToElement('#row-three-container');
});

$('.four').click(function () {
    scrollToElement('#row-four-container');
});

$('.five').click(function () {
    scrollToElement('#row-five-container');
});

$('.six').click(function () {
    scrollToElement('#row-six-container');
});

$('.seven').click(function () {
    scrollToElement('#row-seven-container');
});

$('.eight').click(function () {
    scrollToElement('#row-eight-container');
});

$('.nine').click(function () {
    scrollToElement('#row-nine-container');
});

$('.ten').click(function () {
    scrollToElement('#row-ten-container');
});

$('.eleven').click(function () {
    scrollToElement('#row-eleven-container');
});

$('.twelve').click(function () {
    scrollToElement('#row-tweleve-container');
});

$('.thirteen').click(function () {
    scrollToElement('#row-thirteen-container');
});

$('.fourteen').click(function () {
    scrollToElement('#row-fourteen-container');
});

$('.fifteen').click(function () {
    scrollToElement('#row-fifteen-container');
});

$('.sixteen').click(function () {
    scrollToElement('#row-sixteen-container');
});


/* End Script for scroll functions */


/* Script for parallax image scroll */

$(document).ready(function(){
    // Cache the Window object
    $window = $(window);
                
   $('section[data-type="background"]').each(function(){
     var $bgobj = $(this); // assigning the object
                    
      $(window).scroll(function() {
                    
        // Scroll the background at var speed
        // the yPos is a negative value because we're scrolling it UP!                              
        var yPos = -($window.scrollTop() / $bgobj.data('speed')); 
        
        // Put together our final background position
        var coords = '50% '+ yPos + 'px';

        // Move the background
        $bgobj.css({ backgroundPosition: coords });
        
}); // window scroll Ends

 });    

}); 
/* 
 * Create HTML5 elements for IE's sake
 */

document.createElement("article");
document.createElement("section");