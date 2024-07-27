const express = require("express");
const router = express.Router();
const moment = require('moment');


/**
 * @desc GET route handler for the Author Home Page.
 * Retrieves the author's user details, draft articles, and published articles from the database,
 * and formats the dates for each article. It then renders the author's homepage with this data.
 * @input None directly (uses global.userID to identify the author).
 * @output Renders the 'author-homepage.ejs' view with the user's details and articles.
 * If there is an error during database queries or rendering the page, an error response is generated.
 */
router.get("/homepage", (req, res, next) => {
  // Retrieve the user ID from a global variable
  const userId = global.userID;

  // SQL query to get the user information and articles information 
  let query1 = "SELECT * FROM users WHERE user_id = ?";
  let query2 = "SELECT * FROM articles WHERE article_status = 'Draft' AND user_id = ?";
  let query3 = "SELECT * FROM articles WHERE article_status = 'Published' AND user_id = ?";

  // Execute the query to retrieve user information.
  global.db.all(query1, [userId], (err, row, next) => {
    // Handle any database query errors
    if (err) return next(err);

    // Extract user information from the result row.
    let user_name = row[0].user_name;
    let title = row[0].blog_title;
    let subtitle = row[0].blog_subtitle;

    // Execute the query to retrieve draft articles.
    global.db.all(query2, [userId], (err, draftArticles) => {

      if (err) return next(err); // Handle any database query errors

      // Format the dates for draft articles
      const formattedDraftArticles = formatArticleDates(draftArticles);

      // Execute the query to retrieve published articles.
      global.db.all(query3, [userId], (err, publishedArticles) => {

        if (err) return next(err); // Handle any database query errors

        // Format the dates for published articles
        const formattedPublishedArticles = formatArticleDates(publishedArticles);

        // Render the author homepage with the retrieved and formatted dat
        res.render("author-homepage.ejs", {
          blogAuthor: user_name,
          blogTitle: title,
          blogSubtitle: subtitle,
          draft_articles: formattedDraftArticles,
          published_articles: formattedPublishedArticles
        });
      });
    });
  });
});


/** 
* @desc GET route for author settings page
* This route retrieves the current settings for the author's blog from the database using the author's user ID.
* @input None directly (uses global.userID to identify the author)
* @output  Renders the author-settings.ejs page with the current blog settings (user name, blog title, and blog subtitle)
*/
router.get("/settings", function (req, res) {
  // Retrieve the user ID from a global variable.
  const userId = global.userID;

  // SQL query to get the user's blog settings based on the user ID
  let query = "SELECT * FROM users WHERE user_id = ?";

  // Execute the query 
  global.db.all(query, [userId], (err, row) => {
    if (err) return next(err); // Handle any database query errors

    // Extract the blog settings from the first row of the results
    let user_name = row[0].user_name;
    let title = row[0].blog_title;
    let subtitle = row[0].blog_subtitle;

    // Render the settings page with the extracted settings
    res.render("author-settings.ejs", { blogAuthor: user_name, blogTitle: title, blogSubtitle: subtitle });
  })

});


/** 
* @desc POST route to update author settings
* This route updates the author's blog settings in the database.
* @input user_name, blog_title, blog_subtitle from the request body
* @output  Confirmation message of update in the console, or error handling if update fails 
*/
router.post("/update-settings", function (req, res) {
  // Retrieve the user ID from a global variable.
  const userId = global.userID;

  // Check if the user exists in the database and update their blog settings
  global.db.all("SELECT * FROM users WHERE user_id = ?", [userId], (err, row) => {
    if (err) return next(err);  // Handle any database query errors

    // If the user exists, construct an update query with the new settings
    if (row) {
      let query = "UPDATE users SET user_name = ?, blog_title = ?, blog_subtitle = ? WHERE user_id = ?";
      // Execute the update query with parameters from the request body
      global.db.run(query, [req.body.user_name, req.body.blog_title, req.body.blog_subtitle, userId], function (err) {
        if (err) {
          return next(err);  // Handle any database update errors
        } else {
          console.log("Updated Successfully.");  // Log the success message
        }
      });
    }
  });
});


