from PIL import Image

# Open the main image
background = Image.open("assets/OutPut/PaperCaptionSmall.png").convert("RGBA")  # Ensure RGBA mode

# Open the watermark image
watermark = Image.open("assets/images/watermark.png").convert("RGBA")  # Ensure RGBA mode

# Set position (bottom-right corner example)
position = (background.width - watermark.width, background.height - watermark.height)

# Paste the watermark using its alpha channel as a mask
background.paste(watermark, position, mask=watermark)

# Save or show the output
background.save("output.png")  # Save with transparency intact
background.show()
