
INSERT INTO category (category_type) VALUES ('strength'), ('cardio'), ('core');
INSERT INTO body_parts(body_parts_name) VALUES ('arms'), ('legs'), ('chest'), ('core'), ('back'), ('shoulder');
INSERT INTO locations(location_text) VALUES ('home'), ('gym'), ('outdoor');

COPY workout(workout_name, workout_description, sets, repetition, likes, is_custom, url_link, category_id)
FROM '/Users/cheenaeng/Desktop/project2_rawdata/workout.csv'
DELIMITER ','
CSV HEADER;

COPY workout_body_parts(workout_id, body_parts_id)
FROM '/Users/cheenaeng/Desktop/project2_rawdata/workout_body_parts.csv'
DELIMITER ','
CSV HEADER;

COPY equipment(equipment_required, gym_equipment)
FROM '/Users/cheenaeng/Desktop/project2_rawdata/equipment.csv'
DELIMITER ','
CSV HEADER;

COPY workout_equipment(workout_id, equipment_id)
FROM '/Users/cheenaeng/Desktop/project2_rawdata/workout_equipment.csv'
DELIMITER ','
CSV HEADER;

COPY workout_locations(workout_id, location_id)
FROM '/Users/cheenaeng/Desktop/project2_rawdata/workout_locations.csv'
DELIMITER ','
CSV HEADER;

