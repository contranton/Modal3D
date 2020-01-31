# Partie dessin

* le dossier Exemple vous permet un aperçu du mode dessin
* les fichiers utilsDrawing.js et mouseEvents.js vous permettent de récupérer la fonctionnalité dessin

Dessiner sur des surfaces ou volumes peut être utile afin de créer une forme unique.
Dans cette partie, la librairie ___OrbitControls.js___ a été modifié afin de destiner le clic gauche de la souris au dessin et le clic droit au déplacement de la caméra.

## Principe

### Rappel séance 2 partie - Lancer de rayons
Une approche de lancer de rayons permet de déterminer l’intersection d’un objet avec un rayon. A chaque coordonnée (x,y) sélectionnée sur l’écran, le lanceur de rayons crée un rayon qui a pour origine la position de la caméra et pour direction le rayon qui passe par la caméra et qui se projette en (x,y) sur le plan image de l’écran. Ainsi, l’utilisateur a l’impression de dessiner directement sur le premier objet sur lequel se projette le rayon.

### Algorithme

On appelle polyligne, une ligne continue composée d’un ou plusieurs segments.

Initialisation : polyLigne = null;

Du début à la fin du geste de tracé de l’utilisateur,

   * (xSouris, ySouris) = coordonnées de la souris sur l'écran
   
   * Création d'un rayon qui passe par la caméra et se projette en (xSouris, ySouris) sur le plan image de l'écran 
   
   * Utilisation de ce rayon pour déterminer le point Pi (x,y,z), intersection du rayon et du premier objet intersecté 
   
   * Ajout de Pi dans la polyligne + affichage mise à jour de la polyligne


De fait, le tracé de l’utilisateur n’est pas modifié par le système.


### Informations complémentaires

* Modifier l'épaisseur de la ligne
Ajout de l'attribut "linewidth:valeur" à l'apparence de la polyligne

### Explications des différents éléments de l'ensemble drawingData
* drawingObjects : liste contenant tous les éléments servant de support au dessin 
* selectedObject : support sélectionné pour le dessin 
* line : ligne créée par le dessin 
* drawing3DPoints : liste contenant les coordonnées des points 3D récupérés lors du lancer de rayon
