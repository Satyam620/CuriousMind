#!/usr/bin/env python3
"""
Setup script for the Quiz App backend
"""
import subprocess
import sys
import os

def run_command(command, description):
    """Run a shell command and handle errors"""
    print(f"\n{description}...")
    try:
        result = subprocess.run(command, shell=True, check=True, capture_output=True, text=True)
        print(f"[SUCCESS] {description} completed successfully")
        return result
    except subprocess.CalledProcessError as e:
        print(f"[ERROR] {description} failed:")
        print(f"Error: {e.stderr}")
        sys.exit(1)

def main():
    print("Setting up Quiz App Backend")
    print("=" * 50)
    
    # Check if virtual environment exists
    if not os.path.exists("venv"):
        run_command("python -m venv venv", "Creating virtual environment")
    
    # Determine activation command based on OS
    if os.name == 'nt':  # Windows
        activate_cmd = "venv\\Scripts\\activate"
        pip_cmd = "venv\\Scripts\\pip"
        python_cmd = "venv\\Scripts\\python"
    else:  # Unix/Linux/macOS
        activate_cmd = "source venv/bin/activate"
        pip_cmd = "venv/bin/pip"
        python_cmd = "venv/bin/python"
    
    # Install dependencies
    run_command(f"{pip_cmd} install --upgrade pip", "Upgrading pip")
    run_command(f"{pip_cmd} install -r requirements.txt", "Installing Python dependencies")
    
    # Django setup
    run_command(f"{python_cmd} manage.py makemigrations", "Creating database migrations")
    run_command(f"{python_cmd} manage.py migrate", "Applying database migrations")
    
    print("\n" + "=" * 50)
    print("Backend setup completed successfully!")
    print("\nNext steps:")
    print("1. Create a superuser: python manage.py createsuperuser")
    print("2. Start the server: python manage.py runserver")
    print("\nDatabase: Currently using SQLite (db.sqlite3)")
    print("   To use PostgreSQL:")
    print("   - Install PostgreSQL dependencies: pip install -r requirements-postgres.txt")
    print("   - Update settings.py to use PostgreSQL configuration")
    print("   - Update .env with your database credentials")
    print("\nTo activate the virtual environment:")
    if os.name == 'nt':
        print("   venv\\Scripts\\activate")
    else:
        print("   source venv/bin/activate")

if __name__ == "__main__":
    main()