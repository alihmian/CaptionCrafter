Below is a suggested plan to organize your project. You will have:

1. **A general text utility library** (e.g. `text_utils.py`) that focuses on:
   - Handling text (single-line or multi-line).
   - Handling bounding box geometry (top-to-bottom, expand from center, bottom-to-top).
   - Handling horizontal alignment (left, center, right).
   - Automatically sizing the font if desired (filling the box as large as possible).

2. **Template modules** (e.g. `breaking_news_template.py`, `newspaper_template.py`, …) each of which:
   - Defines the layout for that specific design.
   - Imports and uses the text utility functions from `text_utils.py` (or wherever the library resides).
   - Receives the user’s image(s) and text lines, then applies them to the template coordinates.

3. **A main entry point** (e.g. `generate_image.py`) that:
   - Receives user input (template choice, text strings, images).
   - Calls the appropriate template module’s function to build and save the final image.

---

## 1. Text Utility Library

This module handles text rendering, alignment, and bounding box logic. Below is a proposed structure:

### 1.1 Function: `calculate_font_size_to_fit(text, font_path, box_width, box_height, max_font_size, min_font_size, line_spacing=1.0)`
- **Purpose**: Determine the largest possible font size that makes the text (potentially multi-line) fit within the given box.
- **Inputs**:
  - `text`: The string of text (or possibly a list of lines) to measure.
  - `font_path`: Path to the TrueType/OpenType font file.
  - `box_width`, `box_height`: Dimensions of bounding box.
  - `max_font_size`, `min_font_size`: Upper/lower bounds for trial font sizes.
  - `line_spacing`: Multiplier for extra spacing between lines (1.0 means default line spacing, 1.2 is 20% extra, etc.).
- **Outputs**: 
  - A suitable `font_size` that allows the text to fit or the minimum if it never fits.
  
Implementation outline:
1. Start from `max_font_size` and go down until you find a size that fits (or reach `min_font_size`).
2. To test fit: 
   - Create a temporary `ImageDraw` object, load `ImageFont.truetype(font_path, size=font_size)`.
   - Split text into lines (or break text into multi-lines if necessary).
   - Accumulate the total height needed: sum of each line’s text height plus line spacing in between.
   - The max width is the widest line of text.
3. If the total height and max width are within the box, you have a fit. Otherwise, decrement size and try again.

---

### 1.2 Function: `wrap_text_to_fit(text, font, box_width)`
- **Purpose**: Splits text into multiple lines so none exceed the box width.  
- **Inputs**:
  - `text`: The entire string to be displayed (could be multiline or single line).
  - `font`: An `ImageFont` object for measuring text.
  - `box_width`: The max line width allowed.
- **Outputs**:
  - List of lines that fit into the given width.
  
Implementation outline:
1. Split the text by spaces or existing line breaks.
2. Accumulate words into a current line until adding another word would exceed `box_width`.
3. Move to the next line when the line can no longer fit further words.
4. Return the lines in a list.

---

### 1.3 Function: `draw_text_in_box(draw, text, font_path, box, alignment, vertical_mode, auto_size=False, **kwargs)`
- **Purpose**: The main high-level function that draws text into a bounding box with the requested alignment and vertical expansion logic.
- **Inputs**:
  1. `draw`: An `ImageDraw` instance from Pillow (e.g., `draw = ImageDraw.Draw(image)`).
  2. `text`: The string to be drawn (could be multiline).
  3. `font_path`: Path to the font file (for dynamic font creation).
  4. `box`: A tuple `(left, top, width, height)` describing the bounding box coordinates and dimensions. 
     - Alternatively `(x1, y1, x2, y2)` can be used if you prefer top-left/bottom-right style.
  5. `alignment`: One of `('left', 'center', 'right')` for horizontal alignment.
  6. `vertical_mode`: One of `('top_to_bottom', 'center_expanded', 'bottom_to_top')`.
  7. `auto_size` (bool): If `True`, will call the font-sizing function to fill the box as large as possible without exceeding it.
  8. `kwargs`: Could include text color, line spacing, max font size, min font size, etc.
