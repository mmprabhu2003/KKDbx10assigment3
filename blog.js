document.addEventListener('DOMContentLoaded', function() {
  const blogForm = document.getElementById('blog-form');
  const blogTitle = document.getElementById('blog-title');
  const blogContent = document.getElementById('blog-content');
  const blogList = document.getElementById('blog-list');
  const blogView = document.getElementById('blog-view');
  const blogCount = document.getElementById('blog-count');
  const livePreview = document.getElementById('live-preview');
  const charCount = document.getElementById('char-count');
  const wordCount = document.getElementById('word-count');
  const clearFormBtn = document.getElementById('clear-form-btn');
  const featuredImageInput = document.getElementById('featured-image');
  
  // Rich text editor elements
  const fontSizeSelect = document.getElementById('font-size');
  const fontFamilySelect = document.getElementById('font-family');
  const boldBtn = document.getElementById('bold-btn');
  const italicBtn = document.getElementById('italic-btn');
  const underlineBtn = document.getElementById('underline-btn');
  const clearFormatBtn = document.getElementById('clear-format-btn');

  let posts = JSON.parse(localStorage.getItem('blogPosts')) || [];
  let editingIndex = null;
  let autoSaveInterval;

  const DRAFT_KEY = 'blogDraft';

  function savePosts() {
    localStorage.setItem('blogPosts', JSON.stringify(posts));
  }

  function updateBlogCount() {
    blogCount.textContent = `${posts.length} post${posts.length !== 1 ? 's' : ''}`;
  }

  function updateLivePreview() {
    const title = blogTitle.value.trim();
    const content = blogContent.innerHTML;
    const imageUrl = featuredImageInput.value.trim();

    let imageHtml = '';
    if (imageUrl) {
      imageHtml = `<img src="${imageUrl}" alt="Featured Image Preview" class="featured-image">`;
    }

    livePreview.innerHTML = `
      ${imageHtml}
      <h2>${title || 'Your Title Here'}</h2>
      <div>${content || '<p>Your content will appear here...</p>'}</div>
    `;
    
    // Update character and word count (strip HTML tags for counting)
    const textContent = blogContent.textContent || blogContent.innerText || '';
    charCount.textContent = `${textContent.length} characters`;
    wordCount.textContent = `${textContent.split(/\s+/).filter(Boolean).length} words`;
  }

  function saveDraft() {
    const draft = {
      title: blogTitle.value,
      content: blogContent.innerHTML,
      featuredImage: featuredImageInput.value
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
  }

  function loadDraft() {
    const draft = JSON.parse(localStorage.getItem(DRAFT_KEY));
    if (draft) {
      blogTitle.value = draft.title;
      blogContent.innerHTML = draft.content;
      featuredImageInput.value = draft.featuredImage || '';
      updateLivePreview();
    }
  }

  function clearDraft() {
    localStorage.removeItem(DRAFT_KEY);
  }

  function renderPosts() {
    blogList.innerHTML = '';
    if (posts.length === 0) {
      const emptyMessage = document.createElement('div');
      emptyMessage.textContent = 'No blog posts yet. Create one!';
      emptyMessage.className = 'blog-post empty-message';
      blogList.appendChild(emptyMessage);
    } else {
      posts.slice().reverse().forEach((post, idx) => {
        const realIdx = posts.length - 1 - idx;
        const div = document.createElement('div');
        div.className = 'blog-post';
        div.dataset.index = realIdx;
        div.style.animationDelay = `${idx * 0.1}s`;
        div.classList.add('item-enter');
        div.onclick = () => viewPost(realIdx);
        
        div.innerHTML = `
          <span class="post-list-title">${post.title}</span>
          <span class="post-list-date">${new Date(post.updatedAt).toLocaleDateString()}</span>
        `;

        blogList.appendChild(div);
      });
    }
    hideBlogView();
    updateBlogCount();
  }

  function hideBlogView() {
    blogView.classList.add('hidden');
    setTimeout(() => {
        if (blogView.classList.contains('hidden')) {
            blogView.style.display = 'none';
        }
    }, 300);
  }
  
  function showBlogView() {
    blogView.style.display = 'flex';
    setTimeout(() => {
        blogView.classList.remove('hidden');
    }, 10);
  }

  function viewPost(idx) {
    const post = posts[idx];

    let imageHtml = '';
    if (post.featuredImage) {
      imageHtml = `<img src="${post.featuredImage}" alt="${post.title}" class="featured-image">`;
    }

    blogView.innerHTML = `
      ${imageHtml}
      <h2>${post.title}</h2>
      <p class="post-meta">
        Created: ${new Date(post.createdAt).toLocaleString()} | 
        Last Updated: ${new Date(post.updatedAt).toLocaleString()}
      </p>
      <div class="post-content">${post.content}</div>
      <div class="button-group">
        <button id="edit-post">Edit</button>
        <button id="delete-post">Delete</button>
        <button id="close-view">Close</button>
      </div>
    `;
    showBlogView();
    document.getElementById('edit-post').onclick = () => editPost(idx);
    document.getElementById('delete-post').onclick = () => deletePostWithAnimation(idx);
    document.getElementById('close-view').onclick = hideBlogView;
  }

  function addPost(title, content) {
    const now = new Date().toISOString();
    const newPost = {
      title,
      content,
      featuredImage: featuredImageInput.value.trim(),
      createdAt: now,
      updatedAt: now
    };
    posts.push(newPost);
    savePosts();

    const wasEmpty = posts.length === 1;
    if (wasEmpty) {
      blogList.innerHTML = ''; // Clear "empty" message
    }
    
    // Create new post element and add it to the top of the list
    const newIndex = posts.length - 1;
    const div = document.createElement('div');
    div.className = 'blog-post item-enter';
    div.textContent = title;
    div.dataset.index = newIndex;
    div.onclick = () => viewPost(newIndex);
    blogList.insertBefore(div, blogList.firstChild);

    updateBlogCount();
  }

  function editPost(idx) {
    editingIndex = idx;
    blogTitle.value = posts[idx].title;
    blogContent.innerHTML = posts[idx].content;
    featuredImageInput.value = posts[idx].featuredImage || '';
    hideBlogView();
    blogTitle.focus();
  }

  function deletePostWithAnimation(idx) {
    if (!window.confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return;
    }
    const postElement = blogList.querySelector(`[data-index='${idx}']`);
    if (postElement) {
        postElement.classList.remove('item-enter');
        postElement.classList.add('item-exit');
        postElement.addEventListener('animationend', () => {
            deletePost(idx);
        });
    } else {
        deletePost(idx);
    }
  }

  function deletePost(idx) {
    posts.splice(idx, 1);
    savePosts();
    renderPosts(); // Re-render to fix indices and show empty message if needed
    hideBlogView();
  }

  blogForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const title = blogTitle.value.trim();
    const content = blogContent.innerHTML;
    if (!title || !content || content === '<br>') return;
    if (editingIndex !== null) {
      posts[editingIndex].title = title;
      posts[editingIndex].content = content;
      posts[editingIndex].featuredImage = featuredImageInput.value.trim();
      posts[editingIndex].updatedAt = new Date().toISOString();
      savePosts();
      renderPosts(); // Re-render to show update
      editingIndex = null;
    } else {
      addPost(title, content);
    }
    blogForm.reset();
    blogContent.innerHTML = '';
    clearDraft();
    updateLivePreview();
  });

  // Rich text editor functions
  function formatText(command, value = null) {
    document.execCommand(command, false, value);
    blogContent.focus();
    updateLivePreview();
  }

  function updateFontSize() {
    formatText('fontSize', fontSizeSelect.value);
  }

  function updateFontFamily() {
    formatText('fontName', fontFamilySelect.value);
  }

  // Event Listeners
  blogTitle.addEventListener('input', updateLivePreview);
  blogContent.addEventListener('input', updateLivePreview);
  featuredImageInput.addEventListener('input', updateLivePreview);

  // Rich text editor event listeners
  fontSizeSelect.addEventListener('change', updateFontSize);
  fontFamilySelect.addEventListener('change', updateFontFamily);
  boldBtn.addEventListener('click', () => formatText('bold'));
  italicBtn.addEventListener('click', () => formatText('italic'));
  underlineBtn.addEventListener('click', () => formatText('underline'));
  clearFormatBtn.addEventListener('click', () => formatText('removeFormat'));

  clearFormBtn.addEventListener('click', () => {
    if (confirm("Are you sure you want to clear the form? Any unsaved changes will be lost.")) {
      blogForm.reset();
      blogContent.innerHTML = '';
      clearDraft();
      updateLivePreview();
    }
  });

  // Auto-save logic
  if (autoSaveInterval) clearInterval(autoSaveInterval);
  autoSaveInterval = setInterval(saveDraft, 5000); // Save every 5 seconds

  // Initial setup
  loadDraft();
  renderPosts();
}); 