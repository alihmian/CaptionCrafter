from PIL import Image, ImageDraw
from datetime import datetime, timedelta
from text_utils import draw_text_no_box, draw_text_in_box
from date_util import shamsi, arabic, georgian, day_of_week
from img_util import apply_watermark
from typing import Optional
import argparse

DEFAULT_IS_RTL: bool = False


def create_newspaper_image(
    user_image_path: str,
    overline_text: str,
    main_headline_text: str,
    output_path: str,
    event1_text: Optional[str] = None,
    event2_text: Optional[str] = None,
    event3_text: Optional[str] = None,
    days_into_future: int = 0,
    dynamic_font_size: bool = True,
    overline_font_size_delta: int = 0,
    main_headline_font_size_delta: int = 0,
    watermark: bool = True,
    composed: bool = False, 
) -> None:
    """
    Creates a customized newspaper-style image by adding dynamic texts, events, and an optional watermark.

    If 'composed' is True, then the provided user_image_path is assumed to point to a pre-composed
    base image that already includes the user image and event overlays. In that case, the function only adds text.
    Otherwise, the function loads the base template, pastes the user image, and composites event overlays.

    Args:
        user_image_path: Path to the user image or a pre-composed base image.
        overline_text: Small header above the main headline.
        main_headline_text: Primary headline text.
        output_path: File path to save the generated image.
        event1_text, event2_text, event3_text: Event descriptions (optional).
        days_into_future: Days offset for the displayed date.
        dynamic_font_size: Enable dynamic font sizing.
        overline_font_size_delta: Adjustment to default overline font size.
        main_headline_font_size_delta: Adjustment to default main headline font size.
        watermark: If True, applies a watermark on the final image.
        composed: If True, the base image is assumed to be already composed (user image and event overlays applied).
    """
    # Always compute event texts and count
    event_texts = [e for e in [event1_text, event2_text, event3_text] if e]
    num_events = len(event_texts)

    if composed:
        # Use the pre-composed image provided by the user.
        base_img = Image.open(user_image_path).convert("RGBA")
        draw = ImageDraw.Draw(base_img)
    else:
        # Load the base template and compose it with the user image and event overlays.
        base_img = Image.open("./assets/templates/News Paper/Base.png").convert("RGBA")
        draw = ImageDraw.Draw(base_img)

        # Load and paste user image.
        user_img = Image.open(user_image_path).convert("RGBA")
        alpha = 236
        user_img_resized = user_img.resize((16 * alpha, 9 * alpha))
        base_img.paste(user_img_resized, (150, 1550), user_img_resized)

        # Composite event overlay based on number of events.
        overlay_img = Image.open(
            f"./assets/templates/News Paper/Event{num_events}.png"
        ).convert("RGBA")
        base_img = Image.alpha_composite(base_img, overlay_img)
        draw = ImageDraw.Draw(base_img)

    # Define individual font paths.
    fonts = {
        "overline": "./assets/Font/BNazanin.ttf",
        "headline": "./assets/Font/Ray-ExtraBlack.ttf",
        "arabic_date": "./assets/Font/Sahel-FD.ttf",
        "english_date": "./assets/Font/Poppins-Regular.ttf",
        "weekday": "./assets/Font/Sahel-FD.ttf",
        "persian_day": "./assets/Font/B Titr Bold_0.ttf",
        "persian_month_year": "./assets/Font/Sahel-FD.ttf",
        "events": "./assets/Font/Sahel-FD.ttf",
    }

    # Add overline text.
    overline_size = 180 + overline_font_size_delta
    draw_text_no_box(
        draw,
        overline_text,
        fonts["overline"],
        base_img.width // 2,
        750,
        alignment="center",
        font_size=overline_size,
        color="black",
        is_rtl=False,
    )

    # Add main headline text.
    margin = 100
    headline_box = (margin, 980, base_img.width - 2 * margin, 550)
    headline_size = 160 + main_headline_font_size_delta
    draw_text_in_box(
        draw,
        main_headline_text,
        fonts["headline"],
        headline_box,
        alignment="center",
        vertical_mode="top_to_bottom",
        auto_size=dynamic_font_size,
        font_size=headline_size,
        color="black",
        is_rtl=False,
    )

    # Draw event texts.
    event_y_positions_dict = {1: [250], 2: [230, 340], 3: [150, 260, 370]}
    event_y_positions = event_y_positions_dict.get(num_events, [])
    event_font_size = 70
    for idx, event_text in enumerate(event_texts):
        draw_text_no_box(
            draw,
            event_text,
            fonts["events"],
            940,
            event_y_positions[idx],
            alignment="right",
            font_size=event_font_size,
            color="black",
            is_rtl=False,
        )

    # Define positions for dates.
    x_anchor = 1400 if num_events else 540
    y_offset = -30
    positions = {
        "weekday": (x_anchor, 60),
        "persian_day": (x_anchor, 240 + y_offset),
        "persian_month_year": (x_anchor, 380 + y_offset),
        "arabic_date": (x_anchor, 480 + y_offset),
        "english_date": (x_anchor, 580 + y_offset),
    }
    date_font_size = 70

    # Draw date texts.
    draw_text_no_box(
        draw,
        shamsi(year=False, month=False, day=True, days_into_future=days_into_future),
        fonts["persian_day"],
        *positions["persian_day"],
        alignment="center",
        font_size=date_font_size * 2.3,
    )
    draw_text_no_box(
        draw,
        shamsi(year=True, month=True, day=False, days_into_future=days_into_future),
        fonts["persian_month_year"],
        *positions["persian_month_year"],
        alignment="center",
        font_size=date_font_size,
        is_rtl=DEFAULT_IS_RTL,
    )
    draw_text_no_box(
        draw,
        arabic(year=True, month=True, day=True, days_into_future=days_into_future),
        fonts["arabic_date"],
        *positions["arabic_date"],
        alignment="center",
        font_size=date_font_size,
        is_rtl=DEFAULT_IS_RTL,
    )
    draw_text_no_box(
        draw,
        georgian(year=True, month=True, day=True, days_into_future=days_into_future),
        fonts["english_date"],
        *positions["english_date"],
        alignment="center",
        font_size=date_font_size,
    )
    draw_text_no_box(
        draw,
        day_of_week(),
        fonts["weekday"],
        *positions["weekday"],
        alignment="center",
        font_size=date_font_size,
        is_rtl=DEFAULT_IS_RTL,
    )

    # Optionally add watermark.
    if watermark:
        watermark_path = "./assets/images/watermark_no_back_ground.png"
        watermark_position = (200, 3100)
        base_img = apply_watermark(
            base_img,
            watermark_path,
            position=watermark_position,  # 2-tuple position; scale factor applies
            scale=2.6,  # adjust scale as needed
            opacity=0.7,  # 70% opacity
            adaptive_color=True,  # adjust color based on underlying region
        )

    # Save the final image.
    base_img.convert("RGB").save(output_path, format="JPEG", quality=95)


