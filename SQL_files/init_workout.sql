DROP TABLE IF EXISTS workout_locations;
DROP TABLE IF EXISTS workout_body_parts;
DROP TABLE IF EXISTS workout_equipment;
DROP TABLE IF EXISTS workout_template;

DROP TABLE IF EXISTS body_parts; 
DROP TABLE IF EXISTS locations ;


DROP TABLE IF EXISTS equipment;
DROP TABLE IF EXISTS template;
DROP table if exists workout cascade;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS category ;


CREATE TABLE category(
  id SERIAL PRIMARY KEY,
  category_type TEXT
);

CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  hashed_password text,
  username text,
  email text, 
  UNIQUE(email,username)
);


create table workout (
	id SERIAL PRIMARY KEY,
	workout_name TEXT,
	workout_description TEXT,
	sets INT,
	repetition INT,
	likes BOOLEAN,
	is_custom VARCHAR(50),
	category_id INT,
		CONSTRAINT fk_category
			FOREIGN KEY (category_id)
			 REFERENCES category(id),
	url_link TEXT,

	user_id INT, 
	CONSTRAINT fk_users
      FOREIGN KEY(user_id)
      REFERENCES users(id),

  UNIQUE(workout_name)
);

CREATE TABLE template (
  id SERIAL PRIMARY KEY,
  template_name text,
  user_id INT, 
    CONSTRAINT fk_users
      FOREIGN KEY(user_id)
      REFERENCES users(id),
  created_date text
);


CREATE TABLE workout_template (
	PRIMARY KEY (workout_id, template_id),
  
	workout_id INT ,
  CONSTRAINT fk_workout
    FOREIGN KEY(workout_id)
      REFERENCES workout(id)
      ON DELETE CASCADE,
  

  template_id INT, 
  CONSTRAINT fk_template
    FOREIGN KEY(template_id)
      REFERENCES template(id)
      ON DELETE CASCADE
);


CREATE TABLE body_parts(
  id SERIAL PRIMARY KEY, 
  body_parts_name text NOT NULL
);

CREATE TABLE workout_body_parts(
  PRIMARY KEY (workout_id, body_parts_id), 
  workout_id INT, 
  CONSTRAINT fk_workout
    FOREIGN KEY(workout_id)
      REFERENCES workout(id)
      ON DELETE CASCADE,
  
  body_parts_id INT, 
  CONSTRAINT fk_body_parts
    FOREIGN KEY(body_parts_id)
      REFERENCES body_parts
);

CREATE TABLE locations(
  id SERIAL PRIMARY KEY,
  location_text TEXT NOT NULL
);

CREATE TABLE workout_locations (
	PRIMARY KEY(workout_id,location_id),
	workout_id INT,
  CONSTRAINT fk_workout
    FOREIGN KEY(workout_id)
      REFERENCES workout(id)
      ON DELETE CASCADE 
   ,

	location_id INT,
  CONSTRAINT fk_locations
    FOREIGN KEY(location_id)
      REFERENCES locations(id)
 
);

create table equipment (
	id SERIAL PRIMARY KEY,
	equipment_required TEXT NOT NULL,
  gym_equipment BOOLEAN,

  UNIQUE (equipment_required)
);

create table workout_equipment(
  PRIMARY KEY(workout_id,equipment_id),
  workout_id INT, 
  CONSTRAINT fk_workout
    FOREIGN KEY(workout_id)
      REFERENCES workout(id)
      ON DELETE CASCADE 
   , 

  equipment_id INT, 
  CONSTRAINT fk_equipment
    FOREIGN KEY(equipment_id)
      REFERENCES equipment(id)
     
);


