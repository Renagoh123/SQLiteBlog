const express = require("express");
const router = express.Router();
const { formatArticleDates, formatTimestamp } = require('./author');

/**
 * @desc GET route handler for the Reader Home Page.
 * Retrieves the published articles from the database and displays them on the homepage.
 * @input None directly.
 * @output Renders the 'reader-homepage.ejs' view with published articles.
 * If there is an error during database queries or rendering the page, an error response is generated.
 */
router.get("/homepage", function (req, res, next) {

  // SQL query to get the user name and articles information 
  // and order the results by publication date in descending order
  let query = `SELECT articles.*, users.user_name
              FROM articles
              INNER JOIN users ON articles.user_id = users.user_id
              WHERE article_status = 'Published'
              ORDER BY articles.article_publication_datetime DESC
            `;

  // Run the query for published articles.
  global.db.all(query, function (err, publishedArticles) {
    if (err) return next(err); // Handle any database query errors 

    // Format the publication dates of the article.
    const formattedPublishedArticles = formatArticleDates(publishedArticles);

    // Render the reader home page with the retrieved article details
    res.render("reader-homepage.ejs", { published_articles: formattedPublishedArticles });
  });
});


/**
 * @desc GET route handler for serving individual articles.
 * Retrieves an article by ID, updates view count if the reader is the referrer, and fetches associated comments.
 * @input articleId from the URL parameter, referrer from the query string.
 * @output Renders the 'article.ejs' view with the article's details and comments.
 * If there is an error during database queries or rendering the page, an error response is generated.
 */
router.get("/article/:articleId", function (req, res, next) {

  // Extract the article ID from the request parameters
  const articleId = req.params.articleId;
  // Retrieve the referrer(author or reader) from the query parameters
  referrer = req.query.referrer;

  //console.log("Referrer: ", referrer);

  //  Function to render the article along with its comments
  const renderArticle = (article) => {
    // SQL query to get the comments for the article
    const commentsQuery = "SELECT * FROM articles_comments WHERE article_id = ?";

    // Execute SQL query
    global.db.all(commentsQuery, [articleId], (err, comments) => {
      if (err) {
        console.error('Error fetching article comments:', err);
        return next(err); // Handle any database query errors
      }

      // Render the article page with retrieved article details and comments
      res.render("article.ejs", {
        articleId: article.article_id,
        blogAuthor: article.user_name,
        articleTitle: article.article_title,
        articleContent: article.article_content,
        articlePublishDate: formatTimestamp(article.article_publication_datetime),
        articleViews: article.article_view,
        articleLikes: article.article_likes,
        article_comments: comments,
        referrer: referrer
      });
    });
  };

  // Function to update the view count of the article and then render the article
  // Function to update the article views
  const updateViews = () => {
    //console.log("Updating views for articleId:", articleId);

    // SQL query to update views for the article
    const updateViewsQuery = "UPDATE articles SET article_view = article_view + 1 WHERE article_id = ?";

    // Execute SQL query to increment the view count
    global.db.run(updateViewsQuery, [articleId], function (err) {
      if (err) {
        console.error('Error updating article views:', err);
        return next(err); // Handle any database query errors
      }
      console.log(`Views updated for articleId: ${articleId}. Rows affected:`, this.changes);

      // Fetch the updated article details after incrementing the view count
      fetchArticleDetails();
    });
  };

  // Function to fetch article details from the database
  const fetchArticleDetails = () => {
    // SQL query to retrieve details of the article including the author's name
    const articleDetailsQuery = "SELECT articles.*, users.user_name FROM articles JOIN users ON articles.user_id = users.user_id WHERE articles.article_id = ?";
    global.db.get(articleDetailsQuery, [articleId], (err, article) => {
      if (err) {
        console.error('Error fetching article:', err);
        return next(err); // Handle any database query errors
      }
      // Render the article with the details fetched
      renderArticle(article);
    });
  };

  // Check if the request came from a author (via the referrer) to decide whether to update views
  if (referrer === 'author') {
    // fetch the article details without updating views
    fetchArticleDetails();
  } else {
    // console.log("Referrer is reader (not author). Updating views.");
    updateViews();
  }
});

/**
 * @desc Route handler for article like. It checks if the provided article ID
 * and update the number of likes of the article into the database.
 * @input article_id (from URL parameter)
 * @output Returns a JSON response indicating the success or failure of the article deletion.
 */
router.post('/like/:articleId', function (req, res) {
  // Extract the article ID from the request parameters. 
  const articleId = req.params.articleId;

  //console.log(`Attempting to like article with ID: ${articleId}`);

  // SQL query to like an article
  const likesQuery = "UPDATE articles SET article_likes = article_likes + 1 WHERE article_id = ?";

  // Execute the SQL query
  db.run(likesQuery, [articleId], function (err) {
    if (err) {
      console.error(`Error when trying to like article: ${err.message}`);
      return res.status(500).json({ message: "Failed to like article.", error: err });
    } else {
      console.log("Article Like Successfully." + articleId);
      return res.json({ message: "Article Like Successfully." });
    }
  });
});


/**
 * @desc Route handler for posting comments to an article. It accepts the commenter's name, comment content, 
 * and the article ID to which the comment is being posted.
 * @input article_id (from URL parameter), commenter_name, article_comment, action (from request body)
 * @output On success, redirects to the article page with the new comment added. On failure, sends a 
 * server error response or a client error response if the article ID is missing or the action is incorrect.
 */
router.post('/send-comment/:articleId?', (req, res) => {

  // Retrieve the referrer from query parameters
  const referrer = req.query.referrer;
  console.log("Comments: ", referrer);

  // Destructure the form data from the request body.
  const { article_id, commenter_name, article_comment, action } = req.body;

  //console.log("Req.body", req.body, "Req.body" ,req.params);

  // If there's an article ID, update the existing record
  if (article_id && action === 'Send') {
    // SQL query to insert a new comment

    let insertCommentQuery = "INSERT INTO articles_comments (comment_name, comment_content, article_id) VALUES (?, ?, ?)";

    //console.log("show query params ", commenter_name, article_comment, article_id);

    // Execute SQL query
    db.run(insertCommentQuery, [commenter_name, article_comment, article_id], function (err) {
      if (err) {
        console.error("Database error: " + err.message);
        res.status(500).send("Error processing your comment.");
      } else {
        console.log('New comment created successfully with ID ' + this.lastID);
        res.redirect(`/reader/article/${article_id}?referrer=${referrer}`);
      }
    });
  } else {
    // If no article ID or action is not 'Send, send a 400 status code with an error message.
    res.status(400).send("Missing article ID or incorrect action.");
  }
});


// Export the router object so index.js can access it
module.exports = router;