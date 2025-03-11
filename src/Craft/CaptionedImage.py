from PIL import Image, ImageDraw, ImageFont, ImageStat
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
    output_path="assets/OutPut/PaperTemplateLarg.png",
    Headline="بدون تیتر",
    SubHeadline="بدون زیر تیتر",
    user_image_path="assets/user_image.jpg",
    event1="",
    event2="",
    event3="",
    days_into_future=0,
    Headline_font_size=140,
    SubHeadline_font_size=140,
    event_font_size=70,
    weekday_font_size=100,
    shamsi_day_font_size=160,
    shamsi_month_year_font_size = 100,
    miladi_date_font_size = 70,
    hejri_font_size = 80,
    watermark = 1,
    watermark_path = "assets/images/watermark2.png",
    date_positions =  {
        "weekday": (3850, 800),  # Position of the day of the week in Shamsi calendar
        "shamsi_day": (3850, 1050),  # Position of the day number in Shamsi calendar
        "shamsi_month_year": (3850, 1350),  # Position of the month and year in Shamsi calendar
        "hejri": (3850, 1550),  # Position of the Hijri (Islamic) date
        "miladi": (3850, 1750),  # Position of the Gregorian date
    },
    custom_positions = {
        0: [],  # Base0 positions
        1: [(4130, 2650)],  # Base1 positions
        2: [(4130, 2450), (4130, 2650)],  # Base2 positions
        3: [(4130, 2250), (4130, 2450), (4130, 2650)]   # Base3 positions
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
    
    event_count = (event1 != "") + (event2 != "") + (event3 != "")
    print(event_count)
    if event_count == 3:
        todays_events = event1 + "\n" + event2 + "\n" + event3
    elif event_count == 2 :
        todays_events = event1 + "\n" + event2 
    elif event_count == 1 :
        todays_events = event1 
    else:
        todays_events = "" 
    # Select the appropriate base image based on the number of events
    # The base image is selected based on the number of events (up to 3) to match the design layout.
    event_count = len(todays_events.splitlines()) if todays_events.strip() else 0
    base_image_path = f"./assets/Base/Base6.png"

    blank = Image.new("RGBA", (4198, 3952), "blue")
    draw = ImageDraw.Draw(blank)

    user_image = Image.open(user_image_path).convert("RGBA").resize((3700, 2550))


    blank.paste(user_image, (0,0), user_image)

    base_image = Image.open(base_image_path).convert("RGBA")

    blank.paste(base_image, (0, 0), base_image)


 
    # Load fonts
    # Headline_font = ImageFont.truetype("./assets/Font/Ray-ExtraBold.ttf", Headline_font_size)
    Headline_font = ImageFont.truetype("./assets/Font/Ray-ExtraBlack.ttf", Headline_font_size)
    # SubHeadline_font = ImageFont.truetype("./assets/Font/Sahel.ttf", SubHeadline_font_size)
    SubHeadline_font = ImageFont.truetype("./assets/Font/BNazanin.ttf", SubHeadline_font_size)
    event_font = ImageFont.truetype("./assets/Font/Sahel-FD.ttf", event_font_size)
    weekday_font = ImageFont.truetype("./assets/Font/Sahel-Black-FD.ttf", weekday_font_size)
    shamsi_day_font = ImageFont.truetype("./assets/Font/Sahel-Black-FD.ttf", shamsi_day_font_size)
    shamsi_month_year_font = ImageFont.truetype("./assets/Font/Sahel-Black-FD.ttf", shamsi_month_year_font_size)
    miladi_date_font = ImageFont.truetype("./assets/Font/Sahel.ttf", miladi_date_font_size)
    hejri_font = ImageFont.truetype("./assets/Font/Sahel-FD.ttf", hejri_font_size)
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
    draw.text((weekday_x, date_positions["weekday"][1]), weekday_text, font=weekday_font, fill="white")

    # Draw Shamsi day (center-aligned)
    shamsi_day_text = prepare_farsi_text(shamsi_day)
    shamsi_day_bbox = draw.textbbox((0, 0), shamsi_day_text, font=shamsi_day_font)
    shamsi_day_width = shamsi_day_bbox[2] - shamsi_day_bbox[0]
    shamsi_day_x = date_positions["shamsi_day"][0] - (shamsi_day_width // 2)  # Center-align
    draw.text((shamsi_day_x, date_positions["shamsi_day"][1]), shamsi_day_text, font=shamsi_day_font, fill="white")

    # Draw Shamsi month and year (center-aligned)
    shamsi_month_year_text = prepare_farsi_text(shamsi_month_year)
    shamsi_month_year_bbox = draw.textbbox((0, 0), shamsi_month_year_text, font=shamsi_month_year_font)
    shamsi_month_year_width = shamsi_month_year_bbox[2] - shamsi_month_year_bbox[0]
    shamsi_month_year_x = date_positions["shamsi_month_year"][0] - (shamsi_month_year_width // 2)  # Center-align
    draw.text((shamsi_month_year_x, date_positions["shamsi_month_year"][1]), shamsi_month_year_text, font=shamsi_month_year_font, fill="white")

    # Draw Miladi date (center-aligned)
    miladi_text = miladi_date
    miladi_bbox = draw.textbbox((0, 0), miladi_text, font=miladi_date_font)
    miladi_width = miladi_bbox[2] - miladi_bbox[0]
    miladi_x = date_positions["miladi"][0] - (miladi_width // 2)  # Center-align
    draw.text((miladi_x, date_positions["miladi"][1]), miladi_text, font=miladi_date_font, fill="white")

    
    # Draw Hejri date (center-aligned)
    hejri_text = hejri_date
    hejri_bbox = draw.textbbox((0, 0), hejri_text, font=hejri_font)
    hejri_width = hejri_bbox[2] - hejri_bbox[0]
    hejri_x = date_positions["hejri"][0] - (hejri_width // 2)  # Center-align
    draw.text((hejri_x, date_positions["hejri"][1]), hejri_text, font=hejri_font, fill="white")
        
    
    
   
    # Define the text box boundaries
    box_left = 150
    box_top = 2000
    box_bottom = 2820
    box_width = base_image.size[0] - 1000
    box_height = box_bottom - box_top

    # Wrap the headline text into multiple lines that fit within the box width
    lines = []
    current_line = ""
    for word in Headline.split():
        test_line = (current_line + " " + word).strip()
        test_width = draw.textbbox((0, 0), test_line, font=Headline_font)[2]  # text width at 0,0
        if test_width <= box_width:
            current_line = test_line
        else:
            lines.append(current_line)
            current_line = word
    if current_line:
        lines.append(current_line)

    # Calculate the total height of the text block (sum of all line heights)
    total_height = 0
    line_heights = []
    for line in lines:
        reshaped = prepare_farsi_text(line)
        line_bbox = draw.textbbox((0, 0), reshaped, font=Headline_font)
        line_height = line_bbox[3] - line_bbox[1]
        line_heights.append(line_height)
        total_height += line_height
                        # remove the last line

    # Determine starting y-position for vertical centering
    if total_height < box_height:
        y_offset = box_top + (box_height - total_height) // 2
    else:
        y_offset = box_top

    # Draw each line, centered horizontally within the box, starting at y_offset
    for line in lines:
        reshaped = prepare_farsi_text(line)
        line_bbox = draw.textbbox((0, 0), reshaped, font=Headline_font)
        line_width = line_bbox[2] - line_bbox[0]
        line_height = line_bbox[3] - line_bbox[1]
        x_position = box_left + (box_width - line_width) // 2
        # Stop if the next line would go beyond the bottom of the box
        if y_offset + line_height > box_bottom:
            break
        draw.text((x_position, y_offset), reshaped, font=Headline_font, fill="black")
        y_offset += line_height

    # Draw  SubHeadline
    box_width = 4098 - 100
    y_offset = 3000
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
        x_position = 100 + (box_width - line_width) // 2
        draw.text((x_position, y_offset), reshaped_line, font=SubHeadline_font, fill="black")
        y_offset += line_height
        if y_offset > 3850:
            break


    if todays_events.strip():
        
        positions = custom_positions.get(event_count, [(50, 420)])

        for i, event in enumerate(todays_events.splitlines()):
            reshaped_event = prepare_farsi_text(event)
            line_bbox = draw.textbbox((0, 0), reshaped_event, font=event_font)
            event_width = line_bbox[2] - line_bbox[0]
            x_position, y_position = positions[i]
            adjusted_x_position = x_position - event_width  # Shift left for RTL alignment
            draw.text((adjusted_x_position, y_position), reshaped_event, font=event_font, fill="white")

    if (watermark):
        gray = blank.convert('L')
        avg_brightness = ImageStat.Stat(gray).mean[0]
        print(f"Average brightness: {avg_brightness:.2f}")
        

        
        
        # Threshold to decide dark vs bright (128 is mid-point of 0-255)
        threshold = 128
        # 3. Decide watermark color: white for dark images, black for bright images
        if avg_brightness < threshold:
            watermark_color = (255, 255, 255)  # light color (white)
            print("Image is dark. Using a light-colored (white) watermark.")
        else:
            watermark_color = (0, 0, 0)        # dark color (black)
            print("Image is bright. Using a dark-colored (black) watermark.")

        watermark_img = Image.open(watermark_path).convert("RGBA")
        w, h = watermark_img.size
        
        # Split into channels and create a solid-color image for the new watermark
        r, g, b, alpha = watermark_img.split()
        colored_wm = Image.new("RGBA", watermark_img.size, watermark_color + (255,))
        colored_wm.putalpha(alpha)  # apply the original watermark's alpha mask&#8203;:contentReference[oaicite:4]{index=4}
        

        alpha = 2
        colored_wm = colored_wm.resize((int(alpha * w), int(alpha * h)))
        watermark_position = (250,1700)
        # base_image = base_image.convert("RGBA")
        blank.paste(colored_wm, watermark_position, mask=colored_wm)  # :contentReference[oaicite:5]{index=5}
        # blank.paste(watermark_img, watermark_position, watermark_img)
        
    # Save the resulting image
    blank.save(output_path)

# Example usage
generate_news_image(
    output_path="assets/OutPut/CaptionedImage.png",
    Headline = "بازدهی ۴۰ درصدی گواهی سپرده سکه از ابتدای سال",
    # Headline = "بازدهی ۴۰ درصدی گواهی سپرده سکه از ابتدای سال بازدهی ۴۰ درصدی گواهی سپرده سکه از ابتدای سال بازدهی ۴۰ درصدی گواهی سپرده سکه از ابتدای سال",
    # Headline = "بازدهی ۴۰ درصدی گواهی سپرده سکه از ابتدای سال بازدهی ۴۰ درصدی گواهی سپرده سکه از ابتدای سال",
    SubHeadline="نوسان سکه رفاه در حوالی قله ، تحلیلگران رشد بیشتری را پیش بینی می‌کنند.",
    user_image_path="user_image.jpg",
    event1= "یک، دو، سه، چهار، پنج، شش، هفت، هشت، نه، ده، یازده، دوازده، سیزده، چهارده، پانزده، شانزده، هفده، هجده، نوزده، بیست، بیست و یک، بیست و دو، بیست و سه، بیست و چهار، بیست و پنج، بیست و شش، بیست و هفت، بیست و هشت، بیست و نه، سی، سی و یک، سی و دو، سی و سه، سی و چهار، سی و پنج، سی و شش، سی و هفت، سی و هشت، سی و نه، چهل، چهل و یک، چهل و دو، چهل و سه، چهل و چهار، چهل و پنج، چهل و شش، چهل و هفت، چهل و هشت، چهل و نه، پنجاه، پنجاه و یک، پنجاه و دو، پنجاه و سه، پنجاه و چهار، پنجاه و پنج، پنجاه و شش، پنجاه و هفت، پنجاه و هشت، پنجاه و نه، شصت، شصت و یک، شصت و دو، شصت و سه، شصت و چهار، شصت و پنج، شصت و شش، شصت و هفت، شصت و هشت، شصت و نه، هفتاد، هفتاد و یک، هفتاد و دو، هفتاد و سه، هفتاد و چهار، هفتاد و پنج، هفتاد و شش، هفتاد و هفت، هفتاد و هشت، هفتاد و نه، هشتاد، هشتاد و یک، هشتاد و دو، هشتاد و سه، هشتاد و چهار، هشتاد و پنج، هشتاد و شش، هشتاد و هفت، هشتاد و هشت، هشتاد و نه، نود، نود و یک، نود و دو، نود و سه، نود و چهار، نود و پنج، نود و شش، نود و هفت، نود و هشت، نود و نه، صد.",
    event2= "رویداد یک",
    event3= "رویداد یک",
    # todays_events="",
    # todays_events="رویداد ۱: افزایش نرخ ارز",
    # todays_events="رویداد ۱: افزایش نرخ ارز\nرویداد ۲: کاهش ارزش سهام",
    # todays_events=" افزایش نرخ ارز\n کاهش ارزش سهام\n افزایش نرخ طلا",
    # days_into_future=2,
    # Headline_font_size=40,
    # SubHeadline_font_size=50,
    # slogan_font_size=25,
    # watermark=False
)

# def main():
#     parser = argparse.ArgumentParser()
#     parser.add_argument("--input", required=False)
#     parser.add_argument("--output", required=False)
#     parser.add_argument("--headline", required=False)
#     parser.add_argument("--subheadline", required=False)
#     parser.add_argument("--daysintofuture", required=False)
#     parser.add_argument("--event1", required=False)
#     parser.add_argument("--event2", required=False)
#     parser.add_argument("--event3", required=False)
#     parser.add_argument("--watermark", required=False)
#     args = parser.parse_args()



#     generate_news_image(
#         output_path=args.output,
#         Headline=args.headline,
#         SubHeadline=args.subheadline,
#         user_image_path=args.input,
#         days_into_future=int(args.daysintofuture),
#         event1=args.event1,
#         event2=args.event2,
#         event3=args.event3,
#         watermark=int(args.watermark)
#     )

# if __name__ == "__main__":
#     main()
    
