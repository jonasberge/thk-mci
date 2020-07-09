### [vonas.github.io/thk-mci](https://vonas.github.io/thk-mci/)
Funktionaler Prototyp für das Praktikum in Mensch-Computer Interaktion an der TH Köln

### Lokale Datenbank zurücksetzen

Unsere Applikation verwenden [sql.js](https://github.com/sql-js/sql.js) um eine SQLite-Datenbank vollständig im Speicher des eigenen Browsers verwalten zu können. Damit schlagen wir zwei Fliegen mit einer Klappe: Es muss kein Backend gewartet werden, und dennoch können wir SQL als mächtige Abfrage-Sprache verwenden. Der Code kümmert sich dabei selbstständig um die Verwaltung des Datenbankmodells: Sollte es eine Änderung der SQL-Dateien auf dem Webserver geben, so wird das lokale Datenbankschema (und die Daten) überschrieben. Folglich ist eine immerzu aktuelle Version der Datenbank gewährleistet. Falls doch mal etwas schief gehen sollte, können Sie immer die Datenbank auf einen frischen Zustand zurücksetzen, indem Sie den entsprechenden Knopf auf der Index-Seite im Wurzel-Ordner klicken.

### Webseite lokal ausführen

Falls noch nicht geschehen, gehen Sie auf [python.org/downloads](https://www.python.org/downloads/) und laden Sie sich die neueste Python-Version herunter (`>=3.8.3`). Installieren Sie das Programm und stellen sicher, dass Python Ihrem PATH hinzugefügt wird:

![Füge Python deinem PATH hinzu](images/add-python-to-path.png)

Öffnen Sie nach der Installation eine Kommandozeile (`cmd.exe` auf Windows, Ihr Terminal-Emulator auf Linux) im Ordner `thk-mci` (der Ordner dieses Repos) und geben Sie den folgenden Befehl ein:

```
python -m http.server -d docs/ 8000
```

Damit starten Sie einen lokalen HTTP-Server, mit welchem Sie auf dieselbe Weise auf die Seite zugreifen kannst, wie über [vonas.github.io/thk-mci](https://vonas.github.io/thk-mci/). Das hat [einige Vorteile](https://developer.mozilla.org/en-US/docs/Learn/Common_questions/set_up_a_local_testing_server#The_problem_with_testing_local_files) gegenüber dem direkten Öffnen einer Datei im Browser.

Die Seite ist über [localhost:8000](http://localhost:8000/) erreichbar.
