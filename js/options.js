const optionTypes = {
    'error': {
        toHtml: generateError,
        attribute: 'value'
    },
    'check': {
        toHtml: generateCheck,
        attribute: 'checked'
    },
    'select': {
        toHtml: generateSelect,
        attribute: 'value'
    },
    'range': {
        toHtml: generateRange,
        attribute: 'value'
    },
    'color': {
        toHtml: generateRange,
        attribute: 'value'
    }
}

//for if you dont specify a type
const typeToOption = {
    'undefined': 'error',
    'boolean': 'check',
    'number': 'range',
    'string': 'error'
}

function createElement(html){
    let element = document.createElement('template');
    element.innerHTML = html;
    return element.content.firstChild;

}

function generateError(option){
    return `<p>error</p>`;
}

function generateCheck(option){
    let {data} = option;
    return `<input class="form-check-input checkbox m-3" type="checkbox">`;
}

function generateSelect(option){
    let {data, options} = option;
    let optionElements = '';
    options.forEach(opt => {
        optionElements += `<option>${opt}</option>`;
    })

    return `<select class="custom-select mt-3 text-right">
                <option selected>${data}</option>
                ${optionElements}
            </select>`
}

function generateRange(option){
    let {data, min, max, step} = option;
    return `<input type="range" id="volume" name="volume" min="${min}" max="${max}" step="${step}" class="w-100" value="${data}">`;
}

function addValueLabel(element, type, update, describe){
    let label = createElement(`<p>${describe(element[optionTypes[type].attribute])}</p>`);
    let span = createElement(`<span></span>`);
    span.appendChild(label);
    span.appendChild(element);
    element.onchange = e => {
        update(element[optionTypes[type].attribute]);
        label.innerHTML = describe(element[optionTypes[type].attribute]);
    };
    return span
}

function generateOptionDiv(option){
    let {title, type, data, update, show, describe} = option;
    if(!type){ type = typeToOption[typeof(data)] }
    if(!update){ update = e => {return} }
    if(!describe){ describe = e => e }
    // generate the form element
    let element = createElement(optionTypes[type].toHtml(option));
    // link the elements value to the data
    element.onchange = e => update(element[optionTypes[type].attribute]);

    if(optionTypes[type].attribute == 'checked'){
        element.checked = data;
    }
    if(show){ element = addValueLabel(element, type, update, describe) }

    let html = `<div>
                    <div class="primBack row"> 

                        <div class="col col-md-6 col-sm-12 col-12 p-3">
                            <h2 class="mediumTitle pb-3">${title}</h2>
                        </div>

                        <div class="col col-md-6 col-sm-12 col-12 p-3">
                            <div class="form-check text-right">
                                <span></span>
                            </div>
                        </div>
                    </div>
                <div>&nbsp;</div>
                <div>`
    let parentElement = createElement(html);
    // insert the element into the span
    parentElement.getElementsByTagName('span')[0].appendChild(element);

    return parentElement;
}

function generateOptions(options, elementId){
    const parentElement = document.getElementById(elementId);
    options.forEach(opt =>{
        parentElement.appendChild(generateOptionDiv(opt));
    })
}

export {generateOptions}
