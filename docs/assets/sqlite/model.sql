
CREATE TABLE "transponder" (
    id  INTEGER PRIMARY KEY,
    borrow_time TEXT -- NULL, falls nicht ausgeliehen
);

CREATE TABLE "professor" (
    id  INTEGER PRIMARY KEY,
    name    TEXT NOT NULL
);

CREATE TABLE "room" (
    id  INTEGER PRIMARY KEY,
    name    TEXT NOT NULL,
    responsible_professor_id    INTEGER,
    FOREIGN KEY (responsible_professor_id) REFERENCES professor(id)
);

CREATE TABLE "room_transponder" (
    room_id INTEGER,
    transponder_id  INTEGER,
    PRIMARY KEY (transponder_id, room_id),
    FOREIGN KEY (transponder_id) REFERENCES transponder(id),
    FOREIGN KEY (room_id) REFERENCES room(id)
);
