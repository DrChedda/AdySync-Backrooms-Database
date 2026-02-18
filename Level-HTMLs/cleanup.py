import os
from pathlib import Path

def rename_existing_files(directory="."):
    path = Path(directory)
    count = 0

    # list() ensures we see all files before we start changing their names
    for html_file in list(path.rglob("*.html")):
        if "Level" in html_file.name:
            # Create the new name string
            new_name = html_file.name.replace("Level", "level")
            new_path = html_file.with_name(new_name)

            # Perform the actual rename on the file system
            html_file.rename(new_path)
            
            print(f"Renamed: {html_file.name} -> {new_name}")
            count += 1

    print(f"\nDone. {count} files were renamed.")

if __name__ == "__main__":
    rename_existing_files()