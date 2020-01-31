# Introduction - Git

## Motivations

Problèmes basiques :
* fichiers importants supprimés par maladresse
* besoin de récupérer du code d'une ancienne version
* crash du disque dur
* vol d'ordinateur
* ...etc

Solutions naïve :
* copie dans un autre dossier mais besoin de mettre à jour l'ancien dossier ou d'en recréer un à chaque modification
* envoi de versions par mail ou clé usb

=> perte de la chronologie, fichiers/dossiers avec le même noms...etc 

## Git : concepts de base

Chaque projet git contient :
* les dossiers/fichiers de travail
* un dossier .git (contenant l'historique ou le dépôt)

### Les opérations basiques

Initialisation du projet :
* git clone ssh:// ou https:// : permet de cloner un dépôt en local
* git pull : récupère les dernières révisions

Projet en cours :
* git status : permet de connaître l'état du dépôt par rapport à la version locale
* git commit : crée une nouvelle révision dans le dépôt
* git pull : récupère les révisions du dépôt
* git push : envoie des révisions dans le dépôt
* git add, git rm, git mv : permet d'ajouter des nouveaux fichiers, d'en supprimer ou d'en déplacer dans le dépôt

Voir l'historique :
* gitk : aperçu visuel de toutes les actions effectuées sur le dépôt

Gestion d'un projet à plusieurs :
Un dépôt global est créé puis chaque sous-parties peuvent être réparties en branches


## Quelques indications

* ne pas modifier le même bout de code en même temps
* essayer de travailler si possible sur des fichiers séparés
* éviter d'utiliser d'autres moyens d'envoi en complément de Git

## Conseils pour une utilisation idéale de git

* git commit -a -m "message pour spécifier ce qui a été modifié"
* git pull après le git commit pour avoir une fusion automatique et non manuelle
* git push pour envoyer ses changements 

(Attention à ce que le code s'exécute correctement avant de push son travail)


## Installation de git

git --version pour vérifier si une version est déjà installée

### Linux
sudo apt-get update sudo apt-get install git

sudo dnf install git Sudo yum install git

### Windows

https://gitforwindows.org/

### Mac

https://sourceforge.net/projects/git-osx-installer/files/


### Sites/Logiciels utilisant git
* GitLab : permet de créer des projets privés
* GitHub : projets privés sont payants
* GitKraken : logiciel de gestion de projet utilisant git
