DROP TABLE IF EXISTS books;

CREATE TABLE books (
    id SERIAL PRIMARY KEY,
    author VARCHAR(255),
    title VARCHAR(255),
    ISBN VARCHAR(255),
    img_url VARCHAR(255),
    description VARCHAR(225),
    bookshelf VARCHAR(255)
  );