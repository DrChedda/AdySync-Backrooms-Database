import os
import re

def add_trailing_slash_to_permalinks():
    files_processed = 0

    # Pattern to find the permalink line within the front matter
    # Group 1: 'permalink: '
    # Group 2: The actual path
    permalink_pattern = r'(permalink:\s*)([^\n]+)'

    for filename in os.listdir('.'):
        if filename.endswith('.html'):
            try:
                with open(filename, 'r', encoding='utf-8') as file:
                    content = file.read()

                # We only care about files that actually have front matter
                if content.startswith('---'):
                    
                    def slash_replacer(match):
                        prefix = match.group(1)
                        path = match.group(2).strip()
                        
                        # If it already ends with a slash, leave it alone
                        if path.endswith('/'):
                            return f"{prefix}{path}"
                        # Otherwise, add the slash
                        else:
                            return f"{prefix}{path}/"

                    new_content = re.sub(permalink_pattern, slash_replacer, content, count=1)

                    if new_content != content:
                        with open(filename, 'w', encoding='utf-8') as file:
                            file.write(new_content)
                        print(f"Added trailing slash to permalink in: {filename}")
                        files_processed += 1
                
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    print(f"\nTask completed. Total permalinks updated: {files_processed}")

if __name__ == "__main__":
    add_trailing_slash_to_permalinks()