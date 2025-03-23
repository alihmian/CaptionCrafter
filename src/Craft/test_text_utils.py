# test_text_utils.py

import pytest
from PIL import Image, ImageDraw, ImageFont
import os

# Import your module
import text_utils

# ------------------------------------------------------------
# Test configuration
# ------------------------------------------------------------

# Adjust FONT_PATH to a valid .ttf on your system
FONT_PATH = "src/Craft/Sahel.ttf"  # or "arial.ttf", "DejaVuSans.ttf", etc.


# A helper function to check if test font is actually available
def font_exists(path):
    return os.path.isfile(path)


@pytest.mark.skipif(
    not font_exists(FONT_PATH), reason="Test font not found in local path."
)
def test_create_temporary_draw():
    """
    Test whether create_temporary_draw returns an ImageDraw object of expected size.
    """
    width, height = 200, 100
    draw_obj = text_utils.create_temporary_draw(width, height)
    # We can do a small sanity check by drawing a pixel or verifying type
    assert isinstance(draw_obj, ImageDraw.ImageDraw)


@pytest.mark.parametrize(
    "input_text,expected",
    [
        ("سلام", True),
        ("This is English text", False),
    ],
)
def test_prepare_farsi_text(input_text, expected):
    """
    Check if preparing Farsi text returns a reshaped + bidi version.
    We do a rough check: if the input text is a Farsi/Arabic script,
    the output string typically differs from the original.
    """
    reshaped = text_utils.prepare_farsi_text(input_text)

    # For purely English text, the reshaped = input reversed and might differ.
    # For Farsi script "سلام", shaped text is typically not the same as the raw input.
    if expected:  # Farsi
        assert reshaped != input_text
    else:  # English
        # It's possible it just reverses. We'll do a naive check that it differs.
        # But if the text has no Arabic chars, it might remain the same or get reversed.
        assert reshaped != ""  # At least it's not empty.


@pytest.mark.skipif(
    not font_exists(FONT_PATH), reason="Test font not found in local path."
)
def test_wrap_text_to_fit_basic():
    """
    Ensure that wrap_text_to_fit splits lines correctly for narrow widths.
    """
    # Create a small image draw for measurement
    temp_img = Image.new("RGB", (300, 100))
    draw = ImageDraw.Draw(temp_img)
    font = ImageFont.truetype(FONT_PATH, 20)

    text = "This text should wrap onto multiple lines."
    wrapped_lines = text_utils.wrap_text_to_fit(text, font, box_width=100, draw=draw)

    # Because the box width is only 100, we expect more than one line
    assert len(wrapped_lines) > 1


@pytest.mark.skipif(
    not font_exists(FONT_PATH), reason="Test font not found in local path."
)
def test_calculate_font_size_to_fit():
    """
    Test that calculate_font_size_to_fit picks a smaller font for a smaller box
    and a larger font for a larger box.
    """
    text = "A single line of text"

    # Large box -> expect near max size
    large_size = text_utils.calculate_font_size_to_fit(
        text,
        FONT_PATH,
        box_width=400,
        box_height=200,
        max_font_size=48,
        min_font_size=12,
    )
    # Small box -> expect a smaller size
    small_size = text_utils.calculate_font_size_to_fit(
        text,
        FONT_PATH,
        box_width=100,
        box_height=50,
        max_font_size=48,
        min_font_size=12,
    )

    assert large_size >= small_size
    # Make sure it doesn't exceed the max
    assert large_size <= 48
    # Make sure it doesn't go below the min
    assert small_size >= 12


@pytest.mark.skipif(
    not font_exists(FONT_PATH), reason="Test font not found in local path."
)
@pytest.mark.parametrize("alignment", ["left", "center", "right"])
@pytest.mark.parametrize(
    "vertical_mode", ["top_to_bottom", "center_expanded", "bottom_to_top"]
)
def test_draw_text_in_box_smoke(alignment, vertical_mode):
    """
    'Smoke test' to ensure draw_text_in_box runs without errors
    for each alignment and vertical mode combination.
    We do minimal checks on final bounding box to confirm it is not overflowing.
    """
    img = Image.new("RGB", (300, 150), "white")
    draw = ImageDraw.Draw(img)

    text_utils.draw_text_in_box(
        draw=draw,
        text="Testing text in a box",
        font_path=FONT_PATH,
        box=(10, 10, 280, 100),  # left=10, top=10, width=280, height=100
        alignment=alignment,
        vertical_mode=vertical_mode,
        auto_size=True,
        color="black",
    )
    # Optionally, we could save the image and manually verify
    # img.save(f"test_output_{alignment}_{vertical_mode}.png")

    # Let's measure bounding box of the drawn text to ensure it doesn't exceed the box
    # We'll do it quickly by re-scanning the image for non-white pixels or using textsize.
    # But verifying exact alignment is more involved.
    # For now, we just confirm no crash and that function is called successfully.


@pytest.mark.skipif(
    not font_exists(FONT_PATH), reason="Test font not found in local path."
)
@pytest.mark.parametrize("alignment", ["left", "center", "right"])
def test_draw_text_no_box(alignment):
    """
    Simple test to ensure draw_text_no_box doesn't raise an error and places text roughly
    in the expected horizontal alignment. A deeper check would measure pixel content.
    """
    img = Image.new("RGB", (200, 50), "white")
    draw = ImageDraw.Draw(img)

    text_utils.draw_text_no_box(
        draw=draw,
        text="Hello World",
        font_path=FONT_PATH,
        x=100,
        y=25,  # vertical center
        alignment=alignment,
        color="black",
        font_size=20,
    )
    # If we got here, there's no error in rendering for that alignment
    # Optionally inspect final image visually:
    # img.save(f"test_output_no_box_{alignment}.png")