/**
 * @desc Route handler for the "Edit Article" page. It checks if an article ID is provided and fetches 
 *       the article's details from the database for editing. If no ID is provided, it initializes values 
 *       for creating a new article.
 * @input articleId (from the query string), global.userID (from global variable)
 * @output Renders the 'author-edit.ejs' template with the article's data if an ID is provided, or 
 *         with default values for creating a new article if no ID is provided.
 */
router.get('/edit/:articleId?', function (req, res) {

  // Retrieve the user ID from a global variable.
  const userId = global.userID;

  // SQL query to get an article that matches both article ID and user ID
  let query = "SELECT * FROM articles WHERE article_id = ? AND user_id = ?";

  // Extract the article ID from the request parameters. 
  const articleId = req.params.articleId;

  //console.log(`Attempting to create/edit article with ID: ${articleId}`);

  // Check if an article ID exists
  if (articleId) {
    // Execute the query
    global.db.get(query, [articleId, userId], (err, row) => {
      if (err) return next(err); // Handle any database query errors

      // Format the creation and modification dates of the article.
      const formattedCreationDate = formatTimestamp(row.article_creation_datetime);
      const formattedModificationDate = formatTimestamp(row.article_modification_datetime);

      // Render the edit page with the retrieved article details
      res.render("author-edit.ejs", {
        articleId: row.article_id, // Pass the article ID to the template to keep track of the current article.
        articleTitle: row.article_title,
        articleContent: row.article_content,
        articleCreationDate: formattedCreationDate,
        articleModificationDate: formattedModificationDate
      });
    });
  } else { // If no article ID is provided, 
    // Get the current date and time formatted as a string.
    const currentTimestamp = moment().format('YYYY-MM-DD HH:mm:ss');

    // Render the edit page with default values to create a new article.
    res.render("author-edit.ejs", {
      articleId: null,
      articleTitle: "New Article",
      articleCreationDate: currentTimestamp,
      articleModificationDate: currentTimestamp,
      articleContent: " "

    });
  }
});


/**
 * @desc Route handler for posting changes to an article. It handles saving a draft, publishing an article, 
 *       or creating a new article based on the form's action. It uses the `executeQuery` helper function 
 *       to perform the database operations.
 * @input action, article_id, article_title, article_content (from the request body), global.userID (from global variable)
 * @output Redirects to the 'author-homepage' on success, sends a 400 status code response with an 'Unknown action' 
 *         message on failure or if the action is not recognized.
 */
