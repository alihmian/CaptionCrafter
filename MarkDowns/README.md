Here's a clean, concise, and helpful **`README.md`** to accompany your `text_utils.py` module:

---

# 🖼️ `text_utils` Library

A Python library for easily drawing and aligning **Farsi (Persian)** or other RTL/LTR texts within bounding boxes or freely on images. It simplifies text wrapping, alignment, dynamic font-sizing, and proper RTL text shaping for image processing projects using Pillow.

---

## 📦 Installation

Ensure you have Python ≥3.6 installed, then run:

```bash
pip install Pillow arabic-reshaper python-bidi
```

---

## 🚀 Quick Usage Example

```python
from PIL import Image, ImageDraw
from text_utils import draw_text_in_box

# Create image and drawing context
img = Image.new('RGB', (800, 400), 'white')
draw = ImageDraw.Draw(img)

# Draw RTL text in a bounding box
draw_text_in_box(
    draw,
    text="متن نمونه فارسی برای تست چینش در جعبه",
    font_path="fonts/Vazir.ttf",
    box=(50, 50, 700, 300),
    alignment='center',
    vertical_mode='center_expanded',
    auto_size=True,
    color='blue'
)

img.show()
```

---

## 🛠️ Available Functions

| Function                      | Description                                   |
|-------------------------------|-----------------------------------------------|
| `prepare_farsi_text`          | Shapes and handles RTL text for correct rendering |
| `wrap_text_to_fit`            | Wraps text within a given pixel width         |
| `calculate_font_size_to_fit`  | Determines optimal font size for text-box fitting |
| `draw_text_in_box`            | Draws aligned text inside specified bounding boxes |
| `draw_text_no_box`            | Draws aligned text at a free-floating coordinate |

---

## 🎯 Function Details

### 🔹 **`draw_text_in_box`**

Draw multiline text in bounding boxes with precise control:

- **Alignments:** Left, center, right
- **Vertical modes:** Top-to-bottom, center-expanded, bottom-to-top
- **Auto-sizing:** Automatically fits text to the largest suitable font size.

### 🔹 **`draw_text_no_box`**

Draw single-line texts without bounding boxes:

- **Alignments:** Left, center, right from anchor point
- **RTL/LTR:** Correctly renders both RTL (Farsi/Arabic) and LTR texts

---

## 🌍 RTL Text Support (Farsi/Arabic)

This library automatically handles complex RTL scripts using:

