#!/bin/bash

# Image Optimization Script for Web
# This script optimizes images (JPEG, PNG, WebP, HEIC) for web use
# Dependencies: imagemagick (convert), jpegoptim (optional), optipng (optional)
# Note: HEIC support requires imagemagick to be compiled with libheif

# Function to optimize images
optimize_images() {
    local source_dir="$1"
    local dest_dir="$2"
    local max_width="${3:-2048}"  # Default max width 2048px
    local quality="${4:-85}"       # Default quality 85%
    local output_format="${5:-}"   # Optional: force output format (jpg, png, webp)

    # Normalize output format to lowercase
    if [ -n "$output_format" ]; then
        output_format=$(echo "$output_format" | tr '[:upper:]' '[:lower:]')
        # Normalize jpeg to jpg
        if [ "$output_format" = "jpeg" ]; then
            output_format="jpg"
        fi
        # Validate output format
        if [[ "$output_format" != "jpg" && "$output_format" != "png" && "$output_format" != "webp" ]]; then
            echo "Error: Invalid output format '$output_format'. Use: jpg, png, or webp"
            return 1
        fi
    fi

    # Check if source directory exists
    if [ ! -d "$source_dir" ]; then
        echo "Error: Source directory '$source_dir' does not exist."
        return 1
    fi

    # Create destination directory if it doesn't exist
    mkdir -p "$dest_dir"

    echo "================================================"
    echo "Image Optimization Started"
    echo "================================================"
    echo "Source:      $source_dir"
    echo "Destination: $dest_dir"
    echo "Max Width:   ${max_width}px"
    echo "Quality:     ${quality}%"
    if [ -n "$output_format" ]; then
        echo "Output Format: $output_format"
    else
        echo "Output Format: (keep original)"
    fi
    echo "================================================"
    echo ""

    # Check for ImageMagick
    if ! command -v magick &> /dev/null; then
        echo "Error: ImageMagick is not installed."
        echo "Install with: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
        return 1
    fi

    # Counter for statistics
    local total_files=0
    local processed_files=0
    local skipped_files=0

    # Process images
    find "$source_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" -o -iname "*.heic" \) | while read -r img; do
        total_files=$((total_files + 1))

        # Get relative path
        rel_path="${img#$source_dir/}"
        dest_path="$dest_dir/$rel_path"

        # Determine output extension
        if [ -n "$output_format" ]; then
            # Force output format: remove original extension. add new one
            dest_path="${dest_path%.*}.$output_format"
        else
            # Keep original format, but normalize .jpeg to .jpg
            if [[ "$dest_path" == *.jpeg ]]; then
                dest_path="${dest_path%.jpeg}.jpg"
            elif [[ "$dest_path" == *.JPEG ]]; then
                dest_path="${dest_path%.JPEG}.jpg"
            fi
        fi

        # Create subdirectories if needed
        dest_subdir=$(dirname "$dest_path")
        mkdir -p "$dest_subdir"

        # Get file extension (use output_format if specified, otherwise use original)
        ext="${img##*.}"
        ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

        # Determine which format to use for processing
        if [ -n "$output_format" ]; then
            process_format="$output_format"
        else
            process_format="$ext_lower"
            # Normalize jpeg to jpg
            if [ "$process_format" = "jpeg" ]; then
                process_format="jpg"
            fi
        fi

        echo "Processing: $rel_path"

        # Get original file size
        original_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)

        # Optimize based on output format
        case "$process_format" in
            jpg|jpeg)
                magick "$img" \
                    -auto-orient \
                    -interlace Plane \
                    -sampling-factor 4:2:0 \
                    -quality "$quality" \
                    -resize "${max_width}x${max_width}>" \
                    -units PixelsPerInch -density 72 \
                    "$dest_path"

                # Remove GPS/location data while preserving other EXIF
                if command -v exiftool &> /dev/null; then
                    exiftool -q -overwrite_original -gps:all= "$dest_path" 2>/dev/null
                fi

                # Use jpegoptim if available for additional optimization (without stripping EXIF)
                if command -v jpegoptim &> /dev/null; then
                    jpegoptim --max="$quality" "$dest_path" &> /dev/null
                fi
                ;;
            png)
                magick "$img" \
                    -auto-orient \
                    -quality "$quality" \
                    -resize "${max_width}x${max_width}>" \
                    -units PixelsPerInch -density 72 \
                    "$dest_path"

                # Remove GPS/location data while preserving other EXIF
                if command -v exiftool &> /dev/null; then
                    exiftool -q -overwrite_original -gps:all= "$dest_path" 2>/dev/null
                fi

                # Use optipng if available for additional optimization
                if command -v optipng &> /dev/null; then
                    optipng -quiet -o2 "$dest_path" &> /dev/null
                fi
                ;;
            webp)
                magick "$img" \
                    -auto-orient \
                    -quality "$quality" \
                    -resize "${max_width}x${max_width}>" \
                    -units PixelsPerInch -density 72 \
                    -define webp:lossless=false \
                    "$dest_path"

                # Remove GPS/location data while preserving other EXIF
                if command -v exiftool &> /dev/null; then
                    exiftool -q -overwrite_original -gps:all= "$dest_path" 2>/dev/null
                fi
                ;;
            heic)
                # Convert HEIC to JPEG with optimization
                magick "$img" \
                    -auto-orient \
                    -interlace Plane \
                    -sampling-factor 4:2:0 \
                    -quality "$quality" \
                    -resize "${max_width}x${max_width}>" \
                    "$dest_path"

                # Remove GPS/location data while preserving other EXIF
                if command -v exiftool &> /dev/null; then
                    exiftool -q -overwrite_original -gps:all= "$dest_path" 2>/dev/null
                fi

                # Use jpegoptim if available for additional optimization (without stripping EXIF)
                if command -v jpegoptim &> /dev/null; then
                    jpegoptim --max="$quality" "$dest_path" &> /dev/null
                fi
                ;;
            *)
                echo "  Skipped: Unsupported format"
                skipped_files=$((skipped_files + 1))
                continue
                ;;
        esac

        if [ $? -eq 0 ]; then
            processed_files=$((processed_files + 1))

            # Get new file size
            new_size=$(stat -f%z "$dest_path" 2>/dev/null || stat -c%s "$dest_path" 2>/dev/null)

            # Calculate savings
            if [ -n "$original_size" ] && [ -n "$new_size" ]; then
                saved=$((original_size - new_size))
                percent=$((100 - (new_size * 100 / original_size)))

                # Format sizes
                original_kb=$((original_size / 1024))
                new_kb=$((new_size / 1024))
                saved_kb=$((saved / 1024))

                echo "  ✓ ${original_kb}KB → ${new_kb}KB (saved ${saved_kb}KB, -${percent}%)"
            else
                echo "  ✓ Done"
            fi
        else
            echo "  ✗ Failed to process"
        fi
        echo ""
    done

    echo "================================================"
    echo "Optimization Complete!"
    echo "================================================"
    echo "Check output in: $dest_dir"
    echo ""
}

