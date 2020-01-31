# Animation

2 solutions pour animer une scène :
* un appel de la fonction render() à chaque besoin de mettre à jour l'affichage
* une boucle d'animation appelée en continu et l'affichage est mis à jour tous les dt (~25ms)

## Appel à la fonction render()
+ mise à jour de l'écran que si besoin
- besoin de rajouter l'appel à la fonction dès qu'on modifie la scène (le plus souvent après un événement)

## Boucle d'animation

```javascript

animationLoop();

function animationLoop() {

    // Fonction JavaScript de gestion d'animation
    //  La paramètre de requestAnimationFrame est la fonction à appeler régulièrement
    requestAnimationFrame( animate );
}

// La fonction d'animation en temps que telle
//  Fonction appelée depuis requestAnimationFrame, reçoit en paramètre le temps écoule (en ms).
function animate(time) {

    //temps en seconde
    const t = time/1000;

    // actions à effectuer

    // Affichage de la scène
    render();

    // Relance la boucle d'animation
    animationLoop();
}
```
ou 

``` javascript 
requestAnimationFrame( computeFrame );


function computeFrame( time ) {

    const t = time/1000;
    
    // actions à effectuer

    // Render the scene
    render();

    // Call for the next frame
    requestAnimationFrame( computeFrame );

}
```

+ pas besoin d'appel à la fonction
- mise à jour continu de l'affichage même s'il n'y en a pas besoin
