import os
import re

def final_cleanup():
    # 1. Matches Jekyll front matter
    front_matter_pattern = re.compile(r'^---\s*\n.*?\n---\s*\n', re.DOTALL)
    
    # 2. Matches Liquid tags {{ 'path' | relative_url }}
    liquid_pattern = re.compile(r"\{\{\s*['\"](?P<path>.*?)['\"]\s*\|\s*relative_url\s*\}\}")
    
    # 3. Matches <a href="main"
    anchor_main_pattern = re.compile(r'<a\s+href=["\']main["\']')

    # 4. Matches src="Images/ and changes it to src="../Images/
    image_path_pattern = re.compile(r'src=["\']Images/')

    html_files = [f for f in os.listdir('.') if f.endswith('.html')]

    if not html_files:
        print("No HTML files found.")
        return

    for filename in html_files:
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()

        # Step 1: Remove Front Matter
        content = front_matter_pattern.sub('', content)

        # Step 2: Fix Liquid tags
        def fix_liquid(match):
            path = match.group('path')
            path = path.replace('/main/', '')
            if path.startswith('/'):
                path = path[1:]
            return path
        content = liquid_pattern.sub(fix_liquid, content)

        # Step 3: Replace back button link
        content = anchor_main_pattern.sub('<a href="../index.html"', content)

        # Step 4: Prepend ../ to Image sources
        # This turns src="Images/ into src="../Images/
        content = image_path_pattern.sub('src="../Images/', content)

        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        
        print(f"Updated: {filename}")

if __name__ == "__main__":
    final_cleanup()
    print("\nDone! Front matter removed, and all paths (Links & Images) updated to use ../")