- **Outline**:
  1. If `auto_size` is `True`, call `calculate_font_size_to_fit` to get an optimal `font_size`.
  2. Otherwise, use a `font_size` from `kwargs` or a default.
  3. Construct the font object with `ImageFont.truetype(font_path, font_size)`.
  4. Use `wrap_text_to_fit` if you want to ensure lines do not exceed `box_width`.
  5. Measure total height of the lines + spacing.
  6. Based on `vertical_mode`, compute the starting `y` coordinate:
     - `top_to_bottom`: Start at `box.top`.
     - `center_expanded`: Start so that the entire block of text is centered vertically in `box`. (If multiple lines, it starts above center so that the text block is centered overall.)
     - `bottom_to_top`: Start near `box.top + box.height`, but text flows upward (or you can interpret it so each new line is placed one “line height” above).
  7. For each line, measure the line’s width. Based on `alignment`:
     - `left`: `x = box.left`.
     - `center`: `x = (box.left + box.right - line_width) / 2`.
     - `right`: `x = box.right - line_width`.
  8. Draw each line (e.g., `draw.text((x, y), line, font=font, fill=kwargs.get('color', 'black'))`).
  9. Increment or decrement `y` for the next line, depending on the vertical mode.

**Notes**:
- For the “expand from center” (vertically) approach, you essentially want to center the entire block in the box if it’s a single line, but if multiple lines exist, shift the top line up so that the center of the multi-line block still sits at the box’s vertical center.
- For “bottom_to_top”, you typically start from the bottom of the box. You have to decide if line 1 is the bottom-most line or if you reverse the line order. (In typical English text, the first line is top-most, but you could invert it if desired. Up to your design choice.)

---

### 1.4 Function: `draw_text_no_box(draw, text, font_path, x, y, alignment='left', **kwargs)`
- **Purpose**: For text without bounding box constraints, draw a single line (or still multiline if you want) from left to right or right to left.
- **Inputs**:
  - `draw`: `ImageDraw` instance.
  - `text`: The text string.
  - `font_path`: The font path or an `ImageFont` object.
  - `x, y`: The anchor point.
  - `alignment`: `'left'` or `'right'` (center is also possible, but you probably only need left or right if it’s truly free-floating text).
  - `kwargs`: could include color, font_size, etc.
- **Implementation**:
  1. Build an `ImageFont`.
  2. Measure text width with `font.getsize(text)[0]`.
  3. If alignment is `right`, set `x = x - text_width`.
  4. Draw the text at `(x, y)`.

---

## 2. Template Modules

Create one Python file per template. For example:

### 2.1 `breaking_news_template.py`
- **Function**: `create_breaking_news_image(user_image_path, headline_text, output_path, font_size_delta, dynamic_font_size, headline_font_size_delta , **kwargs)`
- **Steps**:
  1. Load a background or base template (if you have a static “breaking news” background).
  2. Load the user’s image, resize/crop if needed, and paste onto the template.
  3. load and past overlay image. it is the size of the base.

  4. Use your text utility functions:
     - For the `headline_text` bounding box, define `(left, top, width, height)`.  
     - Call `draw_text_in_box(...)` with  `alignment='right'`, `vertical_mode='top_to_button'`, etc.
  5. persian date (only month and day) + time.
  5. Save or return the final image.

### 2.2 `newspaper_template.py`
- **Function**: `create_breaking_news_image(user_image_path, overline_text, main_headline_text, output_path, event1_text, event2_text, event3_text, days_into_future, dynamic_font_size, overline_font_change, main_headline_font_change)`
- **args**:
...
`overline_font_change` : int how much font size should change (positve bigger, negative smaller, overline_font_change = default + overline_font_change ). pleas also find an appropriate name.
...
- **Steps**:
  1. Load a background or base template 
  2. Load the user’s image, resize/crop if needed, and paste onto the template.
  3. Count the number of events, based on that chose overlay image (Event0-1-2-3). past overlay image. is is the size of the base.
  4. Use your text utility functions:
     - For the `overline_text` no box, define `(left, top, width, height)`.  
     - Call `draw_text_no_box(...)` with `alignment='center'`, etc.
  5. Use your text utility functions:
     - For the `Event1_text` no box, define `(left, top, width, height)`.  
     - Call `draw_text_no_box(...)` with `alignment='right'`,  etc.
   6.  Use your text utility functions:
     - For the `main_headline_text` bounding box, define `(left, top, width, height)`.  
      - Call `draw_text_in_box(...)` with `alignment='center'`, `vertical_mode='center_expanded'`, etc.
  7. based on the number of days into future, calculate date in persian , arabic and english calendar and weekday. split persian date into day and month + year.then use text utility.
  5. Save or return the final image.
