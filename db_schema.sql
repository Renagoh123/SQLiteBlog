
-- This makes sure that foreign_key constraints are observed and that errors will be thrown for violations
PRAGMA foreign_keys=ON;

BEGIN TRANSACTION;

-- Create your tables with SQL commands here (watch out for slight syntactical differences with SQLite vs MySQL)
CREATE TABLE IF NOT EXISTS users (
    user_id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_name TEXT NOT NULL,
    blog_title TEXT DEFAULT "My Awesome Blog",
    blog_subtitle TEXT DEFAULT "Welcome to my blog!"
);

CREATE TABLE IF NOT EXISTS articles (
    article_id INTEGER PRIMARY KEY AUTOINCREMENT,
    article_title TEXT NOT NULL,
    article_content TEXT DEFAULT "", 
    article_creation_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    article_modification_datetime TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    article_publication_datetime TIMESTAMP DEFAULT NULL,
    article_view INTEGER NOT NULL DEFAULT 0,
    article_likes INTEGER NOT NULL DEFAULT 0,
    article_status TEXT NOT NULL DEFAULT 'Draft',
    user_id INT, --the user that the email account belongs to
    FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS articles_comments (
    comment_id INTEGER PRIMARY KEY AUTOINCREMENT,
    comment_name TEXT NOT NULL,
    comment_content TEXT NOT NULL,
    comment_creation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    article_id INT NOT NULL,
    FOREIGN KEY (article_id) REFERENCES articles(article_id) ON DELETE CASCADE
);

COMMIT;

