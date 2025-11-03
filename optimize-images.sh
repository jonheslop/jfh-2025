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

        # Normalize extension to lowercase and change .jpeg to .jpg
        file_base="${dest_path%.*}"
        file_ext="${dest_path##*.}"
        file_ext_lower=$(echo "$file_ext" | tr '[:upper:]' '[:lower:]')

        # Convert .jpeg to .jpg and .heic to .jpg
        if [ "$file_ext_lower" = "jpeg" ] || [ "$file_ext_lower" = "heic" ]; then
            file_ext_lower="jpg"
        fi

        dest_path="${file_base}.${file_ext_lower}"

        # Create subdirectories if needed
        dest_subdir=$(dirname "$dest_path")
        mkdir -p "$dest_subdir"

        # Get file extension
        ext="${img##*.}"
        ext_lower=$(echo "$ext" | tr '[:upper:]' '[:lower:]')

        echo "Processing: $rel_path"

        # Get original file size
        original_size=$(stat -f%z "$img" 2>/dev/null || stat -c%s "$img" 2>/dev/null)

        # Optimize based on file type
        case "$ext_lower" in
            jpg|jpeg)
                magick "$img" \
                    -strip \
                    -interlace Plane \
                    -sampling-factor 4:2:0 \
                    -quality "$quality" \
                    -resize "${max_width}x${max_width}>" \
                    "$dest_path"

                # Use jpegoptim if available for additional optimization
                if command -v jpegoptim &> /dev/null; then
                    jpegoptim --strip-all --max="$quality" "$dest_path" &> /dev/null
                fi
                ;;
            png)
                magick "$img" \
                    -strip \
                    -quality "$quality" \
                    -resize "${max_width}x${max_width}>" \
                    "$dest_path"

                # Use optipng if available for additional optimization
                if command -v optipng &> /dev/null; then
                    optipng -quiet -o2 "$dest_path" &> /dev/null
                fi
                ;;
            webp)
                magick "$img" \
                    -strip \
                    -quality "$quality" \
                    -resize "${max_width}x${max_width}>" \
                    -define webp:lossless=false \
                    "$dest_path"
                ;;
            heic)
                # Convert HEIC to JPEG with optimization
                magick "$img" \
                    -strip \
                    -interlace Plane \
                    -sampling-factor 4:2:0 \
                    -quality "$quality" \
                    -resize "${max_width}x${max_width}>" \
                    "$dest_path"

                # Use jpegoptim if available for additional optimization
                if command -v jpegoptim &> /dev/null; then
                    jpegoptim --strip-all --max="$quality" "$dest_path" &> /dev/null
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

        magick "$img" -quality "$quality" "$dest_path"

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
            -strip \
            -interlace Plane \
            -sampling-factor 4:2:0 \
            -quality "$quality" \
            "$dest_path"

        if [ $? -eq 0 ]; then
            processed_files=$((processed_files + 1))

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

            # Use jpegoptim if available for additional optimization
            if command -v jpegoptim &> /dev/null; then
                jpegoptim --strip-all --max="$quality" "$dest_path" &> /dev/null
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
    echo "  optimize_images <source_dir> <dest_dir> [max_width] [quality]"
    echo "  convert_to_webp <source_dir> <dest_dir> [quality]"
    echo "  convert_heic_to_jpeg <source_dir> <dest_dir> [quality]"
    echo ""
    echo "Examples:"
    echo "  optimize_images ./photos ./photos-optimized 1920 85"
    echo "  optimize_images ./images ./web-images"
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
