"""
Première utilisation : indiquer l'emplacement des runes dans les variables xs et ys à l'aide par example de la commande 
```
xdotool getmouselocation --shell
```

Utilisation :
Activer le "mode avancé" dans l'atelier.
Voir le 'tableau' des runes comme une matrice. Par exemple :


EFFET                       Pa      Ra
------------------------------------
intelligence        11      12      13
force               21      22      23
sagesse             31      32      33
...             ...     ...     ...   


Pour utiliser uniquement les runes "rune ine" (11) et "rune Pa fo" (22), lancer le script avec la commande :
```
python3 click.py 11 22
```
Pour les runes "rune ine", "rune fo", "rune Pa sa", utiliser la commande :
```
python3 click.py 11 21 32
```
etc.

Si la commande 
```
python3 click.py
```
et lancée sans paramètres, toutes les runes sont disponibles.


"""


import sys
import pyautogui
import  time
import random

print("\n**DEPLACER LA SOURIS DANS UN COIN DE L'ECRAN POUR QUITER.**\n")
time.sleep(0.25)

def click(x,y) :
    p = pyautogui.position()
    pyautogui.click(x, y)
    pyautogui.moveTo(p)


extra = 0
extraS = 0
extraH = 0
twice_extra = 0

# avec une commande comme ```xdotool getmouselocation --shell``` :
# 1- entrer la position x (horizontale) des runes :
# xs = [
#     3050,
#     3095,
#     3153
#     ]
xs = [
    1130,
    1180,
    1230
    ]
# 2- entrer la position y (varticales) des runes :
ys = [
    340, 
    375, 
    425,
    470,
    510,
    548,
    588,
    631,
    672,
    714
    ]

pos = []
if len(sys.argv) == 0 :
    for i in range(len(ys)) :
        for j in range(len(xs)) :
            pos.append(j,i)
else :
    for i in sys.argv[1:]:
        pos.append((int(i[1])-1, int(i[0])-1))

print("RUNES cible :",end="\n")
for p in pos :
    print(xs[p[0]], ys[p[1]])
    pyautogui.moveTo(xs[p[0]], ys[p[1]])
    time.sleep(1)

time.sleep(0.5)
print("\n**DEPLACER LA SOURIS DANS UN COIN DE L'ECRAN POUR QUITER.**\n")
time.sleep(0.25)
print("\n\n")
for i in range(3,0,-1) :
    print(f"{i}...", end="\r")
    time.sleep(0.75)
print("\n")

for i in range(150) :

    random.shuffle(pos)
    if random.random()<0.15 + extra :
        extra_sleep = 0.1 + random.random() * 0.77
        extra = (random.random()-0.5)/5
        print(f"\textra sleep : {extra_sleep:.2f}s. Set new extra to : {extra:.2f}")
        time.sleep(extra_sleep)
    elif random.random()<0.15/8 + extraS :
        extra_sleep = 0.1*4 + random.random() * 0.77*8
        extraS = (random.random()-0.5)/(5*8)
        print(f"\tSUPER extra sleep : {extra_sleep:.2f}s. Set new extra to : {extraS:.2f}")
        time.sleep(extra_sleep)
    elif random.random()<0.15/16 + extraH :
        extra_sleep = 0.1*8 + random.random() * 0.77*32
        extraH = (random.random()-0.5)/(5*16)
        print(f"\tHYPER extra sleep : {extra_sleep:.2f}s. Set new extra to : {extraH:.2f}")
        time.sleep(extra_sleep)


    print(f"{i} - ".ljust(8), end="")
    for p in pos :
        x, y = xs[p[0]], ys[p[1]]

        sleep_time = 0.2 + random.random()/3
        twice = True if random.random()<0.3 + twice_extra else False

        print(f"{sleep_time:.2f}s ", end="")
        time.sleep(sleep_time)
        click(x, y)

        if twice == False :
            print("- ".ljust(16), " ; ", end="", sep="")
        else :
            while twice :
                sleep_time = sleep_time+(random.random()-0.5)/4

                print(f"- {sleep_time:.2f}s".ljust(10), end="")
                time.sleep(sleep_time)
                click(x, y)    

                twice = False
                twice_extra = random.random()/10
                print(f"<{twice_extra:.2f}> ;".ljust(9), end="")

    print()


import dolphin
dolphin.dolphin_chirp()