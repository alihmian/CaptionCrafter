from PIL import Image, ImageDraw
from datetime import datetime, timedelta
from text_utils import draw_text_no_box, draw_text_in_box
from convertdate import persian, islamic
from typing import Optional

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
    main_headline_font_size_delta: int = 0
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
    base_img = Image.open('templates/base_news_template.png').convert('RGBA')
    draw = ImageDraw.Draw(base_img)

    # Load and paste user image
    user_img = Image.open(user_image_path).convert('RGBA')
    user_img_resized = user_img.resize((800, 600))
    base_img.paste(user_img_resized, (50, 150), user_img_resized)

    # Handle event overlays dynamically
    event_texts = [e for e in [event1_text, event2_text, event3_text] if e]
    num_events = len(event_texts)
    overlay_img = Image.open(f'templates/Event{num_events}.png').convert('RGBA')
    base_img = Image.alpha_composite(base_img, overlay_img)
    draw = ImageDraw.Draw(base_img)

    # Define individual font paths
    fonts = {
        'overline': 'fonts/Vazir.ttf',
        'headline': 'fonts/TitrBold.ttf',
        'arabic_date': 'fonts/Amiri-Regular.ttf',
        'english_date': 'fonts/Roboto-Regular.ttf',
        'weekday': 'fonts/Roboto-Bold.ttf',
        'persian_day': 'fonts/Vazir-Bold.ttf',
        'persian_month_year': 'fonts/Vazir.ttf',
        'events': 'fonts/Vazir.ttf'
    }

    # Overline text
    overline_size = 28 + overline_font_size_delta
    draw_text_no_box(draw, overline_text, fonts['overline'], base_img.width // 2, 50,
                     alignment='center', font_size=overline_size, color='black')

    # Main headline text
    headline_box = (100, 770, base_img.width - 200, 150)
    headline_size = 48 + main_headline_font_size_delta
    draw_text_in_box(draw, main_headline_text, fonts['headline'], headline_box,
                     alignment='center', vertical_mode='center_expanded',
                     auto_size=dynamic_font_size, font_size=headline_size, color='black')

    # Dynamic Event Positions based on number of events
    event_y_positions_dict = {
        1: [550],
        2: [520, 580],
        3: [500, 550, 600]
    }
    event_y_positions = event_y_positions_dict.get(num_events, [])

    event_font_size = 22
    for idx, event_text in enumerate(event_texts):
        draw_text_no_box(draw, event_text, fonts['events'],
                         base_img.width - 50, event_y_positions[idx],
                         alignment='right', font_size=event_font_size, color='black')

    # Calculate target date
    target_date = datetime.now() + timedelta(days=days_into_future)

    # Persian date split
    p_year, p_month, p_day = persian.from_gregorian(target_date.year, target_date.month, target_date.day)
    persian_day_str = str(p_day)
    persian_month_year_str = f"{persian.MONTHS[p_month]} {p_year}"

    # Islamic (Arabic) Date
    i_year, i_month, i_day = islamic.from_gregorian(target_date.year, target_date.month, target_date.day)
    arabic_date_str = f"{i_day}/{i_month}/{i_year}"

    # Gregorian (English) Date
    english_date_str = target_date.strftime('%d %B %Y')

    # Weekday
    weekday_str = target_date.strftime('%A')

    # Define positions for dates clearly
    positions = {
        'persian_day': (100, 950),
        'persian_month_year': (170, 950),
        'arabic_date': (base_img.width // 2, 950),
        'english_date': (base_img.width - 100, 950),
        'weekday': (base_img.width // 2, 980)
    }

    date_font_size = 20

    # Draw dates with respective fonts
    draw_text_no_box(draw, persian_day_str, fonts['persian_day'],
                     *positions['persian_day'], alignment='left', font_size=date_font_size)

    draw_text_no_box(draw, persian_month_year_str, fonts['persian_month_year'],
                     *positions['persian_month_year'], alignment='left', font_size=date_font_size)

    draw_text_no_box(draw, arabic_date_str, fonts['arabic_date'],
                     *positions['arabic_date'], alignment='center', font_size=date_font_size)

    draw_text_no_box(draw, english_date_str, fonts['english_date'],
                     *positions['english_date'], alignment='right', font_size=date_font_size)

    draw_text_no_box(draw, weekday_str, fonts['weekday'],
                     *positions['weekday'], alignment='center', font_size=date_font_size)

    # Save final image
    base_img.convert('RGB').save(output_path, format='JPEG', quality=95)