# Function to convert images to WebP format
convert_to_webp() {
    local source_dir="$1"
    local dest_dir="$2"
    local quality="${3:-85}"

    if [ ! -d "$source_dir" ]; then
        echo "Error: Source directory '$source_dir' does not exist."
        return 1
    fi

    mkdir -p "$dest_dir"

    echo "Converting images to WebP format..."
    echo "Source: $source_dir"
    echo "Destination: $dest_dir"
    echo ""

    find "$source_dir" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" \) | while read -r img; do
        rel_path="${img#$source_dir/}"
        base_name="${rel_path%.*}"
        dest_path="$dest_dir/${base_name}.webp"

        dest_subdir=$(dirname "$dest_path")
        mkdir -p "$dest_subdir"

        echo "Converting: $rel_path → ${base_name}.webp"

        magick "$img" -auto-orient -quality "$quality" -units PixelsPerInch -density 72 "$dest_path"

        if [ $? -eq 0 ]; then
            echo "  ✓ Done"
        else
            echo "  ✗ Failed"
        fi
    done

    echo ""
    echo "WebP conversion complete!"
}

# Function to convert HEIC images to JPEG format
convert_heic_to_jpeg() {
    local source_dir="$1"
    local dest_dir="$2"
    local quality="${3:-90}"  # Higher default quality for HEIC conversion

    if [ ! -d "$source_dir" ]; then
        echo "Error: Source directory '$source_dir' does not exist."
        return 1
    fi

    # Check for ImageMagick
    if ! command -v magick &> /dev/null; then
        echo "Error: ImageMagick is not installed."
        echo "Install with: brew install imagemagick (macOS) or apt-get install imagemagick (Linux)"
        return 1
    fi

    mkdir -p "$dest_dir"

    echo "================================================"
    echo "HEIC to JPEG Conversion Started"
    echo "================================================"
    echo "Source:      $source_dir"
    echo "Destination: $dest_dir"
    echo "Quality:     ${quality}%"
    echo "================================================"
    echo ""

    local total_files=0
    local processed_files=0

    find "$source_dir" -type f \( -iname "*.heic" -o -iname "*.heif" \) | while read -r img; do
        total_files=$((total_files + 1))

        rel_path="${img#$source_dir/}"
        base_name="${rel_path%.*}"
        dest_path="$dest_dir/${base_name}.jpg"

        dest_subdir=$(dirname "$dest_path")
        mkdir -p "$dest_subdir"

        echo "Converting: $rel_path → ${base_name}.jpg"

        # Get original file size
        original_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)

        # Convert HEIC to JPEG
        magick "$img" \
            -auto-orient \
            -interlace Plane \
            -sampling-factor 4:2:0 \
            -quality "$quality" \
            "$dest_path"

        if [ $? -eq 0 ]; then
            processed_files=$((processed_files + 1))

            # Remove GPS/location data while preserving other EXIF
            if command -v exiftool &> /dev/null; then
                exiftool -q -overwrite_original -gps:all= "$dest_path" 2>/dev/null
            fi

            # Get new file size
            new_size=$(stat -f%z "$dest_path" 2>/dev/null || stat -c%s "$dest_path" 2>/dev/null)

            # Calculate savings
            if [ -n "$original_size" ] && [ -n "$new_size" ]; then
                original_kb=$((original_size / 1024))
                new_kb=$((new_size / 1024))

                echo "  ✓ ${original_kb}KB → ${new_kb}KB"
            else
                echo "  ✓ Done"
            fi

            # Use jpegoptim if available for additional optimization (without stripping EXIF)
            if command -v jpegoptim &> /dev/null; then
                jpegoptim --max="$quality" "$dest_path" &> /dev/null
            fi
        else
            echo "  ✗ Failed to convert"
        fi
        echo ""
    done

    echo "================================================"
    echo "HEIC to JPEG Conversion Complete!"
    echo "================================================"
    echo "Check output in: $dest_dir"
    echo ""
}

