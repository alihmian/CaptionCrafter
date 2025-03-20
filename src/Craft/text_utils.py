# text_utils.py

# External dependencies required:
# - Pillow:          pip install Pillow
# - arabic-reshaper: pip install arabic-reshaper
# - python-bidi:     pip install python-bidi


from PIL import Image, ImageDraw, ImageFont
import arabic_reshaper
from bidi.algorithm import get_display
from typing import List, Tuple, Optional, Union

# Default configuration constants
DEFAULT_COLOR: Union[str, Tuple[int, int, int]] = 'black'
DEFAULT_FONT_SIZE: int = 24
DEFAULT_LINE_SPACING: float = 1.0
DEFAULT_MAX_FONT_SIZE: int = 48
DEFAULT_MIN_FONT_SIZE: int = 12
DEFAULT_IS_RTL: bool = True


def create_temporary_draw(width: int, height: int) -> ImageDraw.ImageDraw:
    """
    Creates a temporary ImageDraw instance for text measurement.
    """
    temp_img = Image.new('RGB', (width, height))
    return ImageDraw.Draw(temp_img)


def prepare_farsi_text(text: str) -> str:
    """
    Prepares Farsi (RTL) text for correct rendering.

    Args:
        text (str): Original Farsi text.

    Returns:
        str: Properly shaped and bidi-handled text ready for rendering.
    """
    reshaped_text = arabic_reshaper.reshape(text)
    bidi_text = get_display(reshaped_text)
    return bidi_text

def wrap_text_to_fit(
    text: str,
    font: ImageFont.FreeTypeFont,
    box_width: int,
    draw: ImageDraw.ImageDraw
) -> List[str]:
    """
    Splits text into multiple lines to fit within a given pixel width.

    Args:
        text (str): Prepared RTL or normal text to wrap.
        font (ImageFont.FreeTypeFont): Font object to measure text.
        box_width (int): Pixel width of the bounding box.
        draw (ImageDraw.ImageDraw): Draw object for measuring text size.

    Returns:
        list[str]: List of lines wrapped to fit the given width.
    """
    words = text.split()
    lines = []
    current_line = ""

    for word in words:
        # Tentatively append word to the current line
        test_line = f"{current_line} {word}".strip() if current_line else word
        line_width, _ = draw.textsize(test_line, font=font)

        if line_width <= box_width:
            current_line = test_line
        else:
            if current_line:  # If the line has content, push to lines
                lines.append(current_line)
            current_line = word  # start new line with current word

    if current_line:  # Add the last line if not empty
        lines.append(current_line)

    return lines

def calculate_font_size_to_fit(
    text: str,
    font_path: str,
    box_width: int,
    box_height: int,
    max_font_size: int = DEFAULT_MAX_FONT_SIZE,
    min_font_size: int = DEFAULT_MIN_FONT_SIZE,
    line_spacing: float = DEFAULT_LINE_SPACING,
    is_rtl: bool = DEFAULT_IS_RTL
) -> int:
    """
    Determines the largest possible font size that fits the given text within specified box dimensions.

    Args:
        text (str): Original text (RTL or LTR).
        font_path (str): Path to the TrueType/OpenType font file.
        box_width (int): Width of the bounding box in pixels.
        box_height (int): Height of the bounding box in pixels.
        max_font_size (int): Largest font size to attempt.
        min_font_size (int): Smallest allowable font size.
        line_spacing (float): Line spacing multiplier. Default is 1.0 (normal spacing).
        is_rtl (bool): Indicates if text is right-to-left (e.g., Farsi). Default is True.

    Returns:
        int: Optimal font size that allows the text to fit within the box. Returns min_font_size if none fit.
    
    Example:
        optimal_size = calculate_font_size_to_fit("text", "font.ttf", 400, 200, 48, 12)
    """
    # Prepare RTL text if needed
    if is_rtl:
        text = prepare_farsi_text(text)

    # Temporary image and draw object for measurements
    draw = create_temporary_draw(box_width, box_height)


    # Start from max font size and decrement to min font size
    for font_size in range(max_font_size, min_font_size - 1, -1):
        # Create font object with current font size
        font = ImageFont.truetype(font_path, font_size)

        # Wrap text to fit box width
        lines = wrap_text_to_fit(text, font, box_width, draw)

        # Measure total text height (with line spacing)
        total_height = 0
        max_line_width = 0
        for line in lines:
            line_width, line_height = draw.textsize(line, font=font)
            max_line_width = max(max_line_width, line_width)
            total_height += line_height * line_spacing

        # Adjust total height by removing extra spacing after last line
        total_height -= (line_spacing - 1.0) * line_height

        # Check if dimensions fit inside box constraints
        if total_height <= box_height and max_line_width <= box_width:
            return font_size  # Found suitable font size

    # If no suitable size found, return the minimum font size
    return min_font_size



