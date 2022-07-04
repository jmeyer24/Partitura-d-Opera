# Partitura d'Opera

A visualization of the **Opera Network** dataset in the **Graph Drawing Contest** [GD2022](http://mozart.diei.unipg.it/gdcontest/contest2022/contest.html)  
This project is in association with University Tuebingen in the summer semester 2022 in the seminar **"Graphenzeichnen"**

## Table of Contents
1. [Visualization](#1)
1. [Links](#2)
1. [TODOs](#3)

<a name="1"></a>
## Visualization

Visualization via the open-source library [vexflow](https://github.com/0xfe/vexflow):
<!-- 1. find file under `bin/sheet.php` -->
1. Run a light server via command line when being in the **base directory**
	```command
	php -S 127.0.0.1:8000
	```
1. Run via the URL `localhost:8000`
<!-- 1. Run the file `sheet.php` via the URL `localhost:8000/bin/sheet.php` -->

<a name="2"></a>
## Links

Some links to relevant parts of the `vexflow` documentation
- [Tests](http://vexflow.com/tests/?StaveConnector%20module%3A%20StaveConnector%20Combined%20Draw%20Test%20(Canvas))
- [Tests Github](https://github.com/0xfe/vexflow/tree/master/tests)
- [EasyScore](https://github.com/0xfe/vexflow/wiki/Using-EasyScore)
- [Github](https://github.com/0xfe/vexflow)

Other maybe relevant documentations
- [d3.js Colors](https://d3-graph-gallery.com/graph/custom_color.html)
- [CSS opacity gradient](https://stackoverflow.com/questions/15597167/css3-opacity-gradient)
- [git branching](https://git-scm.com/book/en/v2/Git-Branching-Basic-Branching-and-Merging)

Image resources:
- [Old paper images](https://learn-photoshop.club/resources/graphics/50-high-resolution-old-paper-backgrounds-for-free/)
- [Tiling old paper image](https://lostandtaken.com/downloads/tan-seamless-paper-textures-2/)
- [Flags](https://www.countryflags.com/)

<a name="3"></a>
## TODOs

### General
---

- [x] **Notenzeile** für Komponist
	- [x] erster/letzter Takt beschriftet mit erster/letzter Jahreszahl
	- [ ] Geburts-/Sterbedatum als Symbole
- [x] **Notenhöhe/-linie** für Ort
	- [x] Grand-Staff als Option
- [x] **Notenlänge** für Librettist
	- [ ] häufigstes Vorkommen, kürzester Notenwert
	- [ ] Pro Takt:
		- längster Notenwert zuerst, dann zweitlängster, ...
		- sodass alle Notenenden auf das Taktende fallen
- [x] **Takte** für Jahr
	- [x] 1 Takt pro Jahr
	- [x] Zeitachse (aufsteigend sortiert)
- [x] **Taktart** für Opernjahr über Zeitspanne
- [ ] **Farbe** für Oper
- [ ] ~~**Triolenbalken** für ???~~

### Legend
---

- [ ] **Legende** generell
- [ ] Infos wie Geburts- und Sterbedatum
	- [ ] Komponist
	- [ ] Librettist

### Aesthetic
---

- [x] Komponisten sortieren
	- [x] erst Startjahr
	- [x] dann Zeitspanne (Endjahr - Startjahr)
- [x] Hintergrund altes Notenpapier
- [ ] Bilder der Komponisten
- [x] Flaggen
	- [x] zugeordnet zu Notenlinie/Land
	- [ ] funktioniert auch mit Option GRANDSTAFF
	- [x] neben Notenlinie
	- [x] Filter-Effekt
- [ ] Ortsnamen
- [x] Seite scrollbar machen

### Optional
---

- [x] Vexflow handgeschriebener Stil
- [ ] Komponistennamen Font handgeschriebener Stil

### Vorschläge Seminar (Antwort auf Prototyp)
---

- [x] einzelne Noten, keine Akkorde
- [ ] Haltebogen/Notenbalken um Wiederholungen zu zeigen
