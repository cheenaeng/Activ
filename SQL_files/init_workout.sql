DROP TABLE IF EXISTS workout_locations;
DROP TABLE IF EXISTS workout_body_parts;
DROP TABLE IF EXISTS workout_equipment;
DROP TABLE IF EXISTS users_template ;
DROP TABLE IF EXISTS workout_template;

DROP TABLE IF EXISTS body_parts; 
DROP TABLE IF EXISTS custom_workout ;
DROP TABLE IF EXISTS locations ;

DROP TABLE IF EXISTS equipment;
DROP table if exists workout ;
DROP TABLE IF EXISTS category ;



CREATE TABLE category(
  id SERIAL PRIMARY KEY,
  category_type TEXT
);

create table workout (
	id SERIAL PRIMARY KEY,
	workout_name TEXT,
	workout_description TEXT,
	sets INT,
	repetition INT,
	likes INT,
	is_custom VARCHAR(50),
	category_id INT,
		CONSTRAINT fk_category
			FOREIGN KEY (category_id)
			 REFERENCES category(id),
	url_link TEXT
);

CREATE TABLE workout_template (
	id SERIAL PRIMARY KEY,
  template_name text, 
	workout_id INT,
  CONSTRAINT fk_workout
    FOREIGN KEY(workout_id)
      REFERENCES workout(id),
  

  date_created date
);

CREATE TABLE custom_workout(
  id SERIAL PRIMARY KEY, 
  user_id INT, 
    CONSTRAINT fk_users
      FOREIGN KEY(user_id)
      REFERENCES users(id),
     
  
	workout_id INT,
  CONSTRAINT fk_workout
    FOREIGN KEY(workout_id)
      REFERENCES workout(id)

);


CREATE TABLE users_template(
  id SERIAL PRIMARY KEY, 
  user_id INT, 
    CONSTRAINT fk_users
      FOREIGN KEY(user_id)
      REFERENCES users(id),
  
  template_id INT, 
    CONSTRAINT fk_workout_template
      FOREIGN KEY(template_id)
        REFERENCES workout_template(id)
      
);


CREATE TABLE body_parts(
  id SERIAL PRIMARY KEY, 
  body_parts_name text
);

CREATE TABLE workout_body_parts(
  id SERIAL PRIMARY KEY, 
  workout_id INT, 
  CONSTRAINT fk_workout
    FOREIGN KEY(workout_id)
      REFERENCES workout(id),
  
  body_parts_id INT, 
  CONSTRAINT fk_body_parts
    FOREIGN KEY(body_parts_id)
      REFERENCES body_parts
);

CREATE TABLE locations(
  id SERIAL PRIMARY KEY,
  location_text TEXT
);

CREATE TABLE workout_locations (
	id SERIAL PRIMARY KEY,
	workout_id INT,
  CONSTRAINT fk_workout
    FOREIGN KEY(workout_id)
      REFERENCES workout(id)
   ,

	location_id INT,
  CONSTRAINT fk_locations
    FOREIGN KEY(location_id)
      REFERENCES locations(id)
 
);

create table equipment (
	id SERIAL PRIMARY KEY,
	equipment_required TEXT,
  gym_equipment BOOLEAN
);

create table workout_equipment(
  id serial PRIMARY KEY,
  workout_id INT, 
  CONSTRAINT fk_workout
    FOREIGN KEY(workout_id)
      REFERENCES workout(id)
   , 

  equipment_id INT, 
  CONSTRAINT fk_equipment
    FOREIGN KEY(equipment_id)
      REFERENCES equipment(id)
     
);