def draw_text_in_box(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_path: str,
    box: Tuple[int, int, int, int],
    alignment: str = 'center',
    vertical_mode: str = 'center_expanded',
    auto_size: bool = False,
    color: Union[str, Tuple[int, int, int]] = DEFAULT_COLOR,
    line_spacing: float = DEFAULT_LINE_SPACING,
    max_font_size: int = DEFAULT_MAX_FONT_SIZE,
    min_font_size: int = DEFAULT_MIN_FONT_SIZE,
    is_rtl: bool = DEFAULT_IS_RTL,
    font_size: Optional[int] = None
) -> None:
    """
    Draws text into a specified bounding box with alignment and vertical positioning options.
    
    Args:
        draw (ImageDraw.ImageDraw): Pillow drawing context.
        text (str): Text to render (Farsi or other languages).
        font_path (str): Path to TTF or OTF font file.
        box (tuple): Bounding box coordinates and dimensions (left, top, width, height).
                     Alternatively (x1, y1, x2, y2).
        alignment (str): Horizontal alignment ('left', 'center', 'right').
        vertical_mode (str): Vertical alignment mode ('top_to_bottom', 'center_expanded', 'bottom_to_top').
        auto_size (bool): Whether to automatically adjust font size to fit the box.
        kwargs: Optional parameters like:
            - color (str or tuple): Text color (default 'black').
            - line_spacing (float): Line spacing multiplier (default 1.0).
            - max_font_size (int): Max font size for auto-sizing (default 48).
            - min_font_size (int): Min font size for auto-sizing (default 12).
            - is_rtl (bool): Whether the text is right-to-left (default True).
    """
    # Extract box dimensions
    if len(box) == 4:
        left, top, width, height = box
        right = left + width
        bottom = top + height
    else:
        raise ValueError("Box must be in format (left, top, width, height).")



    # Prepare Farsi text if needed
    if is_rtl:
        prepared_text = prepare_farsi_text(text)
    else:
        prepared_text = text

    # Auto-size font or use provided font size
    if auto_size:
        font_size = calculate_font_size_to_fit(
            prepared_text, font_path, width, height,
            max_font_size, min_font_size, line_spacing, is_rtl
        )
    elif font_size is None:
        font_size = DEFAULT_FONT_SIZE

    # Load the font with determined size
    font = ImageFont.truetype(font_path, font_size)

    # Wrap text into multiple lines within the box width
    lines = wrap_text_to_fit(prepared_text, font, width, draw)

    # Calculate total height of text block with spacing
    line_heights = [draw.textsize(line, font=font)[1] for line in lines]
    total_text_height = sum(line_heights) + (len(lines) - 1) * (line_spacing - 1) * line_heights[0]

    # Determine starting y-coordinate based on vertical_mode
    if vertical_mode == 'top_to_bottom':
        current_y = top
    elif vertical_mode == 'center_expanded':
        current_y = top + (height - total_text_height) / 2
    elif vertical_mode == 'bottom_to_top':
        current_y = bottom - total_text_height
    else:
        raise ValueError("vertical_mode must be 'top_to_bottom', 'center_expanded', or 'bottom_to_top'.")

    # Draw each line with specified horizontal alignment
    for idx, line in enumerate(lines):
        line_width, line_height = draw.textsize(line, font=font)

        # Horizontal alignment calculation
        if alignment == 'left':
            current_x = left
        elif alignment == 'center':
            current_x = left + (width - line_width) / 2
        elif alignment == 'right':
            current_x = right - line_width
        else:
            raise ValueError("alignment must be 'left', 'center', or 'right'.")

        # Draw the line
        draw.text((current_x, current_y), line, font=font, fill=color)

        # Update y-coordinate for next line
        current_y += line_height * line_spacing





def draw_text_no_box(
    draw: ImageDraw.ImageDraw,
    text: str,
    font_path: str,
    x: int,
    y: int,
    alignment: str = 'left',
    color: Union[str, Tuple[int, int, int]] = DEFAULT_COLOR,
    font_size: int = DEFAULT_FONT_SIZE,
    is_rtl: bool = DEFAULT_IS_RTL
) -> None:
    """
    Draws text at a given anchor point (x, y) without bounding box constraints.

    Args:
        draw (ImageDraw.ImageDraw): Pillow drawing context.
        text (str): Text to render.
        font_path (str): Path to the TTF/OTF font file.
        x (int): Horizontal anchor coordinate.
        y (int): Vertical anchor coordinate.
        alignment (str): Horizontal alignment relative to the anchor ('left', 'right', 'center').
        kwargs: Optional parameters including:
            - color (str or tuple): Text color (default 'black').
            - font_size (int): Desired font size (default 24).
            - is_rtl (bool): Whether the text is right-to-left (default True).
    """


    # Prepare Farsi text if needed
    if is_rtl:
        prepared_text = prepare_farsi_text(text)
    else:
        prepared_text = text

    # Load the font
    font = ImageFont.truetype(font_path, font_size)

    # Measure text dimensions
    text_width, text_height = draw.textsize(prepared_text, font=font)

    # Adjust x based on horizontal alignment
    if alignment == 'right':
        adjusted_x = x - text_width
    elif alignment == 'center':
        adjusted_x = x - text_width / 2
    elif alignment == 'left':
        adjusted_x = x
    else:
        raise ValueError("alignment must be 'left', 'center', or 'right'.")

    # Draw text on the image
    draw.text((adjusted_x, y), prepared_text, font=font, fill=color)



# (Keep draw_text_in_box and draw_text_no_box as previously implemented, with improvements applied.)

# --- Usage Examples ---
#
# img = Image.new('RGB', (800, 400), 'white')
# draw = ImageDraw.Draw(img)
# 
# draw_text_in_box(draw, "متن تست فارسی", "font.ttf",
#                  box=(50, 50, 700, 300),
#                  alignment='center',
#                  vertical_mode='center_expanded',
#                  auto_size=True,
#                  color='blue')
# img.show()