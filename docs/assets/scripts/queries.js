const query_transponders = create_callable_db_query(`

     SELECT room.name as room_name,
            professor.name as responsible_professor,
            group_concat(room_transponder.transponder_id, ', ') as transponder_list,
            strftime('%s', datetime('now', 'localtime')) - strftime('%s', MIN(transponder.borrow_time)) as diff_seconds,

            transponder.borrow_time IS NOT NULL as is_rented
       FROM room
  LEFT JOIN professor ON room.responsible_professor_id = professor.id
 INNER JOIN room_transponder ON room.id = room_transponder.room_id
 INNER JOIN transponder ON room_transponder.transponder_id = transponder.id
   GROUP BY room.id

`);
