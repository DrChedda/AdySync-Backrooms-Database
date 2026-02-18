import os
from pathlib import Path

# The exact content you want to find
TARGET_SCRIPT = """<script>
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

  activeContent.innerHTML = activeContent.innerHTML.replace(/<span class="highlight">(.*?)<\\/span>/g, '$1');

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
</script>"""

# The replacement tag
REPLACEMENT = '<script src="master-script.js"></script>'

def migrate_scripts(directory="."):
    path = Path(directory)
    count = 0

    for html_file in path.rglob("*.html"):
        with open(html_file, 'r', encoding='utf-8') as f:
            content = f.read()

        if TARGET_SCRIPT in content:
            new_content = content.replace(TARGET_SCRIPT, REPLACEMENT)
            
            with open(html_file, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"Updated: {html_file}")
            count += 1
        else:
            print(f"Skipped (No match): {html_file}")

    print(f"\nFinished! Total files updated: {count}")

if __name__ == "__main__":
    migrate_scripts()