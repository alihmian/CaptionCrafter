# breaking_news_template.py

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
    **kwargs,
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

    # Load base template
    base_img = Image.open(
        "./assets/templates/Breaking News/breaking_news_base.png"
    ).convert("RGBA")

    # base_img = Image.alpha_composite(base_img, overlay_img)
    draw = ImageDraw.Draw(base_img)

    # Load and paste user image
    user_img = Image.open(user_image_path).convert("RGBA")

    # Define the target region (left, top, right, bottom)
    region = (1890, 0, 4000, 2520)  # Example values

    # Resize user_img to match the region size
    region_width = region[2] - region[0]
    region_height = region[3] - region[1]
    resized_user_img = user_img.resize((region_width, region_height))

    # Paste resized image into the region on base_img
    base_img.paste(resized_user_img, region, resized_user_img)

    overlay_img = Image.open(
        "./assets/templates/Breaking News/breaking_news_overlay.png"
    ).convert("RGBA")
    base_img.paste(overlay_img, (0, 0), overlay_img)

    # Fonts
    fonts = {
        "headline": "./assets/Font/Anjoman-SuperHeavy.ttf",
        "datetime": "./assets/Font/Sahel.ttf",
    }

    # Draw Headline Text
    headline_box = (1080, 2550, 2820, 444)  # (left, top, width, height)
    base_font_size = 140 + font_size_delta

    draw_text_in_box(
        draw=draw,
        text=headline_text,
        font_path=fonts["headline"],
        box=headline_box,
        alignment="right",
        vertical_mode="center_expanded",
        auto_size=dynamic_font_size,
        font_size=base_font_size,
        color="black",
        line_spacing = 1.5,
        is_rtl=True,
        **kwargs,
    )

    # # Get Persian date and current time
    # now = datetime.now()
    # p_year, p_month, p_day = persian.from_gregorian(now.year, now.month, now.day)
    # time_str = now.strftime("%H:%M")
    # persian_date_str = f"{p_day} {persian.MONTHS[p_month]}"

    # # Draw Persian date (month + day)
    # draw_text_no_box(
    #     draw=draw,
    #     text=persian_date_str,
    #     font_path=fonts["datetime"],
    #     x=700,
    #     y=420,
    #     alignment="right",
    #     font_size=24 + font_size_delta,
    #     color="white",
    #     is_rtl=True,
    # )

    # # Draw Time
    # draw_text_no_box(
    #     draw=draw,
    #     text=time_str,
    #     font_path=fonts["datetime"],
    #     x=700,
    #     y=450,
    #     alignment="right",
    #     font_size=24 + font_size_delta,
    #     color="white",
    #     is_rtl=False,  # Time is LTR
    # )

    # Save final output
    base_img.convert("RGB").save(output_path, format="JPEG", quality=95)


create_breaking_news_image(
    "assets/user_image.jpg",
    "خبری خیلی خیلی فوری",
    # "یک، دو، سه، چهار، پنج، شش، هفت، هشت، نه، ده، یازده، دوازده، سیزده، چهارده، پانزده، شانزده، هفده، هجده، نوزده، بیست، بیست و یک، بیست و دو، بیست و سه، بیست و چهار، بیست و پنج، بیست و شش، بیست و هفت، بیست و هشت، بیست و نه، سی، سی و یک، سی و دو، سی و سه، سی و چهار، سی و پنج، سی و شش، سی و هفت، سی و هشت، سی و نه، چهل، چهل و یک، چهل و دو، چهل و سه، چهل و چهار، چهل و پنج، چهل و شش، چهل و هفت، چهل و هشت، چهل و نه، پنجاه، پنجاه و یک، پنجاه و دو، پنجاه و سه، پنجاه و چهار، پنجاه و پنج، پنجاه و شش، پنجاه و هفت، پنجاه و هشت، پنجاه و نه، شصت، شصت و یک، شصت و دو، شصت و سه، شصت و چهار، شصت و پنج، شصت و شش، شصت و هفت، شصت و هشت، شصت و نه، هفتاد، هفتاد و یک، هفتاد و دو، هفتاد و سه، هفتاد و چهار، هفتاد و پنج، هفتاد و شش، هفتاد و هفت، هفتاد و هشت، هفتاد و نه، هشتاد، هشتاد و یک، هشتاد و دو، هشتاد و سه، هشتاد و چهار، هشتاد و پنج، هشتاد و شش، هشتاد و هفت، هشتاد و هشت، هشتاد و نه، نود، نود و یک، نود و دو، نود و سه، نود و چهار، نود و پنج، نود و شش، نود و هفت، نود و هشت، نود و نه، صد.",
    "assets/OutPut/breaking_news_output.png",
    dynamic_font_size=True,
)
