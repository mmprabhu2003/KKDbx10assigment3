document.addEventListener('DOMContentLoaded', function() {
  const noteTypeSelector = document.getElementById('note-type');
  const inputContainer = document.getElementById('input-container');
  const todoForm = document.getElementById('todo-form');
  const todoList = document.getElementById('todo-list');
  const todoCount = document.getElementById('todo-count');

  let todos = JSON.parse(localStorage.getItem('todos')) || [];

  const typeTemplates = {
    task: `
      <div class="input-group">
        <label for="todo-input">Task Description</label>
        <input type="text" id="todo-input" name="content" placeholder="Enter task description..." required>
      </div>
      <div class="input-group">
        <label for="due-date">Due Date</label>
        <input type="date" id="due-date" name="dueDate">
      </div>
      <div class="input-group">
        <label for="reminder-date">Reminder Date</label>
        <input type="date" id="reminder-date" name="reminderDate">
      </div>
      <div class="input-group">
        <label for="repetition-type">Repetition</label>
        <select id="repetition-type" name="repetition" class="note-type-selector">
          <option value="none" selected>One-Time Task</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
          <option value="monthly">Monthly</option>
          <option value="ongoing">Ongoing</option>
        </select>
      </div>
    `,
    image: `
      <div class="input-group">
        <label for="image-title">Title</label>
        <input type="text" id="image-title" name="title" placeholder="Enter image title..." required>
      </div>
      <div class="input-group">
        <label for="image-url">Image URL</label>
        <input type="url" id="image-url" name="content" placeholder="https://example.com/image.jpg" required>
      </div>
    `,
    video: `
      <div class="input-group">
        <label for="video-title">Title</label>
        <input type="text" id="video-title" name="title" placeholder="Enter video title..." required>
      </div>
      <div class="input-group">
        <label for="video-url">Video URL</label>
        <input type="url" id="video-url" name="content" placeholder="https://www.youtube.com/watch?v=..." required>
      </div>
    `,
    audio: `
      <div class="input-group">
        <label for="audio-title">Title</label>
        <input type="text" id="audio-title" name="title" placeholder="Enter audio title..." required>
      </div>
      <div class="input-group">
        <label for="audio-url">Audio URL</label>
        <input type="url" id="audio-url" name="content" placeholder="https://example.com/audio.mp3" required>
      </div>
    `,
    attachment: `
      <div class="input-group">
        <label for="attachment-title">Title</label>
        <input type="text" id="attachment-title" name="title" placeholder="Enter file title..." required>
      </div>
      <div class="input-group">
        <label for="attachment-file">Select File</label>
        <input type="file" id="attachment-file" name="file" required>
        <p class="help-text">Note: Files should be under 5MB due to browser storage limits.</p>
      </div>
    `
  };

  function updateForm() {
    const selectedType = noteTypeSelector.value;
    inputContainer.innerHTML = typeTemplates[selectedType];
  }

  function saveTodos() {
    localStorage.setItem('todos', JSON.stringify(todos));
  }

  function updateTodoCount() {
    const oneTimeNotes = todos.filter(t => !t.repetition || t.repetition === 'none');
    todoCount.textContent = `${oneTimeNotes.length} item${oneTimeNotes.length !== 1 ? 's' : ''}`;
  }

  function renderTodos() {
    const lists = {
      none: document.getElementById('todo-list'),
      daily: document.getElementById('daily-list'),
      weekly: document.getElementById('weekly-list'),
      monthly: document.getElementById('monthly-list'),
      ongoing: document.getElementById('ongoing-list')
    };

    // Clear all lists
    for (const key in lists) {
      if(lists[key]) lists[key].innerHTML = '';
    }

    const notesByRepetition = {
      none: [], daily: [], weekly: [], monthly: [], ongoing: []
    };

    todos.forEach(todo => {
      const repetition = todo.repetition || 'none';
      if (notesByRepetition[repetition]) {
        notesByRepetition[repetition].push(todo);
      }
    });

    for (const repetition in notesByRepetition) {
      const listElement = lists[repetition];
      const notes = notesByRepetition[repetition];

      if (!listElement) continue;

      if (notes.length === 0) {
        const emptyMessage = document.createElement('li');
        emptyMessage.textContent = 'No items in this list.';
        emptyMessage.classList.add('empty-message');
        listElement.appendChild(emptyMessage);
      } else {
        notes.forEach(note => {
          const originalIndex = todos.findIndex(t => t === note);
          const li = createTodoElement(note, originalIndex);
          li.style.animationDelay = `${listElement.children.length * 0.1}s`;
          li.classList.add('item-enter');
          
          // Check for overdue and reminders
          checkTaskStatus(li, note);

          listElement.appendChild(li);
        });
      }
    }

    updateTodoCount();
  }
  
  function getYouTubeEmbedUrl(url) {
    let videoId;
    try {
      const urlObj = new URL(url);
      if (urlObj.hostname === 'youtu.be') {
        videoId = urlObj.pathname.slice(1);
      } else if (urlObj.hostname.includes('youtube.com')) {
        videoId = urlObj.searchParams.get('v');
      }
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    } catch (e) {
      return null;
    }
  }

  function createTodoElement(todo, idx) {
    const li = document.createElement('li');
    li.dataset.index = idx;
    li.className = todo.completed ? 'completed' : '';

    let contentHtml = '';
    const title = todo.title || todo.content;

    switch (todo.type) {
      case 'image':
        contentHtml = `<img src="${todo.content}" alt="${title}">`;
        break;
      case 'video':
        const embedUrl = getYouTubeEmbedUrl(todo.content);
        if (embedUrl) {
          contentHtml = `<iframe src="${embedUrl}" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
          contentHtml = `<p>Invalid video URL. Please use a YouTube link.</p>`;
        }
        break;
      case 'audio':
        contentHtml = `<audio controls src="${todo.content}">Your browser does not support the audio element.</audio>`;
        break;
      case 'attachment':
        if (todo.fileType.startsWith('image/')) {
          contentHtml = `<img src="${todo.content}" alt="${todo.title}">`;
        } else if (todo.fileType.startsWith('video/')) {
          contentHtml = `<video controls src="${todo.content}" width="100%"></video>`;
        } else if (todo.fileType.startsWith('audio/')) {
          contentHtml = `<audio controls src="${todo.content}"></audio>`;
        } else {
          contentHtml = `
            <div class="attachment-download">
              <span>📄 ${todo.fileName}</span>
              <a href="${todo.content}" download="${todo.fileName}" class="download-link">Download</a>
            </div>
          `;
        }
        break;
      case 'task':
      default:
        // Task-specific content is handled by the date display
        break;
    }

    let dateInfoHtml = '';
    if (todo.type === 'task' && (todo.dueDate || todo.reminderDate)) {
      dateInfoHtml = `<div class="note-dates">`;
      if (todo.dueDate) {
        dateInfoHtml += `<span><strong>Due:</strong> ${new Date(todo.dueDate).toLocaleDateString()}</span>`;
      }
      if (todo.reminderDate) {
        dateInfoHtml += `<span><strong>Reminder:</strong> ${new Date(todo.reminderDate).toLocaleDateString()}</span>`;
      }
      dateInfoHtml += `</div>`;
    }

    li.innerHTML = `
      <div class="note-header">
        <span class="title" onclick="toggleComplete(${idx})">${title}</span>
        <span class="type-icon">${todo.type}</span>
      </div>
      <div class="note-content">
        ${contentHtml}
      </div>
      ${dateInfoHtml}
      <button class="delete-btn">Delete</button>
    `;

    li.querySelector('.delete-btn').onclick = (e) => {
      e.stopPropagation();
      deleteTodo(idx);
    };
    
    // The main clickable area for completion is now the title
    li.querySelector('.title').onclick = (e) => {
        toggleComplete(idx, e);
    };

    return li;
  }

  function addTodo(newItem) {
    todos.push(newItem);
    saveTodos();

    if (todos.length === 1) {
      const emptyMessage = todoList.querySelector('.empty-message');
      if (emptyMessage) emptyMessage.remove();
    }
    
    const newIndex = todos.length - 1;
    const li = createTodoElement(todos[newIndex], newIndex);
    li.classList.add('item-enter');
    todoList.appendChild(li);
    updateTodoCount();
  }

  function toggleComplete(idx, event) {
    todos[idx].completed = !todos[idx].completed;
    saveTodos();
    const li = todoList.querySelector(`[data-index='${idx}']`);
    if (li) {
      li.classList.toggle('completed');
    }
  }

  function deleteTodo(idx) {
    const li = todoList.querySelector(`[data-index='${idx}']`);
    if (li) {
      li.classList.remove('item-enter');
      li.classList.add('item-exit');
      li.addEventListener('animationend', () => {
        todos.splice(idx, 1);
        saveTodos();
        renderTodos();
      });
    }
  }

  function checkTaskStatus(li, todo) {
    if (todo.type !== 'task') return;

    const now = new Date();
    now.setHours(0, 0, 0, 0); // Normalize to the start of the day

    if (todo.dueDate) {
      const dueDate = new Date(todo.dueDate);
      if (dueDate < now) {
        li.classList.add('overdue');
      }
    }
    if (todo.reminderDate) {
      const reminderDate = new Date(todo.reminderDate);
      if (reminderDate <= now) {
        li.classList.add('reminder-active');
      }
    }
  }

  todoForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const type = noteTypeSelector.value;
    const newItem = {
      type: type,
      completed: false,
    };

    if (type === 'attachment') {
      const titleInput = todoForm.querySelector('#attachment-title');
      const fileInput = todoForm.querySelector('#attachment-file');
      const file = fileInput.files[0];

      if (!file || !titleInput.value) {
        alert('Please provide a title and select a file.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('File is too large. Please select a file smaller than 5MB.');
        return;
      }

      newItem.title = titleInput.value.trim();
      newItem.fileName = file.name;
      newItem.fileType = file.type;
      
      try {
        newItem.content = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } catch (error) {
        console.error('Error reading file:', error);
        alert('Could not read the selected file.');
        return;
      }
    } else {
      const formData = new FormData(todoForm);
      for (let [key, value] of formData.entries()) {
        newItem[key] = value.trim();
      }
      if (!newItem.content) return;
    }

    addTodo(newItem);
    todoForm.reset();
    updateForm();
  });

  // Initial setup
  noteTypeSelector.addEventListener('change', updateForm);
  updateForm();
  renderTodos();
});
