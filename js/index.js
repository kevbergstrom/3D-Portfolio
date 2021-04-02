let navbar = document.querySelector("#navbar")
let navOptions = document.querySelector("#navOptions")
let navOpen = false;

let toggleNavbar = function() {
    if(navOpen){
        navOptions.classList.add("d-none");
    }else{
        navOptions.classList.remove("d-none");
    }
    navOpen = !navOpen
}

const content = {
    'portfolio': document.getElementById('portfolio'),
    'options': document.getElementById('options'),
    'filler': document.getElementById('filler'),
}

let prev = content['portfolio'];

function openContent(id){
    const found = content[id];
    if(prev && prev != found){
        prev.classList.add("d-none");
    }
    if(found){
        found.classList.remove("d-none");
        prev = found;
    }
}

function hideContent(){
    openContent('filler');
}

function closeButton(id){
    let element = document.getElementById(id)
    element.remove()
}