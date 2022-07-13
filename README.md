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
- [x] **Notenhöhe/-linie** für Ort
  - [x] Grand-Staff als Option
- [x] **Notenlänge** für Librettist
  - [x] häufigstes Vorkommen, kürzester Notenwert
  - [ ] Pro Takt:
    - längster Notenwert zuerst, dann zweitlängster, ...
    - zeitlich verschoben
    - sodass alle Notenenden auf das Taktende fallen
- [x] **Takte** für Jahr
  - [x] 1 Takt pro Jahr
  - [x] Zeitachse (aufsteigend sortiert)
- [x] **Taktart** für Opernjahr über Zeitspanne
- [ ] **Farbe** für Oper
- [x] **Taktangabe** für Anzahl von Opern über Librettisten und Jahre über Zeitperiode
- [x] **Taktzahlen** für die Jahreszahlen (z.B. 1775)
- [ ] **Notenreihenfolge** für Librettisten???
- [ ] **Triolenbalken** für ???

### Legend

---

- [ ] **Legende** generell
- [ ] Infos wie Geburts- und Sterbedatum
  - [ ] Komponist
  - [ ] Librettist
- [ ] Zeitstrahl der Länderentwicklung mit Flaggen (mit Anzahl shows)

### Aesthetic

---

- [x] Komponisten sortieren
  - [x] erst Startjahr
  - [x] dann Zeitspanne (Endjahr - Startjahr)
- [x] Hintergrund altes Notenpapier
- [x] Komponisten
  - [x] Bilder zuschneiden
  - [x] besser positionieren
  - [x] Geburts-/Sterbedatum
    - [ ] in Takten als Symbole
- [x] Flaggen
  - [x] zugeordnet zu Notenlinie/Land
  - [x] als Taktart im ersten Takt
  - [x] ~~funktioniert auch mit Option GRANDSTAFF~~
  - [x] funktioniert nur mit Option GRANDSTAFF
  - [x] ~~neben Notenlinie~~
  - [x] ~~über Taktlinie~~
  - [x] ~~Filter-Effekt~~
  - [x] ~~alle 5 jahre~~
  - [ ] ~~zusätzlich pro Jahr als vertikaler Hintergrund~~
- [ ] Ortsnamen
- [x] Seite scrollbar machen
- [x] Sonderzeichen wie ì oder í richtig darstellen ("i mit Akut")
- [ ] Balance zwischen Ästhetik der Notenwerte (Übersichtlichkeit - Unterscheidbarkeit) und musikalischer Realität finden
- [x] Grandstaff mit Flaggen, sodass jeder Linie eine Flagge zugeordnet wird
  - [x] Länder nach Anzahl der Opern sortiert
- [x] Pausenzeichen für Takte ohne Noten
- [ ] Tooltips schöner machen

### Optional

---

- [x] Vexflow handgeschriebener Stil
- [ ] Komponistennamen Font handgeschriebener Stil
- [ ] ~~zwei Komponisten, die nebeneinander passen (z.B. Anfossi/Mayr) in eine Zeile packen~~
- [ ] einzelne Takte so mit Pausen auffüllen, dass ein musikalisch korrekter Takt entsteht
- [ ] ~~Konnektoren über alle Notenzeilen hinweg~~
- [ ] Option für A4 Format
- [ ] Anzahl der verschiedenen(!) Orte in einem Land:  
 Zahl hinter Flagge &harr; irgendwie farblich

### Vorschläge Seminar (Antwort auf Prototyp)

---

- [x] einzelne Noten, keine Akkorde
- [ ] Haltebogen/Notenbalken um Wiederholungen zu zeigen
- [x] Noten im Takt nach Notenwerten sortiert
- [x] alle 8 Librettisten per Notenwerte, entscheiden:
  - [x] punktierte Noten
  - [x] sortiert nach Häufigkeit
  - [ ] ~~Notenhals nach oben oder unten~~
- [x] alle Flaggen/Länder in eine Notenzeile, über Vorzeichen z.B.
  - [x] Tonart in erstem Takt
  - [ ] dafür dann Basslinie für Informationen über einzelne Opern
  - [x] Notenzwischenräume nutzen
  - [ ] Ideen:  
 eine Oktave hat 8 Noten oder  
 mit Vorzeichen eine Klaviertastatur hinmalen (weiße und schwarze Tasten)
- [ ] Artikulationen über Noten für:
  - [ ] ~~ersten Opernauftritt~~
  - [ ] alle außer ersten Opernauftritt mit Zahl über Notenkopf
- [ ] Neues Thema (Boromir's Theme) für verschiedene Epochen
- [x] Entscheiden, ob Flaggen 1 mal oder öfters  
	1 mal im ersten Takt
- [ ] Vielleicht: Flaggen sortieren nach Höhen-/Breitengrad

### Bugfixing

---

- [x] ~~Die Tooltips zeigen nicht die richtigen Librettisten an, zumindest unterscheiden die sich für gleiche Notenwerte -> Fehler in Tooltips oder Notengenerierung?~~
