const skyColors = [
    {//midnight
        primary: 0x0B00A9,
        secondary: 0x0084ff,
        light: 0x0077e6,
        time: 0,
    },
    {
        primary: 0x0B00A9,
        secondary: 0x0084ff,
        light: 0x1a90ff,
        time: 3,
    },
    {//sunrise
        primary: 0x8B12B0,
        secondary: 0xFF9700,
        light: 0x339cff,
        time: 7,
    },
    {//sunset
        primary: 0x8B12B0,
        secondary: 0xFF9700,
        light: 0x339cff,
        time: 7,
    },
    {
        primary: 0x2795FF,
        secondary: 0x01c7ff,
        light: 0xffe38b,
        time: 9,
    },
    {//mid day
        primary: 0x2795FF,
        secondary: 0x01c7ff,
        light: 0xffe38b,
        time: 12,
    },
    {
        primary: 0x2795FF,
        secondary: 0x01c7ff,
        light: 0xffe38b,
        time: 18,
    },
    {//sunset
        primary: 0x8B12B0,
        secondary: 0xFF9700,
        light: 0x339cff,
        time: 19,
    },
]

// 0xffe38b

const maxTime = 24;

function interpolateColors(color1, color2, value){
    let mask = (1<<8)-1;
    let newColor = 0;
    newColor += ((color1>>16)*(1-value) + (color2>>16)*value)<<16;
    newColor += (((color1>>8)&mask)*(1-value) + ((color2>>8)&mask)*value)<<8;
    newColor += ((color1&mask)*(1-value) + (color2&mask)*value);

    return newColor;
}

function getSkyColorAtTime(time){
    let prev = skyColors[skyColors.length-1];
    let next = skyColors[0];
    next.time = maxTime;

    for(let i = 1; i < skyColors.length;i++){
        if(skyColors[i].time > time){
            next = skyColors[i];
            prev = skyColors[i-1];
            if(next.time < prev.time){
                prev.time = 0;
            }
            break;
        }
    }

    let t = (time - prev.time)/(next.time - prev.time);
    let skyColor = {   
        primary: interpolateColors(prev.primary, next.primary, t),
        secondary: interpolateColors(prev.secondary, next.secondary, t),
        light: interpolateColors(prev.light, next.light, t),
    }

    return skyColor;
}

function timeToValue(hour, minutes){

}

function valueToTime(value){
    let hours = Math.floor(((value+11)%12)+1);
    let minutes = Math.trunc((value-Math.floor(value))*60);
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes} ${value > 12 ? 'PM' : 'AM'}`
}

export default {getSkyColorAtTime, timeToValue, valueToTime}