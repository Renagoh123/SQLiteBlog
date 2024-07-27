

/**
 * Function to send a DELETE request to the server for a specific article.
 * @param {number|string} articleId - The unique identifier of the article to be deleted.
 */
function deleteArticle(articleId, event) {
  // Prevent the default anchor behavior
  event.preventDefault();

  // Send a fetch request to the server to delete the specified article.
  fetch('/author/delete/' + articleId, {
    method: 'DELETE',
  })
    .then(response => {
      // Check if the server response is OK, parse the JSON body of the response.
      if (response.ok) {
        return response.json();
      }
      // Throw an error if the server response status is not OK.
      throw new Error('Request failed.');
    })
    .then(data => {
      // Log the message from the response to the console.
      console.log(data.message);
      // Reload the page to reflect the deletion.
      window.location.reload();
    })
    .catch(error => {
      // If there is an error in the fetch request, log it to the console.
      console.error(error);
    });
}

/**
 * Funtion to send a POST request to the server to like an article identified by articleId.
 * Disables the like button to prevent multiple likes before sending the request.
 * Re-enables the button if the request fails, allowing the user to try again.
 * 
 * @param {number|string} articleId - The unique identifier of the article to be liked.
 * @param {Event} event - The click event that triggered this function.
 */
function likeArticle(articleId, event) {
  // Prevent the default anchor behavior
  event.preventDefault();

  // Select the like button element by its ID
  const likeButton = document.getElementById('likeButton');
  // Disable the like button to prevent additional clicks while processing the current like.
  likeButton.disabled = true;
  // Add the 'disabled' class to visually indicate that the button is disabled.
  likeButton.classList.add('disabled');

  // Send a fetch request to the server to like the specified article.
  fetch('/reader/like/' + articleId, {
    method: 'POST',
  })
    .then(response => {
      // Check if the server response is OK, parse the JSON body of the response.
      if (response.ok) {
        return response.json();
      }
      // Throw an error if the server response status is not OK.
      throw new Error('Request failed.');
    })
    .then(data => {
      // Log the message from the response to the console.
      console.log(data.message);
    })
    .catch(error => {
      console.error(error);
      // Re-enable the like button in case of a failure so the user can attempt to like again.
      likeButton.disabled = false;
      likeButton.classList.remove('disabled');
    });
}

/**
 * Function to handle the article share action.
 * @param {number|string} articleId - The unique identifier of the article to be shared.
 * @param {Event} event - The event object from the click event.
 */
function shareArticle(articleId, event) {
  event.preventDefault();

  // Construct the URL for the article based on its ID
  const articleUrl = window.location.origin + '/reader/article/' + articleId;

  // Use the navigator.clipboard API to copy the link to the user's clipboard.
  if (navigator.clipboard) {
    navigator.clipboard.writeText(articleUrl)
      .then(() => alert('Article link copied to clipboard! You can SHARE IT NOW!'))
      .catch((error) => console.error('Copy failed', error));
  } else {
    // Fallback for browsers that do not support navigator.clipboard
    // Display the URL in a prompt for the user to manually copy
    window.prompt('Copy this link to share the article:', articleUrl);
  }
}


/**
 * Initializes CKEditor on an element with the id 'articlecontent' and a custom toolbar.
 * The toolbar includes text formatting options and list controls. Link options can be omitted.
 * Sets editor height to 500px. Logs initialization success or error to the console.
 *
 * @returns {Promise<Editor>} A promise that resolves with the CKEditor instance or rejects with an error.
 */
ClassicEditor
  .create(document.querySelector('#articlecontent'), {
    toolbar: {
      items: ['heading', '|', 'bold', 'italic', 'link', 'bulletedList', 'numberedList',
        '|', 'indent', 'outdent', '|', 'blockQuote', 'undo', 'redo']
    },
    height: 500
  })
  .then(editor => {
    console.log('CKEditor initialized:', editor);
  })
  .catch(error => {
    console.error('Error initializing CKEditor:', error);
  });

