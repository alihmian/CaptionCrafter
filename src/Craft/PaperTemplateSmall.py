from PIL import Image, ImageDraw, ImageFont
from datetime import datetime, timedelta
from khayyam import JalaliDatetime
import arabic_reshaper
from convertdate import islamic
from bidi.algorithm import get_display
import sys
import argparse

def hijri_date_from_gregorian(gregorian_date):
    """
    Convert a Gregorian date to a Hijri (Islamic) date.

    Args:
        gregorian_date (datetime): The Gregorian date to convert.

    Returns:
        str: The Hijri date in the format "day month year" with month names in Arabic.
    """
    year, month, day = islamic.from_gregorian(
        gregorian_date.year, gregorian_date.month, gregorian_date.day
    )
    hijri_months = [
        "محرم", "صفر", "ربیع‌الاول", "ربیع‌الثانی", "جمادی‌الاول",
        "جمادی‌الثانی", "رجب", "شعبان", "رمضان", "شوال", "ذی‌القعده", "ذی‌الحجه"
    ]
    return f"{day} {hijri_months[month - 1]} {year}"

def generate_news_image(
    output_path="assets/OutPut/PaperCaptionSmall.png",
    Headline="بدون تیتر",
    SubHeadline="بدون زیر تیتر",
    user_image_path="assets/user_image.jpg",
    event1="",
    event2="",
    event3="",
    days_into_future=0,
    Headline_font_size=35,
    SubHeadline_font_size=35,
    event_font_size=12,
    weekday_font_size=20,
    shamsi_day_font_size=40,
    hejri_font_size=16,
    shamsi_month_year_font_size=16,
    miladi_date_font_size=17,
    watermark = 1,
    watermark_path = "assets/images/watermark.png",
    ribbon_path = "assets/images/ribbon.png",
    date_positions =  {
        "weekday": (240, 13),  # Position of the day of the week in Shamsi calendar
        "shamsi_day": (240, 60),  # Position of the day number in Shamsi calendar
        "shamsi_month_year": (240, 110),  # Position of the month and year in Shamsi calendar
        "miladi": (90, 140),  # Position of the Gregorian date
        "hejri": (240, 138),  # Position of the Hijri (Islamic) date
    }
):
    """
    Generate a news image with customized SubHeadline, including Headline, main text, slogan,
    events, and dynamic date formats (Shamsi, Miladi, Hejri).

    Args:
        output_path (str): The file path to save the generated image.
        Headline (str): The Headline text to display in the image.
        SubHeadline (str): The main SubHeadline text for the image.
        slogan (str): A slogan to display in the image.
        user_image_path (str): The path to the user's image to embed in the news image.
        todays_events (str): Multi-line string of events for the day. Each line is an event.
        days_into_future (int): Number of days into the future to calculate the date.
        Headline_font_size (int): Font size for the Headline.
        SubHeadline_font_size (int): Font size for the main SubHeadline.
        slogan_font_size (int): Font size for the slogan.

    Returns:
        None: Saves the generated image to the specified output path.
    """
    

    # Select the appropriate base image based on the number of events
    # The base image is selected based on the number of events (up to 3) to match the design layout.
    event_count = (event1 != "") + (event2 != "") + (event3 != "")
    if event_count == 3:
        todays_events = event1 + "\n" + event2 + "\n" + event3
    elif event_count == 2 :
        todays_events = event1 + "\n" + event2 
    elif event_count == 1 :
        todays_events = event1 
    else:
        todays_events = ""       

    base_image_path = f"./assets/Base/Base1.png"
    base_image = Image.open(base_image_path)
    draw = ImageDraw.Draw(base_image)

    # Load user image
    user_image = Image.open(user_image_path)
    user_image = user_image.resize((909, 542))  # Resize the user image to fit the base image

    # Paste user image onto base image
    user_image_position = (26, 308)  # Adjust position as needed
    base_image.paste(user_image, user_image_position)

    # Load fonts
    Headline_font = ImageFont.truetype("./assets/Font/BNazanin.ttf", Headline_font_size)
    SubHeadline_font = ImageFont.truetype("./assets/Font/Ray-ExtraBlack.ttf", SubHeadline_font_size)
    event_font = ImageFont.truetype("./assets/Font/Sahel-FD.ttf", event_font_size)
    weekday_font = ImageFont.truetype("./assets/Font/Sahel-FD.ttf", weekday_font_size)
    shamsi_day_font = ImageFont.truetype("./assets/Font/B Titr Bold_0.ttf", shamsi_day_font_size)
    miladi_date_font = ImageFont.truetype("./assets/Font/Poppins-Regular.ttf", miladi_date_font_size)
    hejri_font = ImageFont.truetype("./assets/Font/Sahel-FD.ttf", hejri_font_size)
    shamsi_month_year_font = ImageFont.truetype("./assets/Font/Sahel-FD.ttf", shamsi_month_year_font_size)


    # Function to reshape and reorder Farsi text
    def prepare_farsi_text(text):
        reshaped_text = arabic_reshaper.reshape(text)
        bidi_text = get_display(reshaped_text)
        return reshaped_text

    # def prepare_farsi_text(text):
    #     reshaped_text = arabic_reshaper.reshape(text)
    #     bidi_text = get_display(reshaped_text)
    #     return bidi_text
    
    # Prepare dates
    future_date = datetime.now() + timedelta(days=days_into_future)
    miladi_date = future_date.strftime("%d %B %Y")

    hejri_date = hijri_date_from_gregorian(future_date)
    hejri_date = prepare_farsi_text(hejri_date)

    shamsi = JalaliDatetime(future_date)
    shamsi_day = shamsi.strftime("%d")
    shamsi_month_year = shamsi.strftime("%B %Y")
    weekday = shamsi.strftime("%A")

    # Default positions
    

    # Draw dates
    # Draw day of the week
    # Draw weekday (center-aligned)
    weekday_text = prepare_farsi_text(weekday)
    weekday_bbox = draw.textbbox((0, 0), weekday_text, font=weekday_font)
    weekday_width = weekday_bbox[2] - weekday_bbox[0]
    weekday_x = date_positions["weekday"][0] - (weekday_width // 2)  # Center-align
    draw.text((weekday_x, date_positions["weekday"][1]), weekday_text, font=weekday_font, fill="black")

    # Draw Shamsi day (center-aligned)
    shamsi_day_text = prepare_farsi_text(shamsi_day)
    shamsi_day_bbox = draw.textbbox((0, 0), shamsi_day_text, font=shamsi_day_font)
    shamsi_day_width = shamsi_day_bbox[2] - shamsi_day_bbox[0]
    shamsi_day_x = date_positions["shamsi_day"][0] - (shamsi_day_width // 2)  # Center-align
    draw.text((shamsi_day_x, date_positions["shamsi_day"][1]), shamsi_day_text, font=shamsi_day_font, fill="black")

    # Draw Shamsi month and year (center-aligned)
    shamsi_month_year_text = prepare_farsi_text(shamsi_month_year)
    shamsi_month_year_bbox = draw.textbbox((0, 0), shamsi_month_year_text, font=shamsi_month_year_font)
    shamsi_month_year_width = shamsi_month_year_bbox[2] - shamsi_month_year_bbox[0]
    shamsi_month_year_x = date_positions["shamsi_month_year"][0] - (shamsi_month_year_width // 2)  # Center-align
    draw.text((shamsi_month_year_x, date_positions["shamsi_month_year"][1]), shamsi_month_year_text, font=shamsi_month_year_font, fill="black")

    # Draw Miladi date (center-aligned)
    miladi_text = miladi_date
    miladi_bbox = draw.textbbox((0, 0), miladi_text, font=miladi_date_font)
    miladi_width = miladi_bbox[2] - miladi_bbox[0]
    miladi_x = date_positions["miladi"][0] - (miladi_width // 2)  # Center-align
    draw.text((miladi_x, date_positions["miladi"][1]), miladi_text, font=miladi_date_font, fill="black")

    
    # Draw Hejri date (center-aligned)
    hejri_text = hejri_date
    hejri_bbox = draw.textbbox((0, 0), hejri_text, font=hejri_font)
    hejri_width = hejri_bbox[2] - hejri_bbox[0]
    hejri_x = date_positions["hejri"][0] - (hejri_width // 2)  # Center-align
    draw.text((hejri_x, date_positions["hejri"][1]), hejri_text, font=hejri_font, fill="black")
        
    
    
   
    # Draw Headline
    Headline = prepare_farsi_text(Headline)
    Headline_bbox = draw.textbbox((0, 0), Headline, font=Headline_font)
    Headline_width = Headline_bbox[2] - Headline_bbox[0]
    Headline_position = ((base_image.size[0] - Headline_width) // 2, 190)
    draw.text(Headline_position, Headline, font=Headline_font, fill="black")
    # print(base_image.size)

    # Draw main SubHeadline
    box_width = 940 - 20
    y_offset = 230
    current_line = ""
    lines = []

    for word in SubHeadline.split():
        test_line = f"{current_line} {word}".strip()
        test_bbox = draw.textbbox((0, 0), test_line, font=SubHeadline_font)
        test_width = test_bbox[2] - test_bbox[0]
        if test_width <= box_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)

    for line in lines:
        reshaped_line = prepare_farsi_text(line)
        line_bbox = draw.textbbox((0, 0), reshaped_line, font=SubHeadline_font)
        line_width = line_bbox[2] - line_bbox[0]
        line_height = line_bbox[3] - line_bbox[1]
        x_position = 30 + (box_width - line_width) // 2
        draw.text((x_position, y_offset), reshaped_line, font=SubHeadline_font, fill="black")
        y_offset += line_height
        if y_offset > 300:
            break

    # Draw slogan
    # if slogan == "اکنون زمانِ اقتصاد است." :
    #     slogan = prepare_farsi_text(slogan)
    #     Headline_position = (300, 100)
    #     draw.text(Headline_position, slogan, font=slogan_font, fill=(4, 18, 66))

    # else: 
    #     slogan_box_width = 505 - 270
    #     slogan_y_offset = 95
    #     current_slogan_line = ""
    #     slogan_lines = []

    #     for word in slogan.split():
    #         test_line = f"{current_slogan_line} {word}".strip()
    #         test_bbox = draw.textbbox((0, 0), test_line, font=slogan_font)
    #         test_width = test_bbox[2] - test_bbox[0]
    #         if test_width <= slogan_box_width:
    #             current_slogan_line = test_line
    #         else:
    #             slogan_lines.append(current_slogan_line)
    #             current_slogan_line = word
    #     if current_slogan_line:
    #         slogan_lines.append(current_slogan_line)

    #     for line in slogan_lines:
    #         reshaped_line = prepare_farsi_text(line)
    #         line_bbox = draw.textbbox((0, 0), reshaped_line, font=slogan_font)
    #         line_width = line_bbox[2] - line_bbox[0]
    #         line_height = line_bbox[3] - line_bbox[1]
    #         x_position = 270 + (slogan_box_width - line_width) // 2
    #         draw.text((x_position, slogan_y_offset), reshaped_line, font=slogan_font, fill=(4, 18, 66))  
    #         slogan_y_offset += line_height
    #         if slogan_y_offset > 130:
    #             break

    # Draw today's events
    if todays_events.strip():
        custom_positions = {
            0: [],  # Base0 positions
            1: [(150, 60)],  # Base1 positions
            2: [(150, 50), (150, 80)],  # Base2 positions
            3: [(150, 40), (150, 70), (150, 100)]   # Base3 positions
        }
        positions = custom_positions.get(event_count, [(50, 420)])

        for i, event in enumerate(todays_events.splitlines()):
            reshaped_event = prepare_farsi_text(event)
            line_bbox = draw.textbbox((0, 0), reshaped_event, font=event_font)
            event_width = line_bbox[2] - line_bbox[0]
            x_position, y_position = positions[i]
            adjusted_x_position = x_position - event_width  # Shift left for RTL alignment
            draw.text((adjusted_x_position, y_position), reshaped_event, font=event_font, fill="black")

    if (watermark):
        watermark_img = Image.open(watermark_path).convert("RGBA")
        ribbon_img = Image.open(ribbon_path).convert("RGBA")
        (w, h) = watermark_img.size
        (wr, hr) = ribbon_img.size
        alpha = 0.75
        alphar = 0.54
        watermark_img = watermark_img.resize((int(alpha * w), int(alpha * h)))
        ribbon_img = ribbon_img.resize((int(alphar * wr), int(alphar * hr)))
        watermark_position = (35,730)
        ribbon_position = (24,722)
        base_image = base_image.convert("RGBA")
        base_image.paste(ribbon_img, ribbon_position, ribbon_img)
        base_image.paste(watermark_img, watermark_position, watermark_img)
    # Save the resulting image
    base_image.save(output_path)

# Example usage
# generate_news_image(
#     output_path="assets/OutPut/PaperCaptionSmall.png",
#     Headline="بازدهی ۴۰ درصدی گواهی سپرده سکه از ابتدای سال",
#     SubHeadline="نوسان سکه رفاه در حوالی قله ، تحلیلگران رشد بیشتری را پیش بینی می‌کنند.",
#     user_image_path="user_image.jpg",
#     event1= "رویداد یک",
#     # event2= "رویداد یک",
#     # event3= "رویداد یک",
#     # todays_events="",
#     # todays_events="رویداد ۱: افزایش نرخ ارز",
#     # todays_events="رویداد ۱: افزایش نرخ ارز\nرویداد ۲: کاهش ارزش سهام",
#     # todays_events=" افزایش نرخ ارز\n کاهش ارزش سهام\n افزایش نرخ طلا",
#     # days_into_future=2,
#     # Headline_font_size=40,
#     # SubHeadline_font_size=50,
#     # slogan_font_size=25,
#     # watermark=False
# )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=False)
    parser.add_argument("--output", required=False)
    parser.add_argument("--headline", required=False)
    parser.add_argument("--subheadline", required=False)
    parser.add_argument("--daysintofuture", required=False)
    parser.add_argument("--event1", required=False)
    parser.add_argument("--event2", required=False)
    parser.add_argument("--event3", required=False)
    parser.add_argument("--watermark", required=False)
    args = parser.parse_args()



    generate_news_image(
        output_path=args.output,
        Headline=args.headline,
        SubHeadline=args.subheadline,
        user_image_path=args.input,
        days_into_future=int(args.daysintofuture),
        event1=args.event1,
        event2=args.event2,
        event3=args.event3,
        watermark=int(args.watermark)
    )


if __name__ == "__main__":
    main()
    
    
# python generat-images/generate_image2.py --input input_image.jpg --output news_output.png --headline "بازدهی ۴۰ درصدی گواهی سپرده سکه از ابتدای سال" --subheadline "نوسان سکه رفاه در حوالی قله و چشم انداز آینده بازار، تحلیلگران رشد بیشتری را پیش بینی می‌کنند." --daysintofuture 0 --event1 "رویداد یک" --event2 "رویداد سه" --event3 "رویداد دو" --watermark 1


# "/Users/alihushemian/Desktop/project/3rd attempt/venv/bin/python" "/Users/alihushemian/Desktop/project/3rd attempt/generat-images/generate_image1.py" --input "/Users/alihushemian/Documents/learning web developement/telgram bot/examples/user_image.jpg" --output "/Users/alihushemian/Documents/learning web developement/telgram bot/examples/news_output1.png" --headline "بازدهی ۴۰ درصدی گواهی سپرده سکه از ابتدای سال" --subheadline "نوسان سکه رفاه در حوالی قله و چشم انداز آینده بازار، تحلیلگران رشد بیشتری را پیش بینی می‌کنند." --daysintofuture 0 --event1 "رویداد یک" --event2 "رویداد سه" --event3 "رویداد دو" --watermark 1


