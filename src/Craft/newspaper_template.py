from PIL import Image, ImageDraw
from datetime import datetime, timedelta
from text_utils import draw_text_no_box, draw_text_in_box
from date_util import shamsi, arabic, georgian, day_of_week
from typing import Optional

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
) -> None:
    """
    Creates a customized newspaper-style image with dynamic texts and events.

    Args:
        user_image_path: Path to user's provided image.
        overline_text: Small header above the main headline.
        main_headline_text: Primary headline text.
        output_path: File path to save the generated image.
        event1_text, event2_text, event3_text: Event descriptions (optional).
        days_into_future: Days offset for the displayed date.
        dynamic_font_size: Enable dynamic font sizing.
        overline_font_size_delta: Adjustment to default overline font size.
        main_headline_font_size_delta: Adjustment to default main headline font size.
    """
    # Load base template
    base_img = Image.open("./assets/templates/News Paper/Base.png").convert("RGBA")
    draw = ImageDraw.Draw(base_img)

    # Load and paste user image
    user_img = Image.open(user_image_path).convert("RGBA")
    alpha = 236
    user_img_resized = user_img.resize((16 * alpha, 9 * alpha))
    base_img.paste(user_img_resized, (150, 1550), user_img_resized)

    # Handle event overlays dynamically
    event_texts = [e for e in [event1_text, event2_text, event3_text] if e]
    num_events = len(event_texts)
    overlay_img = Image.open(
        f"./assets/templates/News Paper/Event{num_events}.png"
    ).convert("RGBA")
    base_img = Image.alpha_composite(base_img, overlay_img)
    draw = ImageDraw.Draw(base_img)

    # Define individual font paths
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

    # Overline text
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

    # Main headline text
    margin = 100
    headline_box = (margin, 980, base_img.width - 2 * margin, 550)
    headline_size = 160 + main_headline_font_size_delta
    draw_text_in_box(
        draw,
        main_headline_text,
        fonts["headline"],
        headline_box,
        alignment="center",
        # vertical_mode="center_expanded",
        vertical_mode="top_to_bottom",
        auto_size=dynamic_font_size,
        font_size=headline_size,
        color="black",
        is_rtl=False,
    )

    # Dynamic Event Positions based on number of events
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

    # Define positions for dates clearly
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

    # Draw dates with respective fonts

    draw_text_no_box(
        draw,
        shamsi(
            year=False,
            month=False,
            day=True,
            days_into_future=days_into_future,
        ),
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

    # Save final image
    base_img.convert("RGB").save(output_path, format="JPEG", quality=95)


create_newspaper_image(
    user_image_path="assets/user_image.jpg",
    overline_text="سوخت قاچاق در خليج فارس",
    main_headline_text="كشف محموله عظيم سوخت قاچاق درخليج فارس؛ ضربه سنگين به قاچاقچيان",
    output_path="assets/OutPut/newspaper_output.png",
    # event1_text="رویداد یک",
    # event2_text="رویداد دو",
    event3_text="رویداد سه",
    dynamic_font_size=False,
)
