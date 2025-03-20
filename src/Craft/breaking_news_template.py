from PIL import Image, ImageDraw
from datetime import datetime
from convertdate import persian
from text_utils import draw_text_in_box, draw_text_no_box
from typing import Optional

def create_breaking_news_image(
    user_image_path: str,
    headline_text: str,
    output_path: str,
    font_size_delta: int = 0,
    dynamic_font_size: bool = True,
    headline_font_size_delta: int = 0,
    **kwargs
) -> None:
    """
    Generates a breaking news image with headline, Persian date, and time.

    Args:
        user_image_path (str): Path to the user image to embed.
        headline_text (str): The main headline text.
        output_path (str): Where to save the final image.
        font_size_delta (int): General font size delta (optional).
        dynamic_font_size (bool): If True, auto-adjusts font size to fit.
        headline_font_size_delta (int): Font size tweak specifically for headline.
        **kwargs: Additional arguments passed to text utility functions.
    """

    # Load base template and overlay
    base_img = Image.open("templates/breaking_news_base.png").convert("RGBA")
    overlay_img = Image.open("templates/breaking_news_overlay.png").convert("RGBA")
    base_img = Image.alpha_composite(base_img, overlay_img)
    draw = ImageDraw.Draw(base_img)

    # Load and paste user image
    user_img = Image.open(user_image_path).convert("RGBA")
    user_img_resized = user_img.resize((600, 400))  # Adjust size as needed
    base_img.paste(user_img_resized, (50, 100), user_img_resized)

    # Fonts
    fonts = {
        "headline": "fonts/TitrBold.ttf",
        "datetime": "fonts/Vazir.ttf"
    }

    # Draw Headline Text
    headline_box = (700, 100, 500, 300)  # (left, top, width, height)
    base_font_size = 44 + font_size_delta + headline_font_size_delta

    draw_text_in_box(
        draw=draw,
        text=headline_text,
        font_path=fonts["headline"],
        box=headline_box,
        alignment="right",
        vertical_mode="top_to_bottom",
        auto_size=dynamic_font_size,
        font_size=base_font_size,
        color="white",
        is_rtl=True,
        **kwargs
    )

    # Get Persian date and current time
    now = datetime.now()
    p_year, p_month, p_day = persian.from_gregorian(now.year, now.month, now.day)
    time_str = now.strftime("%H:%M")
    persian_date_str = f"{p_day} {persian.MONTHS[p_month]}"

    # Draw Persian date (month + day)
    draw_text_no_box(
        draw=draw,
        text=persian_date_str,
        font_path=fonts["datetime"],
        x=700,
        y=420,
        alignment="right",
        font_size=24 + font_size_delta,
        color="white",
        is_rtl=True
    )

    # Draw Time
    draw_text_no_box(
        draw=draw,
        text=time_str,
        font_path=fonts["datetime"],
        x=700,
        y=450,
        alignment="right",
        font_size=24 + font_size_delta,
        color="white",
        is_rtl=False  # Time is LTR
    )

    # Save final output
    base_img.convert("RGB").save(output_path, format="JPEG", quality=95)
