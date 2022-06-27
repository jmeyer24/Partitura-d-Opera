# Partitura d'Opera

A visualization of the **Opera Network** dataset in the **Graph Drawing Contest** [GD2022](http://mozart.diei.unipg.it/gdcontest/contest2022/contest.html)  

---

This project is in association with University Tuebingen in the summer semester 2022 in the seminar **"Graphenzeichnen"**

## Visualization

Visualization via the open-source library [vexflow](https://github.com/0xfe/vexflow):
1. file under `bin/sheet.html`  
1. upload `data/opera_data.csv` (shortcut `u`)
1. draw the data (shortcut `d`)

## Contribution

JS-code under `bin/sheet.js`

## TODO

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

#### Optional
- Vexflow handgeschriebener Stil

#### Vorschläge für Prototypen
- Keine Akkorde, einzelne Noten
- Kurve unter Noten (Haltebogen für ab Viertelnoten)/Notenbalken (ab Achtelnoten) um Wiederholungen hervorzuheben
