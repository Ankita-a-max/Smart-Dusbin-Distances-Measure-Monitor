document.addEventListener('DOMContentLoaded', function() {
  // Elements
  const statusText = document.getElementById('status-text');
  const statusIndicator = document.getElementById('status-indicator');
  const distanceValue = document.getElementById('distance-value');
  const timestamp = document.getElementById('timestamp');
  const historyList = document.getElementById('history-list');
  
  // Function to format timestamps
  function formatTimestamp(dateString) {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  }
  
  // Update the status display
  function updateStatusDisplay(data) {
    // Update status indicator
    statusText.textContent = data.status.charAt(0).toUpperCase() + data.status.slice(1);
    statusIndicator.className = data.status;
    
    // Update distance
    distanceValue.innerHTML = `<span>${data.distance} cm</span>`;
    
    // Update timestamp
    timestamp.textContent = formatTimestamp(data.timestamp);
  }
  
  // Create a history item element
  function createHistoryItem(data) {
    const item = document.createElement('div');
    item.className = 'history-item';
    
    const statusEl = document.createElement('div');
    statusEl.className = `history-status ${data.status}`;
    statusEl.innerHTML = `
      <i class="fas fa-trash-alt"></i>
      <span>${data.status.charAt(0).toUpperCase() + data.status.slice(1)} (${data.distance}cm)</span>
    `;
    
    const timeEl = document.createElement('div');
    timeEl.className = 'history-time';
    timeEl.textContent = formatTimestamp(data.timestamp);
    
    item.appendChild(statusEl);
    item.appendChild(timeEl);
    
    return item;
  }
  
  // Load history data
  async function loadHistory() {
    try {
      const response = await fetch('/api/history');
      const data = await response.json();
      
      // Clear current history
      historyList.innerHTML = '';
      
      // Add history items
      data.forEach(item => {
        historyList.appendChild(createHistoryItem(item));
      });
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  }
  
  // Function to fetch current status
  async function fetchStatus() {
    try {
      const response = await fetch('/api/status');
      const data = await response.json();
      
      updateStatusDisplay(data);
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  }
  
  // Initial load
  fetchStatus();
  loadHistory();
  
  // Set up polling for updates
  setInterval(() => {
    fetchStatus();
  }, 1000);
  
  // Refresh history less frequently
  setInterval(() => {
    loadHistory();
  }, 5000);
});