import os
import sys
import json
import glob
import sqlite3

# Path to Maktaba Jibreel Books directory and metadata
JIBREEL_BOOKS_DIR = r"D:\jibreel\MaktabaJibreel V2.8 (22-03-2018)\Books"
JIBREEL_IMPORT_DIR = r"D:\import"
METADATA_FILE = os.path.join(os.path.dirname(__file__), "..", "books_metadata.json")
OUTPUT_TEXTS_DIR = os.path.join(os.path.dirname(__file__), "..", "public", "texts")

os.makedirs(OUTPUT_TEXTS_DIR, exist_ok=True)

def inspect_sqlite_tables(db_path):
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
        tables = [t[0] for t in cursor.fetchall()]
        conn.close()
        return tables
    except Exception as e:
        return []

def extract_book_text_from_mjbx(db_path):
    """
    Extracts text content and pages from a .mjbx SQLite database file.
    """
    try:
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()
        
        tables = inspect_sqlite_tables(db_path)
        pages_data = []

        # Common table names in Maktaba Jibreel .mjbx databases: 'Pages', 'BookText', 'Data', 'Content'
        target_table = None
        for tbl in ['Pages', 'BookText', 'Content', 'Data', 'Text']:
            if tbl in tables:
                target_table = tbl
                break

        if not target_table and tables:
            target_table = tables[0]

        if target_table:
            cursor.execute(f"PRAGMA table_info({target_table});")
            columns = [col[1] for col in cursor.fetchall()]
            
            # Identify page_no and text columns
            text_col = next((c for c in columns if 'text' in c.lower() or 'matan' in c.lower() or 'content' in c.lower() or 'data' in c.lower() or 'body' in c.lower()), columns[-1])
            page_col = next((c for c in columns if 'page' in c.lower() or 'num' in c.lower() or 'id' in c.lower()), columns[0])

            cursor.execute(f"SELECT {page_col}, {text_col} FROM {target_table} LIMIT 500;")
            rows = cursor.fetchall()
            for r in rows:
                p_num = r[0]
                p_txt = str(r[1]) if r[1] is not None else ""
                if p_txt.strip():
                    pages_data.append({"page": p_num, "text": p_txt.strip()})

        conn.close()
        return pages_data
    except Exception as e:
        print(f"Error extracting from {db_path}: {e}")
        return []

def main():
    print("📚 Reading Master Books Metadata...")
    if not os.path.exists(METADATA_FILE):
        print(f"Error: {METADATA_FILE} not found!")
        return

    with open(METADATA_FILE, 'r', encoding='utf-8') as f:
        books = json.load(f)

    print(f"Total books in metadata: {len(books)}")

    mjbx_files = glob.glob(os.path.join(JIBREEL_BOOKS_DIR, "*.mjbx"))
    print(f"Found {len(mjbx_files)} .mjbx files in {JIBREEL_BOOKS_DIR}")

    matched_count = 0
    for file_path in mjbx_files:
        base_name = os.path.splitext(os.path.basename(file_path))[0]
        # Match by ID or filename
        matched_book = next((b for b in books if str(b.get("id")) == base_name), None)

        if matched_book:
            book_id = matched_book["id"]
            extracted = extract_book_text_from_mjbx(file_path)
            if extracted:
                out_path = os.path.join(OUTPUT_TEXTS_DIR, f"text_{book_id}.json")
                with open(out_path, 'w', encoding='utf-8') as out_f:
                    json.dump({
                        "book_id": book_id,
                        "title": matched_book.get("title", ""),
                        "pages": extracted
                    }, out_f, ensure_ascii=False, indent=2)
                matched_count += 1
                print(f"✅ Extracted text for Book #{book_id} ({matched_book.get('title')[:30]}...) -> public/texts/text_{book_id}.json")

    print(f"\n🎉 Successfully extracted text for {matched_count} books!")

if __name__ == "__main__":
    main()
