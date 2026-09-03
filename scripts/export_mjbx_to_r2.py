import os
import sys
import re

JIBREEL_DIR = r"D:\jibreel\MaktabaJibreel V2.8 (22-03-2018)"
BOOKS_DIR = os.path.join(JIBREEL_DIR, "Books")

def rtf_to_text(raw_bytes):
    # 1. Try decoding as ASCII/Latin1 to preserve RTF control structures
    try:
        raw_str = raw_bytes.decode('latin-1', errors='ignore')
    except Exception:
        return ""

    # Replace RTF Unicode control sequences: \u1234? or \u-1234?
    def decode_rtf_u(m):
        try:
            val = int(m.group(1))
            if val < 0:
                val += 65536
            return chr(val)
        except Exception:
            return ""

    # Convert \u1234? to actual Unicode character
    text = re.sub(r'\\u(-?\d+)\s*\??', decode_rtf_u, raw_str)

    # Convert hexadecimal escapes \'e1 \'d2
    def decode_rtf_hex(m):
        try:
            h = m.group(1)
            b = bytes.fromhex(h)
            return b.decode('cp1256', errors='ignore')
        except Exception:
            return ""

    text = re.sub(r"\\'([0-9a-fA-F]{2})", decode_rtf_hex, text)

    # Strip remaining RTF tags and braces
    text = re.sub(r'\\[a-zA-Z]+(-?\d+)?\s?', ' ', text)
    text = re.sub(r'[\{\}]', ' ', text)
    
    # Normalize whitespace
    lines = [l.strip() for l in text.split('\n') if len(l.strip()) > 3]
    return lines

def test_rtf_extraction(fpath):
    print(f"\n🔬 --- TESTING RTF UNICODE DECODER ON: {os.path.basename(fpath)} ---")
    with open(fpath, 'rb') as f:
        raw = f.read()

    lines = rtf_to_text(raw)
    print(f"✅ Total RTF Decoded Lines: {len(lines)}")

    print("\n📖 --- CLEAN DECODED URDU LINES SAMPLE (First 15 lines) ---")
    for idx, line in enumerate(lines[:15], 1):
        print(f"  Line #{idx}: {line}")

def main():
    sample1 = os.path.join(BOOKS_DIR, "10.mjbx")
    sample2 = os.path.join(BOOKS_DIR, "1000.mjbx")
    
    if os.path.exists(sample1):
        test_rtf_extraction(sample1)
    if os.path.exists(sample2):
        test_rtf_extraction(sample2)

if __name__ == "__main__":
    main()