# Show usage if script is executed directly
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    echo "Image Optimization Functions"
    echo ""
    echo "Usage:"
    echo "  source optimize-images.sh"
    echo "  optimize_images <source_dir> <dest_dir> [max_width] [quality] [output_format]"
    echo "  convert_to_webp <source_dir> <dest_dir> [quality]"
    echo "  convert_heic_to_jpeg <source_dir> <dest_dir> [quality]"
    echo ""
    echo "Examples:"
    echo "  optimize_images ./photos ./photos-optimized 1920 85"
    echo "  optimize_images ./images ./web-images"
    echo "  optimize_images ./images ./web-images 2048 85 webp  # Force WebP output"
    echo "  optimize_images ./images ./web-images 1920 90 jpg   # Force JPG output"
    echo "  convert_to_webp ./images ./webp-images 85"
    echo "  convert_heic_to_jpeg ./iphone-photos ./jpeg-photos 90"
    echo ""
    echo "Parameters:"
    echo "  source_dir   - Directory containing original images"
    echo "  dest_dir     - Directory for optimized images"
    echo "  max_width    - Maximum width in pixels (default: 1920)"
    echo "  quality      - JPEG/WebP quality 1-100 (default: 85)"
    echo ""
    echo "Note: Source this script to load the functions into your shell:"
    echo "  source optimize-images.sh"
    echo "  optimize_images ./my-images ./optimized"
fi
