"""
================================================================================
Bangladesh Mouza Data Consolidation Script
Combines CSV files from Bangladesh_Mouza_CSV into a consolidated dataset
================================================================================
"""

import os
import csv
import re
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
INPUT_DIR = BASE_DIR / "Bangladesh_Mouza_CSV"
OUTPUT_DIR = BASE_DIR / "processed"

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

# District to Division mapping
DISTRICT_TO_DIVISION = {
    'দিনাজপুর': 'রংপুর', 'পঞ্চগড়': 'রংপুর', 'ঠাকুরগাঁও': 'রংপুর', 'নীলফামারী': 'রংপুর', 
    'কুড়িগ্রাম': 'রংপুর', 'লালমনিরহাট': 'রংপুর', 'গাইবান্ধা': 'রংপুর', 'রংপুর': 'রংপুর',
    'জয়পুরহাট': 'রাজশাহী', 'বগুড়া': 'রাজশাহী', 'নওগাঁ': 'রাজশাহী', 'নাটোর': 'রাজশাহী', 
    'রাজশাহী': 'রাজশাহী', 'চাঁপাইনবাবগঞ্জ': 'রাজশাহী', 'পাবনা': 'রাজশাহী', 'সিরাজগঞ্জ': 'রাজশাহী',
    'মেহেরপুর': 'খুলনা', 'কুষ্টিয়া': 'খুলনা', 'চুয়াডাঙ্গা': 'খুলনা', 'যশোর': 'খুলনা', 
    'মাগুরা': 'খুলনা', 'ঝিনাইদহ': 'খুলনা', 'নড়াইল': 'খুলনা', 'খুলনা': 'খুলনা', 
    'বাগেরহাট': 'খুলনা', 'সাতক্ষীরা': 'খুলনা',
    'জামালপুর': 'ময়মনসিংহ', 'শেরপুর': 'ময়মনসিংহ', 'কিশোরগঞ্জ': 'ঢাকা', 
    'ময়মনসিংহ': 'ময়মনসিংহ', 'নেত্রকোণা': 'ময়মনসিংহ',
    'সিলেট': 'সিলেট', 'হবিগঞ্জ': 'সিলেট', 'মৌলভীবাজার': 'সিলেট', 'সুনামগঞ্জ': 'সিলেট',
    'ঢাকা': 'ঢাকা', 'নারায়ণগঞ্জ': 'ঢাকা', 'মুন্সিগঞ্জ': 'ঢাকা', 'মুন্সীগঞ্জ': 'ঢাকা', 
    'নরসিংদী': 'ঢাকা', 'মানিকগঞ্জ': 'ঢাকা', 'গাজীপুর': 'ঢাকা', 'গোপালগঞ্জ': 'ঢাকা', 
    'শরীয়তপুর': 'ঢাকা', 'রাজবাড়ী': 'ঢাকা', 'ফরিদপুর': 'ঢাকা', 'মাদারীপুর': 'ঢাকা', 
    'টাঙ্গাইল': 'ঢাকা',
    'কুমিল্লা': 'চট্টগ্রাম', 'ব্রাহ্মণবাড়িয়া': 'চট্টগ্রাম', 'চাঁদপুর': 'চট্টগ্রাম', 
    'ফেনী': 'চট্টগ্রাম', 'নোয়াখালী': 'চট্টগ্রাম', 'লক্ষ্মীপুর': 'চট্টগ্রাম', 
    'লক্ষীপুর': 'চট্টগ্রাম', 'চট্টগ্রাম': 'চট্টগ্রাম', 'কক্সবাজার': 'চট্টগ্রাম', 
    'খাগড়াছড়ি': 'চট্টগ্রাম', 'বান্দরবান': 'চট্টগ্রাম', 'রাঙ্গামাটি': 'চট্টগ্রাম',
    'বরিশাল': 'বরিশাল', 'পিরোজপুর': 'বরিশাল', 'ঝালকাঠি': 'বরিশাল', 'ভোলা': 'বরিশাল', 
    'বরগুনা': 'বরিশাল', 'পটুয়াখালী': 'বরিশাল'
}

