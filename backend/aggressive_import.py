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

# Major categories to bulk import from (targeting 1000 questions each)
major_categories = [
    (9, 'General Knowledge', 500),      # Aim for 600 total (currently 100)
    (10, 'Entertainment: Books', 420),  # Aim for 500 total (currently 80)
    (11, 'Entertainment: Film', 370),   # Aim for 500 total (currently 130)
    (12, 'Entertainment: Music', 400),  # Aim for 500 total (currently 100)
    (14, 'Entertainment: Television', 400), # Aim for 500 total (currently 100)
    (15, 'Entertainment: Video Games', 400), # Aim for 500 total (currently 100)
    (17, 'Science & Nature', 400),     # Aim for 500 total (currently 100)
    (18, 'Science: Computers', 400),   # Aim for 500 total (currently 100)
    (20, 'Mythology', 400),            # Aim for 500 total (currently 100)
    (21, 'Sports', 400),               # Aim for 500 total (currently 100)
    (22, 'Geography', 400),            # Aim for 500 total (currently 100)
    (23, 'History', 400),              # Aim for 500 total (currently 100)
    (27, 'Animals', 400)               # Aim for 500 total (currently 100)
]

def import_category_batch(category_id, category_name, target_questions):
    """Import questions for a category in batches of 50"""
    print(f"Starting bulk import for {category_name} (ID: {category_id})")
    print(f"Target: {target_questions} questions")

    imported_total = 0
    batch_size = 50
    failures = 0
    max_failures = 3

    while imported_total < target_questions and failures < max_failures:
        remaining = min(batch_size, target_questions - imported_total)
        print(f"  Importing batch of {remaining} questions... (Progress: {imported_total}/{target_questions})")

        try:
            # Run the Django management command
            result = subprocess.run([
                sys.executable, 'manage.py', 'import_opentdb',
                '--category-id', str(category_id),
                '--amount', str(remaining)
            ], capture_output=True, text=True, cwd=os.path.dirname(os.path.abspath(__file__)))

            if result.returncode == 0 and "Successfully imported" in result.stdout:
                # Extract number of imported questions from output
                lines = result.stdout.strip().split('\n')
                for line in lines:
                    if "Successfully imported" in line and "/" in line:
                        try:
                            imported_count = int(line.split('/')[0].split()[-1])
                            imported_total += imported_count
                            print(f"  [SUCCESS] +{imported_count} questions (Total: {imported_total})")
                            break
                        except:
                            imported_total += remaining
                            print(f"  [SUCCESS] +{remaining} questions (estimated)")
                failures = 0  # Reset failure count on success
            else:
                failures += 1
                if "API error code: 1" in result.stdout or "No questions found" in result.stdout:
                    print(f"  [INFO] Category exhausted - no more questions available")
                    break
                else:
                    print(f"  [WARNING] Import failed (attempt {failures}/{max_failures})")
                    print(f"  Error: {result.stdout.strip()}")

        except Exception as e:
            failures += 1
            print(f"  [ERROR] Exception during import (attempt {failures}/{max_failures}): {e}")

        # Rate limiting delay
        if imported_total < target_questions:
            print("  Waiting 6 seconds to avoid rate limiting...")
            time.sleep(6)

    print(f"Completed {category_name}: imported {imported_total} questions")
    return imported_total

def main():
    print("Starting aggressive bulk import of OpenTDB questions...")
    print(f"Will process {len(major_categories)} major categories")
    print("="*80)

    total_imported = 0
    successful_categories = 0

    for i, (category_id, category_name, target_count) in enumerate(major_categories, 1):
        print(f"\n[{i}/{len(major_categories)}] Processing: {category_name}")

        try:
            imported_count = import_category_batch(category_id, category_name, target_count)
            total_imported += imported_count
            if imported_count > 0:
                successful_categories += 1

        except KeyboardInterrupt:
            print("\nImport interrupted by user")
            break
        except Exception as e:
            print(f"Unexpected error with {category_name}: {e}")

        print("-" * 60)

    print("\n" + "="*80)
    print("AGGRESSIVE IMPORT SUMMARY:")
    print(f"Categories processed: {successful_categories}/{len(major_categories)}")
    print(f"Total questions imported: {total_imported}")
    print("Import completed!")

if __name__ == '__main__':
    main()