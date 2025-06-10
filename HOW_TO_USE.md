# Bedienungsanleitung für den UN Resolution Generator

Diese Anleitung hilft dir dabei, den UN Resolution Generator einfach zu nutzen, ohne technische Vorkenntnisse.

## 1. Was ist der UN Resolution Generator?

Der UN Resolution Generator erstellt aus einem Text eine PDF im Stil einer offiziellen UN-Resolution. Man müssen nur einen Text eingeben – alles Weitere erledigt das Programm automatisch.

## 2. Text eingeben

1. **Kopfzeilen hinzufügen:** Ganz oben im Text muss ein Abschnitt mit wichtigen Infos sein.

   - Der Abschnit beginnt und beendet mit drei Bindestrichen (---).
   - Folgene Parameter müssen eingetragen werden:
     - **title:** Titel der Resolution
     - **Datum:** Datum im Format JJJJ-MM-TT (z. B. 2024-11-20)
     - **Lander:** Liste der Länder (kommagetrennt)
     - **Ausschuss:** Abkürzung des UN-Ausschusses (z. B. WUT, SC, GA)
     - **Typ:** Art des Dokuments (z. B. Resolutionsentwurf)

   Beispiel:

   ```yaml
   ---
   title: Maßnahmen zur Friedenskonsolidierung in der Sahelzone
   Datum: 2024-11-20
   Lander: Algerien, Ecuador, Guyana
   Ausschuss: SR
   Typ: Resolutionsentwurf
   ---
   ```

2. **Haupttext schreiben:** Unter den Kopfzeilen folgt der eigentliche Text:

   - **Fett** für einleitende Sätze (Präambel), gefolgt von einem Komma.
     - Beispiel: **unter Hinweis**, dass...
   - _Kursiv_ für Hervorhebungen innerhalb von Sätzen.
   - Nummerierte Listen für operative Punkte:
     ```markdown
     1. _verurteilt_ alle terroristischen Anschläge;
     2. _fordert_ Maßnahmen zur Stärkung...
     ```
   - Aufzählungen für Details:
     ```markdown
     - Terroristische Aktivitäten
     - Armut und Arbeitslosigkeit
     ```
   - Überschriften zur Strukturierung:

     ```markdown
     # Hauptüberschrift

     ## Unterüberschrift
     ```

   - Leerzeilen für Absätze und Abstände.

## 3. Funktionen im Überblick

- **Live Vorschau:** Aktiviere/deaktiviere die Vorschau mit dem Häkchen.
- **PDF Herunterladen:** Mit einem Klick auf "PDF Herunterladen" speichert man das fertige Dokument.
- **Datei Laden:** Laden Sie Ihre eigene .md-Datei hoch, um den Text zu übernehmen.
- **Beispiel Laden:** Starten Sie mit einem Beispieltext, um die Funktionsweise kennenzulernen.

## 4. Tipps für den Erfolg

- Achten Sie auf die drei Bindestriche für die Kopfzeilen.
- Verwenden Sie das Datum im Format JJJJ-MM-TT.
- Nutzen Sie klare Überschriften und Aufzählungen.