def consolidate():
    files = [f for f in os.listdir(INPUT_DIR) if f.lower().endswith(".csv")]
    files.sort()

    consolidated_rows = []
    file_summaries = []

    for filename in files:
        filepath = INPUT_DIR / filename
        filesize = filepath.stat().st_size
        label = re.sub(r"^.*?-", "", filename).replace(".csv", "").strip()

        if filesize <= 5:
            file_summaries.append({
                "filename": filename,
                "status": "EMPTY (0 bytes)",
                "row_count": 0,
                "detected_district": "N/A" if "Sheet1" in label else label,
                "columns": "None"
            })
            continue

        if "All Zones" in filename:
            file_summaries.append({
                "filename": filename,
                "status": "SUMMARY_TABLE (Reference Only)",
                "row_count": sum(1 for _ in open(filepath, encoding="utf-8", errors="ignore")),
                "detected_district": "National Summary",
                "columns": "জোোনের নাম, জেলার নাম, মৌজা সংখ্যা, Mouja in Zones"
            })
            continue

        if "বাগেরহাট-১" in filename:
            file_summaries.append({
                "filename": filename,
                "status": "DUPLICATE_FILE (Identical to বাগেরহাট.csv)",
                "row_count": 723,
                "detected_district": "বাগেরহাট",
                "columns": "ক্রম, জেলার নাম, উপজেলার নাম, মৌজার নাম, জে এল নম্বর, জমির এরিয়া (একর), সর্বশেষ পরিচালিত"
            })
            continue

        # Detect district
        detected_district = label
        if label in ['কুষ্টিয়া সদর', 'কুমারখালী', 'খোকসা', 'মিরপুর', 'ভেড়ামাড়া', 'দৌলতপুর']:
            detected_district = 'কুষ্টিয়া'
        elif label in ['মেহেরপুর সদর', 'গাংনী', 'মুজিবনগর']:
            detected_district = 'মেহেরপুর'
        elif label in ['চুয়াডাঙ্গা সদর', 'আলমডাঙ্গা', 'দামুরহুদা', 'জীবননগর']:
            detected_district = 'চুয়াডাঙ্গা'
        elif label == 'পাবনা-1':
            detected_district = 'পাবনা'

        file_count = 0
        with open(filepath, encoding="utf-8", errors="replace") as f:
            reader = csv.reader(f)
            for row in reader:
                if not row:
                    continue
                line_str = ",".join(row)
                if any(x in line_str for x in ['জোনাল সেটেলমেন্ট অফিস', 'মৌজার তালিকা', 'মৌজার জরিপ সংক্রান্ত', 'ছক,']):
                    continue
                if any(x in line_str for x in ['মৌজার নাম', 'জে এল নম্বর', 'জে.এল নং', 'Mouza Name', 'আয়তন (একরে)']):
                    continue
                if any(x in line_str for x in ['(একরে)', '(একর)', 'জরিপের নাম', 'গেজেট প্রকাশের', 'মেয়াদ,জমির পরিমাণ']):
                    continue
                if len(row) >= 4 and all(re.match(r"^[0-9০-৯]+$", row[i].strip()) for i in range(4)):
                    continue
                if len([c for c in row if c.strip()]) < 3:
                    continue

                # Mapping based on layout
                sl = row[0].strip() if len(row) > 0 else ""
                division = ""
                district = detected_district
                upazila = ""
                mouza_bn = ""
                mouza_en = ""
                jl_number = ""
                land_area = ""
                sheet_count = ""
                survey_type = ""
                survey_period = ""
                gazette_date = ""
                remarks = ""

                if any(n in filename for n in ['Chattogram.csv', 'কুমিল্লা.csv', 'চাঁদপুর.csv', 'ব্রাহ্মণবাড়িয়া.csv']):
                    division = row[1].strip() if len(row) > 1 else "চট্টগ্রাম"
                    district = row[2].strip() if len(row) > 2 else detected_district
                    upazila = row[3].strip() if len(row) > 3 else ""
                    mouza_bn = row[4].strip() if len(row) > 4 else ""
                    jl_number = row[5].strip() if len(row) > 5 else ""
                    if "Chattogram.csv" in filename:
                        land_area = row[6].strip() if len(row) > 6 else ""
                        survey_type = row[7].strip() if len(row) > 7 else ""
                        gazette_date = row[8].strip() if len(row) > 8 else ""
                        sheet_count = row[9].strip() if len(row) > 9 else ""
                        p_start = row[10].strip() if len(row) > 10 else ""
                        p_end = row[11].strip() if len(row) > 11 else ""
                        survey_period = f"{p_start}-{p_end}" if p_start and p_end else p_start
                        remarks = row[12].strip() if len(row) > 12 else ""
                    else:
                        survey_type = row[6].strip() if len(row) > 6 else ""
                        gazette_date = row[7].strip() if len(row) > 7 else ""
                        sheet_count = row[8].strip() if len(row) > 8 else ""
                        survey_period = row[9].strip() if len(row) > 9 else ""
                        land_area = row[10].strip() if len(row) > 10 else ""
                        remarks = row[11].strip() if len(row) > 11 else ""
                elif any(n in filename for n in ['Habiganj.csv', 'Moulavibazar.csv', 'Sunamganj.csv', 'Sylhet.csv']):
                    division = "সিলেট"
                    district = row[1].strip() if len(row) > 1 else detected_district
                    upazila = row[2].strip() if len(row) > 2 else ""
                    mouza_bn = row[3].strip() if len(row) > 3 else ""
                    mouza_en = row[4].strip() if len(row) > 4 else ""
                    land_area = row[5].strip() if len(row) > 5 else ""
                    sa = f"SA: {row[6].strip()}" if len(row) > 6 and row[6].strip() else ""
                    rs = f"RS: {row[7].strip()}" if len(row) > 7 and row[7].strip() else ""
                    survey_type = "; ".join(filter(None, [sa, rs]))
                    remarks = row[8].strip() if len(row) > 8 else ""
                elif any(n in filename for n in ['Gaibandha.csv', 'kurigram.csv', 'Rangpur.csv', 'Nilphama.csv']):
                    division = "রংপুর"
                    district = row[1].strip() if len(row) > 1 else detected_district
                    upazila = row[2].strip() if len(row) > 2 else ""
                    mouza_bn = row[3].strip() if len(row) > 3 else ""
                    mouza_en = row[4].strip() if len(row) > 4 else ""
                    land_area = row[5].strip() if len(row) > 5 else ""
                    survey_type = row[6].strip() if len(row) > 6 else ""
                    jl_number = row[12].strip() if len(row) > 12 else (row[9].strip() if len(row) > 9 else "")
                elif any(n in filename for n in ['Feni.csv', 'Laxmipour.csv', 'noakhali.csv']):
                    division = "চট্টগ্রাম"
                    district = row[1].strip() if len(row) > 1 else detected_district
                    upazila = row[2].strip() if len(row) > 2 else ""
                    mouza_bn = row[3].strip() if len(row) > 3 else ""
                    jl_number = row[4].strip() if len(row) > 4 else ""
                    sheet_count = row[5].strip() if len(row) > 5 else ""
                    land_area = row[6].strip() if len(row) > 6 else ""
                    remarks = row[7].strip() if len(row) > 7 else ""
                else:
                    division = DISTRICT_TO_DIVISION.get(district, "")
                    district = row[1].strip() if len(row) > 1 else detected_district
                    upazila = row[2].strip() if len(row) > 2 else ""
                    mouza_bn = row[3].strip() if len(row) > 3 else ""
                    jl_number = row[4].strip() if len(row) > 4 else ""
                    land_area = row[5].strip() if len(row) > 5 else ""
                    survey_type = row[6].strip() if len(row) > 6 else ""
                    survey_period = row[7].strip() if len(row) > 7 else ""
                    gazette_date = row[8].strip() if len(row) > 8 else ""
                    remarks = row[9].strip() if len(row) > 9 else ""

                # Clean up district typos, ditto marks, and Unicode variations
                import unicodedata
                district = unicodedata.normalize('NFC', district).strip()
                upazila = unicodedata.normalize('NFC', upazila).strip()
                mouza_bn = unicodedata.normalize('NFC', mouza_bn).strip()

                if district in ['ঐ', '’’', '”', '“', ''] or not district:
                    district = detected_district
                elif district == 'ব্রাহ্মণাড়িয়া':
                    district = 'ব্রাহ্মণবাড়িয়া'
                elif district == 'সিটি কর্পোরেশন' and 'Chattogram' in filename:
                    district = 'চট্টগ্রাম'
                elif district == 'পিরোজপুর':
                    district = 'পিরোজপুর'
                elif district == 'ঝালকাঠী':
                    district = 'ঝালকাঠি'
                elif district == 'লক্ষীপুর':
                    district = 'লক্ষ্মীপুর'

                if not division and district:
                    division = DISTRICT_TO_DIVISION.get(district, "")

                consolidated_rows.append({
                    "source_filename": filename,
                    "sl_no": sl,
                    "division": division,
                    "district": district,
                    "upazila": upazila,
                    "mouza_name_bn": mouza_bn,
                    "mouza_name_en": mouza_en,
                    "jl_number": jl_number,
                    "land_area_acres": land_area,
                    "sheet_count": sheet_count,
                    "survey_type": survey_type,
                    "survey_period": survey_period,
                    "gazette_date": gazette_date,
                    "remarks": remarks
                })
                file_count += 1

        file_summaries.append({
            "filename": filename,
            "status": "CONSOLIDATED",
            "row_count": file_count,
            "detected_district": detected_district,
            "columns": "Standard Mouza Schema"
        })

    # Save outputs
    # 1. combined_mouza.csv
    fieldnames = [
        "source_filename", "sl_no", "division", "district", "upazila", 
        "mouza_name_bn", "mouza_name_en", "jl_number", "land_area_acres", 
        "sheet_count", "survey_type", "survey_period", "gazette_date", "remarks"
    ]
    with open(OUTPUT_DIR / "combined_mouza.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(consolidated_rows)

    # 2. file_summary.csv
    with open(OUTPUT_DIR / "file_summary.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["filename", "status", "row_count", "detected_district", "columns"])
        writer.writeheader()
        writer.writerows(file_summaries)

    print(f"Consolidation complete: {len(consolidated_rows)} rows written to {OUTPUT_DIR / 'combined_mouza.csv'}")

if __name__ == "__main__":
    consolidate()