router.post('/edit/:articleId?', (req, res, next) => {
  // Retrieve the user ID from a global variable.
  const userId = global.userID;

  // Destructure the form data from the request body.
  const { action, article_id, article_title, article_content } = req.body;

  // Create a current date string for article timestamps.
  const currentDate = new Date().toISOString();

  // Check if an article ID exists
  if (article_id) {
    // Use a switch statement to handle different actions based on the form input.
    switch (action) {
      case 'Save Draft':
        // SQL query to update an article's details
        const updateDraftQuery = `UPDATE articles SET article_title = ?, article_content = ?, article_modification_datetime = ? WHERE article_id = ? AND user_id = ?`;
        // Execute the query to update the draft article
        executeQuery(updateDraftQuery, [article_title, article_content, currentDate, article_id, userId], 'Draft Updated Successfully.', res, next);
        break;

      case 'Post':
        // SQL query to update an article's details, set it as published, and update publication datetime.
        const publishArticleQuery = `UPDATE articles SET article_title = ?, article_content = ?, article_modification_datetime = ?, article_publication_datetime = ?, article_status = 'Published' WHERE article_id = ?`;
        // Execute the query to publish the draft article
        executeQuery(publishArticleQuery, [article_title, article_content, currentDate, currentDate, article_id], 'Article Posted Successfully.', res, next);
        break;

      default:
        // If the action is not recognized, send a 400 status code with an error message.
        res.status(400).send('Unknown action');
    }
  } else if (action === 'Save Draft' || action === 'Post') {
    // If no article ID is provided, the request is for creating a new article.
    // Determine the article status based on the action.
    const articleStatus = action === 'Post' ? 'Published' : 'Draft';
    // SQL query to add a new article 
    const insertArticleQuery = `INSERT INTO articles (article_title, article_content, article_creation_datetime, article_modification_datetime, article_publication_datetime, article_status, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    executeQuery(insertArticleQuery, [article_title, article_content, currentDate, currentDate, currentDate, articleStatus, userId], 'New article created successfully.', res, next);
  } else {
    // If the action is not recognized, send a 400 status code with an error message.
    res.status(400).send('Unknown action');
  }
});


/**
 * @desc Route handler for deleting an article. It checks if the provided article ID
 * belongs to the logged-in user and deletes the article from the database.
 * @input article_id (from URL parameter), global.userID (from a global variable)
 * @output Returns a JSON response indicating the success or failure of the article deletion.
 */
router.delete('/delete/:articleId', function (req, res) {

  // Retrieve the user ID from a global variable.
  const userId = global.userID;
  // Extract the article ID from the request parameters.
  const article_id = req.params.articleId;

  //console.log(`Attempting to delete article with ID: ${article_id}`);

  // SQL query to delete an article
  let delQuery = "DELETE FROM articles WHERE article_id = ? AND user_id = ? "; // Assuming each article has a user_id field

  // Execute the SQL query
  db.run(delQuery, [article_id, userId], function (err) {
    if (err) {
      //console.error(`Error when trying to delete article: ${err.message}`);
      return res.status(500).json({ message: "Failed to delete article.", error: err });
    } else {
      //console.log("Article Deleted Successfully." + article_id);
      return res.json({ message: "Article Deleted Successfully." });
    }
  });
});


/**
 * @desc Formats the dates for each article in a list of articles.
 * @input {Array} articles - An array of article objects with date properties that need formatting.
 * @output {Array} The input array with each article's dates formatted as 'YYYY-MM-DD HH:mm:ss'.
 */
function formatArticleDates(articles) {
  return articles.map(article => ({
    ...article,
    // Format the creation datetime
    article_creation_datetime: formatTimestamp(article.article_creation_datetime),
    // Format the modification datetime
    article_modification_datetime: formatTimestamp(article.article_modification_datetime),
    // Format the publication date if the article is published.
    article_publication_datetime: article.article_status === 'Published'
      ? formatTimestamp(article.article_publication_datetime)
      : null,
  }));
}


/**
 * @desc Helper function to format date strings.
 * @input {string|null} date - The date string to format, or null if no date is provided.
 * @output {string|null} The formatted date string in 'YYYY-MM-DD HH:mm:ss' format, or null if input is null.
 */
function formatTimestamp(date) {
  return date ? moment(date).format('YYYY-MM-DD HH:mm:ss') : null;
}


/**
 * @desc Executes a given SQL query using the provided parameters. On success, logs a success message 
 *       and redirects to the author's homepage. On error, passes the error to the next middleware.
 * @input query (SQL query string), params (array of parameters for the query), successMessage (message to log on success)
 * @output On success, logs the success message and redirects to 'author/homepage'. On error, calls next with the error object.
 */
function executeQuery(query, params, successMessage, res, next) {
  db.run(query, params, function (err) {
    if (err) {
      next(new Error(err.message)); // Handle any database query errors
    } else {
      //console.log(successMessage);
      res.redirect('/author/homepage');
    }
  });
}

// Export the router object so index.js can access it
module.exports = {
  router,
  formatArticleDates,
  formatTimestamp
};
