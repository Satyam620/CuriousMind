# Quiz Database Fixtures

This directory contains production-ready fixtures for the CuriousMind quiz application.

## 📊 Database Content

**Total Data:**
- **27 Quiz Categories**
- **31,486 Questions**
- **125,943 Answer Choices**

## 📁 Fixture Files

### Complete Dataset
- `quiz_fixtures.json` (29MB) - Complete quiz database with all categories

### Category-Specific Files
- `animals_fixtures.json` - Animals category (2,008 questions)
- `art_fixtures.json` - Art category (1,280 questions)
- `entertainment_books_fixtures.json` - Entertainment: Books (2,063 questions)
- `entertainment_film_fixtures.json` - Entertainment: Film (2,000 questions)
- `entertainment_fixtures.json` - Mixed Entertainment categories (6,600+ questions)
- `entertainment_music_fixtures.json` - Entertainment: Music (1,625 questions)
- `entertainment_video_games_fixtures.json` - Entertainment: Video Games (2,166 questions)
- `general_knowledge_fixtures.json` - General Knowledge (4,672 questions)
- `geography_fixtures.json` - Geography (2,008 questions)
- `history_fixtures.json` - History (963 questions)
- `science_fixtures.json` - Science categories (3,503 questions)
- `sports_fixtures.json` - Sports (505 questions)

## 🚀 Usage

### Load All Data
```bash
# Load complete dataset
python manage.py loaddata fixtures/quiz_fixtures.json
```

### Load Specific Categories
```bash
# Load only specific categories
python manage.py loaddata fixtures/animals_fixtures.json
python manage.py loaddata fixtures/science_fixtures.json
python manage.py loaddata fixtures/entertainment_film_fixtures.json
```

### Load All Categories
```bash
# Load all category files
python manage.py loaddata fixtures/*.json
```

## 🔧 Production Deployment

1. **Fresh Database Setup:**
   ```bash
   python manage.py migrate
   python manage.py loaddata fixtures/quiz_fixtures.json
   ```

2. **Selective Loading:**
   ```bash
   python manage.py migrate
   python manage.py loaddata fixtures/general_knowledge_fixtures.json
   python manage.py loaddata fixtures/science_fixtures.json
   python manage.py loaddata fixtures/entertainment_fixtures.json
   ```

## ⚡ Performance Notes

- **Complete dataset**: ~29MB, takes 30-60 seconds to load
- **Individual categories**: 500KB-6MB each, faster loading
- **Recommended**: Load specific categories based on app requirements

## 🏷️ Categories Included

| Category | Questions | Description |
|----------|-----------|-------------|
| Animals | 2,008 | Animal-related trivia |
| Art | 1,280 | Art history and general art knowledge |
| Celebrities | 2,085 | Celebrity trivia and entertainment |
| Entertainment: Books | 2,063 | Literature and book-related questions |
| Entertainment: Comics | 2,088 | Comic books and graphic novels |
| Entertainment: Film | 2,000 | Movies and cinema |
| Entertainment: Japanese Anime & Manga | 2,035 | Anime and manga trivia |
| Entertainment: Music | 565 | Music trivia |
| Entertainment: Television | 1,075 | TV shows and series |
| Entertainment: Video Games | 1,268 | Gaming trivia |
| General Knowledge | 2,030 | Mixed general knowledge |
| Geography | 2,008 | World geography |
| History | 963 | Historical events and figures |
| Science & Nature | 2,022 | Science and nature topics |
| Science: Mathematics | 981 | Mathematics problems |
| Sports | 500 | Sports trivia |
| Vehicles | 2,005 | Cars, transportation |

## 🔄 Regenerating Fixtures

To update fixtures from current database:

```bash
# Export all data
python manage.py export_quiz_fixtures --output-dir fixtures --exclude-ai

# Export by category
python manage.py export_quiz_fixtures --output-dir fixtures --exclude-ai --split-files

# Export specific category
python manage.py export_quiz_fixtures --output-dir fixtures --exclude-ai --category "Science"
```

## ⚠️ Important Notes

- All fixtures exclude AI-generated quizzes
- Only active quizzes are included
- Data is UTF-8 encoded for international character support
- Each quiz includes complete question and choice data
- Primary keys are preserved for referential integrity