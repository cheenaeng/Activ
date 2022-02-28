DROP TABLE IF EXISTS users;


CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  first_name text, 
  last_name text, 
  hashed_password text, 
  username text, 
  email_verified boolean
);




