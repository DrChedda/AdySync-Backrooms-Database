import os
import re

def update_permalink_front_matter():
    # Counter for modified files
    files_processed = 0

    # Iterate through all files in the current directory
    for filename in os.listdir('.'):
        if filename.endswith('.html'):
            name_only = os.path.splitext(filename)[0]
            
            # The new front matter block
            new_front_matter = f"---\npermalink: /main/{name_only}/\n---\n"
            
            try:
                with open(filename, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # Regex logic: 
                # If file starts with ---, it finds everything between the first and second ---
                # and replaces it (including the dashes) with the new front matter.
                if content.startswith('---'):
                    # re.S allows '.' to match newlines
                    # This replaces the entire existing front matter block
                    new_content = re.sub(r'^---.*?---\n?', new_front_matter, content, flags=re.S)
                    print(f"Updated existing front matter in: {filename}")
                else:
                    # If no front matter exists, just prepend it
                    new_content = new_front_matter + content
                    print(f"Added new front matter to: {filename}")
                
                with open(filename, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                
                files_processed += 1
                
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    print(f"\nTask completed. Total files updated: {files_processed}")

if __name__ == "__main__":
    update_permalink_front_matter()