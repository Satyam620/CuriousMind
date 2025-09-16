#!/usr/bin/env python
import os
import sys
import time
import subprocess

# Add the project root to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'quiz_backend.settings')
import django
django.setup()

# Categories to import (ID: Name)
categories_to_import = [
    (11, 'Entertainment: Film'),
    (13, 'Entertainment: Musicals & Theatres'),
    (15, 'Entertainment: Video Games'),
    (16, 'Entertainment: Board Games'),
    (18, 'Science: Computers'),
    (19, 'Science: Mathematics'),
    (21, 'Sports'),
    (23, 'History'),
    (24, 'Politics'),
    (25, 'Art'),
    (26, 'Celebrities'),
    (27, 'Animals'),
    (29, 'Entertainment: Comics'),
    (30, 'Science: Gadgets'),
    (32, 'Entertainment: Cartoon & Animations')
]

def import_category(category_id, category_name, amount=50):
    """Import questions for a specific category"""
    print(f"Importing {amount} questions from '{category_name}' (ID: {category_id})...")

    try:
        # Run the Django management command
        result = subprocess.run([
            sys.executable, 'manage.py', 'import_opentdb',
            '--category-id', str(category_id),
            '--amount', str(amount)
        ], capture_output=True, text=True, cwd=os.path.dirname(os.path.abspath(__file__)))

        if result.returncode == 0:
            print(f"[SUCCESS] Successfully imported from {category_name}")
            print(result.stdout.strip())
        else:
            print(f"[FAILED] Failed to import from {category_name}")
            print(result.stderr.strip())

    except Exception as e:
        print(f"[ERROR] Error importing from {category_name}: {e}")

    # Add delay to avoid rate limiting
    print("Waiting 5 seconds to avoid rate limiting...")
    time.sleep(5)

def main():
    print("Starting batch import of OpenTDB questions...")
    print(f"Will import from {len(categories_to_import)} categories")
    print("="*60)

    successful_imports = 0
    total_questions = 0

    for i, (category_id, category_name) in enumerate(categories_to_import, 1):
        print(f"\n[{i}/{len(categories_to_import)}] Processing: {category_name}")

        try:
            import_category(category_id, category_name, 50)
            successful_imports += 1
            total_questions += 50
        except KeyboardInterrupt:
            print("\nImport interrupted by user")
            break
        except Exception as e:
            print(f"Unexpected error: {e}")

    print("\n" + "="*60)
    print("Import Summary:")
    print(f"Successful categories: {successful_imports}/{len(categories_to_import)}")
    print(f"Expected questions imported: {successful_imports * 50}")
    print("Batch import completed!")

if __name__ == '__main__':
    main()