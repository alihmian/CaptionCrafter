from PIL import Image, ImageDraw
from datetime import datetime
from convertdate import persian
from text_utils import draw_text_in_box, draw_text_no_box
from date_util import shamsi, clock_time
from typing import Optional
import argparse

DEFAULT_IS_RTL: bool = False


def create_breaking_news_image(
    user_image_path: str,
    headline_text: str,
    output_path: str,
    font_size_delta: int = 0,
    dynamic_font_size: bool = True,
    composed: bool = False,  # New boolean parameter.
    **kwargs,
) -> None:
    """
    Generates a breaking news image with headline, Persian date, and time.

    If 'composed' is True, then the provided user_image_path is assumed to be a pre-composed
    image that already includes the user image and overlay, so the function only adds text.
    Otherwise, it loads the base template, composites the user image and overlay, and then adds text.

    Args:
        user_image_path (str): Path to the user image to embed or to a pre-composed base image.
        headline_text (str): The main headline text.
        output_path (str): Where to save the final image.
        font_size_delta (int): General font size delta (optional).
        dynamic_font_size (bool): If True, auto-adjusts font size to fit.
        composed (bool): If True, assumes the base image is already composed (user image & overlay applied).
        **kwargs: Additional arguments passed to text utility functions.
    """
    if composed:
        # Use the pre-composed image directly.
        base_img = Image.open(user_image_path).convert("RGBA")
        draw = ImageDraw.Draw(base_img)
    else:
        # Load base template and compose with the user image and overlay.
        base_img = Image.open(
            "./assets/templates/Breaking News/breaking_news_base.png"
        ).convert("RGBA")
        draw = ImageDraw.Draw(base_img)

        # Load and paste the user image.
        user_img = Image.open(user_image_path).convert("RGBA")
        # Define the target region (left, top, right, bottom)
        region = (1890, 0, 4000, 2520)  # Example values
        region_width = region[2] - region[0]
        region_height = region[3] - region[1]
        resized_user_img = user_img.resize((region_width, region_height))
        base_img.paste(resized_user_img, region, resized_user_img)

        # Apply overlay.
        overlay_img = Image.open(
            "./assets/templates/Breaking News/breaking_news_overlay.png"
        ).convert("RGBA")
        base_img.paste(overlay_img, (0, 0), overlay_img)

    # Fonts.
    fonts = {
        "headline": "./assets/Font/Anjoman-Black.ttf",
        "datetime": "./assets/Font/Sahel-Black-FD.ttf",
    }

    # Draw Headline Text.
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
        line_spacing=1.5,
        is_rtl=DEFAULT_IS_RTL,
        **kwargs,
    )

    # Draw Persian date (month + day).
    persian_date_str = shamsi(year=False, month=True, day=True)

    draw_text_no_box(
        draw=draw,
        text=persian_date_str,
        font_path=fonts["datetime"],
        x=450,
        y=3600,
        alignment="left",
        font_size=100,
        color=(109, 105, 115),
        is_rtl=DEFAULT_IS_RTL,
    )

    # Draw Time.
    time_str = clock_time()
    draw_text_no_box(
        draw=draw,
        text=time_str,
        font_path=fonts["datetime"],
        x=450,
        y=3750,
        alignment="left",
        font_size=100,
        color=(109, 105, 115),
        is_rtl=DEFAULT_IS_RTL,
    )

    # Save final output.
    base_img.convert("RGB").save(output_path, format="JPEG", quality=95)


# if __name__ == "__main__":
#     create_breaking_news_image(
#         user_image_path="assets/user_image.jpg",
#         headline_text="خبر خیلی خیلی خیلی خیلی خیلی فوری",
#         output_path="assets/OutPut/breaking_news_output.png",
#         dynamic_font_size=True,
#         composed=False,  # Set to True if passing a pre-composed image.
#     )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a breaking news image with headline, Persian date, and time."
    )
    parser.add_argument(
        "--user_image_path",
        type=str,
        required=True,
        help="Path to the user image or pre-composed base image.",
    )
    parser.add_argument(
        "--headline_text", type=str, required=True, help="The main headline text."
    )
    parser.add_argument(
        "--output_path", type=str, required=True, help="Path to save the final image."
    )
    parser.add_argument(
        "--font_size_delta", type=int, default=0, help="Font size delta adjustment."
    )
    parser.add_argument(
        "--dynamic_font_size", action="store_true", help="Enable dynamic font sizing."
    )
    parser.add_argument(
        "--composed",
        action="store_true",
        help="Indicate if the image is pre-composed (skips base composition).",
    )
    args = parser.parse_args()

    create_breaking_news_image(
        user_image_path=args.user_image_path,
        headline_text=args.headline_text,
        output_path=args.output_path,
        font_size_delta=args.font_size_delta,
        dynamic_font_size=args.dynamic_font_size,
        composed=args.composed,
    )

    # python "./src/Craft/breaking_news_template.py" --user_image_path="./assets/user_image.jpg" --headline_text="Breaking News Headline" --output_path="./assets/OutPut/breaking_news_output.png" --dynamic_font_size --composed
