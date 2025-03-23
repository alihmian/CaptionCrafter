# test_breaking_news_template.py

import os
import pytest
from PIL import Image, ImageChops
from breaking_news_template import create_breaking_news_image


# 1. Basic functional test
def test_create_breaking_news_image_basic(tmp_path):
    """
    Ensures that create_breaking_news_image runs without error
    and produces an output file.
    """
    # Setup paths
    user_image_path = (
        "tests/assets/sample_user_image.png"  # You must provide a sample image
    )
    output_path = tmp_path / "breaking_news_output.jpg"

    headline_text = "خبر فوری: تست سیستم تولید تصویر"  # e.g., Persian text

    # Call the function
    create_breaking_news_image(
        user_image_path=user_image_path,
        headline_text=headline_text,
        output_path=str(output_path),
    )

    # Verify that the output file was created
    assert output_path.exists(), "Output image was not created."

    # Optional: open it to check basic properties
    with Image.open(output_path) as img:
        assert img.mode == "RGB", "Output image mode should be RGB."
        width, height = img.size
        assert width > 0 and height > 0, "Output image dimensions invalid."


# 2. Test invalid user image path
def test_create_breaking_news_image_with_invalid_image(tmp_path):
    """
    Should raise an error (FileNotFoundError or OSError) for invalid user image path.
    """
    fake_image_path = "tests/assets/does_not_exist.png"
    output_path = tmp_path / "breaking_news_invalid.jpg"

    with pytest.raises((FileNotFoundError, OSError)):
        create_breaking_news_image(
            user_image_path=fake_image_path,
            headline_text="Headline",
            output_path=str(output_path),
        )


# 3. Test font size delta variations
@pytest.mark.parametrize("font_size_delta", [0, 10, -5])
def test_create_breaking_news_image_font_size_delta(tmp_path, font_size_delta):
    """
    Test the effect of different font_size_delta values.
    Ensures no error is raised and output is created.
    """
    user_image_path = "tests/assets/sample_user_image.png"
    output_path = tmp_path / f"breaking_news_fontdelta_{font_size_delta}.jpg"

    create_breaking_news_image(
        user_image_path=user_image_path,
        headline_text="خبر فوری با تغییر اندازه قلم",
        output_path=str(output_path),
        font_size_delta=font_size_delta,
    )
    assert output_path.exists()


# 4. Optional Visual Regression Test
#    Compare the newly generated image to a known "golden" image pixel-by-pixel.
#    You would need a pre-approved golden image to compare against.
def images_are_equal(img1_path, img2_path):
    with Image.open(img1_path) as img1, Image.open(img2_path) as img2:
        # Ensure both images are the same size first
        if img1.size != img2.size:
            return False
        diff = ImageChops.difference(img1, img2)
        return not diff.getbbox()


@pytest.mark.skip(reason="Enable this test once you have a golden image to compare to.")
def test_create_breaking_news_image_visual_regression(tmp_path):
    """
    Creates a 'breaking news' image and compares it to a known 'golden' reference.
    This test is skipped by default—unskip to enable visual regression.
    """
    golden_ref_path = (
        "tests/golden/breaking_news_reference.jpg"  # Adjust path as needed
    )

    user_image_path = "tests/assets/sample_user_image.png"
    output_path = tmp_path / "breaking_news_visual.jpg"

    create_breaking_news_image(
        user_image_path=user_image_path,
        headline_text="خبر فوری: نمونه مرجع",
        output_path=str(output_path),
    )

    # Compare
    assert images_are_equal(
        output_path, golden_ref_path
    ), "Generated image does not match the golden reference."
