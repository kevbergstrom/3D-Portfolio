# 3D Portfolio

## Description
This is a portfolio that utilizes [Three.js](https://threejs.org/) to generate a 3D background scene that moves with the rest of the page when you scroll.

## How to run
You can use any web server to host this project locally. I prefer using the npm package [http-server](https://www.npmjs.com/package/http-server)
```
http-server 3D-Portfolio
```
Then go to http://localhost:8000 to view the project

## Performance
* This project is relatively GPU intensive for a website, so mobile users or users with weak graphics cards may get a subpar experience with reduced framerates. You can boost the performance significantly by turning off antialiasing
* You can also boost performance by removing any animated objects and only rendering when the screen moves
* It is recommended to use low poly models for their reduced filesize and improved performance

## Technologies
[Three.js](https://threejs.org/) - 3D Web Rendering  
[Fontawesome](https://fontawesome.com/) - HTML Icons  
[Bootstrap4](https://getbootstrap.com/) - Styling  

## Authors
[Kevin Bergstrom](https://github.com/kevbergstrom)