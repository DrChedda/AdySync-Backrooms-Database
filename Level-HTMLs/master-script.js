
function switchTab(tabName) {
  const tabButtons = document.querySelectorAll('.tab-button');
  const tabContents = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.classList.remove('active');
  });

  tabContents.forEach(content => {
    content.classList.remove('active');
  });

  document.querySelector(`button[data-tab="${tabName}"]`).classList.add('active');
  document.getElementById(tabName).classList.add('active');
}

document.querySelectorAll('.tab-button').forEach(button => {
  button.addEventListener('click', () => {
    switchTab(button.getAttribute('data-tab'));
  });
});

function searchText() {
  const box = document.getElementById('search-box');
  const query = box.value.trim();
  const activeContent = document.querySelector('.tab-content.active');

  activeContent.innerHTML = activeContent.innerHTML.replace(/<span class="highlight">(.*?)<\/span>/g, '$1');

  if (query === "") return;

  const regex = new RegExp(`(${query})`, 'gi');

  const originalHTML = activeContent.innerHTML;
  const newHTML = originalHTML.replace(regex, '<span class="highlight">$1</span>');

  if (originalHTML !== newHTML) {
    activeContent.innerHTML = newHTML;
    
    const firstMatch = document.querySelector('.highlight');
    if (firstMatch) {
      firstMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  } else {
    box.style.borderColor = "#ff3333";
    setTimeout(() => { box.style.borderColor = "#0099ff"; }, 500);
  }
}

document.getElementById('search-box').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchText();
});