- [`arabic-reshaper`](https://github.com/mpcabd/python-arabic-reshaper): For character reshaping.
- [`python-bidi`](https://github.com/MeirKriheli/python-bidi): For correct right-to-left rendering.

---

## 📂 Project Structure

```
your_project/
├── text_utils/
│   ├── __init__.py
│   └── text_utils.py
├── fonts/
│   └── Vazir.ttf
└── example_usage.py
```

---

## 🧩 Example Images and Results

*(Recommended)* Provide visual examples or screenshots showing text alignments and bounding-box results here.

---

## 🖌️ Customization

Edit global defaults directly in `text_utils.py`:

- Font sizes (`DEFAULT_FONT_SIZE`, etc.)
- Colors (`DEFAULT_COLOR`)
- Line spacing (`DEFAULT_LINE_SPACING`)

---

## 📝 License

This project is released under the MIT License.

```text
MIT License

Copyright (c) 2024 YourName

Permission is hereby granted, free of charge, to any person obtaining a copy...
```

*(Replace "YourName" and the year accordingly.)*

---

## 🚩 Contributing

Feel free to open issues, suggest improvements, or submit pull requests!

---

## 📖 Resources

- [Pillow Documentation](https://pillow.readthedocs.io/)
- [arabic-reshaper](https://github.com/mpcabd/python-arabic-reshaper)
- [python-bidi](https://github.com/MeirKriheli/python-bidi)

---

Enjoy using your improved `text_utils`! 🎉



Here's a clear, informative, and concise **`README.md`** file for your `news_paper_template` project:

---

# 🗞️ Newspaper Template Image Generator

A Python project that generates customized, realistic newspaper-style images with dynamically placed user images, headlines, event texts, and multi-calendar dates. Supports both RTL (Farsi, Arabic) and LTR (English) text rendering with auto-alignment and adaptive font sizing.

---

## 🚀 Quickstart

### 📌 Installation

1. Clone or download this repository.

2. Install dependencies using `pip`:

```bash
pip install -r requirements.txt
```

### 📌 Directory Structure

Ensure your project matches the structure below:

```
your_project/
├── templates/
│   ├── base_news_template.png
│   ├── Event0.png
│   ├── Event1.png
│   ├── Event2.png
│   └── Event3.png
├── fonts/
│   ├── Vazir.ttf
│   ├── Vazir-Bold.ttf
│   ├── TitrBold.ttf
│   ├── Amiri-Regular.ttf
│   ├── Roboto-Regular.ttf
│   └── Roboto-Bold.ttf
├── news_paper_template.py
├── text_utils/
│   ├── __init__.py
│   └── text_utils.py
├── requirements.txt
└── outputs/
```

---

## 🎯 Features

- ✅ **Dynamic Text Placement**:
  - Auto-adjust font sizes and alignment.
  - Flexible positioning based on number of events.
  
- ✅ **Multi-Calendar Support**:
  - Persian (Solar Hijri), Islamic (Arabic lunar), and Gregorian calendars displayed simultaneously.

- ✅ **Event Management**:
  - Automatically adjusts layout depending on the number of provided events (0 to 3).

- ✅ **RTL & LTR Text Support**:
  - Advanced handling of Farsi/Arabic text shaping and bidi rendering.

---

## ⚙️ Usage Example

```python
from news_paper_template import create_breaking_news_image

create_breaking_news_image(
    user_image_path="user_photos/photo.jpg",
    overline_text="خبر فوری",
    main_headline_text="رونمایی از فناوری جدید در تهران",
    event1_text="مراسم افتتاحیه برگزار شد",
    event2_text="سخنرانی وزیر ارتباطات",
    event3_text=None,
    output_path="outputs/breaking_news.jpg",
    days_into_future=2,
    dynamic_font_size=True,
    overline_font_size_delta=2,
    main_headline_font_size_delta=-1
)
```

---

## 📚 Customization Options

| Parameter | Description |
|-----------|-------------|
| `overline_font_size_delta` | Adjust font size of the small overline text (+/- pixels). |
| `main_headline_font_size_delta` | Adjust font size of main headline (+/- pixels). |
| `days_into_future` | How many days into the future the displayed date should be. |
| `dynamic_font_size` | Automatically resize fonts to fit bounding boxes (True/False). |

---

## 🖌️ Fonts Used

| Content | Font |
|---------|------|
| Overline (small headline) | `Vazir.ttf` |
| Main Headline | `TitrBold.ttf` |
| Events & Persian Month-Year | `Vazir.ttf` |
| Persian Day Number | `Vazir-Bold.ttf` |
| Arabic (Islamic) Date | `Amiri-Regular.ttf` |
| Gregorian Date | `Roboto-Regular.ttf` |
| Weekday Name | `Roboto-Bold.ttf` |

*(You can replace or add your own fonts easily by modifying the font files in the `fonts/` directory.)*

---

## 📆 Calendar Support

The generated images include dates from:

- **Persian (Solar Hijri)** – clearly split into day and month/year.
- **Islamic (Hijri lunar calendar)** – Arabic numerals.
- **Gregorian** – English formatted date and weekday name.

---

## 🛠 Dependencies

- [Pillow](https://pillow.readthedocs.io/) – Image processing.
- [arabic-reshaper](https://github.com/mpcabd/python-arabic-reshaper) & [python-bidi](https://github.com/MeirKriheli/python-bidi) – RTL text shaping.
- [convertdate](https://pypi.org/project/convertdate/) – Calendar conversions.

Install all via:

```bash
pip install Pillow arabic-reshaper python-bidi convertdate
```

---

## 🖼️ Examples & Screenshots

*(Include sample generated images here to visually demonstrate your template.)*

---

## 📃 License

Released under the MIT License. *(Replace with your preferred license if needed.)*

```text
MIT License

Copyright (c) 2024 YourName

Permission is hereby granted, free of charge, to any person obtaining a copy...
```

---

## 🌟 Contributing

Suggestions, improvements, and pull requests are warmly welcomed!

---

**Enjoy creating dynamic newspaper-style images! 📰✨**