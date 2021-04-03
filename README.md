# 3D-Portfolio
![landing.gif](https://github.com/kevbergstrom/3D-Portfolio/blob/main/landing.gif)

## Description
This is a portfolio that utilizes [Three.js](https://threejs.org/) to generate a 3D background scene that moves with the rest of the page when you scroll. It features a beautiful low poly lake in the mountains with calm water and fake godrays.

## How to run
You can use any web server to host this project locally. I prefer using the npm package [http-server](https://www.npmjs.com/package/http-server)
```
http-server -c-1
```
Then go to http://localhost:8080 to view the project

If you have python3 installed you can use http.server
```
python3 -m http.server
```
Then go to http://localhost:8000 to view the project

## Configuration
You can view all of the configuration options in config/configs.js
* To change the 3D landing text update the `name` and `title` attributes under `landingText`
* To change the time of day update the `timeOfDay` attribute from 0 to 24
* To disable antialiasing update the `fxaa` attribute

## Performance
* This project is relatively GPU intensive for a website, so mobile users or users with weak graphics cards may get a subpar experience with reduced framerates. You can boost the performance significantly by turning off `fxaa`
* You can also boost performance by removing any animated objects and only rendering when the screen moves
* It is recommended to use low poly models for their reduced filesize and improved performance
* Remember to remove the landing.gif file as it is only there for the readme

## Technologies
[Three.js](https://threejs.org/) - 3D Web Rendering  
[Fontawesome](https://fontawesome.com/) - HTML Icons  
[Bootstrap4](https://getbootstrap.com/) - Styling  

## Authors
[Kevin Bergstrom](https://github.com/kevbergstrom)