# Material 
Un objet 3D est décrit par une geométrie (vertices, faces, normales..etc) et un matériau (couleur, transparence..etc). 

## Quelques attributs de la classe 

### Color 

Initialisation : 

```javascript
{color:c} // c en hexa ou string ou r,g,b
```

ou 

```javascript
function MaterialRGB(r,g,b) {
    const c = new THREE.Color(r,g,b);
    return new THREE.MeshLambertMaterial( {color:c} );
}
```

Changement en cours :

 ```javascript
 material.color.set(c); // c en hexa ou string
 ```
 ou 
 
 ```javascript
 material.color.setHex(c); // c en hexa
 ```
 ou 
 
 ```javascript
 material.color.setRGB(c); // c en rgb
```

### Transparent && opacity 
opacity entre 0 (invisible) et 1 (opaque) 

Initialisation : 

```javascript
{transparent: true, opacity:0.5} 
```

Changement en cours :

```javascript
material.opacity = newValue; 
```

### Side

défini le côté des faces à rendre (front, back ou les deux), défaut sur THREE.FrontSide

Initialisation : 

```javascript
{side: THREE.DoubleSide}
```

Changement en cours :

```javascript
material.side = THREE.BackSide
```

### Visible 

rendre l'objet visible ou non, défaut sur true

Initialisation : 

```javascript
{visible: false}
```

Changement en cours :

```javascript
material.visible = true; 
```

## Remarques 

En absence de boucle d'animation, besoin d'appeler "material.needsUpdate" en cas de changement dans les attributs de Material
