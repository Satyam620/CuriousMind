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

# Priority categories that need heavy expansion (Category ID, Name, Target Additional Questions)
high_priority_categories = [
    # Categories with 150 or fewer questions - need 350+ more
    (12, 'Entertainment: Music', 350),           # Currently 150, target 500
    (20, 'Mythology', 350),                     # Currently 150, target 500
    (18, 'Science: Computers', 400),            # Currently 100, target 500
    (15, 'Entertainment: Video Games', 400),    # Currently 100, target 500
    (21, 'Sports', 400),                        # Currently 100, target 500
    (27, 'Animals', 400),                       # Currently 100, target 500
    (23, 'History', 400),                       # Currently 100, target 500
    (22, 'Geography', 400),                     # Currently 100, target 500
    (10, 'Entertainment: Books', 420),          # Currently 80, target 500

    # Categories with 50 questions - need 450 more
    (25, 'Art', 450),                           # Currently 50, target 500
    (24, 'Politics', 450),                      # Currently 50, target 500
    (19, 'Science: Mathematics', 450),          # Currently 50, target 500
    (28, 'Vehicles', 450),                      # Currently 50, target 500
    (31, 'Entertainment: Japanese Anime & Manga', 450), # Currently 50, target 500
    (16, 'Entertainment: Board Games', 450),    # Currently 50, target 500
    (29, 'Entertainment: Comics', 450),         # Currently 50, target 500
    (32, 'Entertainment: Cartoon & Animations', 450), # Currently 50, target 500
]

def bulk_import_category(category_id, category_name, target_additional):
    """Import questions for a category in rapid succession"""
    print(f"\\n{'='*60}")
    print(f"BULK IMPORTING: {category_name} (ID: {category_id})")
    print(f"Target additional questions: {target_additional}")
    print(f"{'='*60}")

    imported_total = 0
    batch_size = 50
    failures = 0
    max_failures = 2

    while imported_total < target_additional and failures < max_failures:
        remaining = min(batch_size, target_additional - imported_total)
        print(f"\\n  [{imported_total:3d}/{target_additional:3d}] Importing batch of {remaining} questions...")

        try:
            # Run the Django management command
            result = subprocess.run([
                sys.executable, 'manage.py', 'import_opentdb',
                '--category-id', str(category_id),
                '--amount', str(remaining)
            ], capture_output=True, text=True, cwd=os.path.dirname(os.path.abspath(__file__)))

            if result.returncode == 0:
                if "Successfully imported" in result.stdout:
                    # Parse the actual number imported
                    lines = result.stdout.strip().split('\\n')
                    for line in lines:
                        if "Successfully imported" in line and "/" in line:
                            try:
                                parts = line.split('/')
                                imported_count = int(parts[0].split()[-1])
                                imported_total += imported_count
                                print(f"    [SUCCESS]: +{imported_count} questions (Total progress: {imported_total}/{target_additional})")
                                failures = 0  # Reset failure count
                                break
                            except:
                                imported_total += remaining
                                print(f"    [SUCCESS]: +{remaining} questions (estimated)")
                                failures = 0
                                break
                elif "No questions found" in result.stdout or "API error code: 1" in result.stdout:
                    print(f"    [EXHAUSTED]: No more questions available for {category_name}")
                    break
                else:
                    failures += 1
                    print(f"    [FAILED]: Attempt {failures}/{max_failures}")
            else:
                failures += 1
                print(f"    [ERROR]: Attempt {failures}/{max_failures} - {result.stderr.strip()}")

        except Exception as e:
            failures += 1
            print(f"    [EXCEPTION]: Attempt {failures}/{max_failures} - {e}")

        # Reduced delay for aggressive importing
        if imported_total < target_additional and failures < max_failures:
            print("    Waiting 4 seconds...")
            time.sleep(4)

    completion_rate = (imported_total / target_additional) * 100 if target_additional > 0 else 100
    print(f"\\n  {category_name} COMPLETED: {imported_total}/{target_additional} questions ({completion_rate:.1f}%)")
    return imported_total

def main():
    print("SUPER AGGRESSIVE BULK IMPORT - TARGETING 500+ PER CATEGORY")
    print(f"Processing {len(high_priority_categories)} high-priority categories")
    print("Goal: Get every category to 500+ questions")
    print("="*80)

    total_imported = 0
    successful_categories = 0
    start_time = time.time()

    for i, (category_id, category_name, target_count) in enumerate(high_priority_categories, 1):
        print(f"\\n[{i:2d}/{len(high_priority_categories)}] PROCESSING: {category_name}")

        try:
            imported_count = bulk_import_category(category_id, category_name, target_count)
            total_imported += imported_count
            if imported_count > 0:
                successful_categories += 1

        except KeyboardInterrupt:
            print("\\nINTERRUPTED BY USER")
            break
        except Exception as e:
            print(f"CRITICAL ERROR with {category_name}: {e}")

    elapsed_time = time.time() - start_time

    print("\\n" + "="*80)
    print("SUPER AGGRESSIVE IMPORT SUMMARY:")
    print("="*80)
    print(f"Categories processed: {successful_categories}/{len(high_priority_categories)}")
    print(f"Total questions imported: {total_imported:,}")
    print(f"Total time: {elapsed_time/60:.1f} minutes")
    print(f"Import rate: {total_imported/(elapsed_time/60):.0f} questions/minute")
    print("Mission: Build the ultimate quiz database!")
    print("="*80)

if __name__ == '__main__':
    main()