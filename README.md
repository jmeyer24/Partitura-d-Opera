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
1. Run a light server via command line when being in the base directory
	```command
	php -S 127.0.0.1:8000
	```
1. Run the file `sheet.php` via the URL `localhost:8000/bin/sheet.php`

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
- [Flags](https://www.countryflags.com/)

<a name="3"></a>
## TODOs

### General

**Legende**, um den Graphen richtig zu lesen  
Mit allen folgenden Infos:
- Infos über Librettist wie Tod des Librettisten? In Legende!  
- **Notenhöhe/-linien** für Orte (braucht es Bass-Linie?)
- **Notenlänge** als Librettist (Farbe, wenn Notenlänge nicht hinhaut)  
	Librettist mit meisten Noten hat kürzeste Notenwert  
	In einem Takt: Librettist mit längestem Notenwert zuerst, dann zweitlängster usw, sodass alle Notenenden auf das Taktende fallen
- **x-Achse/Takte**  
	-> Noten sortiert nach Jahreszahlen  
	-> Notenzeile als Zeitachse (1 Takt für 1 Jahr)
	-> links/rechts unten erste/letzte Jahreszahl eines Komponisten
- (**Farbe** für Oper)
- Falls vorhanden: wenn Komponist gestorben, bevor letzte Oper aufgeführt, dann ein Symbol
- **Triolenbalken** für ???

### Ästhetik

- verschieden lange Notenzeilen sortieren nach Startjahr des Komponisten (bei zwei gleichen dann Endjahr/Zeilenlänge)
- Hintergrund als altes Notenpapier
- Bilder von den Komponisten (Geburts-/Sterbedatum)
- rechts der Notenlinie welches Land/Ort als Flagge (+ Ortsname) und die Flaggen reinverwischen (Filter-Effekt)
- Seite scrollbar machen

### Optional
- Vexflow handgeschriebener Stil

### Vorschläge Seminar (Antwort auf Prototyp)
- Keine Akkorde, einzelne Noten
- Kurve unter Noten (Haltebogen für ab Viertelnoten)/Notenbalken (ab Achtelnoten) um Wiederholungen hervorzuheben