### 2.3 Other template modules
- Same pattern, each file knows the layout and calls the library to place text in the right places.

---

## 3. Main Entry Point

A script named `generate_image.py` (or `main.py`) might:
1. Parse CLI arguments or accept function parameters for:
   - `template_type` (e.g. `'breaking_news'`, `'newspaper'`).
   - `user_image_path`.
   - `text_lines` or relevant text fields.
2. Call the corresponding template module function:
   ```python
   if template_type == 'breaking_news':
       create_breaking_news_image(user_image_path, headline_text, subheader_text, output_path, **kwargs)
   elif template_type == 'newspaper':
       create_newspaper_image(user_image_path, headline_text, body_text, date_text, output_path, **kwargs)
   ...
   ```
3. Output a final image in whatever format the user wants (JPEG, PNG, etc.).

---

## 4. Summary of the Flow

1. **User** chooses template and provides:
   - Image file path(s).
   - Text strings for the fields that template needs.
   - Any special parameters (colors, sizes, etc.).
2. **Main** calls the relevant template creation function.
3. **Template** calls:
   - **Text Utility** to place text with the desired alignment and bounding-box constraints.
   - Pillow (`Image`, `ImageDraw`) to assemble images and text.
4. **Template** saves final image or returns it.

---

## 5. Implementation Tips

- **Pillow**: 
  - `Image.open(path)` to load images.
  - `ImageDraw.Draw(image)` to get a `draw` handle.
  - `ImageFont.truetype(font_path, size=42)` to build fonts.
  - `.textsize(...)` or `.getsize(...)` to measure text width/height with a given font.

- **Handling Many Alignments**:  
  You can have a single function that looks at `alignment` in `[left|center|right]` and `vertical_mode` in `[top_to_bottom | center_expanded | bottom_to_top]`, or you can break them into smaller specialized functions (like `draw_left_align_top_to_bottom()`, etc.). A single function is usually easier to maintain if you keep the code readable.

- **Edge Cases**:
  - Very short or empty text.
  - Very small bounding box (text doesn’t fit even at min size).
  - Very long text requiring multiple lines.

- **Performance**: 
  - Fitting text to a box with repeated measure operations can be slower for very large fonts or large text. A binary search approach for font size might be more efficient than decrementing from `max_font_size` one by one.

---

## Example Sketch of Core Function

Below is a pseudo-code snippet for a function that handles the core “draw text in box” logic. Adjust as you see fit:

```python
from PIL import Image, ImageDraw, ImageFont

def draw_text_in_box(draw, text, font_path, box, alignment='center', vertical_mode='center_expanded',
                     auto_size=False, color='black', max_font_size=100, min_font_size=10, line_spacing=1.0):

    left, top, width, height = box  # or parse differently if it's (x1, y1, x2, y2)

    if auto_size:
        font_size = calculate_font_size_to_fit(
            text=text,
            font_path=font_path,
            box_width=width,
            box_height=height,
            max_font_size=max_font_size,
            min_font_size=min_font_size,
            line_spacing=line_spacing
        )
    else:
        font_size = max_font_size  # or some default

    # Build the font
    font = ImageFont.truetype(font_path, font_size)
    
    # Wrap text to fit width
    lines = wrap_text_to_fit(text, font, box_width=width)
    
    # Measure total height
    total_text_height = 0
    line_heights = []
    for line in lines:
        w, h = draw.textsize(line, font=font)
        line_heights.append(h)
        total_text_height += h
    # Add spacing
    total_text_height += (len(lines) - 1) * (line_heights[0] * (line_spacing - 1))
    
    # Calculate starting Y
    if vertical_mode == 'top_to_bottom':
        current_y = top
    elif vertical_mode == 'center_expanded':
        # center the block
        current_y = top + (height - total_text_height) / 2
    elif vertical_mode == 'bottom_to_top':
        # start near bottom so text flows upward
        current_y = top + height - total_text_height
    else:
        # default or raise an error
        current_y = top

    # Draw each line
    for i, line in enumerate(lines):
        line_width, line_height = draw.textsize(line, font=font)
        
        # spacing offset
        if i > 0:
            # offset by line_height * (line_spacing - 1) if you want extra spacing
            current_y += line_heights[i-1] * (line_spacing)

        # X alignment
        if alignment == 'left':
            x = left
        elif alignment == 'center':
            x = left + (width - line_width) / 2
        elif alignment == 'right':
            x = left + (width - line_width)
        else:
            x = left  # fallback

        draw.text((x, current_y), line, fill=color, font=font)

        current_y += line_height  # move down to next line
```

