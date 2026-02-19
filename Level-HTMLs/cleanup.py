import os

def add_permalink_front_matter():
    # Counter for modified files
    files_processed = 0

    # Iterate through all files in the current directory
    for filename in os.listdir('.'):
        if filename.endswith('.html'):
            # Get the name without the .html extension (e.g., 'level-37')
            name_only = os.path.splitext(filename)[0]
            
            # Construct the front matter block
            front_matter = f"---\npermalink: /{name_only}\n---\n"
            
            try:
                # Read the existing content
                with open(filename, 'r', encoding='utf-8') as file:
                    content = file.read()
                
                # Check if front matter already exists to avoid double-adding
                if content.startswith('---'):
                    print(f"Skipped: {filename} (Already has front matter)")
                    continue
                
                # Combine front matter with original content
                new_content = front_matter + content
                
                # Write the updated content back
                with open(filename, 'w', encoding='utf-8') as file:
                    file.write(new_content)
                
                print(f"Added permalink to: {filename}")
                files_processed += 1
                
            except Exception as e:
                print(f"Error processing {filename}: {e}")

    print(f"\nTask completed. Total files updated: {files_processed}")

if __name__ == "__main__":
    add_permalink_front_matter()