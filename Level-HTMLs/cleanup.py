import os
import re

def fix_assets_and_links():
    files_processed = 0

    # Dictionary of patterns to find and their replacements
    # This handles the back button, css, favicon, scripts, and placeholder images
    replacements = {
        # Back Button
        r'<a\s+href=["\']\.\./main/["\']\s+class=["\']nav-btn["\']>\s*←\s*BACK\s*</a>': 
            '<a href="{{ \'/main\' | relative_url }}" class="nav-btn">← BACK</a>',
        
        # CSS Master Style
        r'<link\s+rel=["\']stylesheet["\']\s+href=["\']master-style\.css["\'](?:\s*/)?>': 
            '<link rel="stylesheet" href="{{ \'/master-style.css\' | relative_url }}">',
        
        # Favicon
        r'<link\s+rel=["\']icon["\']\s+type=["\']image/png["\']\s+href=["\']\.\./favicon\.png["\'](?:\s*/)?>': 
            '<link rel="icon" type="image/png" href="{{ \'/favicon.png\' | relative_url }}">',
        
        # Placeholder Images
        r'<img\s+src=["\']\.\./Images/placeholder\.png["\']': 
            '<img src="{{ \'/Images/placeholder.png\' | relative_url }}"',
        
        # Master Script
        r'<script\s+src=["\']master-script\.js["\']></script>': 
            '<script src="{{ \'/master-script.js\' | relative_url }}"></script>'
    }

    for filename in os.listdir('.'):
        if filename.endswith('.html'):
            try:
                with open(filename, 'r', encoding='utf-8') as file:
                    content = file.read()

                original_content = content
                
                # Apply each replacement defined in the dictionary
                for pattern, replacement in replacements.items():
                    content = re.sub(pattern, replacement, content)

                # Only save if something actually changed
                if content != original_content:
                    with open(filename, 'w', encoding='utf-8') as file:
                        file.write(content)
                    print(f"Updated assets and back button in: {filename}")
                    files_processed += 1
                
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    print(f"\nTask completed. Total files updated: {files_processed}")

if __name__ == "__main__":
    fix_assets_and_links()