import os
import re

def update_assets_to_main_path():
    # Counter for modified files
    files_processed = 0

    # Dictionary of specific patterns to find and their new /main/ versions
    replacements = {
        # Matches <script src="{{ '/master-script.js' | relative_url }}"></script>
        # including variations in quotes or spaces
        r'<script\s+src=["\']{{\s*[\'"]/master-script\.js[\'"]\s*\|\s*relative_url\s*}}["\']><\s*/script\s*>': 
            '<script src="{{ \'/main/master-script.js\' | relative_url }}"></script>',
        
        # Matches <link rel="stylesheet" href="{{ '/master-style.css' | relative_url }}">
        r'<link\s+rel=["\']stylesheet["\']\s+href=["\']{{\s*[\'"]/master-style\.css[\'"]\s*\|\s*relative_url\s*}}["\'](?:\s*/)?>': 
            '<link rel="stylesheet" href="{{ \'/main/master-style.css\' | relative_url }}">'
    }

    # Iterate through all files in the current directory
    for filename in os.listdir('.'):
        if filename.endswith('.html'):
            try:
                with open(filename, 'r', encoding='utf-8') as file:
                    content = file.read()

                original_content = content
                
                # Apply the replacements
                for pattern, replacement in replacements.items():
                    content = re.sub(pattern, replacement, content)

                # Save if changes were made
                if content != original_content:
                    with open(filename, 'w', encoding='utf-8') as file:
                        file.write(content)
                    print(f"Updated paths to /main/ in: {filename}")
                    files_processed += 1
                
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    print(f"\nTask completed. Total files updated: {files_processed}")

if __name__ == "__main__":
    update_assets_to_main_path()