With this kind of function, you can accommodate almost all your box-based text placement needs by passing different alignment/vertical_mode parameters.

---

## Conclusion

- **Centralize** text geometry and sizing in one utility module (`text_utils.py`).
- **Implement** individual templates as separate modules, each describing the coordinates of boxes (or the free-floating text positions).
- **Use** a main script to tie everything together for the user interface or API.  

This structure will keep your code maintainable, let you easily add more templates, and ensure a consistent approach to text alignment and layout. 

Feel free to customize or split functions into smaller ones (e.g., separate “measure text block,” “draw lines,” “wrap text,” etc.) as your project grows.


Below is some additional guidance and recommendations specifically for working with **Farsi (Persian)** text (or other RTL scripts like Arabic, Urdu, etc.), along with pointers to libraries and tools that can save you from reinventing the wheel.  

---

## 1. Handling Farsi (RTL) Text in Python

### 1.1 The Challenge: Shaping & Bi-directional Text

- **Farsi** is written right-to-left (RTL).
- **Glyph shaping**: Arabic-based scripts (including Farsi) have connected letters that change forms depending on context (initial, medial, final, isolated).
- **Bi-directional text**: Farsi may contain numbers or words in left-to-right contexts, so you need to handle possible LTR segments within an RTL sentence.

**Pillow (PIL)** by itself does not fully handle complex text shaping. If you supply it “raw” Farsi text, letters might not connect properly, or might appear reversed or disjointed.  