# if __name__ == "__main__":
#     # Example usage in non-composed mode (function does full composition)
#     create_newspaper_image(
#         user_image_path="./assets/user_image.jpg",
#         overline_text="سوخت قاچاق در خليج فارس",
#         main_headline_text="كشف محموله عظيم سوخت قاچاق درخليج فارس؛ ضربه سنگين به قاچاقچيان",
#         output_path="assets/OutPut/newspaper_output.png",
#         event2_text="رویداد دو",
#         dynamic_font_size=True,
#         watermark=True,
#         composed=False,  # set to True if the base image is already composed
#     )

if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="Generate a newspaper-style image with text overlays and optional watermark."
    )
    parser.add_argument(
        "--user_image_path",
        type=str,
        required=True,
        help="Path to the user image or pre-composed base image.",
    )
    parser.add_argument(
        "--overline_text", type=str, required=True, help="The overline text."
    )
    parser.add_argument(
        "--main_headline_text", type=str, required=True, help="The main headline text."
    )
    parser.add_argument(
        "--output_path", type=str, required=True, help="Path to save the final image."
    )
    parser.add_argument(
        "--days_into_future",
        type=int,
        default=0,
        help="Days offset for the displayed date.",
    )
    parser.add_argument(
        "--overline_font_size_delta",
        type=int,
        default=0,
        help="Overline font size adjustment.",
    )
    parser.add_argument(
        "--main_headline_font_size_delta",
        type=int,
        default=0,
        help="Headline font size adjustment.",
    )
    parser.add_argument(
        "--dynamic_font_size", action="store_true", help="Enable dynamic font sizing."
    )
    parser.add_argument(
        "--watermark", action="store_true", help="Apply watermark on the final image."
    )
    parser.add_argument(
        "--composed",
        action="store_true",
        help="Indicate that the provided image is already composed.",
    )
    parser.add_argument(
        "--event1_text", type=str, default=None, help="Optional text for event 1."
    )
    parser.add_argument(
        "--event2_text", type=str, default=None, help="Optional text for event 2."
    )
    parser.add_argument(
        "--event3_text", type=str, default=None, help="Optional text for event 3."
    )

    args = parser.parse_args()

    create_newspaper_image(
        user_image_path=args.user_image_path,
        overline_text=args.overline_text,
        main_headline_text=args.main_headline_text,
        output_path=args.output_path,
        days_into_future=args.days_into_future,
        overline_font_size_delta=args.overline_font_size_delta,
        main_headline_font_size_delta=args.main_headline_font_size_delta,
        dynamic_font_size=args.dynamic_font_size,
        watermark=args.watermark,
        composed=args.composed,
        event1_text=args.event1_text,
        event2_text=args.event2_text,
        event3_text=args.event3_text,
    )

# python "./src/Craft/newspaper_template.py" --user_image_path="./assets/user_image.jpg" --overline_text="سوخت قاچاق در خليج فارس" --main_headline_text="كشف محموله عظيم سوخت قاچاق درخليج فارس؛ ضربه سنگين به قاچاقچيان" --output_path="assets/OutPut/newspaper_output.png" --event2_text="رویداد دو"  --dynamic_font_size --watermark --composed
