# Rotation locale ou globale

On appelle position d'un objet, la position de son centre.

## Cas 1 : Objet attaché à la Scène
rotation effectuée par défaut selon le centre de l'objet

```javascript

  objet.rotation.axe += 0.1;
```

## Cas 2 : Objet attaché élément statique

### Mauvaise Rotation
```javascript

  objet.rotation.axe += 0.1;
```
Conséquence : l'objet tourne autour du centre du parent translaté sur l'axe pour être dans le même plan que l'enfant

### Bonne Rotation
Comme expliqué dans la séance 2, on réalise une translation pour placer l'objet au centre de son parent, on réalise la rotation puis on le replace à sa position initiale
```javascript
// Translation inverse
const Tinv = new THREE.Matrix4().makeTranslation(0,-1,-1.25);

//Rotation
const R = new THREE.Matrix4().makeRotationAxis(new Vector3(0,0,1), -0.01);

// Translation pour replacer l'objet à sa position initiale
const T = new THREE.Matrix4().makeTranslation( 0, 1, 1.25);

const M_objet = new THREE.Matrix4().multiply(T).multiply(R).multiply(Tinv);

objet.applyMatrix(M_objet);

```
## Cas 3 : Objet attaché élément dynamique

### Parent translaté
même approche que précédemment avec la nécessité de translation au centre du parent, faire la rotation et replacer l'objet à la position Initialise
```javascript
// position objet = Vector3(0,1,1.25)
// Translation inverse
const Tinv = new THREE.Matrix4().makeTranslation(0,-1,-1.25);

//Rotation
const R = new THREE.Matrix4().makeRotationAxis(new Vector3(0,0,1), -0.01);

// Translation pour replacer l'objet à sa position initiale
const T = new THREE.Matrix4().makeTranslation( 0, 1, 1.25);

const M_objet = new THREE.Matrix4().multiply(T).multiply(R).multiply(Tinv);

objet.applyMatrix(M_objet);

```

### Parent qui fait une rotation
Choix du centre de rotation du parent à une extrémité E, translation du parent en -E, rotation du parent, et translation inverse en E

```javascript
// position extrémité qui servira de centre de rotation E = Vector3(-2,-2,-2)
// Transformation du cylindre vert
const Tinv_green = new THREE.Matrix4().makeTranslation(-2,-2,-2);
const R_green = new THREE.Matrix4().makeRotationAxis(new Vector3(1,0,0), 0.01);
const T_green = new THREE.Matrix4().makeTranslation( 2, 2, 2);

const M_green = new THREE.Matrix4().multiply(T_green).multiply(R_green).multiply(Tinv_green);

cylinder.applyMatrix(M_green);

// position cylindre rouge = Vector3(2,6,2)
// Transformation du cylindre rouge
const Tinv_red = new THREE.Matrix4().makeTranslation(-2,-6,-2);
const R_red = new THREE.Matrix4().makeRotationAxis(new Vector3(0,1,0), 0.2);
const T_red = new THREE.Matrix4().makeTranslation( 2, 6, 2);

const M_red = new THREE.Matrix4().multiply(T_red).multiply(R_red).multiply(Tinv_red);
cylinderSon.applyMatrix(M_red);
```

## Bilan
Choix du centre de rotation :
  * centre de l'objet :
      1) (parent = Scène) => translation et rotation classiques (Cas 1)
      2) (parent != Scène) => besoin de translater l'objet de -centre, rotation, translation inverse pour retour à la position initiale (Cas 2 et 3)

  * autre position P(x,y,z) :
    translation en -P, rotation puis translation en P (ex: rotation cylindre vert pour Cas 3 partie 2)
