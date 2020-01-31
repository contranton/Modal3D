# Bilan - Types de Geometry

Il existe 2 familles de géometrie : Geometry et BufferGeometry. 

## Geometry 

- Facile à manipuler

- Plus coûteux mémoire + performance (peu visible pour les petits projets)

- Données stockées comme instance de classes (Vector3, Vector2, Face3..etc)
donc possibilité d'utiliser les spécificités de ces classes

- Exemple : Stockage des vertices v0, v1, v2, v3

```javascript
verticesArray = Array[v0,v1,v2, v3]; 
console.log(verticesArray.length); //3  
```

- Conversion BufferGeometry -> Geometry 

```javascript
const geometry = new THREE.Geometry().fromBufferGeometry( bufferGeometry );
```

### Modification d'un vertex à l'indice 5

geometry.vertices[5] est un THREE.Vector3 dont on peut directement utiliser les méthodes de la classe THREE.Vector3

```javascript
geometry.vertices[5].add(new THREE.Vector3(1,2,3)); 
geometry.verticesNeedUpdate(); 
```

## Buffer Geometry

- Difficile à manipuler 

- Réduit le coût d'envoi des données 

- Données stockées comme des vecteurs de tailles définies par itemSize
(ex: itemSize = 2 pour des THREE.Vector2, itemSize = 3 pour des THREE.Vector3)

- Utiliser pour certaines transformations (spline, extrusion..) 

- Exemple : Stockage des vertices v0, v1, v2, v3

```javascript
verticesArray = Float32Array[v0.x, v0.y, v0.z, v1.x, v1.y, v1.z, v2.x, v2.y, v2.z, v3.x, v3.y, v3.z]; 
console.log(verticesArray.length); // 12 (itemSize*nbVertices = 3*4); 
``` 

- Conversion Geometry -> BufferGeometry

```javascript
const bufferGeometry = new THREE.BufferGeometry().fromGeometry( geometry );
```

### Modification d'une vertex à l'indice 5

```javascript
const offset = 5 * 3 // index * itemSize
bufferGeometry.attributes.position.array[offset] += 1; 
bufferGeometry.attributes.position.array[offset+1] += 2; 
bufferGeometry.attributes.position.array[offset+2] += 3; 
bufferGeometry.attributes.position.needsUpdate = true;
```

ou 

```javascript
const index = 5; 
const attribute = myGeometry.attributes.position
const v3add = new THREE.Vector3(1,2,3)

attribute.setXYZ( 
  index, 
  attribute.getX(index) + v3add.x,
  attribute.getY(index) + v3add.y,
  attribute.getZ(index) + v3add.z
)
bufferGeometry.attributes.position.needsUpdate = true;
```