To fix this:
1. **Shape** the text using a library like [arabic-reshaper](https://pypi.org/project/arabic-reshaper/).  
2. **Apply BiDi** (bi-directional) layout with [python-bidi](https://pypi.org/project/python-bidi/).  

The usual pipeline for Farsi text is:
```python
from arabic_reshaper import reshape
from bidi.algorithm import get_display

text = "مثال فارسی ..."
reshaped_text = reshape(text)      # convert to proper connected forms
bidi_text = get_display(reshaped_text)  # ensure correct right-to-left rendering
```
Now, `bidi_text` is what you pass to Pillow’s `ImageDraw.text()` method.  

**Note**: If your text is purely RTL and does not contain LTR segments (like English words or numbers), sometimes the shaping alone might suffice. But if you have numbers or mixing, `python-bidi` is usually necessary.

### 1.2 Alternative: Using Pango / HarfBuzz / Cairo

For the best typography of complex scripts, you can use:
- **Pango** or **Qt** or **HarfBuzz** libraries to do advanced text layout.
- Then render onto an image surface (via Cairo, for instance).

However, this can be more complex to set up. The combination `arabic-reshaper + python-bidi + PIL` is usually enough for short text in Farsi.

---

## 2. Text Wrapping / Alignment Tools

### 2.1 Python’s `textwrap` Standard Library
- You can use [`textwrap.wrap()`](https://docs.python.org/3/library/textwrap.html#textwrap.wrap) to break text into lines of a given width in characters.  
- **But** `textwrap` is not font-aware: it just wraps based on character count or approximate width, not the actual rendered width. For accurate bounding box measurement, you often still need to measure lines via Pillow’s `draw.textsize()` or `font.getsize()`.

### 2.2 Existing Pillow-based Solutions
- There are various gists and small libraries on GitHub that already handle **“draw multiline text in a box”** for Pillow.  
  - For example, “pillow-utils” or similar.  
  - Many revolve around the same approach: break text into lines that fit your `box_width`, then handle alignment.

Realistically, you’ll still need some custom logic for:
- **Vertical alignment** (centered, top-to-bottom, bottom-to-top).
- **Dynamic font sizing** to fill the box.

That said, the snippet in the previous answer can be adapted to Farsi—just remember to reshape+bidi your text beforehand, and then do the measurement.

---

## 3. Libraries & Tools to Reuse

1. **Pillow** (a.k.a. `PIL Fork`):
   - Main image manipulation library.  
   - [Documentation](https://pillow.readthedocs.io/en/stable/).

2. **arabic-reshaper**:
   - [PyPI link](https://pypi.org/project/arabic-reshaper/).
   - Correctly reshapes the characters for Arabic/Farsi scripts.

3. **python-bidi**:
   - [PyPI link](https://pypi.org/project/python-bidi/).
   - Applies the Unicode BiDi algorithm so text with mixed RTL/LTR sections is displayed properly.

4. **textwrap (builtin)**:
   - Basic text wrapping by characters or word boundaries, but not pixel-perfect.

5. **PyCairo, PyPango (optional)**:
   - If you want the ultimate solution for typographic correctness in Arabic-based scripts. 
   - Higher setup overhead, but you get “real” advanced text shaping and layout.

---

## 4. Putting it all together for Farsi

Below is a **high-level approach** you can integrate into the previously discussed plan:

1. **Prepare your text**:
   ```python
   from arabic_reshaper import reshape
   from bidi.algorithm import get_display

   def prepare_farsi_text(text):
       reshaped = reshape(text)
       return get_display(reshaped)  # final shaped, RTL text
   ```

2. **Measure and wrap lines** in a function that uses `draw.textsize()` to find where to break lines so they fit within `box_width`. For instance:
   ```python
   def wrap_farsi_text_to_fit(text, font, box_width, draw):
       words = text.split(' ')
       lines = []
       current_line = ""

       for word in words:
           test_line = current_line + " " + word if current_line else word
           w, h = draw.textsize(test_line, font=font)
           if w <= box_width:
               current_line = test_line
           else:
               lines.append(current_line)
               current_line = word
       if current_line:
           lines.append(current_line)

       return lines
   ```
   - Here you could refine the logic for punctuation and handle the fact that Farsi is RTL. 
   - Actually, since the shaped text is stored in a visually reversed order (for left-to-right drawing), you might still think in terms of “words” from left to right. It usually still works. If you find it confusing, you can do your “word splitting” **before** you do `get_display()`, but typically you want to measure the final shaped text because that’s what will be drawn.

3. **Draw the text** using the approach in the previous answer, but:
   - Instead of `'left'`, `'center'`, `'right'` alignment in an LTR sense, you often want `'right'` alignment for Farsi if your text box is anchored on the right side.
   - Or if you want to center it, `'center'` is fine.  
   - If you truly want a “right to left” box, you can place your “start” coordinate at the right edge. But since you are giving `draw.text()` the shaped text, `draw.text()` still draws from left to right in screen coordinates. So typically you measure the text width, then compute `x = box_right - line_width` for “RTL alignment.”  

4. **Auto-sizing**:
   - Use the same approach: a loop or binary search from `max_font_size` down to `min_font_size`. 
   - For each candidate size, you:
     1. `font = ImageFont.truetype(font_path, size)`
     2. `lines = wrap_farsi_text_to_fit(bidi_text, font, box_width, draw)`
     3. measure total height
     4. if it fits, done
     5. else reduce size

5. **Reuse**:
   - For your custom alignment modes (top-to-bottom, bottom-to-top, center-expanding), the same geometry logic applies. 
   - Just make sure to handle the fact that lines are visually right-aligned or center-aligned if it’s for Farsi.

---

## 5. Conclusion

- **Core Libraries**:
  1. **Pillow** – For image creation and drawing.
  2. **arabic-reshaper** + **python-bidi** – For correct RTL shaping in Farsi.
  3. **(Optional) Pango/Cairo** – For advanced typography, but more setup.  
- **Already Existing “Wrap and Align” Utilities**: You’ll find some code snippets on GitHub if you search “PIL text wrap multiline Arabic” or “Pillow multiline text Arabic.” However, you’ll likely still adapt them to your own bounding-box alignment logic (top/bottom/center).  
- **Minimize Re-implementation**: Use standard libraries or well-known packages (like `textwrap` for simple line splitting, though it’s not pixel-based). For more robust text measurement, you do still need to call `draw.textsize()` to confirm each line’s width in pixels.

With the above approach, you’ll have a flexible system that correctly renders Farsi text in your templates—without writing all the shaping or alignment code from scratch.